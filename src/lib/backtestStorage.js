// ---------------------------------------------------------------------------
// Backtest Session + Trade Storage  (localStorage)
// ---------------------------------------------------------------------------

const SESSIONS_KEY = "bt:sessions";
const tradesKey = (sessionId) => `bt:trades:${sessionId}`;

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function persist(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Sessions ────────────────────────────────────────────────────────────────

export function getSessions() {
  return load(SESSIONS_KEY, []);
}

export function getSession(id) {
  return getSessions().find((s) => s.id === id) || null;
}

export function createSession(data) {
  const session = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    cursorPosition: 0,
  };
  const sessions = getSessions();
  sessions.unshift(session);
  persist(SESSIONS_KEY, sessions);
  return session;
}

export function updateSession(id, updates) {
  persist(
    SESSIONS_KEY,
    getSessions().map((s) => (s.id === id ? { ...s, ...updates } : s)),
  );
}

export function deleteSession(id) {
  persist(SESSIONS_KEY, getSessions().filter((s) => s.id !== id));
  localStorage.removeItem(tradesKey(id));
}

// ── Trades ──────────────────────────────────────────────────────────────────

export function getTrades(sessionId) {
  return load(tradesKey(sessionId), []);
}

export function saveTrades(sessionId, trades) {
  persist(tradesKey(sessionId), trades);
}

// ── Session stats helper ─────────────────────────────────────────────────────

export function calcSessionStats(closedTrades, startingBalance = 10000) {
  if (!closedTrades.length) {
    return {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      totalPnl: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      avgRR: 0,
      currentBalance: startingBalance,
    };
  }

  const wins = closedTrades.filter((t) => t.result === "win").length;
  const losses = closedTrades.filter((t) => t.result === "loss").length;
  const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl || 0), 0);

  const grossWins = closedTrades.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLosses = Math.abs(closedTrades.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? Infinity : 0;

  let peak = startingBalance;
  let runningBal = startingBalance;
  let maxDrawdown = 0;
  closedTrades.forEach((t) => {
    runningBal += t.pnl || 0;
    if (runningBal > peak) peak = runningBal;
    const dd = peak - runningBal;
    if (dd > maxDrawdown) maxDrawdown = dd;
  });

  const rrVals = closedTrades.map((t) => parseFloat(t.rr) || 0).filter((v) => v > 0);
  const avgRR = rrVals.length > 0 ? rrVals.reduce((s, v) => s + v, 0) / rrVals.length : 0;

  return {
    totalTrades: closedTrades.length,
    wins,
    losses,
    winRate: parseFloat(((wins / closedTrades.length) * 100).toFixed(1)),
    totalPnl: parseFloat(totalPnl.toFixed(2)),
    profitFactor: parseFloat(profitFactor.toFixed(2)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    avgRR: parseFloat(avgRR.toFixed(2)),
    currentBalance: parseFloat((startingBalance + totalPnl).toFixed(2)),
  };
}
