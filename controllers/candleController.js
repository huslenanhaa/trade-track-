// ---------------------------------------------------------------------------
// Candle Controller — Finnhub + Twelve Data proxy
//
// GET /api/market/candles?asset=XAUUSD&from=2020-01-01&to=2020-06-01&timeframe=1h
//
// Priority: Finnhub (free, 2yr history) → Twelve Data fallback
// Results are cached in-memory per (asset+timeframe+from+to) to avoid
// hammering the free API quota on every replay tick.
// ---------------------------------------------------------------------------

// ── In-memory cache ─────────────────────────────────────────────────────────
const cache = new Map(); // key → { candles, storedAt }
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

function cacheKey(asset, timeframe, from, to) {
  return `${asset}|${timeframe}|${from}|${to}`;
}

function fromCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.storedAt > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.candles;
}

function toCache(key, candles) {
  cache.set(key, { candles, storedAt: Date.now() });
}

// ── Finnhub symbol map ───────────────────────────────────────────────────────
const FINNHUB_SYMBOL_MAP = {
  EURUSD:  "OANDA:EUR_USD",
  GBPUSD:  "OANDA:GBP_USD",
  USDJPY:  "OANDA:USD_JPY",
  AUDUSD:  "OANDA:AUD_USD",
  USDCAD:  "OANDA:USD_CAD",
  USDCHF:  "OANDA:USD_CHF",
  NZDUSD:  "OANDA:NZD_USD",
  EURGBP:  "OANDA:EUR_GBP",
  EURJPY:  "OANDA:EUR_JPY",
  GBPJPY:  "OANDA:GBP_JPY",
  XAUUSD:  "OANDA:XAU_USD",
  XAGUSD:  "OANDA:XAG_USD",
  BTCUSD:  "BINANCE:BTCUSDT",
  ETHUSD:  "BINANCE:ETHUSDT",
  SOLUSD:  "BINANCE:SOLUSDT",
  BNBUSD:  "BINANCE:BNBUSDT",
  ADAUSD:  "BINANCE:ADAUSDT",
  XRPUSD:  "BINANCE:XRPUSDT",
  AAPL:    "AAPL",
  TSLA:    "TSLA",
  NVDA:    "NVDA",
  MSFT:    "MSFT",
  AMZN:    "AMZN",
  META:    "META",
  GOOGL:   "GOOGL",
  SPY:     "SPY",
  QQQ:     "QQQ",
  NQ1:     "QQQ",  // NQ futures → QQQ proxy
};

// ── Twelve Data symbol map (fallback) ────────────────────────────────────────
const TD_SYMBOL_MAP = {
  EURUSD: "EUR/USD", GBPUSD: "GBP/USD", USDJPY: "USD/JPY",
  AUDUSD: "AUD/USD", USDCAD: "USD/CAD", USDCHF: "USD/CHF",
  NZDUSD: "NZD/USD", EURGBP: "EUR/GBP", EURJPY: "EUR/JPY",
  GBPJPY: "GBP/JPY", XAUUSD: "XAU/USD", XAGUSD: "XAG/USD",
  BTCUSD: "BTC/USD", ETHUSD: "ETH/USD", SOLUSD: "SOL/USD",
  BNBUSD: "BNB/USD", ADAUSD: "ADA/USD", XRPUSD: "XRP/USD",
  AAPL: "AAPL", TSLA: "TSLA", NVDA: "NVDA", MSFT: "MSFT",
  AMZN: "AMZN", META: "META", GOOGL: "GOOGL", SPY: "SPY",
  QQQ: "QQQ", NQ1: "QQQ",
};

// ── Timeframe → Finnhub resolution ──────────────────────────────────────────
const TF_TO_FINNHUB = {
  "1m": "1", "5m": "5", "15m": "15", "30m": "30",
  "1H": "60", "4H": "240", "1D": "D", "1W": "W",
};

// ── Timeframe → Twelve Data interval ────────────────────────────────────────
const TF_TO_TD = {
  "1m": "1min", "5m": "5min", "15m": "15min", "30m": "30min",
  "1H": "1h",   "4H": "4h",   "1D": "1day",   "1W": "1week",
};

// ── Date helpers ─────────────────────────────────────────────────────────────
function toUnix(dateStr) {
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

function toIso(unixSec) {
  return new Date(unixSec * 1000).toISOString();
}

// ── Finnhub fetch ─────────────────────────────────────────────────────────────
async function fetchFromFinnhub(asset, timeframe, from, to, apiKey) {
  const symbol     = FINNHUB_SYMBOL_MAP[asset] || asset;
  const resolution = TF_TO_FINNHUB[timeframe]  || "60";
  const fromTs     = toUnix(from);
  const toTs       = to ? toUnix(to) : Math.floor(Date.now() / 1000);

  const url = new URL("https://finnhub.io/api/v1/forex/candle");
  // For non-forex assets use the stock candle endpoint
  const isCrypto = symbol.includes(":") && !symbol.startsWith("OANDA:");
  const isStock  = !symbol.includes(":");
  const base     = isCrypto
    ? "https://finnhub.io/api/v1/crypto/candle"
    : isStock
      ? "https://finnhub.io/api/v1/stock/candle"
      : "https://finnhub.io/api/v1/forex/candle";

  const finalUrl = new URL(base);
  finalUrl.searchParams.set("symbol",     symbol);
  finalUrl.searchParams.set("resolution", resolution);
  finalUrl.searchParams.set("from",       fromTs);
  finalUrl.searchParams.set("to",         toTs);
  finalUrl.searchParams.set("token",      apiKey);

  const res = await fetch(finalUrl.toString());
  if (!res.ok) throw new Error(`Finnhub HTTP ${res.status}`);

  const data = await res.json();
  if (data.s === "no_data" || !Array.isArray(data.t)) {
    throw new Error("Finnhub returned no data for this range.");
  }

  return data.t.map((ts, i) => ({
    time:   toIso(ts),
    open:   data.o[i],
    high:   data.h[i],
    low:    data.l[i],
    close:  data.c[i],
    volume: data.v?.[i] ?? 0,
    bullish: data.c[i] >= data.o[i],
  })).filter(c =>
    isFinite(c.open) && isFinite(c.high) &&
    isFinite(c.low)  && isFinite(c.close)
  );
}

// ── Twelve Data fetch (fallback) ─────────────────────────────────────────────
async function fetchFromTwelveData(asset, timeframe, from, to, apiKey) {
  const symbol   = TD_SYMBOL_MAP[asset] || asset;
  const interval = TF_TO_TD[timeframe]  || "15min";

  const params = new URLSearchParams({
    symbol,
    interval,
    outputsize: "5000",
    order: "ASC",
    apikey: apiKey,
  });

  if (from) {
    const normalised = from.length === 10
      ? `${from} 00:00:00`
      : from.replace("T", " ").replace("Z", "");
    params.set("start_date", normalised);
  }
  if (to) {
    const normalised = to.length === 10
      ? `${to} 23:59:59`
      : to.replace("T", " ").replace("Z", "");
    params.set("end_date", normalised);
  }

  const res = await fetch(`https://api.twelvedata.com/time_series?${params}`);
  if (!res.ok) throw new Error(`Twelve Data HTTP ${res.status}`);

  const data = await res.json();
  if (data.status === "error") throw new Error(data.message || "Twelve Data error");

  const values = data.values;
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Twelve Data returned no candles.");
  }

  return values.map(v => {
    const time = v.datetime.length === 10
      ? `${v.datetime}T00:00:00Z`
      : `${v.datetime.replace(" ", "T")}Z`;
    const open  = parseFloat(v.open);
    const high  = parseFloat(v.high);
    const low   = parseFloat(v.low);
    const close = parseFloat(v.close);
    if (!isFinite(open) || !isFinite(high) || !isFinite(low) || !isFinite(close)) return null;
    return { time, open, high, low, close, volume: parseFloat(v.volume) || 0, bullish: close >= open };
  }).filter(Boolean);
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function getCandles(req, res) {
  const { asset, from, timeframe, to } = req.query;

  if (!asset || !from || !timeframe) {
    return res.status(400).json({ error: "Required: asset, from, timeframe" });
  }

  const key = cacheKey(asset, timeframe, from, to || "now");
  const cached = fromCache(key);
  if (cached) {
    return res.json({ candles: cached, source: "cache" });
  }

  const finnhubKey   = process.env.FINNHUB_API_KEY;
  const twelveKey    = process.env.TWELVE_DATA_API_KEY;

  let candles = null;
  let source  = "unknown";

  // Try Finnhub first
  if (finnhubKey) {
    try {
      candles = await fetchFromFinnhub(asset, timeframe, from, to, finnhubKey);
      source  = "finnhub";
    } catch (err) {
      console.warn(`[candles] Finnhub failed (${asset}): ${err.message}`);
    }
  }

  // Fallback → Twelve Data
  if (!candles?.length && twelveKey) {
    try {
      candles = await fetchFromTwelveData(asset, timeframe, from, to, twelveKey);
      source  = "twelvedata";
    } catch (err) {
      console.warn(`[candles] Twelve Data failed (${asset}): ${err.message}`);
    }
  }

  if (!candles?.length) {
    return res.status(502).json({
      error: "No candle data available. Both Finnhub and Twelve Data returned nothing for this asset/range.",
    });
  }

  toCache(key, candles);
  return res.json({ candles, source });
}
