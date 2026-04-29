// ---------------------------------------------------------------------------
// Backtest Symbol Definitions
// Shared between Backtesting.jsx and BacktestingReplay.jsx
// ---------------------------------------------------------------------------

export const SYMBOL_GROUPS = [
  {
    group: "Forex",
    symbols: [
      { id: "EURUSD", label: "EUR/USD" },
      { id: "GBPUSD", label: "GBP/USD" },
      { id: "USDJPY", label: "USD/JPY" },
      { id: "AUDUSD", label: "AUD/USD" },
      { id: "USDCAD", label: "USD/CAD" },
      { id: "USDCHF", label: "USD/CHF" },
      { id: "NZDUSD", label: "NZD/USD" },
      { id: "EURGBP", label: "EUR/GBP" },
      { id: "EURJPY", label: "EUR/JPY" },
      { id: "GBPJPY", label: "GBP/JPY" },
      { id: "XAUUSD", label: "XAU/USD (Gold)" },
      { id: "XAGUSD", label: "XAG/USD (Silver)" },
    ],
  },
  {
    group: "Crypto",
    symbols: [
      { id: "BTCUSD", label: "BTC/USD" },
      { id: "ETHUSD", label: "ETH/USD" },
      { id: "SOLUSD", label: "SOL/USD" },
      { id: "BNBUSD", label: "BNB/USD" },
      { id: "ADAUSD", label: "ADA/USD" },
      { id: "XRPUSD", label: "XRP/USD" },
    ],
  },
  {
    group: "Stocks & ETFs",
    symbols: [
      { id: "AAPL",  label: "AAPL" },
      { id: "TSLA",  label: "TSLA" },
      { id: "NVDA",  label: "NVDA" },
      { id: "MSFT",  label: "MSFT" },
      { id: "AMZN",  label: "AMZN" },
      { id: "META",  label: "META" },
      { id: "GOOGL", label: "GOOGL" },
      { id: "SPY",   label: "SPY" },
      { id: "QQQ",   label: "QQQ" },
      { id: "NQ1",   label: "NQ1! (Nasdaq Futures)" },
    ],
  },
];

// Helper: get display label for a symbol id
export function getSymbolLabel(id) {
  for (const group of SYMBOL_GROUPS) {
    const found = group.symbols.find((s) => s.id === id);
    if (found) return found.label;
  }
  return id;
}
