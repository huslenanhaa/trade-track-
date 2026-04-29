export const calculatePnL = (trade) => {
  if (!trade.entry_price || !trade.exit_price || !trade.lot_size) {
    return 0;
  }

  const diff =
    trade.direction === "long"
      ? trade.exit_price - trade.entry_price
      : trade.entry_price - trade.exit_price;

  return Number(diff * trade.lot_size).toFixed(2) * 1;
};

export const calculateRiskReward = (trade) => {
  if (!trade.entry_price || !trade.stop_loss || !trade.exit_price) {
    return 0;
  }

  const risk = Math.abs(trade.entry_price - trade.stop_loss);
  const reward =
    trade.direction === "long"
      ? trade.exit_price - trade.entry_price
      : trade.entry_price - trade.exit_price;

  if (risk === 0) {
    return 0;
  }

  return Number(reward / risk).toFixed(2) * 1;
};

export const calculateOutcome = (pnl) => {
  if (pnl > 0) {
    return "win";
  }

  if (pnl < 0) {
    return "loss";
  }

  return "breakeven";
};
