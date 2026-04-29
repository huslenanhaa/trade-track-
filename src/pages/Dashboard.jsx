import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, Target, BarChart3 } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";
import { format, subDays, startOfYear } from "date-fns";
import { calculateStats, getCumulativePnl, getDailyPnl, getPerformanceBy } from "../lib/tradeCalculations";
import { Link } from "react-router-dom";
import RiskDisclosureBanner from "@/components/dashboard/RiskDisclosureBanner";
import { useTheme } from "@/lib/ThemeContext";

const TIME_FILTERS = ["7D", "30D", "90D", "YTD", "All"];

function StatCard({ title, value, subtitle, icon: Icon, valueColor, accent = "" }) {
  return (
    <Card className="p-5 rounded-2xl border border-border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden relative">
      <div className={`absolute inset-0 opacity-[0.04] ${accent || "bg-primary"}`} style={{ background: `radial-gradient(circle at top right, currentColor 0%, transparent 70%)` }} />
      <div className="flex items-start justify-between mb-3 relative">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        <div className="p-2 rounded-xl bg-primary/10 shrink-0"><Icon className="w-4 h-4 text-primary" /></div>
      </div>
      <p className={`text-2xl font-bold relative ${valueColor || "text-foreground"}`}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1.5 relative">{subtitle}</p>}
    </Card>
  );
}

export default function Dashboard() {
  const [timeFilter, setTimeFilter] = useState("All");
  const { isDark } = useTheme();

  const chartTheme = {
    text: isDark ? "#F8FAFC" : "#111827",
    mutedText: isDark ? "#CBD5E1" : "#374151",
    axis: isDark ? "#64748B" : "#9CA3AF",
    grid: isDark ? "#1F2937" : "#E5E7EB",
    tooltipBg: isDark ? "#020617" : "#FFFFFF",
    tooltipBorder: isDark ? "#334155" : "#E5E7EB",
  };

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["trades"],
    queryFn: () => appClient.entities.Trade.list("-date", 2000),
  });

  const filterTrades = (trs) => {
    if (timeFilter === "All") return trs;
    const now = new Date();
    const cutoff = timeFilter === "7D" ? subDays(now, 7) : timeFilter === "30D" ? subDays(now, 30) : timeFilter === "90D" ? subDays(now, 90) : startOfYear(now);
    return trs.filter(t => new Date(t.date) >= cutoff);
  };

  const filtered = filterTrades(trades);
  const stats = calculateStats(filtered);
  const cumPnl = getCumulativePnl(filtered);
  const dailyPnl = getDailyPnl(filtered);
  const recentTrades = trades.slice(0, 8);
  const bySymbol = getPerformanceBy(filtered, "symbol").slice(0, 5);

  const longs = filtered.filter(t => t.direction === "long");
  const shorts = filtered.filter(t => t.direction === "short");
  const longStats = calculateStats(longs);
  const shortStats = calculateStats(shorts);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      <RiskDisclosureBanner />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Net P&L" value={`$${stats.totalPnl.toLocaleString()}`} subtitle={`Avg/trade: $${stats.avgPnl}`} icon={DollarSign} valueColor={stats.totalPnl >= 0 ? "text-green-600" : "text-red-600"} />
        <StatCard title="Win Rate" value={`${stats.winRate}%`} subtitle={`${stats.wins}W · ${stats.losses}L · ${stats.breakeven}BE`} icon={Target} />
        <StatCard title="Average R" value={stats.avgRR} subtitle={`Expectancy: $${stats.expectancy}`} icon={TrendingUp} />
        <StatCard title="Profit Factor" value={stats.profitFactor} subtitle={`Max DD: $${stats.maxDrawdown}`} icon={BarChart3} />
      </div>

      {/* Equity Curve + Long/Short */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        <Card className="p-5 lg:col-span-7 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">Cumulative Equity Curve</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} trades in period</p>
            </div>
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              {TIME_FILTERS.map(f => (
                <button key={f} onClick={() => setTimeFilter(f)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${timeFilter === f ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumPnl}>
                <defs>
                  <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} opacity={0.65} />
                <XAxis
                  dataKey="date"
                  tickFormatter={d => format(new Date(d), "MM/dd")}
                  tick={{ fontSize: 11, fill: chartTheme.mutedText }}
                  stroke={chartTheme.axis}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: chartTheme.mutedText }}
                  stroke={chartTheme.axis}
                  tickFormatter={v => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: chartTheme.tooltipBg,
                    border: `1px solid ${chartTheme.tooltipBorder}`,
                    borderRadius: 12,
                    color: chartTheme.text,
                    fontSize: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,.16)",
                  }}
                  itemStyle={{ color: chartTheme.text }}
                  labelStyle={{ color: chartTheme.mutedText }}
                  formatter={v => [`$${v}`, "Equity"]}
                  labelFormatter={d => format(new Date(d), "MMM dd, yyyy")}
                />
                <Area type="monotone" dataKey="cumPnl" stroke="#F97316" fill="url(#eq)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Long vs Short */}
          <Card className="p-5 rounded-2xl flex-1">
            <h3 className="text-sm font-semibold mb-3">Long vs Short</h3>
            <div className="space-y-3">
              {[
                { label: "Long", stats: longStats, count: longs.length, color: "bg-green-500" },
                { label: "Short", stats: shortStats, count: shorts.length, color: "bg-red-500" },
              ].map(d => (
                <div key={d.label} className="p-3 rounded-xl bg-muted/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.label === "Long" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{d.label}</span>
                    <span className={`text-sm font-bold ${d.stats.totalPnl >= 0 ? "text-green-600" : "text-red-600"}`}>{d.stats.totalPnl >= 0 ? "+" : ""}${d.stats.totalPnl}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{d.count} trades</span>
                    <span>{d.stats.winRate}% WR</span>
                    <span>Avg RR: {d.stats.avgRR}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${d.color} rounded-full`} style={{ width: `${d.stats.winRate}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Symbols */}
          <Card className="p-5 rounded-2xl flex-1">
            <h3 className="text-sm font-semibold mb-3">Top Instruments</h3>
            <div className="space-y-2">
              {bySymbol.length === 0 && <p className="text-xs text-muted-foreground">No data yet</p>}
              {bySymbol.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground">{s.trades}T</span>
                  <span className="text-muted-foreground">{s.winRate}% WR</span>
                  <span className={`font-bold ${s.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>{s.pnl >= 0 ? "+" : ""}${s.pnl}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Trades + Daily PnL */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        <Card className="p-5 lg:col-span-7 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Recent Trades</h3>
            <Link to="/Journal" className="text-xs text-primary hover:underline font-medium">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Date", "Symbol", "Dir", "Entry", "Exit", "RR", "P&L", "Outcome"].map(h => (
                    <th key={h} className={`text-xs font-semibold text-muted-foreground pb-3 ${h === "P&L" || h === "RR" || h === "Entry" || h === "Exit" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTrades.map(trade => (
                  <tr key={trade.id} className="border-b border-border/40 hover:bg-orange-50/40 transition-colors cursor-pointer" onClick={() => window.location.href = `/TradeDetail?id=${trade.id}`}>
                    <td className="py-2.5 text-xs text-muted-foreground">{format(new Date(trade.date), "MMM dd, yy")}</td>
                    <td className="py-2.5 text-sm font-bold">{trade.symbol}</td>
                    <td className="py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trade.direction === "long" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{trade.direction === "long" ? "Long" : "Short"}</span>
                    </td>
                    <td className="py-2.5 text-xs text-right">{trade.entry_price}</td>
                    <td className="py-2.5 text-xs text-right">{trade.exit_price || "—"}</td>
                    <td className="py-2.5 text-xs text-right">{trade.risk_reward || "—"}</td>
                    <td className={`py-2.5 text-sm font-bold text-right ${(trade.pnl || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>{(trade.pnl || 0) >= 0 ? "+" : ""}${(trade.pnl || 0).toFixed(2)}</td>
                    <td className="py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-auto block w-fit ${trade.outcome === "win" ? "bg-green-100 text-green-700" : trade.outcome === "loss" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>{trade.outcome || "open"}</span>
                    </td>
                  </tr>
                ))}
                {recentTrades.length === 0 && (
                  <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No trades yet. <Link to="/Journal?add=true" className="text-primary hover:underline">Add your first trade →</Link></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="lg:col-span-3 flex flex-col gap-4">
          <Card className="p-5 rounded-2xl flex-1">
            <h3 className="text-sm font-semibold mb-3">Daily P&L</h3>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyPnl.slice(-20)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} opacity={0.65} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={d => format(new Date(d), "dd")}
                    tick={{ fontSize: 10, fill: chartTheme.mutedText }}
                    stroke={chartTheme.axis}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: chartTheme.mutedText }}
                    stroke={chartTheme.axis}
                    tickFormatter={v => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: chartTheme.tooltipBg,
                      border: `1px solid ${chartTheme.tooltipBorder}`,
                      borderRadius: 10,
                      color: chartTheme.text,
                      fontSize: 11,
                    }}
                    itemStyle={{ color: chartTheme.text }}
                    labelStyle={{ color: chartTheme.mutedText }}
                  />
                  <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                    {dailyPnl.slice(-20).map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "#16A34A" : "#DC2626"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 pt-3 border-t border-border mt-3">
              {[
                { label: "Best Trade", val: `+$${stats.bestTrade}`, color: "text-green-600" },
                { label: "Worst Trade", val: `$${stats.worstTrade}`, color: "text-red-600" },
                { label: "Win Streak", val: `${stats.winStreak} trades`, color: "text-primary" },
                { label: "Max Drawdown", val: `-$${stats.maxDrawdown}`, color: "text-red-600" },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className={`font-semibold ${r.color}`}>{r.val}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
