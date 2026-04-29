import crypto from "node:crypto";
import { AppError, asyncHandler, parseWithSchema } from "../lib/http.js";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { buildTradePayload, mapTrade, mapApiKey } from "../lib/serializers.js";
import { calculateOutcome, calculatePnL, calculateRiskReward } from "../lib/tradeMath.js";
import { hashApiKey } from "../lib/apiKeyAuth.js";
import { mt5SyncSchema, mt5ApiKeyCreateSchema } from "../lib/schemas.js";

// Convert MT5 datetime string "2025.01.15 14:30:00" → ISO 8601
const parseMt5Date = (s) => {
  if (!s) return new Date().toISOString();
  // Replace first two dots with dashes, space with T, append Z
  const iso = s.replace(/^(\d{4})\.(\d{2})\.(\d{2})/, "$1-$2-$3").replace(" ", "T") + "Z";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

const withDerivedFields = (trade) => {
  const pnl = trade.pnl !== undefined ? trade.pnl : calculatePnL(trade);
  const risk_reward = calculateRiskReward(trade);
  const outcome = calculateOutcome(pnl);
  return { ...trade, pnl, risk_reward, outcome };
};

// POST /api/mt5/sync  (authenticated via X-Api-Key)
export const syncTrades = asyncHandler(async (req, res) => {
  const { trades: rawTrades } = parseWithSchema(mt5SyncSchema, req.body, "Invalid MT5 sync payload.");
  const supabase = getSupabaseAdmin();
  const userId = req.user.id;

  // Fetch already-imported tickets for this user in one query
  const incomingTickets = rawTrades.map((t) => String(t.ticket));
  const { data: existing } = await supabase
    .from("trades")
    .select("broker_ticket_id")
    .eq("user_id", userId)
    .in("broker_ticket_id", incomingTickets);

  const alreadySynced = new Set((existing || []).map((r) => r.broker_ticket_id));
  const newTrades = rawTrades.filter((t) => !alreadySynced.has(String(t.ticket)));

  if (newTrades.length === 0) {
    return res.json({ synced: 0, skipped: rawTrades.length, total: rawTrades.length });
  }

  const payloads = newTrades.map((mt5) => {
    const base = {
      symbol:      mt5.symbol.trim().toUpperCase(),
      date:        parseMt5Date(mt5.open_time),
      direction:   mt5.type === "buy" ? "long" : "short",
      entry_price: mt5.open_price,
      exit_price:  mt5.close_price,
      stop_loss:   mt5.sl,
      take_profit: mt5.tp,
      lot_size:    mt5.volume,
      pnl:         mt5.profit,
      notes:       mt5.comment || "",
      source:      "mt5",
      status:      "closed",
      session:     "",
      strategy:    "",
      account:     "",
      tags:        [],
      mistakes:    [],
      screenshots: [],
    };
    const derived = withDerivedFields(base);
    return {
      ...buildTradePayload(derived, userId),
      broker_ticket_id: String(mt5.ticket),
      source: "mt5",
    };
  });

  const { data: inserted, error } = await supabase
    .from("trades")
    .insert(payloads)
    .select("*");

  if (error) throw new AppError(500, `Failed to insert trades: ${error.message}`);

  res.status(201).json({
    synced:  inserted.length,
    skipped: alreadySynced.size,
    total:   rawTrades.length,
    trades:  (inserted || []).map(mapTrade),
  });
});

// POST /api/mt5/keys
export const createApiKey = asyncHandler(async (req, res) => {
  const { label } = parseWithSchema(mt5ApiKeyCreateSchema, req.body, "Invalid API key request.");
  const supabase = getSupabaseAdmin();

  const rawKey = "ttmt5_" + crypto.randomBytes(32).toString("hex");
  const keyHash = hashApiKey(rawKey);

  const { data, error } = await supabase
    .from("mt5_api_keys")
    .insert({ user_id: req.user.id, key_hash: keyHash, label })
    .select("id, label, created_at")
    .single();

  if (error) throw new AppError(500, `Failed to create API key: ${error.message}`);

  res.status(201).json({
    id:        data.id,
    label:     data.label,
    createdAt: data.created_at,
    key:       rawKey, // shown ONCE — never stored raw
  });
});

// GET /api/mt5/keys
export const listApiKeys = asyncHandler(async (req, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mt5_api_keys")
    .select("id, label, is_active, last_used_at, created_at")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) throw new AppError(500, error.message);
  res.json({ keys: (data || []).map(mapApiKey) });
});

// PATCH /api/mt5/keys/:keyId/revoke
export const revokeApiKey = asyncHandler(async (req, res) => {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("mt5_api_keys")
    .update({ is_active: false })
    .eq("id", req.params.keyId)
    .eq("user_id", req.user.id);

  if (error) throw new AppError(500, error.message);
  res.json({ success: true });
});

// DELETE /api/mt5/keys/:keyId
export const deleteApiKey = asyncHandler(async (req, res) => {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("mt5_api_keys")
    .delete()
    .eq("id", req.params.keyId)
    .eq("user_id", req.user.id);

  if (error) throw new AppError(500, error.message);
  res.status(204).send();
});

// GET /api/mt5/status
export const getSyncStatus = asyncHandler(async (req, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("trades")
    .select("created_at")
    .eq("user_id", req.user.id)
    .eq("source", "mt5")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw new AppError(500, error.message);

  const { count } = await supabase
    .from("trades")
    .select("id", { count: "exact", head: true })
    .eq("user_id", req.user.id)
    .eq("source", "mt5");

  res.json({
    count:    count ?? 0,
    lastSync: data?.[0]?.created_at ?? null,
  });
});
