import { useState } from "react";
import TradingViewWidget from "@/components/tradingview/TradingViewWidget";
import { useTheme } from "@/lib/ThemeContext";

const SYMBOLS = [
  { label: "BTC/USD",   value: "BITSTAMP:BTCUSD",   group: "Crypto"  },
  { label: "ETH/USD",   value: "BITSTAMP:ETHUSD",   group: "Crypto"  },
  { label: "SOL/USD",   value: "COINBASE:SOLUSD",   group: "Crypto"  },
  { label: "EUR/USD",   value: "FX:EURUSD",          group: "Forex"   },
  { label: "GBP/USD",   value: "FX:GBPUSD",          group: "Forex"   },
  { label: "USD/JPY",   value: "FX:USDJPY",          group: "Forex"   },
  { label: "AUD/USD",   value: "FX:AUDUSD",          group: "Forex"   },
  { label: "Gold",      value: "TVC:GOLD",           group: "Commod." },
  { label: "Silver",    value: "TVC:SILVER",         group: "Commod." },
  { label: "Oil (WTI)", value: "TVC:USOIL",          group: "Commod." },
  { label: "SPY",       value: "AMEX:SPY",           group: "Stocks"  },
  { label: "QQQ",       value: "NASDAQ:QQQ",         group: "Stocks"  },
  { label: "AAPL",      value: "NASDAQ:AAPL",        group: "Stocks"  },
  { label: "NVDA",      value: "NASDAQ:NVDA",        group: "Stocks"  },
  { label: "TSLA",      value: "NASDAQ:TSLA",        group: "Stocks"  },
];

const INTERVALS = [
  { label: "1m",  value: "1"   },
  { label: "5m",  value: "5"   },
  { label: "15m", value: "15"  },
  { label: "1H",  value: "60"  },
  { label: "4H",  value: "240" },
  { label: "1D",  value: "D"   },
  { label: "1W",  value: "W"   },
];

const STYLES = [
  { label: "Candles",     value: "1" },
  { label: "Heikin Ashi", value: "8" },
  { label: "Bars",        value: "0" },
  { label: "Line",        value: "2" },
];

const GROUPS = ["Crypto", "Forex", "Commod.", "Stocks"];

export default function Markets() {
  const { theme } = useTheme();
  const [symbol,   setSymbol]   = useState("BITSTAMP:BTCUSD");
  const [interval, setInterval] = useState("D");
  const [style,    setStyle]    = useState("1");
  const [filter,   setFilter]   = useState("Crypto");

  const visibleSymbols = SYMBOLS.filter((s) => s.group === filter);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3 md:p-4">
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Group filter */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => { setFilter(g); setSymbol(SYMBOLS.find((s) => s.group === g)?.value ?? symbol); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === g
                  ? "bg-primary text-white shadow"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Symbol selector */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 flex-wrap">
          {visibleSymbols.map((s) => (
            <button
              key={s.value}
              onClick={() => setSymbol(s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                symbol === s.value
                  ? "bg-primary text-white shadow"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Chart style */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          {STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStyle(s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                style === s.value
                  ? "bg-primary text-white shadow"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Interval */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          {INTERVALS.map((iv) => (
            <button
              key={iv.value}
              onClick={() => setInterval(iv.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                interval === iv.value
                  ? "bg-primary text-white shadow"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {iv.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chart ───────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-[520px] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_50px_-36px_rgba(0,0,0,0.28)]">
        <TradingViewWidget
          key={`${symbol}-${interval}-${style}`}
          symbol={symbol}
          interval={interval}
          theme={theme}
          style={style}
          height="100%"
          showToolbar
        />
      </div>
    </div>
  );
}
