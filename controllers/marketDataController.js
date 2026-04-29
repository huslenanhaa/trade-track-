// ---------------------------------------------------------------------------
// Market Data Controller — Twelve Data Proxy
// Proxies Twelve Data API to avoid browser CORS restrictions.
//
// GET /api/market-data?symbol=EURUSD&timeframe=15m
// ---------------------------------------------------------------------------

const TD_BASE = "https://api.twelvedata.com/time_series";

// Internal symbol ID → Twelve Data symbol string
const SYMBOL_MAP = {
  EURUSD: "EUR/USD",
  GBPUSD: "GBP/USD",
  USDJPY: "USD/JPY",
  AUDUSD: "AUD/USD",
  USDCAD: "USD/CAD",
  USDCHF: "USD/CHF",
  NZDUSD: "NZD/USD",
  EURGBP: "EUR/GBP",
  EURJPY: "EUR/JPY",
  GBPJPY: "GBP/JPY",
  XAUUSD: "XAU/USD",
  XAGUSD: "XAG/USD",
  BTCUSD: "BTC/USD",
  ETHUSD: "ETH/USD",
  SOLUSD: "SOL/USD",
  BNBUSD: "BNB/USD",
  ADAUSD: "ADA/USD",
  XRPUSD: "XRP/USD",
  AAPL:   "AAPL",
  TSLA:   "TSLA",
  NVDA:   "NVDA",
  MSFT:   "MSFT",
  AMZN:   "AMZN",
  META:   "META",
  GOOGL:  "GOOGL",
  SPY:    "SPY",
  QQQ:    "QQQ",
  NQ1:    "QQQ", // Futures not on free tier — proxy via QQQ
};

// Internal timeframe → Twelve Data interval
const TF_TO_TD = {
  "1m":  "1min",
  "5m":  "5min",
  "15m": "15min",
  "30m": "30min",
  "1H":  "1h",
  "4H":  "4h",
  "1D":  "1day",
  "1W":  "1week",
};

export async function getMarketData(req, res) {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Twelve Data API key not configured on server (TWELVE_DATA_API_KEY)." });
  }

  const { symbol, timeframe, start_date } = req.query;
  if (!symbol || !timeframe) {
    return res.status(400).json({ error: "Missing required query params: symbol, timeframe" });
  }

  const tdSymbol   = SYMBOL_MAP[symbol] || symbol;
  const tdInterval = TF_TO_TD[timeframe] || "15min";

  const params = new URLSearchParams({
    symbol:     tdSymbol,
    interval:   tdInterval,
    outputsize: "5000",
    order:      "ASC",
    apikey:     apiKey,
  });

  // If a start date is provided, tell Twelve Data to start from that date.
  // This is the key fix that allows historical replay from a specific date.
  if (start_date) {
    // Twelve Data expects "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS"
    const normalised = start_date.length === 10
      ? `${start_date} 00:00:00`
      : start_date.replace("T", " ").replace("Z", "");
    params.set("start_date", normalised);
  }

  try {
    const response = await fetch(`${TD_BASE}?${params}`);
    if (!response.ok) {
      return res.status(502).json({ error: `Twelve Data HTTP ${response.status}` });
    }

    const data = await response.json();

    if (data.status === "error") {
      return res.status(502).json({ error: data.message || "Twelve Data returned an error." });
    }

    const values = data.values;
    if (!Array.isArray(values) || values.length === 0) {
      return res.status(404).json({ error: "No candles returned for this symbol and timeframe." });
    }

    const candles = values
      .map((v) => {
        const open  = parseFloat(v.open);
        const high  = parseFloat(v.high);
        const low   = parseFloat(v.low);
        const close = parseFloat(v.close);
        if (!isFinite(open) || !isFinite(high) || !isFinite(low) || !isFinite(close)) return null;

        // Twelve Data datetime: "2024-01-15 14:45:00"
        const time = v.datetime.length === 10
          ? `${v.datetime}T00:00:00Z`
          : `${v.datetime.replace(" ", "T")}Z`;

        return {
          time,
          open,
          high,
          low,
          close,
          volume:  parseFloat(v.volume) || 0,
          bullish: close >= open,
        };
      })
      .filter(Boolean);

    if (candles.length === 0) {
      return res.status(404).json({ error: "No valid candles after parsing." });
    }

    return res.json({ candles });
  } catch (err) {
    return res.status(502).json({ error: err.message || "Twelve Data request failed." });
  }
}
