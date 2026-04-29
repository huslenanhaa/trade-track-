import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  createChart,
  CrosshairMode,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  createSeriesMarkers,
} from "lightweight-charts";

import { backtestApi } from "@/api/backtestApi";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { generateMockCandles, fetchMarketCandles } from "@/lib/marketData";
import {
  calcSMA,
  calcEMA,
  calcBollingerBands,
  calcVWAP,
  calcRSI,
  calcVolume,
  toTs,
} from "@/lib/indicators";
import { getSymbolLabel } from "@/lib/backtestSymbols";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eraser,
  Minus,
  MousePointer,
  Pause,
  Play,
  SkipBack,
  Square,
  Triangle,
  TrendingUp,
  Type,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────────────

const MIN_CURSOR = 240;
const SIMULATED_CANDLE_COUNT = 1800;
const SPEEDS = [0.25, 0.5, 1, 2, 5];

// Return the number of decimal places appropriate for a given symbol
function pricePrecision(symbol = "") {
  const s = symbol.toUpperCase();
  if (/JPY|JPY$/.test(s))                        return 3;
  if (/XAU|GOLD|SILVER|XAG/.test(s))             return 2;
  if (/BTC|ETH|BNB|SOL/.test(s))                 return 2;
  if (/ADA|XRP|DOGE/.test(s))                    return 4;
  if (/AAPL|TSLA|NVDA|MSFT|AMZN|META|GOOGL|SPY|QQQ|NQ/.test(s)) return 2;
  return 5; // default forex
}

// Format a price number to the correct decimal places for a symbol
function fmtPrice(value, symbol) {
  if (typeof value !== "number" || !isFinite(value)) return "";
  return value.toFixed(pricePrecision(symbol));
}

function chartPriceOptions(symbol = "") {
  const precision = pricePrecision(symbol);
  return {
    precision,
    minMove: 1 / 10 ** precision,
  };
}

const INDICATOR_DEFS = [
  { key: "sma20",  label: "SMA 20",  color: "#f59e0b" },
  { key: "sma50",  label: "SMA 50",  color: "#6366f1" },
  { key: "ema9",   label: "EMA 9",   color: "#22c55e" },
  { key: "ema21",  label: "EMA 21",  color: "#f97316" },
  { key: "bb",     label: "BB 20",   color: "#94a3b8" },
  { key: "vwap",   label: "VWAP",    color: "#38bdf8" },
  { key: "volume", label: "Volume",  color: "#64748b" },
  { key: "rsi",    label: "RSI 14",  color: "#a78bfa" },
];

const DRAWING_TOOLS = [
  { id: "cursor",    Icon: MousePointer, label: "Cursor" },
  { id: "hline",     Icon: Minus,        label: "Horizontal Line" },
  { id: "trendline", Icon: TrendingUp,   label: "Trend Line" },
  { id: "fib",       Icon: Triangle,     label: "Fibonacci" },
  { id: "rect",      Icon: Square,       label: "Rectangle" },
  { id: "text",      Icon: Type,         label: "Text" },
  { id: "eraser",    Icon: Eraser,       label: "Eraser" },
];

// ── Timeframe format mapping (BacktestingReplay uses "1m"/"1H"/"4H" format;
//    fetchMarketCandles expects "M1"/"H1"/"H4" format) ──────────────────────
const TF_MAP = {
  "1m": "M1", "5m": "M5", "15m": "M15", "30m": "M30",
  "1H": "H1", "4H": "H4", "1D": "D1", "1W": "W1",
  M1: "M1", M5: "M5", M15: "M15", M30: "M30",
  H1: "H1", H4: "H4", D1: "D1", W1: "W1",
};

function normalizeReplayTimeframe(timeframe) {
  if (!timeframe) return "H1";
  return TF_MAP[String(timeframe).trim()] || "H1";
}

function toChartTime(time) {
  if (typeof time === "number") {
    return time > 100000000000 ? Math.floor(time / 1000) : Math.floor(time);
  }

  const timestamp = toTs(time);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
}

function isValidCandle(candle) {
  return Boolean(
    candle?.time &&
    Number.isFinite(Number(candle.open)) &&
    Number.isFinite(Number(candle.high)) &&
    Number.isFinite(Number(candle.low)) &&
    Number.isFinite(Number(candle.close)),
  );
}

function normalizeCandles(candles = []) {
  const candleMap = new Map();

  candles.filter(isValidCandle).forEach((candle) => {
    const timestamp = toChartTime(candle.time);
    if (!timestamp) return;

    const normalized = {
      ...candle,
      time: new Date(timestamp * 1000).toISOString(),
      open: Number(candle.open),
      high: Number(candle.high),
      low: Number(candle.low),
      close: Number(candle.close),
      volume: Number(candle.volume) || 0,
    };

    normalized.bullish = normalized.close >= normalized.open;
    candleMap.set(timestamp, normalized);
  });

  return [...candleMap.entries()]
    .sort(([leftTime], [rightTime]) => leftTime - rightTime)
    .map(([, candle]) => candle);
}

function toChartCandle(candle) {
  return {
    time: toChartTime(candle.time),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  };
}

function toChartCandles(candles = []) {
  const byTime = new Map();

  candles.forEach((candle) => {
    const chartCandle = toChartCandle(candle);
    if (
      !chartCandle.time ||
      !Number.isFinite(chartCandle.open) ||
      !Number.isFinite(chartCandle.high) ||
      !Number.isFinite(chartCandle.low) ||
      !Number.isFinite(chartCandle.close)
    ) {
      return;
    }

    byTime.set(chartCandle.time, chartCandle);
  });

  return [...byTime.entries()]
    .sort(([leftTime], [rightTime]) => leftTime - rightTime)
    .map(([, candle]) => candle);
}

// Fetch 2 years of real candles via fetchMarketCandles (paginates automatically)
async function fetchCandlesForSession(symbol, timeframe) {
  const normalizedTf = normalizeReplayTimeframe(timeframe);
  const result = await fetchMarketCandles(symbol, normalizedTf, {
    historyYears: 2,
    requestBudget: 1,
    targetCandles: 5000,
  });
  return normalizeCandles(result.candles);
}

function getSimulatedReplayState(session, savedCursorPosition = 0) {
  const symbol = session?.symbol || "EURUSD";
  const timeframe = session?.timeframe || "15m";
  const candles = normalizeCandles(generateMockCandles(symbol, timeframe, SIMULATED_CANDLE_COUNT, session?.startDate));
  const startIdx = findStartCursorIdx(candles, session?.startDate);
  const cursorIdx = savedCursorPosition > MIN_CURSOR
    ? Math.min(savedCursorPosition, candles.length)
    : startIdx;

  return { candles, startIdx, cursorIdx };
}

function getMarketDataFallbackReason(message = "") {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("api key")) {
    return "Missing Twelve Data API key.";
  }

  if (lowerMessage.includes("rate") || lowerMessage.includes("credits") || lowerMessage.includes("limit")) {
    return "Twelve Data rate limit reached.";
  }

  if (lowerMessage.includes("plan") || lowerMessage.includes("access") || lowerMessage.includes("not available")) {
    return "Twelve Data did not return live candles for this symbol or plan.";
  }

  if (lowerMessage.includes("no candles")) {
    return "Twelve Data returned no candles for this symbol and timeframe.";
  }

  return "Live market data is unavailable right now.";
}

// Find the candle index closest to a given ISO date string.
// Returns MIN_CURSOR as a fallback so the chart always has some history visible.
function findStartCursorIdx(candles, startDate) {
  if (!startDate || !candles.length) return MIN_CURSOR;
  const target = new Date(startDate).getTime();
  for (let i = 0; i < candles.length; i++) {
    if (new Date(candles[i].time).getTime() >= target) {
      // Keep at least MIN_CURSOR candles visible so indicators have data
      return Math.max(MIN_CURSOR, i + 1);
    }
  }
  // startDate is beyond the last candle — sit at the end
  return candles.length;
}

// ── Stats helpers ────────────────────────────────────────────────────────────

function computeStats(trades) {
  const closed = trades.filter((t) => t.status === "closed");
  if (!closed.length) {
    return { trades: 0, winRate: "0.0", pf: "—", avgR: "0.00", maxDD: "0.00", expectancy: "0.00", totalPnl: 0 };
  }

  const wins = closed.filter((t) => t.result === "win");
  const winRate = ((wins.length / closed.length) * 100).toFixed(1);
  const grossWin = closed.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(closed.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  const pf = grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : "∞";
  const avgR = (closed.reduce((s, t) => s + (t.rr || 0), 0) / closed.length).toFixed(2);
  const totalPnl = closed.reduce((s, t) => s + t.pnl, 0);

  // Max drawdown
  let peak = 0, runningPnl = 0, maxDD = 0;
  for (const t of closed) {
    runningPnl += t.pnl;
    if (runningPnl > peak) peak = runningPnl;
    const dd = peak - runningPnl;
    if (dd > maxDD) maxDD = dd;
  }

  const expectancy = (totalPnl / closed.length).toFixed(2);

  return {
    trades: closed.length,
    winRate,
    pf,
    avgR,
    maxDD: maxDD.toFixed(2),
    expectancy,
    totalPnl,
  };
}

// ── Main component ───────────────────────────────────────────────────────────

export default function BacktestingReplay() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // ── Session & saved trades ───────────────────────────────────────────────
  const sessionQuery = useQuery({
    queryKey: ["backtest-session", sessionId],
    queryFn: () => backtestApi.sessions.get(sessionId),
    enabled: !!sessionId && !!user?.id,
  });
  const session = sessionQuery.data?.session ?? null;

  const tradesQuery = useQuery({
    queryKey: ["backtest-trades", sessionId],
    queryFn: () => backtestApi.trades.list(sessionId),
    enabled: !!sessionId && !!user?.id,
  });
  const savedTrades = tradesQuery.data?.trades ?? [];

  // ── Candle state ─────────────────────────────────────────────────────────
  const [allCandles, setAllCandles] = useState([]);
  const [cursorIdx, setCursorIdx] = useState(MIN_CURSOR);
  // The candle index that matches the session's start date — used by SkipBack
  const [startCursorIdx, setStartCursorIdx] = useState(MIN_CURSOR);
  const [fetchStatus, setFetchStatus] = useState("idle"); // idle | loading | error | ok
  const [fetchError, setFetchError] = useState("");
  const [chartReady, setChartReady] = useState(false);
  const [dataMode, setDataMode] = useState("live");
  const [usingMockData, setUsingMockData] = useState(false);
  const [mockDataReason, setMockDataReason] = useState("");

  // ── Replay controls ──────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(0.5);
  const intervalRef = useRef(null);

  // ── Indicators ───────────────────────────────────────────────────────────
  // Volume off by default so candles fill the full chart height.
  const [activeIndicators, setActiveIndicators] = useState({});

  // ── OHLCV hover legend (shown at top-left of chart like TradingView) ─────
  const [ohlcvLegend, setOhlcvLegend] = useState(null);

  // ── Drawing tools ────────────────────────────────────────────────────────
  const [drawTool, setDrawTool] = useState("cursor");

  // ── Trades ───────────────────────────────────────────────────────────────
  const [openTrades, setOpenTrades] = useState([]);
  const [localClosedTrades, setLocalClosedTrades] = useState([]);
  const [confirmLeave, setConfirmLeave] = useState(false);

  // ── Trade form ───────────────────────────────────────────────────────────
  const [direction, setDirection] = useState("long");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [lotSize, setLotSize] = useState("1");
  const [tradeTab, setTradeTab] = useState("new");

  // ── Session name edit ─────────────────────────────────────────────────────
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  // ── Chart refs ────────────────────────────────────────────────────────────
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const markersApiRef = useRef(null);
  const indicatorSeriesRef = useRef({});
  const hasFittedRef = useRef(false);
  // Track previous cursor so we know whether to use update() or setData()
  const prevCursorRef = useRef(0);
  const resizeChartRef = useRef(() => {});

  // ── Session settings (parsed from notes) ─────────────────────────────────
  const sessionSettings = useMemo(() => {
    if (!session?.notes) return { riskPercent: 1, commissionType: "none", commissionValue: 0 };
    try {
      const parsed = JSON.parse(session.notes);
      return {
        riskPercent: parsed.riskPercent ?? 1,
        commissionType: parsed.commissionType ?? "none",
        commissionValue: parsed.commissionValue ?? 0,
      };
    } catch {
      return { riskPercent: 1, commissionType: "none", commissionValue: 0 };
    }
  }, [session?.notes]);

  // ── All trades (saved + local) ────────────────────────────────────────────
  const allTrades = useMemo(() => {
    const savedIds = new Set(savedTrades.map((t) => t.id));
    const merged = [...savedTrades];
    for (const t of localClosedTrades) {
      if (!savedIds.has(t.id)) merged.push(t);
    }
    return merged.sort((a, b) => new Date(a.openTime) - new Date(b.openTime));
  }, [savedTrades, localClosedTrades]);

  const stats = useMemo(() => computeStats(allTrades), [allTrades]);

  // ── Current candle ────────────────────────────────────────────────────────
  const currentCandle = allCandles[cursorIdx - 1] ?? null;

  // ── Derived balance ───────────────────────────────────────────────────────
  const currentBalance = useMemo(() => {
    const base = session?.startingBalance ?? 10000;
    return base + allTrades.filter((t) => t.status === "closed").reduce((s, t) => s + t.pnl, 0);
  }, [session, allTrades]);

  const pnl = currentBalance - (session?.startingBalance ?? 10000);

  // ────────────────────────────────────────────────────────────────────────────
  // PHASE A: Fetch candles on session load
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;

    let isCancelled = false;
    setFetchStatus("loading");
    setFetchError("");
    setAllCandles([]);
    setUsingMockData(false);
    setMockDataReason("");
    hasFittedRef.current = false;
    prevCursorRef.current = 0;

    fetchCandlesForSession(session.symbol, session.timeframe)
      .then((candles) => {
        if (isCancelled) return;
        if (!candles || candles.length === 0) {
          throw new Error("No candles returned for this symbol and timeframe.");
        }
        setAllCandles(candles);
        // If the user has already advanced the session, restore their position.
        // Otherwise land on the candle that matches the session's start date.
        const savedPos = session.cursorPosition;
        const startIdx = findStartCursorIdx(candles, session.startDate);
        setStartCursorIdx(startIdx);
        setCursorIdx(savedPos > MIN_CURSOR ? Math.min(savedPos, candles.length) : startIdx);
        setDataMode("live");
        setUsingMockData(false);
        setMockDataReason("");
        setFetchStatus("ok");
      })
      .catch((err) => {
        if (isCancelled) return;
        const errorMessage = err?.message || "Live market data is unavailable right now.";
        const fallbackReason = getMarketDataFallbackReason(errorMessage);
        console.warn("Market data fetch failed:", errorMessage);
        setFetchError(fallbackReason);
        setDataMode("live");
        setUsingMockData(false);
        setMockDataReason("");
        setFetchStatus("error");
        toast.error("Live market data did not load.", {
          description: fallbackReason,
          duration: 8000,
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [session?.id, session?.symbol, session?.timeframe, session?.startDate]);

  // ── Auto-fill entry price from current candle ─────────────────────────────
  // Track whether the user has manually typed a custom entry price.
  const entryPriceManualRef = useRef(false);

  // When the candle advances, update the entry price ONLY if the user
  // hasn't typed a custom value. This mirrors TradingView's behaviour.
  useEffect(() => {
    if (currentCandle && !entryPriceManualRef.current) {
      setEntryPrice(fmtPrice(currentCandle.close, session?.symbol));
    }
  }, [currentCandle?.time]);

  // ────────────────────────────────────────────────────────────────────────────
  // PHASE B: Lightweight Charts init
  // ────────────────────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    setChartReady(false);

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { color: "#0f172a" },
        textColor: "#94a3b8",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#475569",
          width: 1,
          style: 1,
          labelBackgroundColor: "#1e293b",
        },
        horzLine: {
          color: "#475569",
          width: 1,
          style: 1,
          labelBackgroundColor: "#1e293b",
        },
      },
      rightPriceScale: {
        borderColor: "#1e293b",
        autoScale: true,
        scaleMargins: { top: 0.06, bottom: 0.04 },
      },
      timeScale: {
        borderColor: "#1e293b",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 8,
        minBarSpacing: 2,
      },
      localization: {
        priceFormatter: (price) => fmtPrice(Number(price), session?.symbol),
      },
      handleScroll: true,
      handleScale: true,
    });

    chartInstanceRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      priceFormat: {
        type: "price",
        ...chartPriceOptions(session?.symbol),
      },
    });
    candleSeriesRef.current = series;
    markersApiRef.current = createSeriesMarkers(series, []);

    const resizeChart = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      try {
        chart.resize(Math.floor(width), Math.floor(height));
      } catch {
        // autoSize handles this in newer Lightweight Charts builds.
      }
    };
    resizeChartRef.current = resizeChart;

    const resizeObserver = new ResizeObserver(() => {
      resizeChart();
      requestAnimationFrame(resizeChart);
    });
    resizeObserver.observe(container);
    requestAnimationFrame(() => {
      resizeChart();
      setChartReady(true);
    });

    // Subscribe to crosshair for OHLCV legend
    chart.subscribeCrosshairMove((param) => {
      if (param.time && candleSeriesRef.current) {
        const d = param.seriesData.get(candleSeriesRef.current);
        if (d && d.open !== undefined) {
          setOhlcvLegend({ ...d, time: param.time });
          return;
        }
      }
      setOhlcvLegend(null);
    });

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartInstanceRef.current = null;
      candleSeriesRef.current = null;
      markersApiRef.current = null;
      indicatorSeriesRef.current = {};
      resizeChartRef.current = () => {};
      setChartReady(false);
    };
  }, []);

  useEffect(() => {
    const chart = chartInstanceRef.current;
    const series = candleSeriesRef.current;
    if (!chart || !series) return;

    chart.applyOptions({
      localization: {
        priceFormatter: (price) => fmtPrice(Number(price), session?.symbol),
      },
    });
    series.applyOptions({
      priceFormat: {
        type: "price",
        ...chartPriceOptions(session?.symbol),
      },
    });
  }, [session?.symbol]);

  // ────────────────────────────────────────────────────────────────────────────
  // PHASE C: Update candle data when cursor changes
  //
  // Key design: when advancing by exactly 1 candle (normal play/step-forward),
  // we use series.update() which appends a single bar and auto-scrolls only
  // if the chart is already at the right edge — exactly like TradingView.
  // For jumps (SkipBack, session load, step-back) we do a full setData().
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chartReady || !candleSeriesRef.current || !allCandles.length) return;

    const prevIdx = prevCursorRef.current;
    const isSingleForwardStep = cursorIdx === prevIdx + 1;
    prevCursorRef.current = cursorIdx;

    const safeCursorIdx = Math.min(Math.max(cursorIdx, 1), allCandles.length);
    const visible = allCandles.slice(0, safeCursorIdx);
    if (!visible.length) return;

    if (!hasFittedRef.current || !isSingleForwardStep) {
      // Full reload: initial load, SkipBack, or any non-single-step change
      const lcsData = toChartCandles(visible);
      if (!lcsData.length) {
        setFetchError("The candle data loaded, but none of the bars had valid chart timestamps.");
        setFetchStatus("error");
        return;
      }
      try {
        candleSeriesRef.current.setData(lcsData);
      } catch (error) {
        console.error("[BacktestingReplay] chart data render failed:", error);
        setFetchError("The chart could not render this candle set. Try reloading the session.");
        setFetchStatus("error");
        return;
      }

      const ts = chartInstanceRef.current?.timeScale();
      if (ts && !hasFittedRef.current) {
        // Show last ~200 candles (TradingView default) instead of fitContent()
        // which squishes ALL bars invisibly when there are thousands of candles.
        const BARS_VISIBLE = 200;
        const to = lcsData.length + 8; // 8 bars of right padding
        const from = Math.max(0, lcsData.length - BARS_VISIBLE);
        const fitVisibleRange = () => {
          resizeChartRef.current();
          try {
            ts.setVisibleLogicalRange({ from, to });
            ts.scrollToPosition(8, false);
          } catch {
            // Fallback: fit + scroll
            ts.fitContent();
            ts.scrollToPosition(8, false);
          }
        };
        fitVisibleRange();
        requestAnimationFrame(fitVisibleRange);
        hasFittedRef.current = true;
      }
    } else {
      // Single forward step — fast path: append one bar.
      // LWC auto-scrolls only if the chart is at the right edge (TV behaviour).
      const newCandle = allCandles[safeCursorIdx - 1];
      if (newCandle) {
        const chartCandle = toChartCandle(newCandle);
        if (chartCandle.time) {
          candleSeriesRef.current.update(chartCandle);
        }
      }
    }

    // Update indicators and markers
    updateIndicators(visible);
    updateMarkers(visible);
  }, [chartReady, cursorIdx, allCandles]);

  // ────────────────────────────────────────────────────────────────────────────
  // PHASE D: Indicators
  // ────────────────────────────────────────────────────────────────────────────
  const updateIndicators = useCallback(
    (visible) => {
      const chart = chartInstanceRef.current;
      if (!chart) return;
      const refs = indicatorSeriesRef.current;

      // Helper: ensure series exists
      const ensureLine = (key, color, priceScaleId) => {
        if (!refs[key]) {
          refs[key] = chart.addSeries(LineSeries, {
            color,
            lineWidth: 1,
            priceScaleId: priceScaleId || "right",
            lastValueVisible: false,
            priceLineVisible: false,
          });
        }
      };

      const ensureHistogram = (key, color, scaleMargins) => {
        if (!refs[key]) {
          refs[key] = chart.addSeries(HistogramSeries, {
            color,
            priceFormat: { type: "volume" },
            priceScaleId: key,
            scaleMargins: scaleMargins || { top: 0.85, bottom: 0 },
          });
        }
      };

      // Remove series for disabled indicators
      for (const key of Object.keys(refs)) {
        const indicatorKey = key.replace(/_upper|_lower|_mid|_hist|_signal/, "");
        if (!activeIndicators[indicatorKey]) {
          try { chart.removeSeries(refs[key]); } catch { /* ignore */ }
          delete refs[key];
        }
      }

      // SMA 20
      if (activeIndicators.sma20) {
        ensureLine("sma20", "#f59e0b");
        refs.sma20.setData(calcSMA(visible, 20));
      }
      // SMA 50
      if (activeIndicators.sma50) {
        ensureLine("sma50", "#6366f1");
        refs.sma50.setData(calcSMA(visible, 50));
      }
      // EMA 9
      if (activeIndicators.ema9) {
        ensureLine("ema9", "#22c55e");
        refs.ema9.setData(calcEMA(visible, 9));
      }
      // EMA 21
      if (activeIndicators.ema21) {
        ensureLine("ema21", "#f97316");
        refs.ema21.setData(calcEMA(visible, 21));
      }
      // Bollinger Bands
      if (activeIndicators.bb) {
        const { upper, middle, lower } = calcBollingerBands(visible, 20, 2);
        ensureLine("bb_upper", "#94a3b8");
        ensureLine("bb_mid", "#94a3b8");
        ensureLine("bb_lower", "#94a3b8");
        refs.bb_upper.setData(upper);
        refs.bb_mid.setData(middle);
        refs.bb_lower.setData(lower);
      }
      // VWAP
      if (activeIndicators.vwap) {
        ensureLine("vwap", "#38bdf8");
        refs.vwap.setData(calcVWAP(visible));
      }
      // Volume
      if (activeIndicators.volume) {
        ensureHistogram("volume", "#64748b", { top: 0.85, bottom: 0 });
        refs.volume.setData(calcVolume(visible));
      }
      // RSI
      if (activeIndicators.rsi) {
        if (!refs.rsi) {
          refs.rsi = chart.addSeries(LineSeries, {
            color: "#a78bfa",
            lineWidth: 1,
            priceScaleId: "rsi",
            lastValueVisible: true,
            priceLineVisible: false,
            scaleMargins: { top: 0.6, bottom: 0.1 },
          });
          chart.priceScale("rsi").applyOptions({
            scaleMargins: { top: 0.6, bottom: 0.1 },
          });
        }
        refs.rsi.setData(calcRSI(visible, 14));
      }
    },
    [activeIndicators],
  );

  const toggleIndicator = (key) => {
    setActiveIndicators((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // If turning off, remove the series immediately
      if (!next[key] && chartInstanceRef.current) {
        const refs = indicatorSeriesRef.current;
        const toRemove = Object.keys(refs).filter((k) =>
          k === key || k.startsWith(`${key}_`),
        );
        for (const k of toRemove) {
          try { chartInstanceRef.current.removeSeries(refs[k]); } catch { /* ignore */ }
          delete refs[k];
        }
      }
      return next;
    });
  };

  // ────────────────────────────────────────────────────────────────────────────
  // PHASE E: Trade markers
  // ────────────────────────────────────────────────────────────────────────────
  const updateMarkers = useCallback((visibleCandles = []) => {
    if (!candleSeriesRef.current) return;

    const visibleTimes = new Set(visibleCandles.map((candle) => toChartTime(candle.time)).filter(Boolean));
    if (visibleCandles.length > 0 && visibleTimes.size === 0) {
      if (markersApiRef.current) markersApiRef.current.setMarkers([]);
      return;
    }

    const shouldShowMarker = (time) => {
      if (!time) return false;
      if (visibleTimes.size === 0) return false;
      return visibleTimes.has(time);
    };

    const markers = [];
    for (const t of allTrades) {
      if (!t.openTime) continue;
      const openTime = toTs(t.openTime);
      if (!shouldShowMarker(openTime)) continue;

      markers.push({
        time: openTime,
        position: t.direction === "long" ? "belowBar" : "aboveBar",
        color: t.direction === "long" ? "#22c55e" : "#ef4444",
        shape: t.direction === "long" ? "arrowUp" : "arrowDown",
        text: t.entryPrice ? t.entryPrice.toFixed(2) : "",
      });
      if (t.exitPrice && t.closeTime) {
        const closeTime = toTs(t.closeTime);
        if (!shouldShowMarker(closeTime)) continue;

        markers.push({
          time: closeTime,
          position: "inBar",
          color: "#94a3b8",
          shape: "circle",
          text: t.exitPrice.toFixed(2),
        });
      }
    }

    // Sort by time ascending (required by lightweight-charts)
    markers.sort((a, b) => a.time - b.time);
    try {
      if (markersApiRef.current) markersApiRef.current.setMarkers(markers);
    } catch { /* ignore during init */ }
  }, [allTrades]);

  useEffect(() => {
    if (!allCandles.length) {
      if (markersApiRef.current) markersApiRef.current.setMarkers([]);
      return;
    }
    updateMarkers(allCandles.slice(0, Math.min(Math.max(cursorIdx, 1), allCandles.length)));
  }, [allTrades, allCandles, cursorIdx, updateMarkers]);

  // ── SL/TP price lines for open trades (rendered as chart price lines) ────────
  // We attach these directly to the candlestick series as priceLine objects,
  // which are always horizontally visible regardless of the candle count.
  const slTpLinesRef = useRef({}); // key → { line, series }

  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series) return;

    // Remove previous price lines
    for (const { line } of Object.values(slTpLinesRef.current)) {
      try { series.removePriceLine(line); } catch { /* ignore */ }
    }
    slTpLinesRef.current = {};

    for (const trade of openTrades) {
      if (trade.sl) {
        const line = series.createPriceLine({
          price: trade.sl,
          color: "#ef4444",
          lineWidth: 1,
          lineStyle: 2, // dashed
          axisLabelVisible: true,
          title: `SL`,
        });
        slTpLinesRef.current[`${trade.id}_sl`] = { line };
      }
      if (trade.tp) {
        const line = series.createPriceLine({
          price: trade.tp,
          color: "#22c55e",
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: `TP`,
        });
        slTpLinesRef.current[`${trade.id}_tp`] = { line };
      }
    }
  }, [openTrades]);

  // ────────────────────────────────────────────────────────────────────────────
  // PHASE F: Replay controls
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCursorIdx((prev) => {
          if (prev >= allCandles.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, allCandles.length]);

  // ── Auto-close trades on new candle ──────────────────────────────────────
  const createTradeMutation = useMutation({
    mutationFn: (trade) => backtestApi.trades.create(sessionId, trade),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backtest-trades", sessionId] });
    },
    onError: (err) => toast.error(err.message || "Failed to save trade."),
  });

  const closeTrade = useCallback(
    (trade, exitPrice, result) => {
      const pnlRaw =
        trade.direction === "long"
          ? (exitPrice - trade.entryPrice) * trade.lotSize
          : (trade.entryPrice - exitPrice) * trade.lotSize;
      const rr =
        trade.sl && trade.entryPrice !== trade.sl
          ? Math.abs((exitPrice - trade.entryPrice) / (trade.entryPrice - trade.sl))
          : 0;

      const closed = {
        ...trade,
        exitPrice,
        pnl: parseFloat(pnlRaw.toFixed(2)),
        rr: parseFloat(rr.toFixed(2)),
        result,
        status: "closed",
        closeTime: currentCandle?.time || new Date().toISOString(),
      };

      setOpenTrades((prev) => prev.filter((t) => t.id !== trade.id));
      setLocalClosedTrades((prev) => [...prev, closed]);

      // Persist to Supabase backtest_trades
      createTradeMutation.mutate({
        symbol: closed.symbol,
        direction: closed.direction,
        lotSize: closed.lotSize,
        entryPrice: closed.entryPrice,
        sl: closed.sl,
        tp: closed.tp,
        exitPrice: closed.exitPrice,
        rr: closed.rr,
        pnl: closed.pnl,
        result: closed.result,
        status: "closed",
        openTime: closed.openTime,
        closeTime: closed.closeTime,
      });

      // ── Auto-sync to main journal (trades table) ──────────────────────────
      supabase.auth.getSession().then(({ data }) => {
        const uid = data?.session?.user?.id;
        if (!uid) return;
        supabase.from("trades").insert({
          user_id:              uid,
          symbol:               closed.symbol,
          date:                 closed.closeTime || new Date().toISOString(),
          direction:            closed.direction,
          entry_price:          closed.entryPrice,
          exit_price:           closed.exitPrice,
          stop_loss:            closed.sl  || 0,
          take_profit:          closed.tp  || 0,
          lot_size:             closed.lotSize,
          pnl:                  closed.pnl,
          risk_reward:          closed.rr,
          outcome:              closed.result === "win" ? "win" : closed.result === "loss" ? "loss" : "breakeven",
          status:               "closed",
          source:               "backtest",
          backtest_session_id:  sessionId,
          notes:                `Auto-synced from backtest session "${session?.name || sessionId}"`,
          tags:                 JSON.stringify(["backtest"]),
          session:              "Backtest",
          strategy:             "",
          account:              "",
          mistakes:             JSON.stringify([]),
          screenshots:          JSON.stringify([]),
        }).then(({ error }) => {
          if (error) console.warn("[BacktestingReplay] journal sync failed:", error.message);
        });
      }).catch(() => {});

      toast[result === "win" ? "success" : "error"](
        `Trade closed — ${result.toUpperCase()} $${Math.abs(closed.pnl).toFixed(2)}`,
      );
    },
    [currentCandle, createTradeMutation, sessionId, session?.name],
  );

  useEffect(() => {
    if (!allCandles.length || !openTrades.length) return;
    const candle = allCandles[cursorIdx - 1];
    if (!candle) return;

    for (const trade of [...openTrades]) {
      if (trade.direction === "long") {
        if (trade.sl && candle.low <= trade.sl) {
          closeTrade(trade, trade.sl, "loss");
        } else if (trade.tp && candle.high >= trade.tp) {
          closeTrade(trade, trade.tp, "win");
        }
      } else {
        if (trade.sl && candle.high >= trade.sl) {
          closeTrade(trade, trade.sl, "loss");
        } else if (trade.tp && candle.low <= trade.tp) {
          closeTrade(trade, trade.tp, "win");
        }
      }
    }
  }, [cursorIdx]);

  // ────────────────────────────────────────────────────────────────────────────
  // PHASE G: Persist cursor (debounced)
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || !cursorIdx) return;
    const t = setTimeout(() => {
      backtestApi.sessions.update(sessionId, { cursorPosition: cursorIdx }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [cursorIdx, sessionId, session?.id]);

  // ────────────────────────────────────────────────────────────────────────────
  // PHASE H: Keyboard shortcuts
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space" && !e.shiftKey) {
        e.preventDefault();
        setCursorIdx((p) => Math.min(p + 1, allCandles.length));
      }
      if (e.code === "Space" && e.shiftKey) {
        e.preventDefault();
        setCursorIdx((p) => Math.max(MIN_CURSOR, p - 1));
      }
      if (e.key === "b" || e.key === "B") setDirection("long");
      if (e.key === "s" || e.key === "S") setDirection("short");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [allCandles.length]);

  // ────────────────────────────────────────────────────────────────────────────
  // Session mutations
  // ────────────────────────────────────────────────────────────────────────────
  const updateSessionMutation = useMutation({
    mutationFn: (patch) => backtestApi.sessions.update(sessionId, patch),
    onSuccess: (_res, patch) => {
      queryClient.invalidateQueries({ queryKey: ["backtest-session", sessionId] });
      if (patch?.timeframe) {
        toast.success(`Timeframe changed to ${patch.timeframe}`);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const endSession = () => {
    updateSessionMutation.mutate({ status: "completed" });
    toast.success("Session marked as completed.");
  };

  const saveSessionName = () => {
    if (!nameInput.trim()) return;
    updateSessionMutation.mutate({ name: nameInput.trim() });
    setEditingName(false);
  };

  const changeTimeframe = (timeframe) => {
    if (!session || timeframe === session.timeframe || updateSessionMutation.isPending) return;
    if (openTrades.length > 0) {
      toast.error("Close open trades before changing timeframe.");
      return;
    }

    setIsPlaying(false);
    setFetchStatus("loading");
    setAllCandles([]);
    setUsingMockData(false);
    setMockDataReason("");
    hasFittedRef.current = false;
    prevCursorRef.current = 0;
    updateSessionMutation.mutate({ timeframe, cursorPosition: 0 });
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Trade placement
  // ────────────────────────────────────────────────────────────────────────────
  const placeTrade = () => {
    const ep = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);
    const tp = parseFloat(takeProfit);
    const ls = parseFloat(lotSize) || 1;

    if (!ep || isNaN(ep)) { toast.error("Enter a valid entry price"); return; }
    if (!currentCandle) { toast.error("No candle data available"); return; }
    if (session?.status === "completed") { toast.error("Session is completed"); return; }

    const rr = sl && ep !== sl
      ? Math.abs((tp - ep) / (ep - sl))
      : 0;

    const newTrade = {
      id: crypto.randomUUID(),
      symbol: session?.symbol || "UNKNOWN",
      direction,
      entryPrice: ep,
      sl: sl || null,
      tp: tp || null,
      lotSize: ls,
      rr: parseFloat(rr.toFixed(2)),
      pnl: 0,
      result: "open",
      status: "open",
      openTime: currentCandle.time,
      closeTime: null,
    };

    setOpenTrades((prev) => [...prev, newTrade]);
    toast.success(`${direction === "long" ? "BUY" : "SELL"} trade placed at ${ep}`);
    setTradeTab("open");
  };

  const closeAtMarket = (trade) => {
    if (!currentCandle) return;
    const exitPrice = currentCandle.close;
    const pnlRaw =
      trade.direction === "long"
        ? (exitPrice - trade.entryPrice) * trade.lotSize
        : (trade.entryPrice - exitPrice) * trade.lotSize;
    const result = pnlRaw >= 0 ? "win" : "loss";
    closeTrade(trade, exitPrice, result);
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Risk calc preview
  // ────────────────────────────────────────────────────────────────────────────
  const riskPreview = useMemo(() => {
    const ep = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);
    const tp = parseFloat(takeProfit);
    const ls = parseFloat(lotSize) || 1;
    if (!ep || !sl || isNaN(ep) || isNaN(sl)) return null;
    const risk = Math.abs(ep - sl) * ls;
    const reward = tp ? Math.abs(tp - ep) * ls : null;
    const rr = reward ? reward / risk : null;
    return { risk, reward, rr };
  }, [entryPrice, stopLoss, takeProfit, lotSize]);

  // ────────────────────────────────────────────────────────────────────────────
  // Mock data fallback
  // ────────────────────────────────────────────────────────────────────────────
  const loadMockData = () => {
    const { candles, startIdx, cursorIdx } = getSimulatedReplayState(session, session?.cursorPosition);
    hasFittedRef.current = false;
    prevCursorRef.current = 0;
    setAllCandles(candles);
    setStartCursorIdx(startIdx);
    setCursorIdx(cursorIdx);
    setFetchError("");
    setDataMode("simulated");
    setUsingMockData(true);
    setMockDataReason("Live market data was manually replaced with simulated candles.");
    setFetchStatus("ok");
    toast.warning("Using simulated candles for this replay.", {
      description: "Backtesting stays available when live market data is paused, rate-limited, or offline.",
      duration: 8000,
    });
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────────

  // ── TradingView-style tab state for right panel ───────────────────────────
  // (reuses the existing tradeTab state: "new" | "open" | "all")

  if (sessionQuery.isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#131722]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2962ff]/30 border-t-[#2962ff]" />
          <p className="text-xs text-[#787b86]">Loading session…</p>
        </div>
      </div>
    );
  }

  if (sessionQuery.isError || !session) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#131722]">
        <AlertTriangle className="h-12 w-12 text-[#f23645]" />
        <p className="text-lg font-semibold text-white">Session not found</p>
        <Button onClick={() => navigate("/Backtesting")}>Back to Sessions</Button>
      </div>
    );
  }

  const symbolLabel = getSymbolLabel(session.symbol) || session.symbol;
  const isCompleted = session.status === "completed";

  // TradingView exact colors
  const TV = {
    bg:         "#131722",
    panel:      "#1e222d",
    border:     "#2a2e39",
    text:       "#d1d5db",
    textMuted:  "#787b86",
    textDim:    "#4c525e",
    green:      "#26a69a",
    red:        "#ef5350",
    blue:       "#2962ff",
    hover:      "#2a2e39",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden select-none"
      style={{ background: TV.bg, color: TV.text, fontFamily: "'Trebuchet MS', sans-serif" }}
    >
      {/* ═══════════════════════════════════════════════════════════════
          TOP BAR  — identical zone layout to TradingView's chart-page
          height: 38px  (TV uses exactly 38px)
      ═══════════════════════════════════════════════════════════════ */}
      <div
        className="flex h-[38px] shrink-0 items-center justify-between"
        style={{ borderBottom: `1px solid ${TV.border}`, background: TV.panel }}
      >
        {/* ── LEFT ZONE: logo-width (52px) + symbol area ── */}
        <div className="flex items-center h-full">
          {/* 52px logo/back zone — mirrors TV's topleft zone */}
          <div
            className="flex h-full w-[52px] shrink-0 items-center justify-center"
            style={{ borderRight: `1px solid ${TV.border}` }}
          >
            <button
              onClick={() => {
                if (isPlaying || openTrades.length > 0) setConfirmLeave(true);
                else navigate("/Backtesting");
              }}
              title="Back to sessions"
              className="flex h-7 w-7 items-center justify-center rounded transition-colors"
              style={{ color: TV.textMuted }}
              onMouseEnter={e => e.currentTarget.style.background = TV.hover}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Symbol + name pill — TV's symbol search area */}
          <div
            className="flex h-full items-center gap-0"
            style={{ borderRight: `1px solid ${TV.border}` }}
          >
            {/* Editable name */}
            <div className="flex items-center px-2 h-full gap-1.5">
              {editingName ? (
                <>
                  <input
                    className="h-6 w-32 rounded px-2 text-xs text-white focus:outline-none focus:ring-1"
                    style={{ background: TV.bg, border: `1px solid ${TV.blue}`, color: TV.text }}
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter")  saveSessionName();
                      if (e.key === "Escape") setEditingName(false);
                    }}
                    autoFocus
                  />
                  <button onClick={saveSessionName} style={{ color: TV.green }} className="flex h-5 w-5 items-center justify-center rounded" onMouseEnter={e=>e.currentTarget.style.background=TV.hover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <Check className="h-3 w-3" />
                  </button>
                  <button onClick={() => setEditingName(false)} style={{ color: TV.textMuted }} className="flex h-5 w-5 items-center justify-center rounded" onMouseEnter={e=>e.currentTarget.style.background=TV.hover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <button
                  onDoubleClick={() => { setNameInput(session.name); setEditingName(true); }}
                  title="Double-click to rename"
                  className="flex items-center gap-1.5 h-full px-1 rounded transition-colors text-left"
                  style={{ color: TV.text }}
                  onMouseEnter={e=>e.currentTarget.style.background=TV.hover}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                >
                  <span className="text-sm font-bold tracking-tight" style={{ color: "#fff" }}>
                    {symbolLabel}
                  </span>
                  <span
                    className="max-w-[140px] truncate text-xs"
                    style={{ color: TV.textMuted }}
                  >
                    {session.name}
                  </span>
                </button>
              )}
            </div>

            {/* Timeframe pill — TV style */}
            <div className="flex items-center gap-px px-1 h-full">
              {["1m","5m","15m","30m","1H","4H","1D","1W"].map(tf => (
                <button
                  key={tf}
                  onClick={() => changeTimeframe(tf)}
                  disabled={updateSessionMutation.isPending}
                  className="flex h-6 items-center justify-center rounded px-2 text-xs font-medium transition-colors"
                  style={{
                    background:   session.timeframe === tf ? TV.blue : "transparent",
                    color:        session.timeframe === tf ? "#fff" : TV.textMuted,
                    fontWeight:   session.timeframe === tf ? 700 : 400,
                    cursor:       updateSessionMutation.isPending ? "wait" : "pointer",
                  }}
                  onMouseEnter={e => { if (session.timeframe !== tf) e.currentTarget.style.background = TV.hover; }}
                  onMouseLeave={e => { if (session.timeframe !== tf) e.currentTarget.style.background = "transparent"; }}
                  title={`Timeframe: ${tf}`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Indicators toggles — TV's "Indicators" button */}
          <div
            className="flex items-center gap-px px-2 h-full"
            style={{ borderRight: `1px solid ${TV.border}` }}
          >
            {INDICATOR_DEFS.map(({ key, label, color }) => (
              <button
                key={key}
                title={label}
                onClick={() => toggleIndicator(key)}
                className="flex h-6 w-7 items-center justify-center rounded text-[10px] font-bold transition-all"
                style={{
                  color:   activeIndicators[key] ? color : TV.textDim,
                  background: activeIndicators[key] ? `${color}18` : "transparent",
                  border:  activeIndicators[key] ? `1px solid ${color}40` : "1px solid transparent",
                }}
                onMouseEnter={e => { if (!activeIndicators[key]) e.currentTarget.style.color = TV.textMuted; }}
                onMouseLeave={e => { if (!activeIndicators[key]) e.currentTarget.style.color = TV.textDim; }}
              >
                {{ sma20:"S2",sma50:"S5",ema9:"E9",ema21:"E2",bb:"BB",vwap:"VP",volume:"V",rsi:"RS" }[key]}
              </button>
            ))}
          </div>
        </div>

        {/* ── CENTER ZONE: replay controls ── */}
        <div className="flex items-center gap-1 px-2">
          {/* Jump to start */}
          <button
            onClick={() => setCursorIdx(startCursorIdx)}
            title="Jump to session start"
            className="flex h-7 w-7 items-center justify-center rounded transition-colors"
            style={{ color: TV.textMuted }}
            onMouseEnter={e=>e.currentTarget.style.background=TV.hover}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>

          {/* Step back */}
          <button
            onClick={() => setCursorIdx((p) => Math.max(MIN_CURSOR, p - 1))}
            className="flex h-7 w-7 items-center justify-center rounded transition-colors"
            style={{ color: TV.textMuted }}
            onMouseEnter={e=>e.currentTarget.style.background=TV.hover}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {/* Play / Pause — the main CTA button */}
          <button
            onClick={() => setIsPlaying(p => !p)}
            className="flex h-7 items-center justify-center gap-1 rounded px-3 text-xs font-semibold transition-colors"
            style={{
              background: isPlaying ? TV.panel : TV.blue,
              color: "#fff",
              border: `1px solid ${isPlaying ? TV.border : TV.blue}`,
            }}
            onMouseEnter={e => { if (!isPlaying) e.currentTarget.style.background = "#1e53e5"; }}
            onMouseLeave={e => { if (!isPlaying) e.currentTarget.style.background = TV.blue; }}
          >
            {isPlaying
              ? <><Pause className="h-3 w-3" /> Pause</>
              : <><Play  className="h-3 w-3" /> Play</>}
          </button>

          {/* Step forward */}
          <button
            onClick={() => setCursorIdx(p => Math.min(p + 1, allCandles.length))}
            className="flex h-7 w-7 items-center justify-center rounded transition-colors"
            style={{ color: TV.textMuted }}
            onMouseEnter={e=>e.currentTarget.style.background=TV.hover}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          {/* Speed pills */}
          <div className="ml-1 flex items-center gap-0.5">
            {SPEEDS.map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className="rounded px-1.5 py-0.5 text-[11px] font-semibold transition-colors"
                style={{
                  background: speed === s ? TV.blue  : "transparent",
                  color:      speed === s ? "#fff"   : TV.textMuted,
                }}
                onMouseEnter={e => { if (speed !== s) e.currentTarget.style.background = TV.hover; }}
                onMouseLeave={e => { if (speed !== s) e.currentTarget.style.background = "transparent"; }}
              >
                {s}×
              </button>
            ))}
          </div>

          {/* Candle timestamp */}
          <span
            className="ml-2 tabular-nums text-[11px]"
            style={{ color: TV.textMuted }}
          >
            {currentCandle
              ? format(new Date(currentCandle.time), "dd MMM yyyy · HH:mm")
              : "—"}
          </span>
          <span className="text-[11px]" style={{ color: TV.textDim }}>
            {cursorIdx}/{allCandles.length || "?"}
          </span>
        </div>

        {/* ── RIGHT ZONE: account stats + end session ── */}
        <div className="flex items-center gap-0" style={{ borderLeft: `1px solid ${TV.border}` }}>
          {/* Stat cells — exact TV data-window style */}
          {[
            { label: "Balance", value: `$${currentBalance.toFixed(2)}`, accent: null },
            {
              label: "P&L",
              value: `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`,
              accent: pnl >= 0 ? TV.green : TV.red,
            },
            { label: "Win%", value: `${stats.winRate}%`, accent: null },
            { label: "Trades", value: stats.trades, accent: null },
          ].map(({ label, value, accent }) => (
            <div
              key={label}
              className="flex h-full flex-col items-end justify-center px-3"
              style={{ borderLeft: `1px solid ${TV.border}` }}
            >
              <span className="text-[9px] uppercase tracking-wider" style={{ color: TV.textDim }}>
                {label}
              </span>
              <span
                className="tabular-nums text-xs font-bold"
                style={{ color: accent ?? TV.text }}
              >
                {value}
              </span>
            </div>
          ))}

          {/* End / Reactivate */}
          <div className="px-2" style={{ borderLeft: `1px solid ${TV.border}` }}>
            {isCompleted ? (
              <button
                onClick={() => updateSessionMutation.mutate({ status: "active" })}
                disabled={updateSessionMutation.isPending}
                className="rounded px-2.5 py-1 text-[11px] font-semibold transition-colors"
                style={{ background: `${TV.green}22`, color: TV.green }}
                onMouseEnter={e=>e.currentTarget.style.background=`${TV.green}33`}
                onMouseLeave={e=>e.currentTarget.style.background=`${TV.green}22`}
              >
                Reactivate
              </button>
            ) : (
              <button
                onClick={endSession}
                className="rounded px-2.5 py-1 text-[11px] font-semibold transition-colors"
                style={{ background: `${TV.red}22`, color: TV.red }}
                onMouseEnter={e=>e.currentTarget.style.background=`${TV.red}33`}
                onMouseLeave={e=>e.currentTarget.style.background=`${TV.red}22`}
              >
                End Session
              </button>
            )}
          </div>
        </div>
      </div>{/* /TOP BAR */}

      {/* ── COMPLETED BANNER ── */}
      {isCompleted && (
        <div
          className="flex h-7 shrink-0 items-center justify-center gap-2 text-[11px]"
          style={{ background: `${TV.green}18`, borderBottom: `1px solid ${TV.green}40`, color: TV.green }}
        >
          <Check className="h-3 w-3" />
          Session completed — trade placement disabled. Review your results below.
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MIDDLE ROW — left toolbar + chart + right widgetbar
          Mirrors TV's:  layout_area--left | layout_area--center | layout_area--right
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex min-h-0 flex-1">

        {/* ── LEFT TOOLBAR (52px) — TV drawing tools rail ── */}
        <div
          className="flex w-[52px] shrink-0 flex-col items-center py-1.5 gap-0.5"
          style={{ borderRight: `1px solid ${TV.border}`, background: TV.panel }}
        >
          {/* Drawing tool buttons */}
          {DRAWING_TOOLS.map(({ id, Icon, label }) => (
            <button
              key={id}
              title={label}
              onClick={() => {
                if (id !== "cursor") toast.info("Drawing tools coming soon");
                setDrawTool(id);
              }}
              className="flex h-9 w-9 items-center justify-center rounded transition-colors"
              style={{
                background: drawTool === id ? `${TV.blue}28` : "transparent",
                color:      drawTool === id ? TV.blue : TV.textMuted,
              }}
              onMouseEnter={e => { if (drawTool !== id) { e.currentTarget.style.background = TV.hover; e.currentTarget.style.color = TV.text; } }}
              onMouseLeave={e => { if (drawTool !== id) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TV.textMuted; } }}
            >
              <Icon className="h-[15px] w-[15px]" />
            </button>
          ))}

          {/* Divider */}
          <div className="my-1 w-7 shrink-0" style={{ borderTop: `1px solid ${TV.border}` }} />

          {/* Indicator abbreviation buttons — compact, color-coded */}
          {INDICATOR_DEFS.map(({ key, color }) => (
            <button
              key={key}
              title={INDICATOR_DEFS.find(d => d.key === key)?.label}
              onClick={() => toggleIndicator(key)}
              className="flex h-7 w-9 items-center justify-center rounded text-[9px] font-bold tracking-tight transition-all"
              style={{
                color:      activeIndicators[key] ? color : TV.textDim,
                background: activeIndicators[key] ? `${color}18` : "transparent",
                opacity:    activeIndicators[key] ? 1 : 0.5,
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "1"}
              onMouseLeave={e => { if (!activeIndicators[key]) e.currentTarget.style.opacity = "0.5"; }}
            >
              {{ sma20:"S20",sma50:"S50",ema9:"E9",ema21:"E21",bb:"BB",vwap:"VP",volume:"VOL",rsi:"RSI" }[key]}
            </button>
          ))}
        </div>

        {/* ── CHART (flex-1) — layout_area--center ── */}
        <div className="relative min-w-0 flex-1" style={{ background: TV.bg }}>
          {usingMockData && fetchStatus === "ok" && (
            <div
              className="absolute left-3 right-3 top-3 z-20 flex items-start gap-2 rounded border px-3 py-2 text-xs font-medium shadow-lg"
              style={{
                background: "#451a03",
                borderColor: "#f59e0b",
                color: "#fde68a",
              }}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Showing simulated price data - {mockDataReason || "Live market data is unavailable right now."} Prices are anchored to historical reality but are not real market data.
              </span>
            </div>
          )}

          {/* Loading overlay */}
          {(fetchStatus === "loading" || (fetchStatus === "ok" && allCandles.length > 0 && !chartReady)) && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
              style={{ background: TV.bg }}
            >
              <div
                className="h-8 w-8 animate-spin rounded-full border-2"
                style={{ borderColor: `${TV.blue}30`, borderTopColor: TV.blue }}
              />
              <p className="text-xs" style={{ color: TV.textMuted }}>
                Loading {symbolLabel} {session.timeframe} candles…
              </p>
            </div>
          )}

          {/* Error overlay */}
          {fetchStatus === "error" && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
              style={{ background: TV.bg }}
            >
              <AlertTriangle className="h-8 w-8" style={{ color: TV.red }} />
              <p className="text-sm font-semibold" style={{ color: TV.red }}>
                Failed to load market data
              </p>
              <p className="max-w-xs text-center text-xs" style={{ color: TV.textMuted }}>
                {fetchError}
              </p>
              <button
                onClick={loadMockData}
                className="mt-2 rounded px-4 py-2 text-xs font-semibold"
                style={{ background: TV.blue, color: "#fff" }}
              >
                Use Simulated Data
              </button>
            </div>
          )}

          {fetchStatus === "ok" && allCandles.length === 0 && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2"
              style={{ background: TV.bg }}
            >
              <AlertTriangle className="h-7 w-7" style={{ color: TV.textMuted }} />
              <p className="text-sm font-semibold" style={{ color: TV.text }}>
                No candles loaded
              </p>
              <button
                onClick={loadMockData}
                className="mt-2 rounded px-4 py-2 text-xs font-semibold"
                style={{ background: TV.blue, color: "#fff" }}
              >
                Use Simulated Data
              </button>
            </div>
          )}

          {/* Lightweight Charts mount point */}
          <div ref={chartContainerRef} className="absolute inset-0" />

          {dataMode === "simulated" && fetchStatus === "ok" && (
            <div
              className="pointer-events-none absolute bottom-3 left-3 z-10 rounded px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: `${TV.panel}e6`,
                border: `1px solid ${TV.border}`,
                color: TV.textMuted,
              }}
            >
              Simulated candles
            </div>
          )}

          {/* ── OHLCV legend — top-left exactly like TradingView ── */}
          {(ohlcvLegend || currentCandle) && (() => {
            const c   = ohlcvLegend ?? currentCandle;
            const bull = c.close >= c.open;
            const clr  = bull ? TV.green : TV.red;
            const sym  = session?.symbol ?? "";
            const dec  = /XAU|XAG|BTC|ETH|SOL|BNB|ADA|XRP|AAPL|TSLA|NVDA|MSFT|AMZN|META|GOOGL|SPY|QQQ|NQ/i.test(sym) ? 2
                       : /JPY/i.test(sym) ? 3 : 5;
            const fmt  = v => (typeof v === "number" ? v.toFixed(dec) : v);
            return (
              <div
                className="pointer-events-none absolute left-3 top-2 z-10 flex items-center gap-3 rounded px-2 py-1 text-[11px] tabular-nums"
                style={{ background: `${TV.bg}cc`, backdropFilter: "blur(4px)" }}
              >
                <span className="font-bold mr-0.5" style={{ color: clr }}>
                  {getSymbolLabel(sym) || sym}
                </span>
                {[["O", c.open], ["H", c.high], ["L", c.low], ["C", c.close]].map(([lbl, val]) => (
                  <span key={lbl} className="flex items-center gap-0.5">
                    <span style={{ color: TV.textDim }}>{lbl}</span>
                    <span style={{ color: clr, fontWeight: lbl === "C" ? 700 : 400 }}>{fmt(val)}</span>
                  </span>
                ))}
              </div>
            );
          })()}
        </div>

        {/* ── RIGHT WIDGETBAR — layout_area--right ──
            TV: collapsed tab strip (45px) + expandable panel.
            We render it always-expanded at 268px for the trade panel.
        ── */}
        <div
          className="flex w-[268px] shrink-0 flex-col"
          style={{ borderLeft: `1px solid ${TV.border}`, background: TV.panel }}
        >
          {/* Tab strip — TV widgetbar-tabs style */}
          <div
            className="flex h-9 shrink-0 items-center"
            style={{ borderBottom: `1px solid ${TV.border}` }}
          >
            {[
              { key: "new",  label: `Order` },
              { key: "open", label: `Positions${openTrades.length ? ` (${openTrades.length})` : ""}` },
              { key: "all",  label: "History" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTradeTab(key)}
                className="flex h-full items-center px-3 text-xs font-medium transition-colors"
                style={{
                  color:       tradeTab === key ? TV.text : TV.textMuted,
                  borderBottom: tradeTab === key ? `2px solid ${TV.blue}` : "2px solid transparent",
                  marginBottom: "-1px",
                }}
                onMouseEnter={e => { if (tradeTab !== key) e.currentTarget.style.color = TV.text; }}
                onMouseLeave={e => { if (tradeTab !== key) e.currentTarget.style.color = TV.textMuted; }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="min-h-0 flex-1 overflow-y-auto">

            {/* ── ORDER PANEL ── */}
            {tradeTab === "new" && (
              <div className="p-3 space-y-2.5">
                {isCompleted ? (
                  <div
                    className="mt-6 rounded-lg p-4 text-center text-xs"
                    style={{ background: `${TV.border}`, color: TV.textMuted }}
                  >
                    Session completed — trading is disabled.
                  </div>
                ) : (
                  <>
                    {/* Direction — TV buy/sell buttons */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => setDirection("long")}
                        className="rounded py-2 text-xs font-bold transition-colors"
                        style={{
                          background: direction === "long" ? TV.green : `${TV.green}18`,
                          color:      direction === "long" ? "#fff"   : TV.green,
                          border:     `1px solid ${direction === "long" ? TV.green : `${TV.green}40`}`,
                        }}
                      >
                        ▲ BUY / LONG
                      </button>
                      <button
                        onClick={() => setDirection("short")}
                        className="rounded py-2 text-xs font-bold transition-colors"
                        style={{
                          background: direction === "short" ? TV.red : `${TV.red}18`,
                          color:      direction === "short" ? "#fff" : TV.red,
                          border:     `1px solid ${direction === "short" ? TV.red : `${TV.red}40`}`,
                        }}
                      >
                        ▼ SELL / SHORT
                      </button>
                    </div>

                    {/* Field helper */}
                    {[
                      {
                        label: "Entry Price",
                        value: entryPrice,
                        setter: v => { entryPriceManualRef.current = true; setEntryPrice(v); },
                        hint: currentCandle
                          ? <button
                              type="button"
                              onClick={() => { entryPriceManualRef.current = false; setEntryPrice(fmtPrice(currentCandle.close, session?.symbol)); }}
                              className="text-[10px] transition-colors"
                              style={{ color: TV.blue }}
                              onMouseEnter={e=>e.currentTarget.style.textDecoration="underline"}
                              onMouseLeave={e=>e.currentTarget.style.textDecoration="none"}
                            >
                              ≈ {fmtPrice(currentCandle.close, session?.symbol)}
                            </button>
                          : null,
                        accentBorder: null,
                      },
                      {
                        label: "Stop Loss",
                        value: stopLoss,
                        setter: setStopLoss,
                        hint: null,
                        accentBorder: TV.red,
                      },
                      {
                        label: "Take Profit",
                        value: takeProfit,
                        setter: setTakeProfit,
                        hint: null,
                        accentBorder: TV.green,
                      },
                      {
                        label: "Lot Size",
                        value: lotSize,
                        setter: setLotSize,
                        hint: null,
                        accentBorder: null,
                      },
                    ].map(({ label, value, setter, hint, accentBorder }) => (
                      <div key={label}>
                        <div className="mb-1 flex items-center justify-between">
                          <label className="text-[10px]" style={{ color: TV.textMuted }}>{label}</label>
                          {hint}
                        </div>
                        <input
                          type="number"
                          step="any"
                          value={value}
                          onChange={e => setter(e.target.value)}
                          className="w-full rounded px-2 py-1.5 text-xs outline-none transition-colors"
                          style={{
                            background:  TV.bg,
                            color:       TV.text,
                            border:      `1px solid ${TV.border}`,
                            borderLeft:  accentBorder ? `2px solid ${accentBorder}` : undefined,
                          }}
                          onFocus={e => e.currentTarget.style.border=`1px solid ${TV.blue}`}
                          onBlur={e  => e.currentTarget.style.border=`1px solid ${TV.border}`}
                        />
                      </div>
                    ))}

                    {/* Risk preview — TV's order ticket style */}
                    {riskPreview && (
                      <div
                        className="rounded p-2 text-xs space-y-1"
                        style={{
                          background: riskPreview.rr && riskPreview.rr >= 1.5
                            ? `${TV.green}12`
                            : `${TV.border}80`,
                          border: `1px solid ${riskPreview.rr && riskPreview.rr >= 1.5 ? `${TV.green}40` : TV.border}`,
                        }}
                      >
                        <div className="flex justify-between">
                          <span style={{ color: TV.textMuted }}>Risk</span>
                          <span className="tabular-nums" style={{ color: TV.red }}>${riskPreview.risk.toFixed(2)}</span>
                        </div>
                        {riskPreview.reward != null && (
                          <div className="flex justify-between">
                            <span style={{ color: TV.textMuted }}>Reward</span>
                            <span className="tabular-nums" style={{ color: TV.green }}>${riskPreview.reward.toFixed(2)}</span>
                          </div>
                        )}
                        {riskPreview.rr != null && (
                          <div className="flex justify-between">
                            <span style={{ color: TV.textMuted }}>R:R</span>
                            <span
                              className="tabular-nums font-bold"
                              style={{ color: riskPreview.rr >= 1.5 ? TV.green : "#f59e0b" }}
                            >
                              1:{riskPreview.rr.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Submit button */}
                    <button
                      onClick={placeTrade}
                      disabled={!currentCandle}
                      className="w-full rounded py-2 text-xs font-bold transition-colors disabled:opacity-40"
                      style={{
                        background: direction === "long" ? TV.green : TV.red,
                        color: "#fff",
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                      {direction === "long" ? "▲ Place Buy Trade" : "▼ Place Sell Trade"}
                    </button>

                    {/* Keyboard hint */}
                    <p className="text-center text-[9px]" style={{ color: TV.textDim }}>
                      Space +1 · Shift+Space −1 · B=Buy · S=Sell
                    </p>
                  </>
                )}
              </div>
            )}

            {/* ── POSITIONS PANEL ── */}
            {tradeTab === "open" && (
              <div className="p-3">
                {openTrades.length === 0 ? (
                  <div className="mt-8 flex flex-col items-center gap-2">
                    <p className="text-xs" style={{ color: TV.textMuted }}>No open positions</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {openTrades.map(t => {
                      const curPx   = currentCandle?.close ?? t.entryPrice;
                      const upnl    = t.direction === "long"
                        ? (curPx - t.entryPrice) * t.lotSize
                        : (t.entryPrice - curPx) * t.lotSize;
                      const pos     = upnl >= 0;
                      const sym     = session?.symbol ?? "";

                      return (
                        <div
                          key={t.id}
                          className="rounded p-2.5 text-xs space-y-1.5"
                          style={{
                            background: pos ? `${TV.green}0d` : `${TV.red}0d`,
                            border: `1px solid ${pos ? `${TV.green}30` : `${TV.red}30`}`,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold" style={{ color: t.direction==="long" ? TV.green : TV.red }}>
                              {t.direction === "long" ? "▲ LONG" : "▼ SHORT"}
                            </span>
                            <span className="tabular-nums font-bold" style={{ color: pos ? TV.green : TV.red }}>
                              {pos ? "+" : ""}${upnl.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between" style={{ color: TV.textMuted }}>
                            <span>
                              Entry <span className="tabular-nums" style={{ color: TV.text }}>{fmtPrice(t.entryPrice, sym)}</span>
                            </span>
                            <span>
                              Now <span className="tabular-nums" style={{ color: TV.text }}>{fmtPrice(curPx, sym)}</span>
                            </span>
                          </div>
                          {(t.sl || t.tp) && (
                            <div className="flex gap-3 text-[10px]">
                              {t.sl && <span>SL <span className="tabular-nums" style={{ color: TV.red }}>{fmtPrice(t.sl, sym)}</span></span>}
                              {t.tp && <span>TP <span className="tabular-nums" style={{ color: TV.green }}>{fmtPrice(t.tp, sym)}</span></span>}
                              <span className="ml-auto" style={{ color: TV.textDim }}>×{t.lotSize}</span>
                            </div>
                          )}
                          <button
                            onClick={() => closeAtMarket(t)}
                            className="w-full rounded py-1 text-[10px] font-semibold transition-colors"
                            style={{ background: TV.hover, color: TV.text, border: `1px solid ${TV.border}` }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = TV.red}
                            onMouseLeave={e => e.currentTarget.style.borderColor = TV.border}
                          >
                            Close @ {fmtPrice(curPx, sym)}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── HISTORY PANEL ── */}
            {tradeTab === "all" && (
              <div className="p-3">
                {allTrades.length === 0 ? (
                  <div className="mt-8 flex flex-col items-center gap-2">
                    <p className="text-xs" style={{ color: TV.textMuted }}>No trades yet</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {[...allTrades].reverse().map(t => (
                      <div
                        key={t.id}
                        className="rounded p-2 text-xs"
                        style={{
                          background: t.result === "win"
                            ? `${TV.green}0d`
                            : t.result === "loss"
                              ? `${TV.red}0d`
                              : `${TV.border}40`,
                          border: `1px solid ${t.result === "win" ? `${TV.green}25` : t.result === "loss" ? `${TV.red}25` : TV.border}`,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold" style={{ color: t.direction === "long" ? TV.green : TV.red }}>
                            {t.direction === "long" ? "▲ LONG" : "▼ SHORT"}
                          </span>
                          <span className="tabular-nums font-semibold" style={{ color: t.pnl >= 0 ? TV.green : TV.red }}>
                            {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-0.5 tabular-nums" style={{ color: TV.textMuted }}>
                          {t.entryPrice} → {t.exitPrice ?? "open"}
                          {t.rr > 0 && <span style={{ color: TV.textMuted }}> · {t.rr.toFixed(1)}R</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>{/* /MIDDLE ROW */}

      {/* ═══════════════════════════════════════════════════════════════
          BOTTOM PANEL — TV's "Strategy Tester" strip
          height: 168px
      ═══════════════════════════════════════════════════════════════ */}
      <div
        className="flex h-[168px] shrink-0 items-stretch"
        style={{ borderTop: `1px solid ${TV.border}`, background: TV.panel }}
      >
        {/* Stats grid — 6 cells, 2×3 */}
        <div
          className="grid w-[216px] shrink-0 grid-cols-3 grid-rows-2"
          style={{ borderRight: `1px solid ${TV.border}` }}
        >
          {[
            { label: "Trades",        value: stats.trades },
            { label: "Win Rate",      value: `${stats.winRate}%` },
            { label: "Profit Factor", value: stats.pf },
            { label: "Avg R",         value: stats.avgR },
            { label: "Max DD",        value: `$${stats.maxDD}` },
            { label: "Expectancy",    value: `$${stats.expectancy}` },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center px-1"
              style={{ borderRight: `1px solid ${TV.border}`, borderBottom: `1px solid ${TV.border}` }}
            >
              <span className="text-[9px] uppercase tracking-wide" style={{ color: TV.textDim }}>
                {label}
              </span>
              <span className="mt-0.5 text-xs font-bold tabular-nums" style={{ color: TV.text }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Trade log — TV strategy tester list of trades */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="h-full overflow-x-auto overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0" style={{ background: TV.panel }}>
                <tr style={{ borderBottom: `1px solid ${TV.border}` }}>
                  {["#","Dir","Entry","Exit","P&L","R:R","Opened"].map(h => (
                    <th
                      key={h}
                      className="px-3 py-1.5 text-left text-[10px] font-semibold"
                      style={{ color: TV.textMuted }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allTrades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-5 text-center text-xs" style={{ color: TV.textDim }}>
                      No trades yet — place your first trade above
                    </td>
                  </tr>
                ) : (
                  allTrades.map((t, i) => (
                    <tr
                      key={t.id}
                      style={{ borderBottom: `1px solid ${TV.border}40` }}
                      onMouseEnter={e => e.currentTarget.style.background = TV.hover}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td className="px-3 py-1" style={{ color: TV.textDim }}>{i + 1}</td>
                      <td className="px-3 py-1 font-bold" style={{ color: t.direction === "long" ? TV.green : TV.red }}>
                        {t.direction === "long" ? "L" : "S"}
                      </td>
                      <td className="px-3 py-1 tabular-nums" style={{ color: TV.text }}>
                        {t.entryPrice?.toFixed(4) ?? "—"}
                      </td>
                      <td className="px-3 py-1 tabular-nums" style={{ color: TV.text }}>
                        {t.exitPrice?.toFixed(4) ?? "—"}
                      </td>
                      <td
                        className="px-3 py-1 tabular-nums font-semibold"
                        style={{ color: t.pnl >= 0 ? TV.green : TV.red }}
                      >
                        {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                      </td>
                      <td className="px-3 py-1 tabular-nums" style={{ color: TV.textMuted }}>
                        {t.rr > 0 ? `${t.rr.toFixed(1)}R` : "—"}
                      </td>
                      <td className="px-3 py-1" style={{ color: TV.textDim }}>
                        {t.openTime ? format(new Date(t.openTime), "MM/dd HH:mm") : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>{/* /BOTTOM PANEL */}

      {/* ── CONFIRM LEAVE DIALOG ── */}
      <Dialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <DialogContent className="max-w-sm rounded-xl" style={{ background: TV.panel, border: `1px solid ${TV.border}` }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: "#f59e0b" }}>
              <AlertTriangle className="h-5 w-5" />
              Leave Trading Room?
            </DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-sm" style={{ color: TV.textMuted }}>
            {openTrades.length > 0
              ? `You have ${openTrades.length} open trade(s). Leaving will discard them.`
              : "The replay is still running."}
            {" "}Your candle position is saved automatically.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" className="rounded-lg" onClick={() => setConfirmLeave(false)}>
              Stay
            </Button>
            <Button
              className="rounded-lg"
              onClick={() => { setIsPlaying(false); setConfirmLeave(false); navigate("/Backtesting"); }}
            >
              Leave
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
