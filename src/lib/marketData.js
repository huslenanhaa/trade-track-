import { addMinutes } from "date-fns";

const MARKET_DATA_CACHE_PREFIX = "trade-track.market-data.v1";
const TARGET_HISTORY_YEARS = 3;
const MAX_CANDLES_PER_REQUEST = 5000;
const REQUEST_DELAY_MS = 250;
const REQUEST_BUDGET_BY_TIMEFRAME = {
  M1: 2,
  M5: 3,
  M15: 6,
  M30: 6,
  H1: 6,
  H4: 4,
  D1: 2,
  W1: 2,
};

export const DEFAULT_BACKTEST_SYMBOL = "EURUSD";

export const BACKTEST_ASSETS = [
  // ── Forex ──
  { id: "EURUSD", label: "EUR/USD",           providerSymbol: "EUR/USD", precision: 5, pipSize: 0.0001, type: "forex" },
  { id: "GBPUSD", label: "GBP/USD",           providerSymbol: "GBP/USD", precision: 5, pipSize: 0.0001, type: "forex" },
  { id: "USDJPY", label: "USD/JPY",           providerSymbol: "USD/JPY", precision: 3, pipSize: 0.01,   type: "forex" },
  { id: "AUDUSD", label: "AUD/USD",           providerSymbol: "AUD/USD", precision: 5, pipSize: 0.0001, type: "forex" },
  { id: "USDCAD", label: "USD/CAD",           providerSymbol: "USD/CAD", precision: 5, pipSize: 0.0001, type: "forex" },
  { id: "USDCHF", label: "USD/CHF",           providerSymbol: "USD/CHF", precision: 5, pipSize: 0.0001, type: "forex" },
  { id: "NZDUSD", label: "NZD/USD",           providerSymbol: "NZD/USD", precision: 5, pipSize: 0.0001, type: "forex" },
  { id: "EURGBP", label: "EUR/GBP",           providerSymbol: "EUR/GBP", precision: 5, pipSize: 0.0001, type: "forex" },
  { id: "EURJPY", label: "EUR/JPY",           providerSymbol: "EUR/JPY", precision: 3, pipSize: 0.01,   type: "forex" },
  { id: "GBPJPY", label: "GBP/JPY",           providerSymbol: "GBP/JPY", precision: 3, pipSize: 0.01,   type: "forex" },

  // ── Commodities ──
  { id: "XAUUSD", label: "Gold (XAU/USD)",    providerSymbol: "XAU/USD", precision: 2, pipSize: 0.1,    type: "commodity" },
  { id: "XAGUSD", label: "Silver (XAG/USD)",  providerSymbol: "XAG/USD", precision: 3, pipSize: 0.01,   type: "commodity" },

  // ── Crypto ──
  { id: "BTCUSD", label: "Bitcoin (BTC/USD)", providerSymbol: "BTC/USD", precision: 2, pipSize: 1,      type: "crypto" },
  { id: "ETHUSD", label: "Ethereum (ETH/USD)",providerSymbol: "ETH/USD", precision: 2, pipSize: 0.1,    type: "crypto" },
  { id: "SOLUSD", label: "Solana (SOL/USD)",  providerSymbol: "SOL/USD", precision: 2, pipSize: 0.01,   type: "crypto" },
  { id: "BNBUSD", label: "BNB/USD",           providerSymbol: "BNB/USD", precision: 2, pipSize: 0.1,    type: "crypto" },
  { id: "ADAUSD", label: "Cardano (ADA/USD)", providerSymbol: "ADA/USD", precision: 4, pipSize: 0.0001, type: "crypto" },
  { id: "XRPUSD", label: "Ripple (XRP/USD)",  providerSymbol: "XRP/USD", precision: 4, pipSize: 0.0001, type: "crypto" },

  // ── Stocks & ETFs ──
  { id: "AAPL",   label: "AAPL",              providerSymbol: "AAPL",    precision: 2, pipSize: 0.01,   type: "stock" },
  { id: "TSLA",   label: "TSLA",              providerSymbol: "TSLA",    precision: 2, pipSize: 0.01,   type: "stock" },
  { id: "NVDA",   label: "NVDA",              providerSymbol: "NVDA",    precision: 2, pipSize: 0.01,   type: "stock" },
  { id: "MSFT",   label: "MSFT",              providerSymbol: "MSFT",    precision: 2, pipSize: 0.01,   type: "stock" },
  { id: "AMZN",   label: "AMZN",              providerSymbol: "AMZN",    precision: 2, pipSize: 0.01,   type: "stock" },
  { id: "META",   label: "META",              providerSymbol: "META",    precision: 2, pipSize: 0.01,   type: "stock" },
  { id: "GOOGL",  label: "GOOGL",             providerSymbol: "GOOGL",   precision: 2, pipSize: 0.01,   type: "stock" },
  { id: "SPY",    label: "SPY",               providerSymbol: "SPY",     precision: 2, pipSize: 0.01,   type: "etf" },
  { id: "QQQ",    label: "QQQ",               providerSymbol: "QQQ",     precision: 2, pipSize: 0.01,   type: "etf" },
  { id: "NQ1",    label: "NQ1! (Nasdaq Futures)", providerSymbol: "QQQ", precision: 2, pipSize: 0.01,   proxyFor: "Nasdaq 100", type: "etf-proxy" },

  // ── Legacy/proxy aliases (kept for backwards compat) ──
  { id: "NAS100", label: "NAS100 (QQQ proxy)",providerSymbol: "QQQ",     precision: 2, pipSize: 1, proxyFor: "Nasdaq 100", type: "etf-proxy" },
  { id: "US30",   label: "US30 (DIA proxy)",  providerSymbol: "DIA",     precision: 2, pipSize: 1, proxyFor: "Dow Jones 30", type: "etf-proxy" },
];

export const BACKTEST_TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"];

const TIMEFRAME_TO_INTERVAL = {
  M1: "1min",
  M5: "5min",
  M15: "15min",
  M30: "30min",
  H1: "1h",
  H4: "4h",
  D1: "1day",
  W1: "1week",
};

const SYMBOL_BASES = {
  XAUUSD: 2850,
  EURUSD: 1.082,
  GBPUSD: 1.264,
  BTCUSD: 87000,
  NAS100: 19800,
  US30: 39200,
  USDJPY: 151.4,
};

const SYMBOL_VOL = {
  XAUUSD: 3.5,
  EURUSD: 0.0008,
  GBPUSD: 0.001,
  BTCUSD: 400,
  NAS100: 55,
  US30: 85,
  USDJPY: 0.18,
};

const TF_MINUTES = {
  M1: 1,
  M5: 5,
  M15: 15,
  M30: 30,
  H1: 60,
  H4: 240,
  D1: 1440,
  W1: 10080,
};

const hasStorage = () => {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
};

const getCacheKey = (symbol, timeframe, targetCandles) =>
  `${MARKET_DATA_CACHE_PREFIX}:${symbol}:${timeframe}:${targetCandles}`;

const getCacheTtlMs = (timeframe) => {
  switch (timeframe) {
    case "M1":
      return 20 * 60 * 1000;
    case "M5":
      return 30 * 60 * 1000;
    case "M15":
    case "M30":
      return 2 * 60 * 60 * 1000;
    case "H1":
    case "H4":
      return 6 * 60 * 60 * 1000;
    case "D1":
    case "W1":
      return 24 * 60 * 60 * 1000;
    default:
      return 2 * 60 * 60 * 1000;
  }
};

const readCachedMarketData = (cacheKey, timeframe) => {
  if (!hasStorage()) return null;

  try {
    const rawValue = window.localStorage.getItem(cacheKey);
    if (!rawValue) return null;

    const parsedValue = JSON.parse(rawValue);
    if (!parsedValue?.storedAt || !Array.isArray(parsedValue?.candles)) {
      window.localStorage.removeItem(cacheKey);
      return null;
    }

    const isExpired = Date.now() - parsedValue.storedAt > getCacheTtlMs(timeframe);
    if (isExpired) {
      window.localStorage.removeItem(cacheKey);
      return null;
    }

    return parsedValue;
  } catch {
    return null;
  }
};

const writeCachedMarketData = (cacheKey, payload) => {
  if (!hasStorage()) return;

  try {
    window.localStorage.setItem(
      cacheKey,
      JSON.stringify({
        ...payload,
        storedAt: Date.now(),
      }),
    );
  } catch {
    // Ignore storage quota and serialization issues.
  }
};

const normalizeDateTime = (dateTimeValue) => {
  if (!dateTimeValue) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateTimeValue)) {
    return `${dateTimeValue}T00:00:00Z`;
  }

  if (dateTimeValue.includes("T")) {
    return dateTimeValue.endsWith("Z") ? dateTimeValue : `${dateTimeValue}Z`;
  }

  return `${dateTimeValue.replace(" ", "T")}Z`;
};

const parseCandleNumber = (value) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const mapMarketCandle = (value) => {
  const open = parseCandleNumber(value.open);
  const high = parseCandleNumber(value.high);
  const low = parseCandleNumber(value.low);
  const close = parseCandleNumber(value.close);
  const time = normalizeDateTime(value.datetime);

  if (!time || !Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) {
    return null;
  }

  return {
    time,
    open,
    high,
    low,
    close,
    volume: parseCandleNumber(value.volume) || 0,
    bullish: close >= open,
  };
};

export const getBacktestAsset = (symbol) =>
  BACKTEST_ASSETS.find((asset) => asset.id === symbol) ||
  BACKTEST_ASSETS.find((asset) => asset.id === DEFAULT_BACKTEST_SYMBOL) ||
  BACKTEST_ASSETS[0];

export const getBacktestAssetLabel = (symbol) => getBacktestAsset(symbol).label;

export const getBacktestLiveDataHint = (symbol) => {
  const asset = getBacktestAsset(symbol);

  if (asset.type === "commodity") {
    return "Gold live candles can require a higher Twelve Data plan. Try EUR/USD, GBP/USD, USD/JPY, BTC/USD, NAS100, or US30 for live replay.";
  }

  return "";
};

export const getBacktestPricePrecision = (symbol) => getBacktestAsset(symbol).precision ?? 2;

export const getBacktestPipSize = (symbol) => getBacktestAsset(symbol).pipSize ?? 0.1;

export const getBacktestInterval = (timeframe) => TIMEFRAME_TO_INTERVAL[timeframe] || "15min";

export const getReplayRequestBudget = (timeframe) => REQUEST_BUDGET_BY_TIMEFRAME[timeframe] || 2;

export const getEstimatedCandlesForYears = (timeframe, years = TARGET_HISTORY_YEARS) => {
  const minutes = TF_MINUTES[timeframe] || 60;
  return Math.ceil((years * 365 * 24 * 60) / minutes);
};

export const getTargetCandleCount = (timeframe, years = TARGET_HISTORY_YEARS, requestBudget = getReplayRequestBudget(timeframe)) =>
  Math.min(getEstimatedCandlesForYears(timeframe, years), requestBudget * MAX_CANDLES_PER_REQUEST);

const formatApiDateTime = (value) => value.toISOString().slice(0, 19).replace("T", " ");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const clearMarketDataCache = (symbol, timeframe, targetCandles = getTargetCandleCount(timeframe)) => {
  if (!hasStorage()) return;

  try {
    window.localStorage.removeItem(getCacheKey(symbol, timeframe, targetCandles));
  } catch {
    // Ignore storage access issues.
  }
};

export async function fetchMarketCandles(symbol, timeframe, options = {}) {
  const apiKey = import.meta.env.VITE_TWELVE_DATA_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Twelve Data API key. Add VITE_TWELVE_DATA_API_KEY to .env.local.");
  }

  const asset = getBacktestAsset(symbol);
  const interval = getBacktestInterval(timeframe);
  const historyYears = options.historyYears || TARGET_HISTORY_YEARS;
  const requestBudget = options.requestBudget || getReplayRequestBudget(timeframe);
  const targetCandles = options.targetCandles || getTargetCandleCount(timeframe, historyYears, requestBudget);
  const cacheKey = getCacheKey(symbol, timeframe, targetCandles);
  const cachedResult = readCachedMarketData(cacheKey, timeframe);
  if (cachedResult) {
    return cachedResult;
  }

  const earliestAllowedDate = new Date();
  earliestAllowedDate.setFullYear(earliestAllowedDate.getFullYear() - historyYears);

  let requestCount = 0;
  let pageEndDate = new Date();
  let warningMessage = "";
  let lastPayload = null;
  const candleMap = new Map();

  while (requestCount < requestBudget && candleMap.size < targetCandles) {
    const remainingCandles = targetCandles - candleMap.size;
    const pageSize = Math.min(MAX_CANDLES_PER_REQUEST, remainingCandles);
    const url = new URL("https://api.twelvedata.com/time_series");
    url.searchParams.set("symbol", asset.providerSymbol);
    url.searchParams.set("interval", interval);
    url.searchParams.set("outputsize", String(pageSize));
    url.searchParams.set("order", "desc");
    url.searchParams.set("apikey", apiKey);
    if (requestCount > 0) {
      url.searchParams.set("end_date", formatApiDateTime(pageEndDate));
    }

    let payload;
    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Could not reach Twelve Data.");
      }
      payload = await response.json();
      lastPayload = payload;
    } catch (error) {
      if (candleMap.size > 0) {
        warningMessage = error.message || "Live market data is partially loaded.";
        break;
      }
      throw error;
    }

    if (payload.status !== "ok") {
      if (candleMap.size > 0) {
        warningMessage = payload.message || "Live market data is partially loaded.";
        break;
      }
      throw new Error(payload.message || "Live market data is unavailable right now.");
    }

    const pageCandles = (payload.values || []).map(mapMarketCandle).filter(Boolean);
    if (pageCandles.length === 0) {
      break;
    }

    pageCandles.forEach((candle) => {
      if (new Date(candle.time) >= earliestAllowedDate) {
        candleMap.set(candle.time, candle);
      }
    });

    requestCount += 1;
    const oldestPageCandle = pageCandles[pageCandles.length - 1];
    const oldestPageTime = oldestPageCandle ? new Date(oldestPageCandle.time) : null;
    if (!oldestPageTime || oldestPageTime <= earliestAllowedDate || pageCandles.length < pageSize) {
      break;
    }

    pageEndDate = new Date(oldestPageTime.getTime() - 1000);
    if (requestCount < requestBudget && candleMap.size < targetCandles) {
      await delay(REQUEST_DELAY_MS);
    }
  }

  const candles = [...candleMap.values()].sort((leftCandle, rightCandle) => new Date(leftCandle.time) - new Date(rightCandle.time));

  if (candles.length === 0) {
    throw new Error("Twelve Data returned no candles for this asset.");
  }

  const estimatedCandles = getEstimatedCandlesForYears(timeframe, historyYears);
  const result = {
    candles,
    meta: {
      source: "Twelve Data",
      interval,
      providerSymbol: lastPayload?.meta?.symbol || asset.providerSymbol,
      exchange: lastPayload?.meta?.exchange || "",
      isProxy: Boolean(asset.proxyFor),
      proxyFor: asset.proxyFor || "",
      type: lastPayload?.meta?.type || asset.type,
      loadedCandles: candles.length,
      targetCandles,
      estimatedCandles,
      requestCount,
      partial: candles.length < estimatedCandles,
      warning: warningMessage,
      coverageStart: candles[0]?.time || "",
      coverageEnd: candles[candles.length - 1]?.time || "",
      storedAt: Date.now(),
    },
  };

  writeCachedMarketData(cacheKey, result);
  return result;
}

// Normalize new-format timeframe keys (e.g. "15m", "1H", "4H") to minutes
const TF_MINUTES_NEW = {
  "1m": 1, "5m": 5, "15m": 15, "30m": 30,
  "1H": 60, "4H": 240, "1D": 1440, "1W": 10080,
};

function tfToMinutes(timeframe) {
  return TF_MINUTES[timeframe] || TF_MINUTES_NEW[timeframe] || 60;
}

// Base prices and volatility for new symbol IDs
const SYMBOL_BASES_EXT = {
  ...SYMBOL_BASES,
  GBPUSD: 1.264, AUDUSD: 0.645, USDCAD: 1.36, USDCHF: 0.895,
  NZDUSD: 0.598, EURGBP: 0.855, EURJPY: 162, GBPJPY: 194,
  USDJPY: 151.4, XAUUSD: 2350, XAGUSD: 28,
  BTCUSD: 65000, ETHUSD: 3200, SOLUSD: 160, BNBUSD: 400,
  ADAUSD: 0.45, XRPUSD: 0.52,
  AAPL: 190, TSLA: 175, NVDA: 850, MSFT: 410, AMZN: 185,
  META: 480, GOOGL: 170, SPY: 520, QQQ: 440, NQ1: 18200,
};

const SYMBOL_YEAR_ANCHORS = {
  EURUSD: { 2020: 1.20, 2021: 1.13, 2022: 1.07, 2023: 1.10, 2024: 1.08, 2025: 1.05, 2026: 1.09 },
  GBPUSD: { 2020: 1.37, 2021: 1.35, 2022: 1.21, 2023: 1.27, 2024: 1.26, 2025: 1.25, 2026: 1.28 },
  USDJPY: { 2020: 103, 2021: 115, 2022: 131, 2023: 141, 2024: 151, 2025: 148, 2026: 145 },
  AUDUSD: { 2020: 0.77, 2021: 0.73, 2022: 0.68, 2023: 0.68, 2024: 0.65, 2025: 0.66, 2026: 0.68 },
  USDCAD: { 2020: 1.27, 2021: 1.26, 2022: 1.35, 2023: 1.32, 2024: 1.36, 2025: 1.39, 2026: 1.37 },
  USDCHF: { 2020: 0.88, 2021: 0.91, 2022: 0.92, 2023: 0.84, 2024: 0.90, 2025: 0.89, 2026: 0.88 },
  NZDUSD: { 2020: 0.72, 2021: 0.68, 2022: 0.63, 2023: 0.63, 2024: 0.60, 2025: 0.59, 2026: 0.61 },
  EURGBP: { 2020: 0.89, 2021: 0.84, 2022: 0.88, 2023: 0.87, 2024: 0.85, 2025: 0.84, 2026: 0.85 },
  EURJPY: { 2020: 126, 2021: 131, 2022: 141, 2023: 156, 2024: 162, 2025: 160, 2026: 158 },
  GBPJPY: { 2020: 141, 2021: 155, 2022: 159, 2023: 180, 2024: 194, 2025: 190, 2026: 186 },
  XAUUSD: { 2020: 1900, 2021: 1820, 2022: 1830, 2023: 2050, 2024: 2350, 2025: 2900, 2026: 5000 },
  XAGUSD: { 2020: 26, 2021: 23, 2022: 24, 2023: 24, 2024: 28, 2025: 32, 2026: 38 },
  BTCUSD: { 2020: 28000, 2021: 47000, 2022: 16500, 2023: 42000, 2024: 65000, 2025: 95000, 2026: 110000 },
  ETHUSD: { 2020: 735, 2021: 3700, 2022: 1200, 2023: 2300, 2024: 3200, 2025: 4200, 2026: 5200 },
  SOLUSD: { 2020: 1.5, 2021: 170, 2022: 10, 2023: 100, 2024: 160, 2025: 220, 2026: 260 },
  BNBUSD: { 2020: 38, 2021: 510, 2022: 245, 2023: 315, 2024: 400, 2025: 650, 2026: 750 },
  ADAUSD: { 2020: 0.18, 2021: 1.31, 2022: 0.25, 2023: 0.60, 2024: 0.45, 2025: 0.75, 2026: 0.90 },
  XRPUSD: { 2020: 0.22, 2021: 0.83, 2022: 0.34, 2023: 0.62, 2024: 0.52, 2025: 1.20, 2026: 1.50 },
  AAPL: { 2020: 133, 2021: 178, 2022: 130, 2023: 192, 2024: 190, 2025: 220, 2026: 235 },
  TSLA: { 2020: 235, 2021: 352, 2022: 123, 2023: 248, 2024: 175, 2025: 260, 2026: 300 },
  NVDA: { 2020: 130, 2021: 294, 2022: 146, 2023: 495, 2024: 850, 2025: 1150, 2026: 1250 },
  MSFT: { 2020: 222, 2021: 336, 2022: 239, 2023: 376, 2024: 410, 2025: 460, 2026: 500 },
  AMZN: { 2020: 163, 2021: 167, 2022: 84, 2023: 151, 2024: 185, 2025: 220, 2026: 240 },
  META: { 2020: 273, 2021: 336, 2022: 120, 2023: 354, 2024: 480, 2025: 620, 2026: 680 },
  GOOGL: { 2020: 88, 2021: 145, 2022: 88, 2023: 140, 2024: 170, 2025: 195, 2026: 210 },
  SPY: { 2020: 373, 2021: 475, 2022: 382, 2023: 475, 2024: 520, 2025: 590, 2026: 630 },
  QQQ: { 2020: 313, 2021: 398, 2022: 266, 2023: 409, 2024: 440, 2025: 520, 2026: 560 },
  NQ1: { 2020: 12900, 2021: 16300, 2022: 11000, 2023: 16900, 2024: 18200, 2025: 21000, 2026: 22500 },
  NAS100: { 2020: 12900, 2021: 16300, 2022: 11000, 2023: 16900, 2024: 19800, 2025: 22000, 2026: 23500 },
  US30: { 2020: 30600, 2021: 36300, 2022: 33100, 2023: 37700, 2024: 39200, 2025: 43000, 2026: 45500 },
};

const SYMBOL_VOL_EXT = {
  ...SYMBOL_VOL,
  GBPUSD: 0.001, AUDUSD: 0.0007, USDCAD: 0.0008, USDCHF: 0.0006,
  NZDUSD: 0.0006, EURGBP: 0.0006, EURJPY: 0.12, GBPJPY: 0.15,
  USDJPY: 0.18, XAUUSD: 4, XAGUSD: 0.25,
  BTCUSD: 500, ETHUSD: 50, SOLUSD: 3, BNBUSD: 4,
  ADAUSD: 0.008, XRPUSD: 0.008,
  AAPL: 1.5, TSLA: 4, NVDA: 10, MSFT: 2.5, AMZN: 2,
  META: 5, GOOGL: 2, SPY: 3, QQQ: 4, NQ1: 80,
};

function getFallbackBasePrice(symbol, asset = getBacktestAsset(symbol)) {
  const lookupId = SYMBOL_BASES_EXT[symbol] !== undefined ? symbol : asset.id;
  return SYMBOL_BASES_EXT[lookupId] || SYMBOL_BASES[asset.id] || 1;
}

function getYearProgress(date) {
  const year = date.getUTCFullYear();
  const yearStart = Date.UTC(year, 0, 1);
  const nextYearStart = Date.UTC(year + 1, 0, 1);
  return (date.getTime() - yearStart) / (nextYearStart - yearStart);
}

function createSeededRandom(seedText) {
  let seed = 2166136261;
  for (let index = 0; index < seedText.length; index += 1) {
    seed ^= seedText.charCodeAt(index);
    seed = Math.imul(seed, 16777619);
  }

  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function getAnchorPrice(symbol, dateValue = null) {
  const asset = getBacktestAsset(symbol);
  const anchors = SYMBOL_YEAR_ANCHORS[symbol] || SYMBOL_YEAR_ANCHORS[asset.id];
  const fallbackBase = getFallbackBasePrice(symbol, asset);
  const date = dateValue ? new Date(dateValue) : new Date();

  if (!anchors || Number.isNaN(date.getTime())) {
    return fallbackBase;
  }

  const years = Object.keys(anchors).map(Number).sort((leftYear, rightYear) => leftYear - rightYear);
  const year = date.getUTCFullYear();

  if (year <= years[0]) return anchors[years[0]];
  if (year >= years[years.length - 1]) return anchors[years[years.length - 1]];

  const previousYear = years.filter((anchorYear) => anchorYear <= year).pop();
  const nextYear = years.find((anchorYear) => anchorYear > year);

  if (!previousYear || !nextYear) return anchors[year] || fallbackBase;

  const progress = getYearProgress(date);
  return anchors[previousYear] + (anchors[nextYear] - anchors[previousYear]) * progress;
}

export function generateMockCandles(symbol, timeframe, count = 300, startDate = null) {
  const asset = getBacktestAsset(symbol);
  // Look up by both original asset.id and the passed symbol for extended coverage
  const lookupId = SYMBOL_BASES_EXT[symbol] !== undefined ? symbol : asset.id;
  const minutes = tfToMinutes(timeframe);
  const preRollCandles = startDate ? Math.min(Math.floor(count * 0.3), Math.max(0, count - 1)) : 0;
  const firstCandleDate = startDate
    ? addMinutes(new Date(startDate), -minutes * preRollCandles)
    : new Date("2024-01-02T00:00:00Z");
  const base = getAnchorPrice(symbol, startDate || firstCandleDate);
  const vol = SYMBOL_VOL_EXT[lookupId] || SYMBOL_VOL[asset.id] || 1;
  const precision = getBacktestPricePrecision(symbol);
  const candles = [];
  let close = base;
  let time = firstCandleDate;
  const random = createSeededRandom(`${symbol}:${timeframe}:${startDate || "default"}`);
  const minPrice = 1 / 10 ** precision;
  const absoluteNoiseCap = Math.max(vol * 1.2, base * 0.00045);
  const meanReversionRate = 0.11;

  for (let index = 0; index < count; index += 1) {
    const target = getAnchorPrice(symbol, time);
    const open = close;
    const waveMove = Math.sin(index / 37) * absoluteNoiseCap * 0.16 + Math.sin(index / 143) * absoluteNoiseCap * 0.1;
    const randomMove = (random() - 0.5) * absoluteNoiseCap * 0.9;
    const anchorPull = (target - open) * meanReversionRate;
    close = Math.max(minPrice, open + anchorPull + waveMove + randomMove);

    const targetDriftLimit = Math.max(vol * 14, target * 0.008);
    if (Math.abs(close - target) > targetDriftLimit) {
      close = target + Math.sign(close - target) * targetDriftLimit;
    }

    const body = Math.abs(close - open);
    const range = Math.max(body, vol * (0.35 + random() * 0.5), target * 0.00045);
    const upperWick = range * (0.14 + random() * 0.22);
    const lowerWick = range * (0.14 + random() * 0.22);
    const high = Math.max(open, close) + upperWick;
    const low = Math.max(minPrice, Math.min(open, close) - lowerWick);

    candles.push({
      time: time.toISOString(),
      open: Number(open.toFixed(precision)),
      high: Number(high.toFixed(precision)),
      low: Number(low.toFixed(precision)),
      close: Number(close.toFixed(precision)),
      bullish: close >= open,
      volume: Math.round(900 + random() * 1800 + body / Math.max(vol, 0.000001) * 300),
    });

    time = addMinutes(time, minutes);
  }

  if (startDate && candles.length > 0) {
    const startTime = new Date(startDate).getTime();
    const anchorIndex = candles.findIndex((candle) => new Date(candle.time).getTime() >= startTime);
    if (anchorIndex >= 0) {
      const offset = base - candles[anchorIndex].close;
      return candles.map((candle) => {
        const open = Math.max(minPrice, candle.open + offset);
        const high = Math.max(minPrice, candle.high + offset);
        const low = Math.max(minPrice, candle.low + offset);
        const closeValue = Math.max(minPrice, candle.close + offset);

        return {
          ...candle,
          open: Number(open.toFixed(precision)),
          high: Number(high.toFixed(precision)),
          low: Number(low.toFixed(precision)),
          close: Number(closeValue.toFixed(precision)),
          bullish: closeValue >= open,
        };
      });
    }
  }

  return candles;
}
