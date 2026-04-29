import { AppError, mapSupabaseError } from "./http.js";
import { getSupabaseAdmin } from "./supabase.js";

export const getOwnedSessionOrThrow = async (userId, sessionId) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("backtest_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw mapSupabaseError(error, "Unable to load that backtest session.");
  }

  if (!data) {
    throw new AppError(404, "Backtest session not found.");
  }

  return data;
};

export const getOwnedTradeOrThrow = async (userId, tradeId) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("id", tradeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw mapSupabaseError(error, "Unable to load that trade.");
  }

  if (!data) {
    throw new AppError(404, "Trade not found.");
  }

  return data;
};

export const getOwnedBacktestTradeOrThrow = async (userId, sessionId, tradeId) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("backtest_trades")
    .select("*")
    .eq("id", tradeId)
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw mapSupabaseError(error, "Unable to load that backtest trade.");
  }

  if (!data) {
    throw new AppError(404, "Backtest trade not found.");
  }

  return data;
};
