export function calculatePnL(trade) {
  if (!trade.entry_price || !trade.exit_price || !trade.lot_size) return 0;
  const diff = trade.direction === "long"
    ? trade.exit_price - trade.entry_price
    : trade.entry_price - trade.exit_price;
  return parseFloat((diff * trade.lot_size).toFixed(2));
}

export function calculateRiskReward(trade) {
  if (!trade.entry_price || !trade.stop_loss || !trade.exit_price) return 0;
  const risk = Math.abs(trade.entry_price - trade.stop_loss);
  const reward = trade.direction === "long"
    ? trade.exit_price - trade.entry_price
    : trade.entry_price - trade.exit_price;
  if (risk === 0) return 0;
  return parseFloat((reward / risk).toFixed(2));
}

export function calculateOutcome(pnl) {
  if (pnl > 0) return "win";
  if (pnl < 0) return "loss";
  return "breakeven";
}

export function calculateStats(trades) {
  if (!trades || trades.length === 0) {
    return {
      totalTrades: 0, wins: 0, losses: 0, breakeven: 0,
      winRate: 0, totalPnl: 0, avgPnl: 0, avgWin: 0, avgLoss: 0,
      avgRR: 0, expectancy: 0, profitFactor: 0, maxDrawdown: 0,
      bestTrade: 0, worstTrade: 0, winStreak: 0, lossStreak: 0,
      currentStreak: 0, currentStreakType: null
    };
  }

  const closedTrades = trades.filter(t => t.status === "closed" || !t.status);
  const wins = closedTrades.filter(t => t.outcome === "win");
  const losses = closedTrades.filter(t => t.outcome === "loss");
  const breakeven = closedTrades.filter(t => t.outcome === "breakeven");

  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalWinPnl = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalLossPnl = Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0));

  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
  const avgPnl = closedTrades.length > 0 ? totalPnl / closedTrades.length : 0;
  const avgWin = wins.length > 0 ? totalWinPnl / wins.length : 0;
  const avgLoss = losses.length > 0 ? totalLossPnl / losses.length : 0;

  const avgRR = closedTrades.length > 0
    ? closedTrades.reduce((sum, t) => sum + (t.risk_reward || 0), 0) / closedTrades.length
    : 0;

  const expectancy = closedTrades.length > 0
    ? ((winRate / 100) * avgWin) - ((1 - winRate / 100) * avgLoss)
    : 0;

  const profitFactor = totalLossPnl > 0 ? totalWinPnl / totalLossPnl : totalWinPnl > 0 ? Infinity : 0;

  // Max drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let cumPnl = 0;
  const sortedTrades = [...closedTrades].sort((a, b) => new Date(a.date) - new Date(b.date));
  for (const trade of sortedTrades) {
    cumPnl += trade.pnl || 0;
    if (cumPnl > peak) peak = cumPnl;
    const drawdown = peak - cumPnl;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  // Streaks
  let winStreak = 0, lossStreak = 0, currentWin = 0, currentLoss = 0;
  for (const trade of sortedTrades) {
    if (trade.outcome === "win") {
      currentWin++;
      currentLoss = 0;
      winStreak = Math.max(winStreak, currentWin);
    } else if (trade.outcome === "loss") {
      currentLoss++;
      currentWin = 0;
      lossStreak = Math.max(lossStreak, currentLoss);
    }
  }

  const lastTrade = sortedTrades[sortedTrades.length - 1];
  const currentStreakType = lastTrade?.outcome === "win" ? "win" : lastTrade?.outcome === "loss" ? "loss" : null;
  const currentStreak = currentStreakType === "win" ? currentWin : currentLoss;

  const pnlValues = closedTrades.map(t => t.pnl || 0);
  const bestTrade = Math.max(...pnlValues, 0);
  const worstTrade = Math.min(...pnlValues, 0);

  return {
    total: closedTrades.length,
    totalTrades: closedTrades.length,
    wins: wins.length,
    losses: losses.length,
    breakeven: breakeven.length,
    winRate: parseFloat(winRate.toFixed(1)),
    totalPnl: parseFloat(totalPnl.toFixed(2)),
    avgPnl: parseFloat(avgPnl.toFixed(2)),
    avgWin: parseFloat(avgWin.toFixed(2)),
    avgLoss: parseFloat(avgLoss.toFixed(2)),
    avgRR: parseFloat(avgRR.toFixed(2)),
    expectancy: parseFloat(expectancy.toFixed(2)),
    profitFactor: profitFactor === Infinity ? "∞" : parseFloat(profitFactor.toFixed(2)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    bestTrade: parseFloat(bestTrade.toFixed(2)),
    worstTrade: parseFloat(worstTrade.toFixed(2)),
    winStreak,
    lossStreak,
    currentStreak,
    currentStreakType
  };
}

export function getCumulativePnl(trades) {
  const sorted = [...trades]
    .filter(t => t.status === "closed" || !t.status)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  let cum = 0;
  return sorted.map(t => {
    cum += t.pnl || 0;
    return { date: t.date, pnl: t.pnl || 0, cumPnl: parseFloat(cum.toFixed(2)), symbol: t.symbol };
  });
}

export function getPerformanceBy(trades, field) {
  const map = {};
  const closedTrades = trades.filter(t => t.status === "closed" || !t.status);
  for (const trade of closedTrades) {
    const key = field === "tags" ? (trade.tags || []).join(", ") || "No Tags" : trade[field] || "Unknown";
    if (!map[key]) map[key] = { trades: 0, pnl: 0, wins: 0 };
    map[key].trades++;
    map[key].pnl += trade.pnl || 0;
    if (trade.outcome === "win") map[key].wins++;
  }
  return Object.entries(map).map(([name, data]) => ({
    name,
    trades: data.trades,
    pnl: parseFloat(data.pnl.toFixed(2)),
    winRate: parseFloat(((data.wins / data.trades) * 100).toFixed(1)),
    avgR: parseFloat((data.pnl / data.trades).toFixed(2))
  })).sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl));
}

export function getDailyPnl(trades) {
  const map = {};
  const closedTrades = trades.filter(t => t.status === "closed" || !t.status);
  for (const trade of closedTrades) {
    const day = new Date(trade.date).toISOString().split("T")[0];
    if (!map[day]) map[day] = 0;
    map[day] += trade.pnl || 0;
  }
  return Object.entries(map)
    .map(([date, pnl]) => ({ date, pnl: parseFloat(pnl.toFixed(2)) }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}