import { asyncHandler, mapSupabaseError, parseWithSchema } from "../lib/http.js";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { buildBacktestSessionPayload, mapBacktestSession } from "../lib/serializers.js";
import { backtestSessionCreateSchema, backtestSessionUpdateSchema } from "../lib/schemas.js";
import { getOwnedSessionOrThrow } from "../lib/repository.js";

export const listBacktestSessions = asyncHandler(async (req, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("backtest_sessions")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw mapSupabaseError(error, "Unable to load backtest sessions.");
  }

  res.json({
    sessions: (data || []).map(mapBacktestSession),
  });
});

export const getBacktestSession = asyncHandler(async (req, res) => {
  const session = await getOwnedSessionOrThrow(req.user.id, req.params.sessionId);
  res.json({ session: mapBacktestSession(session) });
});

export const createBacktestSession = asyncHandler(async (req, res) => {
  const parsedSession = parseWithSchema(
    backtestSessionCreateSchema,
    req.body,
    "Backtest session payload is invalid.",
  );
  const supabase = getSupabaseAdmin();
  const payload = buildBacktestSessionPayload(
    parsedSession,
    req.user.id,
    parsedSession.startingBalance,
  );

  const { data, error } = await supabase
    .from("backtest_sessions")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw mapSupabaseError(error, "Unable to create backtest session.");
  }

  res.status(201).json({
    message: "Backtest session created.",
    session: mapBacktestSession(data),
  });
});

export const updateBacktestSession = asyncHandler(async (req, res) => {
  const parsedSession = parseWithSchema(
    backtestSessionUpdateSchema,
    req.body,
    "Backtest session payload is invalid.",
  );
  const existingSession = await getOwnedSessionOrThrow(req.user.id, req.params.sessionId);
  const supabase = getSupabaseAdmin();
  const mergedSession = {
    ...mapBacktestSession(existingSession),
    ...parsedSession,
  };
  const payload = buildBacktestSessionPayload(mergedSession, req.user.id, existingSession.current_balance);

  const { data, error } = await supabase
    .from("backtest_sessions")
    .update(payload)
    .eq("id", req.params.sessionId)
    .eq("user_id", req.user.id)
    .select("*")
    .single();

  if (error) {
    throw mapSupabaseError(error, "Unable to update backtest session.");
  }

  res.json({
    message: "Backtest session updated.",
    session: mapBacktestSession(data),
  });
});

export const deleteBacktestSession = asyncHandler(async (req, res) => {
  const supabase = getSupabaseAdmin();
  await getOwnedSessionOrThrow(req.user.id, req.params.sessionId);

  const { error } = await supabase
    .from("backtest_sessions")
    .delete()
    .eq("id", req.params.sessionId)
    .eq("user_id", req.user.id);

  if (error) {
    throw mapSupabaseError(error, "Unable to delete backtest session.");
  }

  res.status(204).send();
});
