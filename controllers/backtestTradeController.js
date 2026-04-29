import { asyncHandler, mapSupabaseError, parseWithSchema } from "../lib/http.js";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { recalculateSessionBalance } from "../lib/backtestStats.js";
import { buildBacktestTradePayload, mapBacktestTrade } from "../lib/serializers.js";
import { backtestTradeCreateSchema, backtestTradeListQuerySchema, backtestTradeUpdateSchema } from "../lib/schemas.js";
import { getOwnedBacktestTradeOrThrow, getOwnedSessionOrThrow } from "../lib/repository.js";

export const listBacktestTrades = asyncHandler(async (req, res) => {
  const query = parseWithSchema(
    backtestTradeListQuerySchema,
    req.query,
    "Backtest trade query parameters are invalid.",
  );
  const session = await getOwnedSessionOrThrow(req.user.id, req.params.sessionId);
  const supabase = getSupabaseAdmin();

  let request = supabase
    .from("backtest_trades")
    .select("*")
    .eq("session_id", session.id)
    .eq("user_id", req.user.id)
    .order("open_time", { ascending: true });

  if (query.status) {
    request = request.eq("status", query.status);
  }

  const { data, error } = await request;

  if (error) {
    throw mapSupabaseError(error, "Unable to load backtest trades.");
  }

  res.json({
    trades: (data || []).map(mapBacktestTrade),
  });
});

export const getBacktestTrade = asyncHandler(async (req, res) => {
  await getOwnedSessionOrThrow(req.user.id, req.params.sessionId);
  const trade = await getOwnedBacktestTradeOrThrow(req.user.id, req.params.sessionId, req.params.tradeId);
  res.json({ trade: mapBacktestTrade(trade) });
});

export const createBacktestTrade = asyncHandler(async (req, res) => {
  const parsedTrade = parseWithSchema(
    backtestTradeCreateSchema,
    req.body,
    "Backtest trade payload is invalid.",
  );
  const session = await getOwnedSessionOrThrow(req.user.id, req.params.sessionId);
  const supabase = getSupabaseAdmin();
  const payload = buildBacktestTradePayload(parsedTrade, req.user.id, session.id);

  const { data, error } = await supabase
    .from("backtest_trades")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw mapSupabaseError(error, "Unable to create backtest trade.");
  }

  await recalculateSessionBalance(req.user.id, session.id, Number(session.starting_balance));

  res.status(201).json({
    message: "Backtest trade created.",
    trade: mapBacktestTrade(data),
  });
});

export const updateBacktestTrade = asyncHandler(async (req, res) => {
  const parsedTrade = parseWithSchema(
    backtestTradeUpdateSchema,
    req.body,
    "Backtest trade payload is invalid.",
  );
  const session = await getOwnedSessionOrThrow(req.user.id, req.params.sessionId);
  const existingTrade = await getOwnedBacktestTradeOrThrow(req.user.id, session.id, req.params.tradeId);
  const supabase = getSupabaseAdmin();
  const mergedTrade = {
    ...mapBacktestTrade(existingTrade),
    ...parsedTrade,
  };
  const payload = buildBacktestTradePayload(mergedTrade, req.user.id, session.id);

  const { data, error } = await supabase
    .from("backtest_trades")
    .update(payload)
    .eq("id", req.params.tradeId)
    .eq("session_id", session.id)
    .eq("user_id", req.user.id)
    .select("*")
    .single();

  if (error) {
    throw mapSupabaseError(error, "Unable to update backtest trade.");
  }

  await recalculateSessionBalance(req.user.id, session.id, Number(session.starting_balance));

  res.json({
    message: "Backtest trade updated.",
    trade: mapBacktestTrade(data),
  });
});

export const deleteBacktestTrade = asyncHandler(async (req, res) => {
  const session = await getOwnedSessionOrThrow(req.user.id, req.params.sessionId);
  const supabase = getSupabaseAdmin();
  await getOwnedBacktestTradeOrThrow(req.user.id, session.id, req.params.tradeId);

  const { error } = await supabase
    .from("backtest_trades")
    .delete()
    .eq("id", req.params.tradeId)
    .eq("session_id", session.id)
    .eq("user_id", req.user.id);

  if (error) {
    throw mapSupabaseError(error, "Unable to delete backtest trade.");
  }

  await recalculateSessionBalance(req.user.id, session.id, Number(session.starting_balance));

  res.status(204).send();
});
