import { calculateOutcome, calculatePnL, calculateRiskReward } from "../lib/tradeMath.js";
import { AppError, asyncHandler, mapSupabaseError, parseWithSchema } from "../lib/http.js";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { buildTradePayload, mapTrade } from "../lib/serializers.js";
import { tradeCreateSchema, tradeListQuerySchema, tradeUpdateSchema } from "../lib/schemas.js";
import { getOwnedTradeOrThrow } from "../lib/repository.js";

const hasOwnProperty = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

const withDerivedTradeFields = (baseTrade = {}, overrides = {}) => {
  const mergedTrade = {
    ...baseTrade,
    ...overrides,
  };

  const pnl = hasOwnProperty(overrides, "pnl") ? overrides.pnl : calculatePnL(mergedTrade);
  const riskReward = hasOwnProperty(overrides, "risk_reward")
    ? overrides.risk_reward
    : calculateRiskReward(mergedTrade);
  const outcome = hasOwnProperty(overrides, "outcome") ? overrides.outcome : calculateOutcome(pnl);

  return {
    ...mergedTrade,
    pnl,
    risk_reward: riskReward,
    outcome,
  };
};

export const listTrades = asyncHandler(async (req, res) => {
  const query = parseWithSchema(tradeListQuerySchema, req.query, "Trade query parameters are invalid.");
  const supabase = getSupabaseAdmin();
  const sortField = query.sort || "-date";
  const ascending = !sortField.startsWith("-");
  const orderColumn = ascending ? sortField : sortField.slice(1);

  let request = supabase
    .from("trades")
    .select("*")
    .eq("user_id", req.user.id)
    .order(orderColumn, { ascending });

  if (query.limit) {
    request = request.limit(query.limit);
  }

  if (query.status) {
    request = request.eq("status", query.status);
  }

  if (query.symbol) {
    request = request.ilike("symbol", query.symbol.toUpperCase());
  }

  const { data, error } = await request;

  if (error) {
    throw mapSupabaseError(error, "Unable to load trades.");
  }

  res.json({
    trades: (data || []).map(mapTrade),
  });
});

export const getTrade = asyncHandler(async (req, res) => {
  const trade = await getOwnedTradeOrThrow(req.user.id, req.params.tradeId);
  res.json({ trade: mapTrade(trade) });
});

export const createTrade = asyncHandler(async (req, res) => {
  const parsedTrade = parseWithSchema(tradeCreateSchema, req.body, "Trade payload is invalid.");
  const supabase = getSupabaseAdmin();
  const payload = buildTradePayload(withDerivedTradeFields({}, parsedTrade), req.user.id);

  const { data, error } = await supabase.from("trades").insert(payload).select("*").single();

  if (error) {
    throw mapSupabaseError(error, "Unable to create trade.");
  }

  res.status(201).json({
    message: "Trade created.",
    trade: mapTrade(data),
  });
});

export const updateTrade = asyncHandler(async (req, res) => {
  const parsedTrade = parseWithSchema(tradeUpdateSchema, req.body, "Trade payload is invalid.");
  const existingTrade = await getOwnedTradeOrThrow(req.user.id, req.params.tradeId);
  const supabase = getSupabaseAdmin();
  const mergedTrade = withDerivedTradeFields(existingTrade, parsedTrade);
  const payload = buildTradePayload(mergedTrade, req.user.id);

  const { data, error } = await supabase
    .from("trades")
    .update(payload)
    .eq("id", req.params.tradeId)
    .eq("user_id", req.user.id)
    .select("*")
    .single();

  if (error) {
    throw mapSupabaseError(error, "Unable to update trade.");
  }

  res.json({
    message: "Trade updated.",
    trade: mapTrade(data),
  });
});

export const deleteTrade = asyncHandler(async (req, res) => {
  const supabase = getSupabaseAdmin();
  await getOwnedTradeOrThrow(req.user.id, req.params.tradeId);

  const { error } = await supabase
    .from("trades")
    .delete()
    .eq("id", req.params.tradeId)
    .eq("user_id", req.user.id);

  if (error) {
    throw mapSupabaseError(error, "Unable to delete trade.");
  }

  res.status(204).send();
});

export const bulkCreateTrades = asyncHandler(async (req, res) => {
  const { trades } = req.body;
  if (!Array.isArray(trades) || trades.length === 0) {
    throw new AppError(400, "trades must be a non-empty array.");
  }

  const supabase = getSupabaseAdmin();
  const payloads = [];
  const errors = [];

  // Validate each row independently — skip bad ones instead of nuking the batch
  trades.forEach((trade, index) => {
    try {
      const parsed = parseWithSchema(tradeCreateSchema, trade, "Trade payload is invalid.");
      payloads.push(buildTradePayload(withDerivedTradeFields({}, parsed), req.user.id));
    } catch (err) {
      const details = err?.details;
      let message = err?.message || "Invalid row.";
      // Zod flatten() → { formErrors: [], fieldErrors: { field: [msg] } }
      if (details && typeof details === "object") {
        const parts = [];
        if (Array.isArray(details.formErrors)) {
          parts.push(...details.formErrors);
        }
        if (details.fieldErrors && typeof details.fieldErrors === "object") {
          for (const [field, msgs] of Object.entries(details.fieldErrors)) {
            if (Array.isArray(msgs) && msgs.length > 0) {
              parts.push(`${field}: ${msgs.join(", ")}`);
            }
          }
        }
        if (parts.length > 0) {
          message = parts.join("; ");
        }
      }
      errors.push({ row: index + 1, message, input: trade });
    }
  });

  let inserted = [];
  if (payloads.length > 0) {
    const { data, error } = await supabase.from("trades").insert(payloads).select("*");

    if (error) {
      // If the DB rejects the whole batch, surface that alongside any validation errors
      throw mapSupabaseError(error, "Unable to bulk create trades.");
    }
    inserted = data || [];
  }

  const status = inserted.length > 0 ? 201 : 400;
  const summary = errors.length > 0
    ? `${inserted.length} trades created, ${errors.length} skipped.`
    : `${inserted.length} trades created.`;

  res.status(status).json({
    message: summary,
    imported: inserted.length,
    failed: errors.length,
    errors,
    trades: inserted.map(mapTrade),
  });
});

export const clearTrades = asyncHandler(async (req, res) => {
  const supabase = getSupabaseAdmin();

  const { count, error } = await supabase
    .from("trades")
    .delete()
    .eq("user_id", req.user.id)
    .select("*", { count: "exact", head: true });

  if (error) {
    throw mapSupabaseError(error, "Unable to clear trades.");
  }

  res.json({ deletedCount: count ?? 0 });
});
