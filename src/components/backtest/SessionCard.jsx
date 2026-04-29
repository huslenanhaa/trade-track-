import { format } from "date-fns";
import { Lock, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card }   from "@/components/ui/card";

// ---------------------------------------------------------------------------
// SessionCard
// Individual backtest session card for the sessions dashboard grid.
// ---------------------------------------------------------------------------

const ASSET_TYPE_COLOR = {
  forex:     "bg-blue-500/10 text-blue-400",
  crypto:    "bg-yellow-500/10 text-yellow-400",
  indices:   "bg-purple-500/10 text-purple-400",
  commodity: "bg-orange-500/10 text-orange-400",
  "etf-proxy": "bg-teal-500/10 text-teal-400",
};

function StatusBadge({ status }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
      ● Active
    </span>
  );
}

export function SessionCard({ session, onOpen, onDelete }) {
  const pnl          = (session.currentBalance ?? session.current_balance ?? 0) -
                       (session.startingBalance ?? session.starting_balance ?? 0);
  const pnlPositive  = pnl >= 0;
  const winRate      = session.winRate ?? session.win_rate ?? 0;
  const tradeCount   = session.tradesCount ?? session.trades_count ?? 0;
  const isPrivate    = session.isPrivate ?? session.is_private ?? true;
  const assetType    = session.assetType ?? session.asset_type ?? "forex";
  const symbol       = session.symbol ?? session.asset ?? "";
  const startingBal  = session.startingBalance ?? session.starting_balance ?? 10000;
  const currentBal   = session.currentBalance ?? session.current_balance ?? startingBal;

  // Date progress bar (start → today)
  const startD  = session.startDate ?? session.start_date;
  const createdD = session.createdAt ?? session.created_at;
  const progressPct = tradeCount > 0 ? Math.min(100, (tradeCount / 50) * 100) : 0; // rough proxy

  return (
    <Card
      className="group relative rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-primary/30 cursor-pointer"
      onClick={() => onOpen?.()}
    >
      {/* Delete button */}
      <button
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 focus:opacity-100"
        onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
        aria-label="Delete session"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {/* Name + status */}
      <div className="flex items-start justify-between gap-2 pr-6">
        <p className="text-[15px] font-bold leading-tight line-clamp-1">{session.name}</p>
        <StatusBadge status={session.status} />
      </div>

      {/* Badges row */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ASSET_TYPE_COLOR[assetType] ?? "bg-muted text-muted-foreground"}`}>
          {symbol}
        </span>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">
          {session.timeframe ?? "—"}
        </span>
        {isPrivate && (
          <span className="flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            <Lock className="h-2.5 w-2.5" /> Private
          </span>
        )}
      </div>

      {/* Balance row */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <div>
          <p className="text-muted-foreground">Balance</p>
          <p className="font-semibold tabular-nums">
            ${currentBal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground">P&L</p>
          <p className={`font-bold tabular-nums ${pnlPositive ? "text-emerald-500" : "text-red-500"}`}>
            {pnlPositive ? "+" : ""}${pnl.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Progress bar (candle progress proxy) */}
      <div className="mt-2.5">
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary/60 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>{startD ? format(new Date(startD), "MMM d yyyy") : "—"}</span>
          <span>Today</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        <span>{tradeCount} trades</span>
        <span className={winRate >= 50 ? "text-emerald-500" : "text-red-400"}>
          {winRate.toFixed(1)}% win
        </span>
        <span className="ml-auto text-[10px]">
          {createdD ? format(new Date(createdD), "MMM d") : ""}
        </span>
      </div>

      {/* Open button */}
      <div className="mt-3">
        <Button
          size="sm"
          className="w-full h-8 gap-1.5 rounded-lg text-xs"
          onClick={(e) => { e.stopPropagation(); onOpen?.(); }}
        >
          <Play className="h-3 w-3" />
          Open Room
        </Button>
      </div>
    </Card>
  );
}
