import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";

// ---------------------------------------------------------------------------
// SessionStats
// Win-rate gauge + key stat chips for the replay room header/sidebar.
// ---------------------------------------------------------------------------

function StatChip({ label, value, sub, color = "text-foreground" }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`mt-0.5 text-sm font-bold tabular-nums leading-tight ${color}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function SessionStats({
  balance = 10000,
  startingBalance = 10000,
  totalPnl = 0,
  winRate = "0.0",
  tradeCount = 0,
  wins = 0,
  className = "",
}) {
  const pnlPositive = totalPnl >= 0;
  const winRateNum  = parseFloat(winRate) || 0;

  const gaugeData = [{ value: winRateNum, fill: winRateNum >= 50 ? "#22c55e" : "#ef4444" }];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Win Rate Gauge */}
      <div className="flex flex-col items-center rounded-xl border border-border bg-card py-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Win Rate</p>
        <div className="relative h-24 w-24">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="68%"
              outerRadius="100%"
              data={gaugeData}
              startAngle={225}
              endAngle={-45}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar
                dataKey="value"
                cornerRadius={4}
                background={{ fill: "#1e293b" }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          {/* Centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-lg font-bold tabular-nums ${winRateNum >= 50 ? "text-emerald-500" : "text-red-500"}`}>
              {winRateNum.toFixed(0)}%
            </span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {wins} W / {tradeCount - wins} L
        </p>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-2 gap-2">
        <StatChip
          label="Balance"
          value={`$${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
        />
        <StatChip
          label="P&L"
          value={`${pnlPositive ? "+" : ""}$${Math.abs(totalPnl).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          color={pnlPositive ? "text-emerald-500" : "text-red-500"}
        />
        <StatChip
          label="Trades"
          value={tradeCount}
          sub={`${wins} wins`}
        />
        <StatChip
          label="Return"
          value={`${pnlPositive ? "+" : ""}${startingBalance > 0 ? ((totalPnl / startingBalance) * 100).toFixed(2) : "0.00"}%`}
          color={pnlPositive ? "text-emerald-500" : "text-red-500"}
        />
      </div>
    </div>
  );
}
