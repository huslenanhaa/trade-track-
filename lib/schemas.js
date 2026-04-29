import { z } from "zod";

const isoDateTimeString = z.string().datetime({ offset: true });
const nullableDateString = z.union([z.string().date(), z.literal(""), z.null()]).optional();
const stringArray = z.array(z.string().trim().min(1)).default([]);
const nullableNumber = z.union([z.number(), z.string(), z.null(), z.undefined()]).transform((value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
});

export const signupSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  fullName: z.string().trim().min(2).max(120),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

const tradeBaseSchema = z.object({
  symbol: z.string().trim().min(1).max(20),
  date: isoDateTimeString,
  direction: z.enum(["long", "short"]).default("long"),
  entry_price: z.coerce.number().finite().default(0),
  stop_loss: z.coerce.number().finite().default(0),
  take_profit: z.coerce.number().finite().default(0),
  exit_price: z.coerce.number().finite().default(0),
  lot_size: z.coerce.number().finite().default(0),
  session: z.string().trim().max(120).default(""),
  strategy: z.string().trim().max(120).default(""),
  notes: z.string().max(5000).default(""),
  tags: stringArray,
  mistakes: stringArray,
  screenshots: stringArray,
  status: z.enum(["open", "closed"]).default("closed"),
  account: z.string().trim().max(120).default(""),
  pnl: z.coerce.number().finite().optional(),
  risk_reward: z.coerce.number().finite().optional(),
  outcome: z.enum(["win", "loss", "breakeven"]).optional(),
});

export const tradeCreateSchema = tradeBaseSchema;
export const tradeUpdateSchema = tradeBaseSchema.partial();

const backtestSessionBaseSchema = z.object({
  name: z.string().trim().min(1).max(150),
  symbol: z.string().trim().min(1).max(20),
  timeframe: z.string().trim().min(1).max(20),
  startingBalance: z.coerce.number().positive().default(10000),
  cursorPosition: z.coerce.number().int().min(0).default(0),
  startDate: z.string().date(),
  endDate: nullableDateString,
  status: z.enum(["draft", "active", "archived", "completed"]).default("active"),
  notes: z.string().max(5000).default(""),
});

export const backtestSessionCreateSchema = backtestSessionBaseSchema;
export const backtestSessionUpdateSchema = backtestSessionBaseSchema.partial();

const backtestTradeBaseSchema = z.object({
  symbol: z.string().trim().min(1).max(20),
  direction: z.enum(["long", "short"]),
  lotSize: z.coerce.number().finite().nonnegative().default(0),
  entryPrice: z.coerce.number().finite().default(0),
  sl: z.coerce.number().finite().default(0),
  tp: z.coerce.number().finite().default(0),
  exitPrice: nullableNumber,
  rr: z.coerce.number().finite().default(0),
  pnl: z.coerce.number().finite().default(0),
  result: z.enum(["win", "loss", "breakeven"]).default("breakeven"),
  status: z.enum(["open", "closed"]).default("open"),
  openTime: isoDateTimeString,
  closeTime: z.union([isoDateTimeString, z.literal(""), z.null()]).optional(),
  notes: z.string().max(5000).default(""),
});

export const backtestTradeCreateSchema = backtestTradeBaseSchema;
export const backtestTradeUpdateSchema = backtestTradeBaseSchema.partial();

export const tradeListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(10000).optional(),
  status: z.enum(["open", "closed"]).optional(),
  symbol: z.string().trim().max(20).optional(),
  sort: z.enum(["date", "-date", "created_at", "-created_at"]).optional(),
});

export const backtestTradeListQuerySchema = z.object({
  status: z.enum(["open", "closed"]).optional(),
});

// MT5 auto-sync schemas
export const mt5TradeSchema = z.object({
  ticket:      z.union([z.number(), z.string()]).transform(String),
  symbol:      z.string().trim().min(1).max(30),
  type:        z.enum(["buy", "sell"]),
  volume:      z.coerce.number().finite().nonnegative(),
  open_price:  z.coerce.number().finite(),
  close_price: z.coerce.number().finite(),
  open_time:   z.string(),
  close_time:  z.string().optional(),
  sl:          z.coerce.number().finite().default(0),
  tp:          z.coerce.number().finite().default(0),
  profit:      z.coerce.number().finite(),
  comment:     z.string().max(500).default(""),
});

export const mt5SyncSchema = z.object({
  trades:     z.array(mt5TradeSchema).min(1).max(500),
  account_id: z.string().optional(),
});

export const mt5ApiKeyCreateSchema = z.object({
  label: z.string().trim().min(1).max(80),
});
