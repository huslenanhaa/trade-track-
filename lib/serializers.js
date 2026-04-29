const toNumber = (value, fallback = 0) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

export const sanitizeStringArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item).trim())
    .filter(Boolean);
};

export const buildTradePayload = (input, userId) => ({
  user_id: userId,
  symbol: input.symbol.trim().toUpperCase(),
  date: input.date,
  direction: input.direction,
  entry_price: toNumber(input.entry_price),
  stop_loss: toNumber(input.stop_loss),
  take_profit: toNumber(input.take_profit),
  exit_price: toNumber(input.exit_price),
  lot_size: toNumber(input.lot_size),
  session: input.session || "",
  strategy: input.strategy || "",
  notes: input.notes || "",
  tags: sanitizeStringArray(input.tags),
  mistakes: sanitizeStringArray(input.mistakes),
  screenshots: sanitizeStringArray(input.screenshots),
  status: input.status,
  account: input.account || "",
  pnl: toNumber(input.pnl),
  risk_reward: toNumber(input.risk_reward),
  outcome: input.outcome,
});

export const buildBacktestSessionPayload = (input, userId, currentBalance) => ({
  user_id: userId,
  name: input.name.trim(),
  symbol: input.symbol.trim().toUpperCase(),
  timeframe: input.timeframe.trim().toUpperCase(),
  starting_balance: toNumber(input.startingBalance, 10000),
  current_balance: toNumber(currentBalance, toNumber(input.startingBalance, 10000)),
  cursor_position: Math.max(0, Math.trunc(toNumber(input.cursorPosition, 0))),
  start_date: input.startDate,
  end_date: input.endDate || null,
  status: input.status,
  notes: input.notes || "",
});

export const buildBacktestTradePayload = (input, userId, sessionId) => ({
  user_id: userId,
  session_id: sessionId,
  symbol: input.symbol.trim().toUpperCase(),
  direction: input.direction,
  lot_size: toNumber(input.lotSize),
  entry_price: toNumber(input.entryPrice),
  stop_loss: toNumber(input.sl),
  take_profit: toNumber(input.tp),
  exit_price: input.exitPrice === null || input.exitPrice === undefined ? null : toNumber(input.exitPrice),
  risk_reward: toNumber(input.rr),
  pnl: toNumber(input.pnl),
  result: input.result,
  status: input.status,
  open_time: input.openTime,
  close_time: input.closeTime || null,
  notes: input.notes || "",
});

export const mapTrade = (row) => ({
  ...row,
  entry_price: toNumber(row.entry_price),
  stop_loss: toNumber(row.stop_loss),
  take_profit: toNumber(row.take_profit),
  exit_price: toNumber(row.exit_price),
  lot_size: toNumber(row.lot_size),
  pnl: toNumber(row.pnl),
  risk_reward: toNumber(row.risk_reward),
  tags: Array.isArray(row.tags) ? row.tags : [],
  mistakes: Array.isArray(row.mistakes) ? row.mistakes : [],
  screenshots: Array.isArray(row.screenshots) ? row.screenshots : [],
});

export const mapBacktestSession = (row) => ({
  id: row.id,
  name: row.name,
  symbol: row.symbol,
  timeframe: row.timeframe,
  startingBalance: toNumber(row.starting_balance, 10000),
  currentBalance: toNumber(row.current_balance, 10000),
  cursorPosition: Math.max(0, Math.trunc(toNumber(row.cursor_position, 0))),
  startDate: row.start_date,
  endDate: row.end_date,
  status: row.status,
  notes: row.notes || "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapApiKey = (row) => ({
  id:         row.id,
  label:      row.label,
  isActive:   row.is_active,
  lastUsedAt: row.last_used_at,
  createdAt:  row.created_at,
});

export const mapBacktestTrade = (row) => ({
  id: row.id,
  sessionId: row.session_id,
  symbol: row.symbol,
  direction: row.direction,
  lotSize: toNumber(row.lot_size),
  entryPrice: toNumber(row.entry_price),
  sl: toNumber(row.stop_loss),
  tp: toNumber(row.take_profit),
  exitPrice: row.exit_price === null || row.exit_price === undefined ? null : toNumber(row.exit_price),
  rr: toNumber(row.risk_reward),
  pnl: toNumber(row.pnl),
  result: row.result,
  status: row.status,
  openTime: row.open_time,
  closeTime: row.close_time,
  notes: row.notes || "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
