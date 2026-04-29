// ---------------------------------------------------------------------------
// Technical Indicator Calculations
// All functions accept the app's candle format: { time, open, high, low, close, volume }
// All functions return lightweight-charts compatible data: { time (unix seconds), value }
// ---------------------------------------------------------------------------

export const toTs = (time) => Math.floor(new Date(time).getTime() / 1000);

// ── Simple Moving Average ────────────────────────────────────────────────────
export function calcSMA(candles, period) {
  const out = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
    out.push({ time: toTs(candles[i].time), value: sum / period });
  }
  return out;
}

// ── Exponential Moving Average ───────────────────────────────────────────────
export function calcEMA(candles, period) {
  if (candles.length < period) return [];
  const k = 2 / (period + 1);
  const out = [];
  let ema = 0;
  for (let i = 0; i < period; i++) ema += candles[i].close;
  ema /= period;
  out.push({ time: toTs(candles[period - 1].time), value: ema });
  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
    out.push({ time: toTs(candles[i].time), value: ema });
  }
  return out;
}

// ── Weighted Moving Average ──────────────────────────────────────────────────
export function calcWMA(candles, period) {
  const out = [];
  const denom = (period * (period + 1)) / 2;
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += candles[i - j].close * (period - j);
    out.push({ time: toTs(candles[i].time), value: sum / denom });
  }
  return out;
}

// ── Bollinger Bands ──────────────────────────────────────────────────────────
export function calcBollingerBands(candles, period = 20, multiplier = 2) {
  const upper = [], middle = [], lower = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
    const avg = sum / period;
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) variance += (candles[j].close - avg) ** 2;
    const std = Math.sqrt(variance / period);
    const t = toTs(candles[i].time);
    upper.push({ time: t, value: avg + multiplier * std });
    middle.push({ time: t, value: avg });
    lower.push({ time: t, value: avg - multiplier * std });
  }
  return { upper, middle, lower };
}

// ── VWAP (resets per day) ────────────────────────────────────────────────────
export function calcVWAP(candles) {
  const out = [];
  let cumPV = 0, cumVol = 0;
  let lastDay = null;
  for (const c of candles) {
    const day = new Date(c.time).toDateString();
    if (day !== lastDay) { cumPV = 0; cumVol = 0; lastDay = day; }
    const typical = (c.high + c.low + c.close) / 3;
    const vol = c.volume || 1;
    cumPV += typical * vol;
    cumVol += vol;
    out.push({ time: toTs(c.time), value: cumPV / cumVol });
  }
  return out;
}

// ── RSI ──────────────────────────────────────────────────────────────────────
export function calcRSI(candles, period = 14) {
  if (candles.length <= period) return [];
  const out = [];
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const d = candles[i].close - candles[i - 1].close;
    if (d >= 0) avgGain += d; else avgLoss -= d;
  }
  avgGain /= period;
  avgLoss /= period;
  const rsi = (t) => avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  out.push({ time: toTs(candles[period].time), value: rsi() });
  for (let i = period + 1; i < candles.length; i++) {
    const d = candles[i].close - candles[i - 1].close;
    avgGain = (avgGain * (period - 1) + (d > 0 ? d : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (d < 0 ? -d : 0)) / period;
    out.push({ time: toTs(candles[i].time), value: rsi() });
  }
  return out;
}

// ── MACD ─────────────────────────────────────────────────────────────────────
export function calcMACD(candles, fast = 12, slow = 26, signal = 9) {
  const emaFast = calcEMA(candles, fast);
  const emaSlow = calcEMA(candles, slow);
  const slowMap = new Map(emaSlow.map((d) => [d.time, d.value]));
  const macdLine = emaFast
    .filter((d) => slowMap.has(d.time))
    .map((d) => ({ time: d.time, value: d.value - slowMap.get(d.time) }));
  if (macdLine.length < signal) return { macdLine: [], signalLine: [], histogram: [] };

  const k = 2 / (signal + 1);
  const signalLine = [];
  let sigEma = macdLine.slice(0, signal).reduce((s, d) => s + d.value, 0) / signal;
  signalLine.push({ time: macdLine[signal - 1].time, value: sigEma });
  for (let i = signal; i < macdLine.length; i++) {
    sigEma = macdLine[i].value * k + sigEma * (1 - k);
    signalLine.push({ time: macdLine[i].time, value: sigEma });
  }
  const sigMap = new Map(signalLine.map((d) => [d.time, d.value]));
  const histogram = macdLine
    .filter((d) => sigMap.has(d.time))
    .map((d) => {
      const hist = d.value - sigMap.get(d.time);
      return { time: d.time, value: hist, color: hist >= 0 ? "rgba(38,166,154,0.7)" : "rgba(239,83,80,0.7)" };
    });
  return { macdLine, signalLine, histogram };
}

// ── ATR ──────────────────────────────────────────────────────────────────────
export function calcATR(candles, period = 14) {
  if (candles.length <= period) return [];
  const trs = [];
  for (let i = 1; i < candles.length; i++) {
    const h = candles[i].high, l = candles[i].low, pc = candles[i - 1].close;
    trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }
  const out = [];
  let atr = trs.slice(0, period).reduce((s, v) => s + v, 0) / period;
  out.push({ time: toTs(candles[period].time), value: atr });
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
    out.push({ time: toTs(candles[i + 1].time), value: atr });
  }
  return out;
}

// ── Volume bars ──────────────────────────────────────────────────────────────
export function calcVolume(candles) {
  return candles
    .filter((c) => c?.time)
    .map((c) => ({
      time: toTs(c.time),
      value: c.volume || 0,
      color: c.bullish ? "rgba(38,166,154,0.6)" : "rgba(239,83,80,0.6)",
    }));
}

// ── Default indicator config ─────────────────────────────────────────────────
export const DEFAULT_INDICATORS = {
  sma: [
    { period: 20, color: "#f59e0b", enabled: false },
    { period: 50, color: "#6366f1", enabled: false },
    { period: 200, color: "#ec4899", enabled: false },
  ],
  ema: [
    { period: 9,  color: "#22c55e", enabled: false },
    { period: 21, color: "#f97316", enabled: false },
  ],
  bb:     { period: 20, stdDev: 2,  enabled: false },
  vwap:   { enabled: false },
  volume: { enabled: true },
  rsi:    { period: 14, enabled: false },
  macd:   { fast: 12, slow: 26, signal: 9, enabled: false },
  atr:    { period: 14, enabled: false },
};
