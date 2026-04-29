import { mapSupabaseError } from "./http.js";
import { getSupabaseAdmin } from "./supabase.js";

const toNumber = (value) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

export const recalculateSessionBalance = async (userId, sessionId, startingBalance) => {
  const supabase = getSupabaseAdmin();

  const { data: trades, error: tradeError } = await supabase
    .from("backtest_trades")
    .select("pnl, status")
    .eq("session_id", sessionId)
    .eq("user_id", userId);

  if (tradeError) {
    throw mapSupabaseError(tradeError, "Unable to refresh backtest session balance.");
  }

  const realizedPnl = (trades || []).reduce((sum, trade) => {
    if (trade.status !== "closed") {
      return sum;
    }

    return sum + toNumber(trade.pnl);
  }, 0);

  const currentBalance = Number((startingBalance + realizedPnl).toFixed(2));

  const { error: updateError } = await supabase
    .from("backtest_sessions")
    .update({ current_balance: currentBalance })
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (updateError) {
    throw mapSupabaseError(updateError, "Unable to refresh backtest session balance.");
  }

  return currentBalance;
};
