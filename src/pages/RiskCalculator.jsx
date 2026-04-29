import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Shield, DollarSign, TrendingUp, AlertTriangle,
  Calculator, Target, Zap, ChevronRight
} from "lucide-react";

const LOT_SIZES = {
  standard: { label: "Standard", units: 100_000, abbr: "Std" },
  mini:     { label: "Mini",     units: 10_000,  abbr: "Mini" },
  micro:    { label: "Micro",    units: 1_000,   abbr: "Micro" },
  nano:     { label: "Nano",     units: 100,     abbr: "Nano" },
};

const INSTRUMENTS = [
  { key: "forex",  label: "Forex",  useLots: true },
  { key: "stock",  label: "Stocks", useLots: false },
  { key: "crypto", label: "Crypto", useLots: false },
];

function ResultRow({ label, value, valueClass = "", sub }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-bold ${valueClass}`}>{value}</span>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, prefix }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">{prefix}</span>
        )}
        <Input
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`h-10 rounded-xl text-sm ${prefix ? "pl-7" : ""}`}
        />
      </div>
    </div>
  );
}

const RISK_PRESETS = [0.5, 1, 1.5, 2, 3];

export default function RiskCalculator() {
  const [accountBalance, setAccountBalance] = useState("10000");
  const [riskPercent, setRiskPercent]       = useState("1");
  const [entryPrice, setEntryPrice]         = useState("");
  const [stopLoss, setStopLoss]             = useState("");
  const [takeProfit, setTakeProfit]         = useState("");
  const [direction, setDirection]           = useState("long");
  const [instrument, setInstrument]         = useState("forex");
  const [lotType, setLotType]               = useState("micro");

  const isForex = instrument === "forex";
  const lotUnits = LOT_SIZES[lotType].units;

  const calc = useMemo(() => {
    const balance = parseFloat(accountBalance) || 0;
    const risk    = parseFloat(riskPercent) || 0;
    const entry   = parseFloat(entryPrice) || 0;
    const sl      = parseFloat(stopLoss) || 0;
    const tp      = parseFloat(takeProfit) || 0;

    if (!balance || !risk || !entry || !sl) return null;

    const riskAmount = (balance * risk) / 100;
    const slDistance = Math.abs(entry - sl);
    const tpDistance = tp ? Math.abs(tp - entry) : 0;

    if (slDistance === 0) return null;

    // Raw units (works for any instrument)
    const rawUnits    = riskAmount / slDistance;
    const lots        = isForex ? rawUnits / lotUnits : null;
    const positionValue = rawUnits * entry;

    const rrRatio        = tpDistance > 0 ? tpDistance / slDistance : null;
    const potentialProfit = tpDistance > 0 ? rawUnits * tpDistance : null;

    const riskRating = risk <= 1 ? "Low" : risk <= 2 ? "Moderate" : "High";
    const riskColor  = risk <= 1 ? "#4ade80" : risk <= 2 ? "#facc15" : "#f87171";
    const leverage   = positionValue / balance;

    return {
      riskAmount:      riskAmount.toFixed(2),
      rawUnits:        rawUnits.toFixed(4),
      lots:            lots !== null ? lots.toFixed(2) : null,
      lotsLabel:       lots !== null ? `${lots.toFixed(2)} lots (${LOT_SIZES[lotType].label})` : null,
      positionValue:   positionValue.toFixed(2),
      slDistance:      slDistance.toFixed(5),
      tpDistance:      tpDistance > 0 ? tpDistance.toFixed(5) : null,
      rrRatio:         rrRatio ? rrRatio.toFixed(2) : null,
      potentialProfit: potentialProfit ? potentialProfit.toFixed(2) : null,
      leverage:        leverage.toFixed(2),
      riskRating,
      riskColor,
    };
  }, [accountBalance, riskPercent, entryPrice, stopLoss, takeProfit, isForex, lotUnits, lotType]);

  const directionWarning = useMemo(() => {
    const entry = parseFloat(entryPrice);
    const sl    = parseFloat(stopLoss);
    const tp    = parseFloat(takeProfit);
    if (!entry || !sl) return null;
    if (direction === "long"  && sl >= entry) return "Stop loss should be below entry for a Long trade";
    if (direction === "short" && sl <= entry) return "Stop loss should be above entry for a Short trade";
    if (tp && direction === "long"  && tp <= entry) return "Take profit should be above entry for a Long trade";
    if (tp && direction === "short" && tp >= entry) return "Take profit should be below entry for a Short trade";
    return null;
  }, [entryPrice, stopLoss, takeProfit, direction]);

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Calculator className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Risk Calculator</h1>
          <p className="text-xs text-muted-foreground">Size your position before entering the trade</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* ── Inputs ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Instrument */}
          <Card className="p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Instrument</h3>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Asset Type</label>
              <div className="flex gap-1.5">
                {INSTRUMENTS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setInstrument(key)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border ${
                      instrument === key
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lot size — Forex only */}
            {isForex && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Lot Size</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {Object.entries(LOT_SIZES).map(([key, { label, units }]) => (
                    <button
                      key={key}
                      onClick={() => setLotType(key)}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all border flex flex-col items-center gap-0.5 ${
                        lotType === key
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{label}</span>
                      <span className={`text-[10px] ${lotType === key ? "text-white/70" : "text-muted-foreground/60"}`}>
                        {units >= 1000 ? `${units / 1000}k` : units}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  1 {LOT_SIZES[lotType].label} lot = {LOT_SIZES[lotType].units.toLocaleString()} units
                </p>
              </div>
            )}
          </Card>

          {/* Account */}
          <Card className="p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Account</h3>
            </div>
            <InputField label="Account Balance" value={accountBalance} onChange={setAccountBalance} placeholder="10000" prefix="$" />
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Risk Per Trade</label>
              <div className="flex gap-1.5 mb-2">
                {RISK_PRESETS.map(p => (
                  <button
                    key={p}
                    onClick={() => setRiskPercent(String(p))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${parseFloat(riskPercent) === p ? "bg-primary text-white shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(e.target.value)}
                  className="h-10 rounded-xl text-sm pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={Math.min(parseFloat(riskPercent) || 1, 5)}
                onChange={(e) => setRiskPercent(e.target.value)}
                className="w-full mt-2 accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                <span>0.1%</span>
                <span>Conservative ≤ 1%</span>
                <span>5%</span>
              </div>
            </div>
          </Card>

          {/* Trade Setup */}
          <Card className="p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Trade Setup</h3>
              </div>
              <div className="flex rounded-xl border border-border p-0.5 gap-0.5">
                {["long", "short"].map(d => (
                  <button
                    key={d}
                    onClick={() => setDirection(d)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all capitalize ${direction === d
                      ? d === "long" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                      : "text-muted-foreground"}`}
                  >
                    {d === "long" ? "↑ Long" : "↓ Short"}
                  </button>
                ))}
              </div>
            </div>

            <InputField label="Entry Price" value={entryPrice} onChange={setEntryPrice} placeholder="0.00000" />
            <InputField label="Stop Loss"   value={stopLoss}   onChange={setStopLoss}   placeholder="0.00000" />
            <InputField label="Take Profit (optional)" value={takeProfit} onChange={setTakeProfit} placeholder="0.00000" />

            {directionWarning && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-50 border border-yellow-200">
                <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700">{directionWarning}</p>
              </div>
            )}
          </Card>
        </div>

        {/* ── Results ── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Main result card */}
          <Card className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-white/90">Position Size</h3>
            </div>
            {calc ? (
              <>
                <div className="text-center py-4">
                  {isForex ? (
                    <>
                      <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Lots to Trade</p>
                      <p className="text-5xl font-bold text-white">{calc.lots}</p>
                      <p className="text-sm text-white/50 mt-1">
                        {LOT_SIZES[lotType].label} lots · {parseFloat(calc.rawUnits).toLocaleString(undefined, { maximumFractionDigits: 0 })} units
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Units / Shares</p>
                      <p className="text-5xl font-bold text-white">{parseFloat(calc.rawUnits).toFixed(instrument === "crypto" ? 6 : 0)}</p>
                      <p className="text-sm text-white/50 mt-1">Position Value: ${parseFloat(calc.positionValue).toLocaleString()}</p>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-xs text-white/50 mb-1">Risk Amount</p>
                    <p className="text-base font-bold text-red-400">${calc.riskAmount}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-xs text-white/50 mb-1">Risk Rating</p>
                    <p className="text-base font-bold" style={{ color: calc.riskColor }}>{calc.riskRating}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-xs text-white/50 mb-1">Leverage</p>
                    <p className="text-base font-bold text-white">{calc.leverage}x</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <Calculator className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">Fill in your trade details to calculate position size</p>
              </div>
            )}
          </Card>

          {/* Breakdown */}
          {calc && (
            <Card className="p-5 rounded-2xl space-y-1">
              <h3 className="text-sm font-semibold mb-2">Breakdown</h3>
              <ResultRow label="SL Distance" value={calc.slDistance} />
              {calc.tpDistance && <ResultRow label="TP Distance" value={calc.tpDistance} />}
              {isForex && (
                <ResultRow
                  label="Position Size (units)"
                  value={parseFloat(calc.rawUnits).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                />
              )}
              {calc.rrRatio && (
                <ResultRow
                  label="Risk : Reward"
                  value={`1 : ${calc.rrRatio}`}
                  valueClass={parseFloat(calc.rrRatio) >= 2 ? "text-green-600" : parseFloat(calc.rrRatio) >= 1 ? "text-yellow-600" : "text-red-600"}
                />
              )}
              {calc.potentialProfit && (
                <ResultRow label="Potential Profit" value={`+$${calc.potentialProfit}`} valueClass="text-green-600" />
              )}
              <ResultRow label="Amount at Risk" value={`-$${calc.riskAmount}`} valueClass="text-red-600" />
              <ResultRow label="Leverage Used" value={`${calc.leverage}x`} />
            </Card>
          )}

          {/* Scenarios */}
          {calc && (
            <Card className="p-5 rounded-2xl">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-primary" />Outcome Scenarios</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 text-left text-muted-foreground font-semibold">Scenario</th>
                      <th className="pb-2 text-right text-muted-foreground font-semibold">P&L</th>
                      <th className="pb-2 text-right text-muted-foreground font-semibold">Account After</th>
                      <th className="pb-2 text-right text-muted-foreground font-semibold">% Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Full Stop Loss Hit", multiplier: -1, color: "text-red-600" },
                      { label: "Break Even",         multiplier: 0,  color: "text-muted-foreground" },
                      ...(calc.rrRatio ? [
                        { label: `TP Hit (1 : ${calc.rrRatio} RR)`, multiplier: parseFloat(calc.rrRatio), color: "text-green-600" },
                      ] : []),
                    ].map((s, i) => {
                      const pnl   = s.multiplier * parseFloat(calc.riskAmount);
                      const after = parseFloat(accountBalance) + pnl;
                      const pct   = ((pnl / parseFloat(accountBalance)) * 100).toFixed(2);
                      return (
                        <tr key={i} className="border-b border-border/40 last:border-0">
                          <td className="py-2 font-medium">{s.label}</td>
                          <td className={`py-2 text-right font-bold ${s.color}`}>{pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}</td>
                          <td className="py-2 text-right font-medium">${after.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className={`py-2 text-right font-bold ${pnl > 0 ? "text-green-600" : pnl < 0 ? "text-red-600" : "text-muted-foreground"}`}>{pnl >= 0 ? "+" : ""}{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Tips */}
          <Card className="p-4 rounded-2xl bg-primary/5 border-primary/20">
            <h3 className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">Pro Tips</h3>
            <ul className="space-y-1.5">
              {[
                "Never risk more than 1-2% per trade to survive drawdowns",
                "A 2:1 RR means you only need 34% win rate to break even",
                "Forex: 1 micro lot = 1,000 units — good for small accounts",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <ChevronRight className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
