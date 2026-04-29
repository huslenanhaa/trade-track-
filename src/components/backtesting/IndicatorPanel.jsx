import React, { useState, useRef, useEffect } from "react";
import { Activity, ChevronDown, ChevronRight, Plus, X } from "lucide-react";

const PANEL_BG   = "#1a1d27";
const BORDER     = "#2a2d3a";
const TEXT_MUTED = "#6b7280";
const ACCENT     = "#6366f1";

const MA_COLORS = ["#f59e0b", "#6366f1", "#ec4899", "#22c55e", "#f97316", "#06b6d4"];

// ── Small toggle switch ───────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
      style={{ background: on ? ACCENT : "#374151" }}
    >
      <span
        className="absolute h-3.5 w-3.5 rounded-full bg-white shadow transition-all"
        style={{ left: on ? "calc(100% - 18px)" : "2px" }}
      />
    </button>
  );
}

// ── Small number input ────────────────────────────────────────────────────────
function NumInput({ value, onChange, min = 1, max = 999, width = 48 }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(Number(e.target.value) || min)}
      className="rounded px-1.5 py-0.5 text-center text-xs font-mono text-white outline-none"
      style={{ width, background: "#0f1117", border: `1px solid ${BORDER}` }}
    />
  );
}

// ── Color dot picker ─────────────────────────────────────────────────────────
function ColorDot({ color, onChange }) {
  return (
    <label className="relative cursor-pointer">
      <div
        className="h-4 w-4 rounded-full border border-white/10"
        style={{ background: color }}
      />
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${BORDER}` }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider"
        style={{ color: TEXT_MUTED }}
      >
        {title}
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

// ── MA row (SMA / EMA) ────────────────────────────────────────────────────────
function MARow({ item, onChange, onRemove, canRemove }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <Toggle on={item.enabled} onChange={(v) => onChange({ ...item, enabled: v })} />
      <span className="w-8 text-xs font-mono text-white">{item.period}</span>
      <NumInput value={item.period} onChange={(v) => onChange({ ...item, period: v })} width={52} />
      <ColorDot color={item.color} onChange={(v) => onChange({ ...item, color: v })} />
      {canRemove && (
        <button onClick={onRemove} className="ml-auto text-gray-600 hover:text-red-400">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function IndicatorPanel({ indicators, onChange }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const set = (path, value) => {
    const next = { ...indicators };
    if (path.includes(".")) {
      const [a, b] = path.split(".");
      next[a] = { ...next[a], [b]: value };
    } else {
      next[path] = value;
    }
    onChange(next);
  };

  const setMA = (key, index, value) => {
    const arr = [...indicators[key]];
    arr[index] = value;
    onChange({ ...indicators, [key]: arr });
  };

  const addMA = (key) => {
    const arr = [...indicators[key]];
    const used = arr.map((m) => m.period);
    const nextPeriod = [9, 20, 50, 100, 200].find((p) => !used.includes(p)) || arr.length * 10 + 10;
    arr.push({ period: nextPeriod, color: MA_COLORS[arr.length % MA_COLORS.length], enabled: true });
    onChange({ ...indicators, [key]: arr });
  };

  const removeMA = (key, index) => {
    const arr = indicators[key].filter((_, i) => i !== index);
    onChange({ ...indicators, [key]: arr });
  };

  // Count active indicators for badge
  const activeCount = [
    ...indicators.sma.filter((m) => m.enabled),
    ...indicators.ema.filter((m) => m.enabled),
    indicators.bb.enabled,
    indicators.vwap.enabled,
    indicators.volume.enabled,
    indicators.rsi.enabled,
    indicators.macd.enabled,
    indicators.atr.enabled,
  ].filter(Boolean).length;

  return (
    <div ref={panelRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition"
        style={{
          background: open || activeCount > 0 ? "#6366f120" : "#1e2330",
          color: open || activeCount > 0 ? "#818cf8" : "#9ca3af",
          border: `1px solid ${open || activeCount > 0 ? "#6366f140" : BORDER}`,
        }}
        title="Indicators"
      >
        <Activity className="h-3.5 w-3.5" />
        Indicators
        {activeCount > 0 && (
          <span
            className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
            style={{ background: ACCENT, color: "#fff" }}
          >
            {activeCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 top-10 z-50 w-64 overflow-y-auto rounded-xl shadow-2xl"
          style={{
            background: PANEL_BG,
            border: `1px solid ${BORDER}`,
            maxHeight: "calc(100vh - 120px)",
          }}
        >
          <div
            className="px-3 py-2.5 text-xs font-bold text-white"
            style={{ borderBottom: `1px solid ${BORDER}` }}
          >
            Chart Indicators
          </div>

          {/* ── Overlays ──────────────────────────── */}
          <Section title="Moving Averages — SMA" defaultOpen>
            {indicators.sma.map((item, i) => (
              <MARow
                key={i}
                item={item}
                onChange={(v) => setMA("sma", i, v)}
                onRemove={() => removeMA("sma", i)}
                canRemove={indicators.sma.length > 1}
              />
            ))}
            <button
              onClick={() => addMA("sma")}
              className="mt-1 flex items-center gap-1 text-xs"
              style={{ color: ACCENT }}
            >
              <Plus className="h-3 w-3" /> Add SMA
            </button>
          </Section>

          <Section title="Moving Averages — EMA">
            {indicators.ema.map((item, i) => (
              <MARow
                key={i}
                item={item}
                onChange={(v) => setMA("ema", i, v)}
                onRemove={() => removeMA("ema", i)}
                canRemove={indicators.ema.length > 1}
              />
            ))}
            <button
              onClick={() => addMA("ema")}
              className="mt-1 flex items-center gap-1 text-xs"
              style={{ color: ACCENT }}
            >
              <Plus className="h-3 w-3" /> Add EMA
            </button>
          </Section>

          <Section title="Bollinger Bands">
            <div className="flex items-center justify-between py-1">
              <Toggle on={indicators.bb.enabled} onChange={(v) => set("bb", { ...indicators.bb, enabled: v })} />
              <span className="text-xs" style={{ color: TEXT_MUTED }}>Period</span>
              <NumInput value={indicators.bb.period} onChange={(v) => set("bb", { ...indicators.bb, period: v })} />
              <span className="text-xs" style={{ color: TEXT_MUTED }}>StdDev</span>
              <NumInput value={indicators.bb.stdDev} onChange={(v) => set("bb", { ...indicators.bb, stdDev: v })} min={1} max={5} width={40} />
            </div>
          </Section>

          <Section title="VWAP">
            <div className="flex items-center gap-3 py-1">
              <Toggle on={indicators.vwap.enabled} onChange={(v) => set("vwap", { enabled: v })} />
              <span className="text-xs text-white">Volume Weighted Avg Price</span>
            </div>
          </Section>

          {/* ── Sub-panes ─────────────────────────── */}
          <Section title="Volume">
            <div className="flex items-center gap-3 py-1">
              <Toggle on={indicators.volume.enabled} onChange={(v) => set("volume", { enabled: v })} />
              <span className="text-xs text-white">Volume histogram</span>
            </div>
          </Section>

          <Section title="RSI">
            <div className="flex items-center justify-between py-1">
              <Toggle on={indicators.rsi.enabled} onChange={(v) => set("rsi", { ...indicators.rsi, enabled: v })} />
              <span className="text-xs" style={{ color: TEXT_MUTED }}>Period</span>
              <NumInput value={indicators.rsi.period} onChange={(v) => set("rsi", { ...indicators.rsi, period: v })} />
            </div>
          </Section>

          <Section title="MACD">
            <div className="space-y-1.5 py-1">
              <div className="flex items-center gap-3">
                <Toggle on={indicators.macd.enabled} onChange={(v) => set("macd", { ...indicators.macd, enabled: v })} />
                <span className="text-xs text-white">MACD</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: TEXT_MUTED }}>Fast</span>
                <NumInput value={indicators.macd.fast} onChange={(v) => set("macd", { ...indicators.macd, fast: v })} />
                <span className="text-xs" style={{ color: TEXT_MUTED }}>Slow</span>
                <NumInput value={indicators.macd.slow} onChange={(v) => set("macd", { ...indicators.macd, slow: v })} />
                <span className="text-xs" style={{ color: TEXT_MUTED }}>Sig</span>
                <NumInput value={indicators.macd.signal} onChange={(v) => set("macd", { ...indicators.macd, signal: v })} />
              </div>
            </div>
          </Section>

          <Section title="ATR">
            <div className="flex items-center justify-between py-1">
              <Toggle on={indicators.atr.enabled} onChange={(v) => set("atr", { ...indicators.atr, enabled: v })} />
              <span className="text-xs" style={{ color: TEXT_MUTED }}>Period</span>
              <NumInput value={indicators.atr.period} onChange={(v) => set("atr", { ...indicators.atr, period: v })} />
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
