import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area
} from "recharts";
import { subDays, startOfYear } from "date-fns";
import { calculateStats, getCumulativePnl, getPerformanceBy } from "../lib/tradeCalculations";
import {
  DollarSign, Target, TrendingUp, Zap, BarChart3, Flame, AlertTriangle
} from "lucide-react";

const TIME_FILTERS = ["7D", "30D", "90D", "YTD", "All"];

function MetricCard({ title, value, sub, icon: Icon, valueColor }) {
  return (
    <Card className="p-4 rounded-2xl border border-border bg-card hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider leading-tight">{title}</p>
        {Icon && <div className="p-1.5 rounded-lg bg-orange-50 shrink-0"><Icon className="w-3.5 h-3.5 text-primary" /></div>}
      </div>
      <p className={`text-2xl font-bold leading-none mt-1 ${valueColor || "text-foreground"}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
    </Card>
  );
}

export default function Analytics() {
  const [timeFilter, setTimeFilter] = useState("All");
  const [symbolFilter, setSymbolFilter] = useState("All");
  const [sessionFilter, setSessionFilter] = useState("All");
  const [dirFilter, setDirFilter] = useState("All");
  const [chartMode, setChartMode] = useState("equity");

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["trades"],
    queryFn: () => appClient.entities.Trade.list("-date", 5000),
  });

  const allSymbols = [...new Set(trades.map(t => t.symbol).filter(Boolean))];

  const filtered = trades.filter(t => {
    const now = new Date();
    if (timeFilter !== "All") {
      const cutoff = timeFilter === "7D" ? subDays(now, 7) : timeFilter === "30D" ? subDays(now, 30) : timeFilter === "90D" ? subDays(now, 90) : startOfYear(now);
      if (new Date(t.date) < cutoff) return false;
    }
    if (symbolFilter !== "All" && t.symbol !== symbolFilter) return false;
    if (sessionFilter !== "All" && t.session !== sessionFilter) return false;
    if (dirFilter !== "All" && t.direction !== dirFilter) return false;
    return true;
  });

  const stats = calculateStats(filtered);
  const cumPnl = getCumulativePnl(filtered);

  // Drawdown data
  let peak = 0;
  const ddData = cumPnl.map((p, i) => {
    if (p.cumPnl > peak) peak = p.cumPnl;
    return { idx: i + 1, dd: parseFloat(-(peak - p.cumPnl).toFixed(2)) };
  });

  const bySymbol = getPerformanceBy(filtered, "symbol");
  const bySession = getPerformanceBy(filtered, "session");

  // Session chart data
  const sessionData = bySession.map(s => ({
    name: s.name === "new_york" ? "New York" : s.name.charAt(0).toUpperCase() + s.name.slice(1),
    pnl: s.pnl, trades: s.trades, winRate: s.winRate
  }));

  // Day of week
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayMap = {};
  filtered.forEach(t => {
    const d = days[new Date(t.date).getDay()];
    if (!dayMap[d]) dayMap[d] = { pnl: 0, trades: 0 };
    dayMap[d].pnl += t.pnl || 0;
    dayMap[d].trades++;
  });
  const dayData = days.map(d => ({ name: d, pnl: parseFloat((dayMap[d]?.pnl || 0).toFixed(2)) }));

  // RR distribution
  const rrBuckets = { "<0": 0, "0-1": 0, "1-2": 0, "2-3": 0, "3+": 0 };
  filtered.forEach(t => {
    const rr = t.risk_reward || 0;
    if (rr < 0) rrBuckets["<0"]++;
    else if (rr < 1) rrBuckets["0-1"]++;
    else if (rr < 2) rrBuckets["1-2"]++;
    else if (rr < 3) rrBuckets["2-3"]++;
    else rrBuckets["3+"]++;
  });
  const rrData = Object.entries(rrBuckets).map(([name, value]) => ({ name, value }));

  // Long vs Short
  const longs = filtered.filter(t => t.direction === "long");
  const shorts = filtered.filter(t => t.direction === "short");
  const longPnl = longs.reduce((s, t) => s + (t.pnl || 0), 0);
  const shortPnl = shorts.reduce((s, t) => s + (t.pnl || 0), 0);
  const longWR = longs.length ? ((longs.filter(t => t.outcome === "win").length / longs.length) * 100).toFixed(1) : 0;
  const shortWR = shorts.length ? ((shorts.filter(t => t.outcome === "win").length / shorts.length) * 100).toFixed(1) : 0;

  const equityChartData = cumPnl.map((p, i) => ({ idx: i + 1, cumPnl: p.cumPnl }));

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* ── Filter bar ── */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {TIME_FILTERS.map(f => (
              <button key={f} onClick={() => setTimeFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${timeFilter === f ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {f}
              </button>
            ))}
          </div>
          <Select value={symbolFilter} onValueChange={setSymbolFilter}>
            <SelectTrigger className="w-32 h-8 text-xs rounded-xl"><SelectValue placeholder="Symbol" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Symbols</SelectItem>
              {allSymbols.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sessionFilter} onValueChange={setSessionFilter}>
            <SelectTrigger className="w-32 h-8 text-xs rounded-xl"><SelectValue placeholder="Session" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Sessions</SelectItem>
              <SelectItem value="asian">Asian</SelectItem>
              <SelectItem value="london">London</SelectItem>
              <SelectItem value="new_york">New York</SelectItem>
              <SelectItem value="overlap">Overlap</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dirFilter} onValueChange={setDirFilter}>
            <SelectTrigger className="w-28 h-8 text-xs rounded-xl"><SelectValue placeholder="Direction" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="long">Long</SelectItem>
              <SelectItem value="short">Short</SelectItem>
            </SelectContent>
          </Select>
          <p className="ml-auto text-xs text-muted-foreground self-center">{filtered.length} trades</p>
        </div>
      </div>

      {/* ── Metrics row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <MetricCard title="Total Trades" value={stats.total} sub={`${stats.wins}W · ${stats.losses}L`} icon={BarChart3} />
        <MetricCard title="Win Rate" value={`${stats.winRate}%`} sub="of closed trades" icon={Target} valueColor={stats.winRate >= 50 ? "text-green-600" : "text-red-600"} />
        <MetricCard title="Avg RR" value={stats.avgRR} sub="risk:reward" icon={TrendingUp} />
        <MetricCard title="Net Return" value={`$${stats.totalPnl.toLocaleString()}`} sub="cumulative" icon={DollarSign} valueColor={stats.totalPnl >= 0 ? "text-green-600" : "text-red-600"} />
        <MetricCard title="Profit Factor" value={stats.profitFactor} sub="gross profit/loss" icon={Zap} valueColor={parseFloat(stats.profitFactor) >= 1.5 ? "text-green-600" : "text-red-600"} />
        <MetricCard title="Expectancy" value={`$${stats.expectancy}`} sub="per trade avg" icon={TrendingUp} valueColor={stats.expectancy >= 0 ? "text-green-600" : "text-red-600"} />
        <MetricCard title="Max Drawdown" value={`-$${stats.maxDrawdown}`} sub="worst peak-to-trough" icon={AlertTriangle} valueColor="text-red-600" />
        <MetricCard title="Win Streak" value={stats.winStreak} sub="best consecutive wins" icon={Flame} valueColor="text-primary" />
      </div>

      {/* ── Main chart + right panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        {/* Left: equity chart */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <Card className="p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-sm font-semibold">Strategy Equity Curve</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Cumulative performance across {filtered.length} trades</p>
              </div>
              <div className="flex gap-1 bg-muted rounded-xl p-1">
                {["equity", "drawdown"].map(m => (
                  <button key={m} onClick={() => setChartMode(m)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${chartMode === m ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === "equity" ? (
                  <AreaChart data={equityChartData}>
                    <defs>
                      <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="idx" tick={{ fontSize: 10, fill: "#9CA3AF" }} stroke="#E5E7EB"
                      label={{ value: "Trade #", position: "insideBottom", offset: -2, fontSize: 10, fill: "#9CA3AF" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} stroke="#E5E7EB" tickFormatter={v => `$${v}`} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, fontSize: 12 }}
                      formatter={v => [`$${v}`, "Equity"]} labelFormatter={l => `Trade #${l}`} />
                    <Area type="monotone" dataKey="cumPnl" stroke="#F97316" fill="url(#eqGrad)" strokeWidth={2.5} dot={false} />
                  </AreaChart>
                ) : (
                  <AreaChart data={ddData}>
                    <defs>
                      <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#DC2626" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="idx" tick={{ fontSize: 10, fill: "#9CA3AF" }} stroke="#E5E7EB" />
                    <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} stroke="#E5E7EB" tickFormatter={v => `$${v}`} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, fontSize: 12 }}
                      formatter={v => [`$${v}`, "Drawdown"]} />
                    <Area type="monotone" dataKey="dd" stroke="#DC2626" fill="url(#ddGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 3 breakdown charts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 rounded-2xl">
              <h4 className="text-xs font-semibold mb-3">RR Distribution</h4>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rrData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#E5E7EB" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#E5E7EB" />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 11 }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {rrData.map((d, i) => <Cell key={i} fill={d.name === "<0" ? "#DC2626" : d.name === "0-1" ? "#FB923C" : d.name === "1-2" ? "#F97316" : d.name === "2-3" ? "#16A34A" : "#15803D"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4 rounded-2xl">
              <h4 className="text-xs font-semibold mb-3">Session Performance</h4>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#E5E7EB" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#E5E7EB" tickFormatter={v => `$${v}`} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 11 }} />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {sessionData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "#16A34A" : "#DC2626"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4 rounded-2xl">
              <h4 className="text-xs font-semibold mb-3">Day of Week</h4>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayData} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#E5E7EB" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#E5E7EB" tickFormatter={v => `$${v}`} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 11 }} />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {dayData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "#16A34A" : "#DC2626"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>

        {/* Right analytics column */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {/* Win vs Loss */}
          <Card className="p-4 rounded-2xl">
            <h4 className="text-xs font-semibold mb-3">Win vs Loss Analysis</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${stats.winRate}%` }} />
                </div>
                <span className="text-xs font-bold text-green-600 w-10 text-right">{stats.winRate}%</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-green-50 text-center">
                  <p className="text-xs text-green-600 font-medium">Avg Win</p>
                  <p className="text-sm font-bold text-green-700">+${stats.avgWin}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-red-50 text-center">
                  <p className="text-xs text-red-600 font-medium">Avg Loss</p>
                  <p className="text-sm font-bold text-red-700">-${stats.avgLoss}</p>
                </div>
              </div>
              <div className="space-y-1.5 pt-1 border-t border-border">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Wins</span>
                  <span className="font-bold text-green-600">{stats.wins} trades</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Losses</span>
                  <span className="font-bold text-red-600">{stats.losses} trades</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Long vs Short */}
          <Card className="p-4 rounded-2xl">
            <h4 className="text-xs font-semibold mb-3">Long vs Short</h4>
            <div className="space-y-2.5">
              {[
                { label: "Long", count: longs.length, pnl: longPnl, wr: longWR, bg: "bg-green-100", tc: "text-green-700" },
                { label: "Short", count: shorts.length, pnl: shortPnl, wr: shortWR, bg: "bg-red-100", tc: "text-red-700" },
              ].map(d => (
                <div key={d.label} className="p-3 rounded-xl bg-muted/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.bg} ${d.tc}`}>{d.label}</span>
                    <span className={`text-sm font-bold ${d.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {d.pnl >= 0 ? "+" : ""}${parseFloat(d.pnl.toFixed(2)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{d.count} trades</span>
                    <span>{d.wr}% WR</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${d.wr}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Performers */}
          <Card className="p-4 rounded-2xl">
            <h4 className="text-xs font-semibold mb-3">Top Performers</h4>
            <div className="space-y-2">
              {bySymbol.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                  <span className="font-semibold w-20">{s.name}</span>
                  <span className="text-muted-foreground">{s.trades}T</span>
                  <span className="text-muted-foreground">{s.winRate}% WR</span>
                  <span className={`font-bold ${s.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {s.pnl >= 0 ? "+" : ""}${s.pnl.toLocaleString()}
                  </span>
                </div>
              ))}
              {bySymbol.length === 0 && <p className="text-xs text-muted-foreground">No data yet</p>}
            </div>
          </Card>

          {/* Session insight */}
          <Card className="p-4 rounded-2xl">
            <h4 className="text-xs font-semibold mb-3">Session Insights</h4>
            <div className="space-y-2">
              {sessionData.sort((a, b) => b.pnl - a.pnl).map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground">{s.trades}T · {s.winRate}% WR</span>
                  <span className={`font-bold ${s.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {s.pnl >= 0 ? "+" : ""}${s.pnl.toLocaleString()}
                  </span>
                </div>
              ))}
              {sessionData.length === 0 && <p className="text-xs text-muted-foreground">No data yet</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
