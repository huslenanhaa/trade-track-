import { useEffect, useRef } from "react";

const SCRIPT_SRC = "https://s3.tradingview.com/tv.js";

// Load the TradingView script once and reuse it across instances
let tvScriptPromise = null;
const loadTVScript = () => {
  if (tvScriptPromise) return tvScriptPromise;
  tvScriptPromise = new Promise((resolve, reject) => {
    if (window.TradingView) { resolve(); return; }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => {
      tvScriptPromise = null; // allow retry on next mount
      reject(new Error("Failed to load TradingView script."));
    };
    document.head.appendChild(script);
  });
  return tvScriptPromise;
};

let instanceCounter = 0;

export default function TradingViewWidget({
  symbol = "NASDAQ:AAPL",
  interval = "D",
  theme = "light",
  style = "1",          // 1 = candles, 2 = bars, 3 = line, 8 = Heikin Ashi
  height = "100%",
  showToolbar = true,
}) {
  const containerRef = useRef(null);
  const widgetRef    = useRef(null);
  const containerId  = useRef(`tv_widget_${++instanceCounter}`);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        await loadTVScript();
      } catch {
        return;
      }

      if (cancelled || !containerRef.current || !window.TradingView) return;

      // Destroy previous widget if symbol / interval changed
      if (widgetRef.current) {
        try { widgetRef.current.remove(); } catch {}
        widgetRef.current = null;
      }

      // Clear the container so TradingView writes a fresh iframe
      containerRef.current.innerHTML = "";

      widgetRef.current = new window.TradingView.widget({
        autosize: true,
        symbol,
        interval,
        timezone: "Etc/UTC",
        theme,
        style,
        locale: "en",
        toolbar_bg: theme === "dark" ? "#171c26" : "#f3e8da",
        enable_publishing: false,
        allow_symbol_change: true,
        hide_top_toolbar: !showToolbar,
        save_image: true,
        container_id: containerId.current,
        studies: [],
        show_popup_button: false,
        withdateranges: true,
        hide_side_toolbar: false,
      });
    };

    init();

    return () => {
      cancelled = true;
      if (widgetRef.current) {
        try { widgetRef.current.remove(); } catch {}
        widgetRef.current = null;
      }
    };
  }, [symbol, interval, theme, style, showToolbar]);

  return (
    <div
      id={containerId.current}
      ref={containerRef}
      style={{ height }}
      className="w-full overflow-hidden rounded-xl"
    />
  );
}
