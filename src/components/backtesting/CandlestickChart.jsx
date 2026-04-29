import React, { useEffect, useMemo, useRef } from "react";
import {
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  createSeriesMarkers,
} from "lightweight-charts";
import {
  calcSMA, calcEMA, calcBollingerBands, calcVWAP,
  calcRSI, calcMACD, calcATR, calcVolume,
} from "@/lib/indicators";

// ── Theme constants ───────────────────────────────────────────────────────────
const CHART_BG    = "#0f1117";
const CARD_BG     = "#1a1d27";
const GRID_COLOR  = "#2a2d3a";
const AXIS_COLOR  = "#374151";
const LABEL_COLOR = "#6b7280";
const BULL_COLOR  = "#22c55e";
const BEAR_COLOR  = "#ef4444";
const ENTRY_COLOR = "#f97316";
const REPLAY_WINDOW_SIZE = 240;

const toTimestamp = (value) => Math.floor(new Date(value).getTime() / 1000);

// ── Data converters ───────────────────────────────────────────────────────────
const toChartCandles = (candles) =>
  candles
    .filter((c) => c?.time)
    .map((c) => {
      const color = c.bullish ? BULL_COLOR : BEAR_COLOR;
      return {
        time: toTimestamp(c.time),
        open: c.open, high: c.high, low: c.low, close: c.close,
        color, borderColor: color, wickColor: color,
      };
    });

const toTradeMarkers = (trades, closedTrades) => {
  const entries = trades
    .filter((t) => t?.openTime)
    .map((t, i) => ({
      id: `entry-${String(t.id ?? i)}`,
      time: toTimestamp(t.openTime),
      position: t.direction === "long" ? "belowBar" : "aboveBar",
      shape: t.direction === "long" ? "arrowUp" : "arrowDown",
      color: t.direction === "long" ? BULL_COLOR : BEAR_COLOR,
      text: t.direction === "long" ? "▲ BUY" : "▼ SELL",
    }));
  const exits = closedTrades
    .filter((t) => t?.closeTime && Number.isFinite(t?.exitPrice))
    .map((t, i) => ({
      id: `exit-${String(t.id ?? i)}`,
      time: toTimestamp(t.closeTime),
      position: "atPriceMiddle",
      price: t.exitPrice,
      shape: t.result === "win" ? "circle" : "square",
      color: t.result === "win" ? BULL_COLOR : BEAR_COLOR,
      text: `${t.pnl >= 0 ? "+" : ""}${Number(t.pnl || 0).toFixed(0)}`,
    }));
  return [...entries, ...exits].sort((a, b) => a.time - b.time);
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const removeSeriesSafe = (chart, series) => {
  if (!chart || !series) return;
  try { chart.removeSeries(series); } catch {}
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function CandlestickChart({
  candles = [],
  symbol = "",
  timeframe = "",
  dp = 2,
  entryLines = [],
  slLines = [],
  tpLines = [],
  trades = [],
  closedTrades = [],
  drawingLines = [],
  trendLines = [],
  onDrawLine,
  isDrawingMode = false,
  isFollowing = true,
  onFollowChange,
  indicators = null,
}) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRef    = useRef(null);
  const markersRef   = useRef(null);
  const priceLinesRef      = useRef([]);
  const drawnPriceLinesRef = useRef([]);
  const trendSeriesRef     = useRef(/** @type {any[]} */ ([]));
  const prevCandleCountRef = useRef(0);
  const isFollowingRef     = useRef(true);
  const onFollowChangeRef  = useRef(onFollowChange);
  const onDrawLineRef      = useRef(onDrawLine);
  const isDrawingModeRef   = useRef(isDrawingMode);
  const isProgrammaticScrollRef = useRef(false);

  // Indicator series refs — keyed by type
  const indRef = useRef({
    sma:        /** @type {any[]} */ ([]),
    ema:        /** @type {any[]} */ ([]),
    bbUpper:    null,
    bbMiddle:   null,
    bbLower:    null,
    vwap:       null,
    volume:     null,
    rsiLine:    null,
    rsi70:      null,
    rsi30:      null,
    macdLine:   null,
    macdSignal: null,
    macdHist:   null,
    macdZero:   null,
    atr:        null,
  });

  // Keep callback refs fresh
  useEffect(() => { onFollowChangeRef.current = onFollowChange; }, [onFollowChange]);
  useEffect(() => { onDrawLineRef.current = onDrawLine; },       [onDrawLine]);
  useEffect(() => { isDrawingModeRef.current = isDrawingMode; }, [isDrawingMode]);
  useEffect(() => { isFollowingRef.current = isFollowing; },     [isFollowing]);

  const latestCandle  = candles[candles.length - 1];
  const chartCandles  = useMemo(() => toChartCandles(candles), [candles]);
  const tradeMarkers  = useMemo(() => toTradeMarkers(trades, closedTrades), [trades, closedTrades]);

  // ── Chart creation (once) ────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      attributionLogo: false,
      layout: {
        background: { type: ColorType.Solid, color: CHART_BG },
        textColor: LABEL_COLOR,
        fontFamily: "'Inter', 'DM Sans', sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: GRID_COLOR },
        horzLines: { color: GRID_COLOR },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: AXIS_COLOR, labelBackgroundColor: CARD_BG },
        horzLine: { color: AXIS_COLOR, labelBackgroundColor: CARD_BG },
      },
      rightPriceScale: { borderColor: AXIS_COLOR },
      timeScale: {
        borderColor: AXIS_COLOR,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 10,
        minBarSpacing: 5,
      },
      localization: {
        priceFormatter: (p) => Number(p).toFixed(dp),
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale:  { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor:    BULL_COLOR,
      downColor:  BEAR_COLOR,
      wickUpColor:   BULL_COLOR,
      wickDownColor: BEAR_COLOR,
      borderVisible: false,
      lastValueVisible: true,
      priceLineVisible: true,
      priceFormat: { type: "price", precision: dp, minMove: 1 / 10 ** dp },
    });

    chartRef.current   = chart;
    seriesRef.current  = series;
    markersRef.current = createSeriesMarkers(series, []);

    const clickHandler = (param) => {
      if (!isDrawingModeRef.current || !param.point || !onDrawLineRef.current) return;
      const price = series.coordinateToPrice(param.point.y);
      const time  = param.time ?? null;
      if (price !== null) onDrawLineRef.current({ price, time });
    };
    chart.subscribeClick(clickHandler);

    const rangeChangeHandler = () => {
      if (isProgrammaticScrollRef.current) return;
      if (isFollowingRef.current && onFollowChangeRef.current) {
        isFollowingRef.current = false;
        onFollowChangeRef.current(false);
      }
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(rangeChangeHandler);

    return () => {
      chart.unsubscribeClick(clickHandler);
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(rangeChangeHandler);
      priceLinesRef.current.forEach((l) => { try { series.removePriceLine(l); } catch {} });
      drawnPriceLinesRef.current.forEach((l) => { try { series.removePriceLine(l); } catch {} });
      trendSeriesRef.current.forEach((s) => { try { chart.removeSeries(s); } catch {} });
      // Remove indicator series
      const ind = indRef.current;
      [...ind.sma, ...ind.ema].forEach((s) => removeSeriesSafe(chart, s));
      [ind.bbUpper, ind.bbMiddle, ind.bbLower, ind.vwap, ind.volume,
       ind.rsiLine, ind.rsi70, ind.rsi30,
       ind.macdLine, ind.macdSignal, ind.macdHist, ind.macdZero, ind.atr
      ].forEach((s) => removeSeriesSafe(chart, s));
      priceLinesRef.current = [];
      drawnPriceLinesRef.current = [];
      trendSeriesRef.current = [];
      markersRef.current = null;
      seriesRef.current  = null;
      chartRef.current   = null;
      chart.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── dp / timeframe options ────────────────────────────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;
    chart.applyOptions({
      localization: { priceFormatter: (p) => Number(p).toFixed(dp) },
      timeScale: { timeVisible: true, secondsVisible: false, barSpacing: timeframe === "M1" ? 14 : 10 },
    });
    series.applyOptions({
      priceFormat: { type: "price", precision: dp, minMove: 1 / 10 ** dp },
    });
  }, [dp, timeframe]);

  // ── Candle data updates ───────────────────────────────────────────────────
  useEffect(() => {
    const chart  = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const prev = prevCandleCountRef.current;
    const next = chartCandles.length;
    if (next === 0) { series.setData([]); prevCandleCountRef.current = 0; return; }

    const scrollToLatest = () => {
      isProgrammaticScrollRef.current = true;
      chart.timeScale().setVisibleLogicalRange({ from: Math.max(next - REPLAY_WINDOW_SIZE, 0), to: next + 4 });
      isProgrammaticScrollRef.current = false;
    };

    if (next === prev + 1 && isFollowingRef.current) {
      series.update(chartCandles[next - 1]);
      scrollToLatest();
    } else {
      series.setData(chartCandles);
      if (isFollowingRef.current) scrollToLatest();
    }
    prevCandleCountRef.current = next;
  }, [chartCandles]);

  // ── Trade markers ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (markersRef.current) markersRef.current.setMarkers(tradeMarkers);
  }, [tradeMarkers]);

  // ── SL / TP / Entry price lines ───────────────────────────────────────────
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    priceLinesRef.current.forEach((l) => { try { series.removePriceLine(l); } catch {} });
    const buildLines = (prices, label, color) =>
      prices.filter(Number.isFinite).map((price, i) =>
        series.createPriceLine({
          price, color, lineWidth: 1, lineStyle: LineStyle.Dashed,
          lineVisible: true, axisLabelVisible: true,
          title: `${label} ${i + 1}`, axisLabelColor: color, axisLabelTextColor: "#fff",
        }),
      );
    priceLinesRef.current = [
      ...buildLines(entryLines, "Entry", ENTRY_COLOR),
      ...buildLines(slLines,    "SL",    BEAR_COLOR),
      ...buildLines(tpLines,    "TP",    BULL_COLOR),
    ];
  }, [entryLines, slLines, tpLines]);

  // ── Drawn horizontal levels ───────────────────────────────────────────────
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    drawnPriceLinesRef.current.forEach((l) => { try { series.removePriceLine(l); } catch {} });
    drawnPriceLinesRef.current = drawingLines
      .filter((l) => Number.isFinite(l.price))
      .map((l) =>
        series.createPriceLine({
          price: l.price, color: ENTRY_COLOR, lineWidth: 1,
          lineStyle: LineStyle.Solid, lineVisible: true, axisLabelVisible: true,
          title: "Level", axisLabelColor: ENTRY_COLOR, axisLabelTextColor: "#fff",
        }),
      );
  }, [drawingLines]);

  // ── Trend lines ───────────────────────────────────────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    trendSeriesRef.current.forEach((s) => { try { chart.removeSeries(s); } catch {} });
    trendSeriesRef.current = [];
    trendLines.forEach((tl) => {
      if (!tl.p1 || !tl.p2 || !tl.p1.time || !tl.p2.time) return;
      const s = chart.addSeries(LineSeries, {
        color: ENTRY_COLOR, lineWidth: 1, lineStyle: LineStyle.Solid,
        lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false,
      });
      const pts = [
        { time: tl.p1.time, value: tl.p1.price },
        { time: tl.p2.time, value: tl.p2.price },
      ].sort((a, b) => a.time - b.time);
      s.setData(pts);
      trendSeriesRef.current.push(s);
    });
  }, [trendLines]);

  // ── Indicators ────────────────────────────────────────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !indicators || candles.length < 2) return;

    const ind = indRef.current;

    // Helper: add or update a LineSeries in a given pane
    const upsertLine = (ref, pane, opts) => {
      if (!ref) return chart.addSeries(LineSeries, opts, pane);
      try { ref.applyOptions(opts); } catch {}
      return ref;
    };

    const upsertHistogram = (ref, pane, opts) => {
      if (!ref) return chart.addSeries(HistogramSeries, opts, pane);
      try { ref.applyOptions(opts); } catch {}
      return ref;
    };

    // ── SMA ────────────────────────────────────────────────────────
    // Remove excess SMA series
    while (ind.sma.length > indicators.sma.length) {
      removeSeriesSafe(chart, ind.sma.pop());
    }
    indicators.sma.forEach((cfg, i) => {
      if (!cfg.enabled) {
        removeSeriesSafe(chart, ind.sma[i]);
        ind.sma[i] = null;
        return;
      }
      ind.sma[i] = upsertLine(ind.sma[i], 0, {
        color: cfg.color, lineWidth: 1, lastValueVisible: false,
        priceLineVisible: false, crosshairMarkerVisible: false,
        title: `SMA${cfg.period}`,
      });
      ind.sma[i].setData(calcSMA(candles, cfg.period));
    });

    // ── EMA ────────────────────────────────────────────────────────
    while (ind.ema.length > indicators.ema.length) {
      removeSeriesSafe(chart, ind.ema.pop());
    }
    indicators.ema.forEach((cfg, i) => {
      if (!cfg.enabled) {
        removeSeriesSafe(chart, ind.ema[i]);
        ind.ema[i] = null;
        return;
      }
      ind.ema[i] = upsertLine(ind.ema[i], 0, {
        color: cfg.color, lineWidth: 1, lineStyle: LineStyle.Dashed,
        lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false,
        title: `EMA${cfg.period}`,
      });
      ind.ema[i].setData(calcEMA(candles, cfg.period));
    });

    // ── Bollinger Bands ────────────────────────────────────────────
    if (indicators.bb.enabled) {
      const { upper, middle, lower } = calcBollingerBands(candles, indicators.bb.period, indicators.bb.stdDev);
      const bbOpts = { color: "#6366f180", lineWidth: 1, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false };
      ind.bbUpper  = upsertLine(ind.bbUpper,  0, { ...bbOpts, title: "BB Upper" });
      ind.bbMiddle = upsertLine(ind.bbMiddle, 0, { ...bbOpts, color: "#6366f1", lineStyle: LineStyle.Dashed, title: "BB Mid" });
      ind.bbLower  = upsertLine(ind.bbLower,  0, { ...bbOpts, title: "BB Lower" });
      ind.bbUpper.setData(upper);
      ind.bbMiddle.setData(middle);
      ind.bbLower.setData(lower);
    } else {
      removeSeriesSafe(chart, ind.bbUpper);  ind.bbUpper  = null;
      removeSeriesSafe(chart, ind.bbMiddle); ind.bbMiddle = null;
      removeSeriesSafe(chart, ind.bbLower);  ind.bbLower  = null;
    }

    // ── VWAP ───────────────────────────────────────────────────────
    if (indicators.vwap.enabled) {
      ind.vwap = upsertLine(ind.vwap, 0, {
        color: "#a78bfa", lineWidth: 1, lineStyle: LineStyle.Dotted,
        lastValueVisible: true, priceLineVisible: false, crosshairMarkerVisible: false,
        title: "VWAP",
      });
      ind.vwap.setData(calcVWAP(candles));
    } else {
      removeSeriesSafe(chart, ind.vwap); ind.vwap = null;
    }

    // ── Volume (pane 1) ────────────────────────────────────────────
    if (indicators.volume.enabled) {
      ind.volume = upsertHistogram(ind.volume, 1, {
        priceFormat: { type: "volume" },
        lastValueVisible: false, priceLineVisible: false,
      });
      ind.volume.priceScale().applyOptions({ scaleMargins: { top: 0.1, bottom: 0 } });
      ind.volume.setData(calcVolume(candles));
    } else {
      removeSeriesSafe(chart, ind.volume); ind.volume = null;
    }

    // ── RSI (pane 2) ───────────────────────────────────────────────
    if (indicators.rsi.enabled) {
      ind.rsiLine = upsertLine(ind.rsiLine, 2, {
        color: "#f59e0b", lineWidth: 1.5,
        lastValueVisible: true, priceLineVisible: false, crosshairMarkerVisible: false,
        title: `RSI${indicators.rsi.period}`,
      });
      ind.rsi70 = upsertLine(ind.rsi70, 2, {
        color: "#ef444460", lineWidth: 1, lineStyle: LineStyle.Dashed,
        lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false,
      });
      ind.rsi30 = upsertLine(ind.rsi30, 2, {
        color: "#22c55e60", lineWidth: 1, lineStyle: LineStyle.Dashed,
        lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false,
      });
      ind.rsiLine.priceScale().applyOptions({ scaleMargins: { top: 0.1, bottom: 0.1 }, autoScale: false });

      const rsiData = calcRSI(candles, indicators.rsi.period);
      ind.rsiLine.setData(rsiData);
      // 70 / 30 reference lines as flat series
      const times = rsiData.map((d) => d.time);
      if (times.length) {
        ind.rsi70.setData(times.map((t) => ({ time: t, value: 70 })));
        ind.rsi30.setData(times.map((t) => ({ time: t, value: 30 })));
      }
    } else {
      removeSeriesSafe(chart, ind.rsiLine); ind.rsiLine = null;
      removeSeriesSafe(chart, ind.rsi70);   ind.rsi70   = null;
      removeSeriesSafe(chart, ind.rsi30);   ind.rsi30   = null;
    }

    // ── MACD (pane 3) ──────────────────────────────────────────────
    if (indicators.macd.enabled) {
      const { macdLine, signalLine, histogram } = calcMACD(
        candles, indicators.macd.fast, indicators.macd.slow, indicators.macd.signal,
      );
      ind.macdLine   = upsertLine(ind.macdLine,   3, { color: "#6366f1", lineWidth: 1.5, lastValueVisible: true, priceLineVisible: false, crosshairMarkerVisible: false, title: "MACD" });
      ind.macdSignal = upsertLine(ind.macdSignal, 3, { color: "#f97316", lineWidth: 1,   lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false, title: "Signal" });
      ind.macdHist   = upsertHistogram(ind.macdHist, 3, { lastValueVisible: false, priceLineVisible: false });
      ind.macdZero   = upsertLine(ind.macdZero,   3, { color: "#374151", lineWidth: 1, lineStyle: LineStyle.Dashed, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false });

      ind.macdLine.setData(macdLine);
      ind.macdSignal.setData(signalLine);
      ind.macdHist.setData(histogram);
      // zero line
      const mTimes = macdLine.map((d) => d.time);
      if (mTimes.length) ind.macdZero.setData(mTimes.map((t) => ({ time: t, value: 0 })));
    } else {
      removeSeriesSafe(chart, ind.macdLine);   ind.macdLine   = null;
      removeSeriesSafe(chart, ind.macdSignal); ind.macdSignal = null;
      removeSeriesSafe(chart, ind.macdHist);   ind.macdHist   = null;
      removeSeriesSafe(chart, ind.macdZero);   ind.macdZero   = null;
    }

    // ── ATR (pane 4) ───────────────────────────────────────────────
    if (indicators.atr.enabled) {
      ind.atr = upsertLine(ind.atr, 4, {
        color: "#06b6d4", lineWidth: 1.5,
        lastValueVisible: true, priceLineVisible: false, crosshairMarkerVisible: false,
        title: `ATR${indicators.atr.period}`,
      });
      ind.atr.setData(calcATR(candles, indicators.atr.period));
    } else {
      removeSeriesSafe(chart, ind.atr); ind.atr = null;
    }
  }, [indicators, candles]);

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${isDrawingMode ? "cursor-crosshair" : ""}`}
      style={{ background: CHART_BG }}
    >
      <div ref={containerRef} className="h-full w-full" />

      {/* Drawing mode badge */}
      {isDrawingMode && (
        <div className="pointer-events-none absolute right-4 top-14 rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-300">
          Drawing Mode — click chart to place level
        </div>
      )}

      {/* Trend line counter */}
      {trendLines.length > 0 && (
        <div className="pointer-events-none absolute left-4 top-16 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold text-blue-300">
          {trendLines.length} trend line{trendLines.length > 1 ? "s" : ""}
        </div>
      )}

      {/* OHLCV overlay */}
      <div
        className="pointer-events-none absolute left-4 top-4 rounded-xl border border-white/5 px-3 py-2 text-xs font-mono text-gray-300 backdrop-blur"
        style={{ background: "rgba(26,29,39,0.85)" }}
      >
        <div className="mb-1 flex items-center gap-2">
          <span className="font-bold text-white tracking-wide">{symbol || "Replay"}</span>
          {timeframe && <span className="text-gray-600">{timeframe}</span>}
        </div>
        {latestCandle ? (
          <p className="tabular-nums leading-relaxed">
            O <span className="text-gray-200">{latestCandle.open?.toFixed(dp)}</span>{" "}
            H <span className="text-[#22c55e]">{latestCandle.high?.toFixed(dp)}</span>{" "}
            L <span className="text-[#ef4444]">{latestCandle.low?.toFixed(dp)}</span>{" "}
            C <span className={latestCandle.bullish ? "text-[#22c55e]" : "text-[#ef4444]"}>{latestCandle.close?.toFixed(dp)}</span>
            {latestCandle.volume > 0 && (
              <> V <span className="text-gray-400">{latestCandle.volume?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></>
            )}
          </p>
        ) : (
          <p className="text-gray-600">Load candle data to start.</p>
        )}
      </div>

      {/* TradingView attribution */}
      <div className="absolute bottom-3 right-4 text-[10px] text-gray-700">
        Charts by{" "}
        <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer" className="text-gray-500 underline decoration-white/10 underline-offset-4 hover:text-white">
          TradingView
        </a>
      </div>
    </div>
  );
}
