import {
  calculateOutcome,
  calculatePnL,
  calculateRiskReward,
} from "@/lib/tradeCalculations";
import {
  getLocalDb,
  getLocalProfile,
  resetLocalAppState,
  saveLocalDb,
  saveLocalProfile,
} from "@/lib/localStore";
import { supabase } from "@/lib/supabaseClient";

// ── Backend API helpers ───────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated. Please log in.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
};

const getApiErrorMessage = (body, status) => {
  const primaryMessage = body?.error || body?.message || `API error ${status}`;
  const formError = Array.isArray(body?.details?.formErrors)
    ? body.details.formErrors.find(Boolean)
    : "";
  const fieldError = body?.details?.fieldErrors
    ? Object.values(body.details.fieldErrors).flat().find(Boolean)
    : "";

  return [primaryMessage, fieldError || formError].filter(Boolean).join(": ");
};

const apiFetch = async (path, options = {}) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(body, res.status));
  return body;
};

const nowIso = () => new Date().toISOString();

const createId = (prefix) => {
  const randomPart = globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${randomPart}`;
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return [];
};

const toIsoString = (value) => {
  if (!value) {
    return nowIso();
  }

  const dateValue = new Date(value);
  return Number.isNaN(dateValue.getTime()) ? nowIso() : dateValue.toISOString();
};

const isProvided = (value) => value !== "" && value !== null && value !== undefined;

const normalizeTrade = (trade = {}) => {
  const normalizedTrade = {
    symbol: trade.symbol?.toUpperCase?.() || "",
    date: toIsoString(trade.date),
    direction: trade.direction || "long",
    entry_price: toNumber(trade.entry_price),
    stop_loss: toNumber(trade.stop_loss),
    take_profit: toNumber(trade.take_profit),
    exit_price: toNumber(trade.exit_price),
    lot_size: toNumber(trade.lot_size),
    session: trade.session || "",
    strategy: trade.strategy || "",
    notes: trade.notes || "",
    tags: toArray(trade.tags),
    mistakes: toArray(trade.mistakes),
    screenshots: toArray(trade.screenshots),
    status: trade.status || "closed",
    account: trade.account || "",
  };

  const pnl = isProvided(trade.pnl) ? toNumber(trade.pnl) : calculatePnL(normalizedTrade);
  const riskReward = isProvided(trade.risk_reward)
    ? toNumber(trade.risk_reward)
    : calculateRiskReward({ ...normalizedTrade, pnl });

  return {
    ...normalizedTrade,
    pnl,
    risk_reward: riskReward,
    outcome: trade.outcome || calculateOutcome(pnl),
  };
};

const normalizeTag = (tag = {}) => ({
  name: tag.name?.trim?.() || "",
  category: tag.category || "other",
});

const normalizeWeeklyReview = (review = {}) => ({
  week_start: review.week_start || "",
  week_end: review.week_end || "",
  total_trades: toNumber(review.total_trades),
  total_pnl: toNumber(review.total_pnl),
  win_rate: toNumber(review.win_rate),
  what_went_well: review.what_went_well || "",
  what_to_improve: review.what_to_improve || "",
  goals_next_week: review.goals_next_week || "",
  emotional_state: review.emotional_state || "neutral",
  discipline_score: toNumber(review.discipline_score) || 5,
  key_lessons: review.key_lessons || "",
});

const normalizeBacktestStrategy = (strategy = {}) => ({
  name: strategy.name?.trim?.() || "",
  description: strategy.description || "",
  symbol: strategy.symbol || "",
  timeframe: strategy.timeframe || "",
  rules: strategy.rules || "",
  status: strategy.status || "testing",
});

const normalizeBacktestRecord = (record = {}) => ({
  strategy_id: record.strategy_id || "",
  strategy_name: record.strategy_name || "",
  trade_date: toIsoString(record.trade_date),
  symbol: record.symbol || "",
  direction: record.direction || "long",
  entry_price: toNumber(record.entry_price),
  exit_price: toNumber(record.exit_price),
  stop_loss: toNumber(record.stop_loss),
  take_profit: toNumber(record.take_profit),
  rr_ratio: toNumber(record.rr_ratio),
  pnl: toNumber(record.pnl),
  result: record.result || "breakeven",
  session: record.session || "",
  notes: record.notes || "",
});

const entityConfig = {
  Trade: {
    idPrefix: "trade",
    normalize: normalizeTrade,
  },
  Tag: {
    idPrefix: "tag",
    normalize: normalizeTag,
  },
  WeeklyReview: {
    idPrefix: "review",
    normalize: normalizeWeeklyReview,
  },
  BacktestStrategy: {
    idPrefix: "strategy",
    normalize: normalizeBacktestStrategy,
  },
  BacktestRecord: {
    idPrefix: "record",
    normalize: normalizeBacktestRecord,
  },
};

const getComparableValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsedDate = Date.parse(value);
    if (!Number.isNaN(parsedDate) && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return parsedDate;
    }

    const parsedNumber = Number(value);
    if (!Number.isNaN(parsedNumber) && value.trim() !== "") {
      return parsedNumber;
    }

    return value.toLowerCase();
  }

  return value;
};

const sortItems = (items, sortField) => {
  if (!sortField) {
    return [...items];
  }

  const isDescending = sortField.startsWith("-");
  const fieldName = isDescending ? sortField.slice(1) : sortField;

  return [...items].sort((leftItem, rightItem) => {
    const leftValue = getComparableValue(leftItem[fieldName]);
    const rightValue = getComparableValue(rightItem[fieldName]);

    if (leftValue === rightValue) {
      return 0;
    }

    if (leftValue === null) {
      return 1;
    }

    if (rightValue === null) {
      return -1;
    }

    if (leftValue > rightValue) {
      return isDescending ? -1 : 1;
    }

    return isDescending ? 1 : -1;
  });
};

const getCollection = (entityName) => getLocalDb().entities[entityName] || [];

const saveCollection = (entityName, items) => {
  const db = getLocalDb();
  db.entities[entityName] = items;
  saveLocalDb(db);
};

const createEntityApi = (entityName) => {
  const config = entityConfig[entityName];

  return {
    async list(sortField, limit) {
      const items = sortItems(getCollection(entityName), sortField);
      return typeof limit === "number" ? items.slice(0, limit) : items;
    },

    async create(data) {
      const timestamp = nowIso();
      const item = {
        id: createId(config.idPrefix),
        created_date: timestamp,
        updated_date: timestamp,
        ...config.normalize(data),
      };

      const nextItems = [...getCollection(entityName), item];
      saveCollection(entityName, nextItems);
      return clone(item);
    },

    async update(id, data) {
      let updatedItem = null;
      const nextItems = getCollection(entityName).map((item) => {
        if (item.id !== id) {
          return item;
        }

        updatedItem = {
          ...item,
          ...config.normalize({
            ...item,
            ...data,
          }),
          id,
          updated_date: nowIso(),
        };

        return updatedItem;
      });

      saveCollection(entityName, nextItems);
      return clone(updatedItem);
    },

    async delete(id) {
      const nextItems = getCollection(entityName).filter((item) => item.id !== id);
      saveCollection(entityName, nextItems);
      return { success: true };
    },

    async bulkCreate(items) {
      const timestamp = nowIso();
      const nextItems = [
        ...getCollection(entityName),
        ...items.map((item) => ({
          id: createId(config.idPrefix),
          created_date: timestamp,
          updated_date: timestamp,
          ...config.normalize(item),
        })),
      ];

      saveCollection(entityName, nextItems);
      return clone(nextItems);
    },
  };
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file selected."));
      return;
    }

    if (file.size > 1_500_000) {
      reject(new Error("Screenshot is too large for local storage. Try a smaller image."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read this file."));
    reader.readAsDataURL(file);
  });

const uploadToSupabaseStorage = async (file) => {
  if (!file) throw new Error("No file selected.");
  if (file.size > 10_000_000) throw new Error("File too large. Max 10MB.");

  const ext = file.name.split(".").pop() || "png";
  const fileName = `screenshots/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from("trade-screenshots")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (error) throw new Error(error.message);

  const { data: publicData } = supabase.storage
    .from("trade-screenshots")
    .getPublicUrl(data.path);

  return { file_url: publicData.publicUrl };
};

export const appClient = {
  auth: {
    async me() {
      return clone(getLocalProfile());
    },

    async updateProfile(profileUpdates) {
      return clone(
        saveLocalProfile({
          ...getLocalProfile(),
          ...profileUpdates,
        }),
      );
    },
  },

  entities: {
    Trade: {
      async list(sortField, limit) {
        const params = new URLSearchParams();
        if (sortField) params.set("sort", sortField.startsWith("-") ? sortField : sortField);
        if (typeof limit === "number") params.set("limit", String(limit));
        const data = await apiFetch(`/trades?${params}`);
        return data?.trades ?? [];
      },

      async create(tradeData) {
        const data = await apiFetch("/trades", {
          method: "POST",
          body: JSON.stringify(tradeData),
        });
        return data?.trade ?? data;
      },

      async update(id, tradeData) {
        const data = await apiFetch(`/trades/${id}`, {
          method: "PATCH",
          body: JSON.stringify(tradeData),
        });
        return data?.trade ?? data;
      },

      async delete(id) {
        await apiFetch(`/trades/${id}`, { method: "DELETE" });
        return { success: true };
      },

      async bulkCreate(trades) {
        const normalizedTrades = trades.map((trade) => {
          const normalized = {
            ...trade,
            date: toIsoString(trade.date),
          };
          if (normalized.outcome === "open") {
            delete normalized.outcome;
          }
          return normalized;
        });
        // Don't use apiFetch — we want the full body even on 400 (all-rows-failed case)
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/api/trades/bulk`, {
          method: "POST",
          headers,
          body: JSON.stringify({ trades: normalizedTrades }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok && !Array.isArray(body?.errors)) {
          throw new Error(getApiErrorMessage(body, res.status));
        }
        return {
          trades: body?.trades ?? [],
          imported: body?.imported ?? (body?.trades?.length || 0),
          failed: body?.failed ?? 0,
          errors: body?.errors ?? [],
          message: body?.message || body?.error || "",
        };
      },
    },
    Tag: createEntityApi("Tag"),
    WeeklyReview: createEntityApi("WeeklyReview"),
    BacktestStrategy: createEntityApi("BacktestStrategy"),
    BacktestRecord: createEntityApi("BacktestRecord"),
  },

  files: {
    async uploadImage(file) {
      // Try backend upload endpoint first (uses service role key, no RLS issues)
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${apiUrl}/api/upload/screenshot`, { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          return { file_url: data.file_url };
        }
      } catch {
        // fall through
      }
      // Fall back to Supabase client upload (if authenticated)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          return await uploadToSupabaseStorage(file);
        }
      } catch {
        // fall through to base64
      }
      // Last resort: base64 (local mode, small images only)
      const fileUrl = await fileToDataUrl(file);
      return { file_url: fileUrl };
    },
  },

  MT5: {
    async listKeys() {
      const data = await apiFetch("/mt5/keys");
      return data?.keys ?? [];
    },

    async createKey(label) {
      return apiFetch("/mt5/keys", {
        method: "POST",
        body: JSON.stringify({ label }),
      });
    },

    async revokeKey(id) {
      return apiFetch(`/mt5/keys/${id}/revoke`, { method: "PATCH" });
    },

    async deleteKey(id) {
      return apiFetch(`/mt5/keys/${id}`, { method: "DELETE" });
    },

    async getSyncStatus() {
      const data = await apiFetch("/mt5/status");
      return data ?? { count: 0, lastSync: null };
    },
  },

  system: {
    async reset() {
      return resetLocalAppState();
    },

    async clearTradeHistory() {
      const data = await apiFetch("/trades", { method: "DELETE" });
      return { deletedCount: data?.deletedCount ?? 0 };
    },
  },
};
