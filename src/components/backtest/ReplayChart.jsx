import { useEffect, useLayoutEffect, useRef } from "react";
import {
  createChart,
  CrosshairMode,
  CandlestickSeries,
} from "lightweight-charts";

// ---------------------------------------------------------------------------
// ReplayChart
// Renders a Lightweight Charts candlestick chart that updates on each replay tick.
// The chart is created once; only the data series is mutated on each render.
// ---------------------------------------------------------------------------

// Convert ISO string → unix timestamp (seconds) for Lightweight Charts
function toTs(isoStr) {
  if (!isoStr) return 0;
  // If it's already a date-string like "2024-01-15", return as-is (LWC accepts both)
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) return isoStr;
  return Math.floor(new Date(isoStr).getTime() / 1000);
}

export function ReplayChart({ visibleCandles = [], className = "" }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRef    = useRef(null);
  const fittedRef    = useRef(false);

  // ── Create chart once ────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: "#0f172a" },
        textColor:  "#94a3b8",
        fontSize:   11,
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#475569", width: 1, style: 1, labelBackgroundColor: "#1e293b" },
        horzLine: { color: "#475569", width: 1, style: 1, labelBackgroundColor: "#1e293b" },
      },
      rightPriceScale: {
        borderColor:  "#1e293b",
        autoScale:    true,
        scaleMargins: { top: 0.06, bottom: 0.04 },
      },
      timeScale: {
        borderColor:    "#1e293b",
        timeVisible:    true,
        secondsVisible: false,
        rightOffset:    12,
        barSpacing:     8,
        minBarSpacing:  2,
      },
      handleScroll: true,
      handleScale:  true,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor:        "#26a69a",
      downColor:      "#ef5350",
      borderUpColor:  "#26a69a",
      borderDownColor:"#ef5350",
      wickUpColor:    "#26a69a",
      wickDownColor:  "#ef5350",
    });

    chartRef.current  = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current  = null;
      seriesRef.current = null;
      fittedRef.current = false;
    };
  }, []);

  // ── Update data on each tick ─────────────────────────────────────────────
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !visibleCandles.length) return;

    const lcsData = visibleCandles.map((c) => ({
      time:  toTs(c.time),
      open:  c.open,
      high:  c.high,
      low:   c.low,
      close: c.close,
    }));

    series.setData(lcsData);

    const ts = chartRef.current?.timeScale();
    if (ts) {
      if (!fittedRef.current) {
        ts.fitContent();
        ts.scrollToPosition(8, false);
        fittedRef.current = true;
      } else {
        ts.scrollToPosition(8, false);
      }
    }
  }, [visibleCandles]);

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-xl overflow-hidden ${className}`}
      style={{ height: 420 }}
    />
  );
}
