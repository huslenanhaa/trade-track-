import { supabase } from "@/lib/supabaseClient";

const SESSION_META_PREFIX = "__trade_track_meta__:";

export const backtestApi = {
  sessions: {
    async list() {
      const userId = await getUserId();
      const rows = await listRowsWithOrderFallback({
        table: "backtest_sessions",
        userId,
        orderColumns: ["created_at", "created_date"],
        emptyMessage: "Could not load sessions.",
      });

      return { sessions: rows.map(mapSession) };
    },

    async get(sessionId) {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("backtest_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        throw formatSupabaseError(error, "Could not load this session.");
      }

      if (!data) {
        throw new Error("This session no longer exists or you do not have access to it.");
      }

      return { session: mapSession(data) };
    },

    async create(input) {
      const userId = await getUserId();
      const row = await insertWithVariants("backtest_sessions", buildSessionInsertVariants(userId, input), "Could not create session.");
      return { session: mapSession(row) };
    },

    async update(sessionId, input) {
      const userId = await getUserId();
      const row = await updateSessionWithVariants(sessionId, userId, buildSessionUpdateVariants(input), "Could not update session.");
      return { session: mapSession(row) };
    },

    async delete(sessionId) {
      const userId = await getUserId();
      const { error } = await supabase
        .from("backtest_sessions")
        .delete()
        .eq("id", sessionId)
        .eq("user_id", userId);

      if (error) {
        throw formatSupabaseError(error, "Could not delete session.");
      }

      return null;
    },
  },

  trades: {
    async list(sessionId, params = {}) {
      const userId = await getUserId();
      const rows = await listTradeRows(userId, sessionId, params);
      return { trades: rows.map(mapTrade) };
    },

    async create(sessionId, input) {
      const userId = await getUserId();
      const row = await insertWithVariants("backtest_trades", buildTradeInsertVariants(userId, sessionId, input), "Could not save trade.");
      await recalcBalance(sessionId, userId);
      return { trade: mapTrade(row) };
    },

    async delete(sessionId, tradeId) {
      const userId = await getUserId();
      const { error } = await supabase
        .from("backtest_trades")
        .delete()
        .eq("id", tradeId)
        .eq("session_id", sessionId)
        .eq("user_id", userId);

      if (error) {
        throw formatSupabaseError(error, "Could not delete trade.");
      }

      await recalcBalance(sessionId, userId);
      return null;
    },
  },
};

async function getUserId() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw formatSupabaseError(error, "Could not read your login session.");
  }

  const userId = data?.session?.user?.id;
  if (!userId) {
    throw new Error("You are not logged in. Please sign in again.");
  }

  return userId;
}

async function listRowsWithOrderFallback({ table, userId, orderColumns, emptyMessage }) {
  let lastError = null;

  for (const orderColumn of orderColumns) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("user_id", userId)
      .order(orderColumn, { ascending: false });

    if (!error) {
      return data ?? [];
    }

    lastError = error;
    if (isSchemaMismatchError(error, [orderColumn])) {
      continue;
    }

    throw formatSupabaseError(error, emptyMessage);
  }

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throw formatSupabaseError(error, emptyMessage);
  }

  return data ?? [];
}

async function listTradeRows(userId, sessionId, params = {}) {
  const attempts = [
    { orderColumn: "open_time", includeStatus: true },
    { orderColumn: "open_time", includeStatus: false },
    { orderColumn: "created_at", includeStatus: true },
    { orderColumn: "created_at", includeStatus: false },
    { orderColumn: "trade_date", includeStatus: false },
    { orderColumn: null, includeStatus: false },
  ];

  let lastError = null;

  for (const attempt of attempts) {
    let query = supabase
      .from("backtest_trades")
      .select("*")
      .eq("session_id", sessionId)
      .eq("user_id", userId);

    if (attempt.includeStatus && params.status) {
      query = query.eq("status", params.status);
    }

    if (attempt.orderColumn) {
      query = query.order(attempt.orderColumn, { ascending: true });
    }

    const { data, error } = await query;

    if (!error) {
      return data ?? [];
    }

    lastError = error;
    if (isSchemaMismatchError(error, [attempt.orderColumn, "status"])) {
      continue;
    }

    throw formatSupabaseError(error, "Could not load session trades.");
  }

  throw formatSupabaseError(lastError, "Could not load session trades.");
}

async function insertWithVariants(table, variants, fallbackMessage) {
  let lastError = null;

  for (const variant of variants) {
    const { data, error } = await supabase
      .from(table)
      .insert(variant)
      .select("*")
      .single();

    if (!error) {
      return data;
    }

    lastError = error;
    if (isSchemaMismatchError(error)) {
      continue;
    }

    throw formatSupabaseError(error, fallbackMessage);
  }

  throw formatSupabaseError(lastError, fallbackMessage);
}

async function updateSessionWithVariants(sessionId, userId, variants, fallbackMessage) {
  let lastError = null;

  for (const variant of variants) {
    if (Object.keys(variant).length === 0) {
      continue;
    }

    const { data, error } = await supabase
      .from("backtest_sessions")
      .update(variant)
      .eq("id", sessionId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (!error) {
      return data;
    }

    lastError = error;
    if (isSchemaMismatchError(error)) {
      continue;
    }

    throw formatSupabaseError(error, fallbackMessage);
  }

  throw formatSupabaseError(lastError, fallbackMessage);
}

async function recalcBalance(sessionId, userId) {
  const { data: session, error: sessionError } = await supabase
    .from("backtest_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (sessionError) {
    throw formatSupabaseError(sessionError, "Could not refresh the session balance.");
  }

  if (!session) {
    return;
  }

  const trades = await listTradeRows(userId, sessionId, { status: "closed" });
  const startingBalance = toNumber(session.starting_balance, 10000);
  const totalPnl = trades.reduce((sum, trade) => sum + toNumber(trade.pnl, 0), 0);
  const nextBalance = Number((startingBalance + totalPnl).toFixed(2));

  const patchVariants = [
    compactObject({
      current_balance: nextBalance,
      updated_at: nowIso(),
    }),
    compactObject({
      current_balance: nextBalance,
      net_profit: totalPnl,
      trades_count: trades.length,
      win_rate: trades.length > 0 ? Number(((trades.filter((trade) => mapTrade(trade).result === "win").length / trades.length) * 100).toFixed(2)) : 0,
    }),
    compactObject({
      current_balance: nextBalance,
    }),
  ];

  let lastError = null;

  for (const patch of patchVariants) {
    const { error } = await supabase
      .from("backtest_sessions")
      .update(patch)
      .eq("id", sessionId)
      .eq("user_id", userId);

    if (!error) {
      return;
    }

    lastError = error;
    if (isSchemaMismatchError(error)) {
      continue;
    }

    throw formatSupabaseError(error, "Could not refresh the session balance.");
  }

  if (lastError) {
    throw formatSupabaseError(lastError, "Could not refresh the session balance.");
  }
}

function buildSessionInsertVariants(userId, input) {
  const sessionId = createUuid();
  const name = input.name?.trim() || "Untitled session";
  const symbol = normalizeSymbol(input.symbol);
  const timeframe = normalizeTimeframe(input.timeframe);
  const startingBalance = toNumber(input.startingBalance, 10000);
  const startDate = input.startDate || null;
  const endDate = input.endDate || null;
  const createdAt = nowIso();
  const legacyNotes = encodeSessionMeta("", { timeframe });

  const baseSession = {
    id: sessionId,
    user_id: userId,
    name,
    symbol,
    starting_balance: startingBalance,
    current_balance: startingBalance,
    cursor_position: 0,
    start_date: startDate,
    end_date: endDate,
    notes: "",
  };

  return [
    compactObject({
      ...baseSession,
      timeframe,
      status: "active",
      updated_at: createdAt,
    }),
    compactObject({
      ...baseSession,
      timeframe,
      status: "active",
    }),
    compactObject({
      ...baseSession,
      market_type: "Forex",
      playbook: "Manual Backtest",
      currency: "USD",
      tags: [`tt:timeframe:${timeframe}`],
      net_profit: 0,
      trades_count: 0,
      win_rate: 0,
      notes: legacyNotes,
      visibility: "private",
      created_date: createdAt,
    }),
    compactObject({
      ...baseSession,
      notes: legacyNotes,
    }),
  ];
}

function buildSessionUpdateVariants(input) {
  const cursorPosition = input.cursorPosition !== undefined
    ? Math.max(0, Math.trunc(Number(input.cursorPosition) || 0))
    : undefined;
  const currentBalance = input.currentBalance !== undefined
    ? Number(input.currentBalance)
    : undefined;

  const modernPatch = compactObject({
    cursor_position: cursorPosition,
    current_balance: currentBalance,
    timeframe: input.timeframe,
    name: input.name,
    status: input.status,
    notes: input.notes,
    updated_at: nowIso(),
  });

  const legacyPatch = compactObject({
    cursor_position: cursorPosition,
    current_balance: currentBalance,
    notes: input.timeframe ? encodeSessionMeta(input.notes || "", { timeframe: input.timeframe }) : input.notes,
    name: input.name,
  });

  return [modernPatch, legacyPatch];
}

function buildTradeInsertVariants(userId, sessionId, input) {
  const tradeId = createUuid();
  const symbol = normalizeSymbol(input.symbol);
  const baseTrade = {
    id: tradeId,
    user_id: userId,
    session_id: sessionId,
    symbol,
    direction: input.direction,
    lot_size: toNumber(input.lotSize, 0),
    entry_price: toNumber(input.entryPrice, 0),
    stop_loss: toNumber(input.sl, 0),
    take_profit: toNumber(input.tp, 0),
    exit_price: input.exitPrice != null ? Number(input.exitPrice) : null,
    risk_reward: toNumber(input.rr, 0),
    pnl: toNumber(input.pnl, 0),
    result: input.result ?? "breakeven",
    status: input.status ?? "closed",
    open_time: input.openTime || nowIso(),
    close_time: input.closeTime || null,
    notes: input.notes || "",
  };

  return [
    compactObject(baseTrade),
    compactObject({
      ...baseTrade,
      status: undefined,
      notes: undefined,
    }),
    compactObject({
      id: tradeId,
      user_id: userId,
      session_id: sessionId,
      symbol,
      direction: input.direction,
      lot_size: toNumber(input.lotSize, 0),
      entry_price: toNumber(input.entryPrice, 0),
      stop_loss: toNumber(input.sl, 0),
      take_profit: toNumber(input.tp, 0),
      exit_price: input.exitPrice != null ? Number(input.exitPrice) : null,
      rr_ratio: toNumber(input.rr, 0),
      pnl: toNumber(input.pnl, 0),
      result: input.result ?? "breakeven",
      trade_date: input.openTime || nowIso(),
      notes: input.notes || "",
    }),
  ];
}

function mapSession(row) {
  const metadata = readSessionMeta(row);
  const startingBalance = toNumber(row.starting_balance, 10000);
  const fallbackBalance = startingBalance + toNumber(row.net_profit, 0);
  // Prefer the stored timeframe exactly as saved; fall back to metadata or "15m"
  const timeframe = row.timeframe || metadata.timeframe || "15m";

  return {
    id: row.id,
    name: row.name || "Untitled session",
    symbol: row.symbol || "",
    timeframe,
    startingBalance,
    currentBalance: row.current_balance != null ? Number(row.current_balance) : fallbackBalance,
    cursorPosition: Math.max(0, Math.trunc(Number(row.cursor_position) || 0)),
    startDate: row.start_date || null,
    endDate: row.end_date || null,
    status: row.status || "active",
    notes: stripSessionMeta(row.notes),
    tradesCount: toNumber(row.trades_count, 0),
    winRate: toNumber(row.win_rate, 0),
    createdAt: row.created_at || row.created_date || null,
    updatedAt: row.updated_at || row.updated_date || row.created_at || row.created_date || null,
  };
}

function mapTrade(row) {
  const pnl = row.pnl != null ? Number(row.pnl) : 0;

  return {
    id: row.id,
    sessionId: row.session_id,
    symbol: row.symbol || "",
    direction: row.direction || "long",
    lotSize: Number(row.lot_size ?? 0),
    entryPrice: Number(row.entry_price ?? 0),
    sl: Number(row.stop_loss ?? 0),
    tp: Number(row.take_profit ?? 0),
    exitPrice: row.exit_price != null ? Number(row.exit_price) : null,
    rr: Number(row.risk_reward ?? row.rr_ratio ?? 0),
    pnl,
    result: row.result || getTradeResult(pnl),
    status: row.status || "closed",
    openTime: row.open_time || row.trade_date || row.created_at || row.created_date || null,
    closeTime: row.close_time || null,
    notes: row.notes || "",
    createdAt: row.created_at || row.created_date || row.open_time || row.trade_date || null,
  };
}

function readSessionMeta(row) {
  const metadata = {};

  if (Array.isArray(row?.tags)) {
    const timeframeTag = row.tags.find((tag) => typeof tag === "string" && tag.startsWith("tt:timeframe:"));
    if (timeframeTag) {
      metadata.timeframe = timeframeTag.slice("tt:timeframe:".length);
    }
  }

  if (typeof row?.notes === "string" && row.notes.startsWith(SESSION_META_PREFIX)) {
    try {
      Object.assign(metadata, JSON.parse(row.notes.slice(SESSION_META_PREFIX.length)));
    } catch {
      return metadata;
    }
  }

  return metadata;
}

function stripSessionMeta(notes) {
  if (typeof notes !== "string") {
    return "";
  }

  return notes.startsWith(SESSION_META_PREFIX) ? "" : notes;
}

function encodeSessionMeta(notes, metadata) {
  if (typeof notes === "string" && notes.trim()) {
    return notes;
  }

  return `${SESSION_META_PREFIX}${JSON.stringify(metadata)}`;
}

function normalizeSymbol(value) {
  return String(value || "").trim().toUpperCase();
}

// Preserve original casing — the UI sends "15m", "1H", "4H", etc.
// which must match TF_TO_YF keys in backtestSymbols.js exactly.
function normalizeTimeframe(value) {
  return String(value || "15m").trim();
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

function nowIso() {
  return new Date().toISOString();
}

function createUuid() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.random() * 16 | 0;
    const next = character === "x" ? random : (random & 0x3) | 0x8;
    return next.toString(16);
  });
}

function getTradeResult(pnl) {
  if (pnl > 0) return "win";
  if (pnl < 0) return "loss";
  return "breakeven";
}

function isSchemaMismatchError(error, columns = []) {
  const message = getErrorMessage(error);
  if (!message) {
    return false;
  }

  if (/Could not find the .* column|column .* does not exist|schema cache/i.test(message)) {
    return true;
  }

  return columns
    .filter(Boolean)
    .some((column) => message.toLowerCase().includes(String(column).toLowerCase()));
}

function formatSupabaseError(error, fallbackMessage) {
  const message = getErrorMessage(error) || fallbackMessage || "Supabase request failed.";

  if (/not authenticated|invalid jwt|jwt/i.test(message)) {
    return new Error("You are not logged in. Please sign in again.");
  }

  if (/row-level security|permission denied/i.test(message)) {
    return new Error("Supabase blocked this request. Check your Row Level Security policies for authenticated users.");
  }

  if (/relation .* does not exist/i.test(message)) {
    return new Error("Your Supabase tables are missing. Create `backtest_sessions` and `backtest_trades` first.");
  }

  if (/network|failed to fetch/i.test(message)) {
    return new Error("Cannot reach Supabase right now. If you changed `.env.local`, stop and restart `npm run dev` first.");
  }

  if (isSchemaMismatchError(error)) {
    return new Error(`Database schema mismatch: ${message}`);
  }

  return new Error(message);
}

function getErrorMessage(error) {
  return [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(" ")
    .trim();
}
