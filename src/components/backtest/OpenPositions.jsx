import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// OpenPositions
// Live list of open trades with unrealised P&L based on the current candle.
// ---------------------------------------------------------------------------

function unrealisedPnl(trade, currentPrice) {
  if (!currentPrice) return 0;
  const diff =
    trade.direction === "long"
      ? currentPrice - trade.entryPrice
      : trade.entryPrice - currentPrice;
  return Number((diff * trade.lotSize).toFixed(2));
}

export function OpenPositions({ openTrades = [], currentCandle, onClose }) {
  const currentPrice = currentCandle?.close ?? null;

  if (openTrades.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        No open positions
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {openTrades.map((trade) => {
        const upnl   = unrealisedPnl(trade, currentPrice);
        const isLong = trade.direction === "long";

        return (
          <div
            key={trade.id}
            className="rounded-xl border border-border bg-card p-3 text-xs"
          >
            {/* Header row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isLong
                      ? "bg-emerald-500/15 text-emerald-500"
                      : "bg-red-500/15 text-red-500"
                  }`}
                >
                  {isLong ? "LONG" : "SHORT"}
                </span>
                <span className="font-semibold">{trade.symbol}</span>
                <span className="text-muted-foreground">× {trade.lotSize}</span>
              </div>

              {/* Unrealised P&L */}
              <span
                className={`tabular-nums font-bold ${
                  upnl >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {upnl >= 0 ? "+" : ""}${upnl.toFixed(2)}
              </span>
            </div>

            {/* Entry / SL / TP row */}
            <div className="mt-1.5 flex items-center gap-3 text-muted-foreground">
              <span>@ <span className="font-mono text-foreground">{trade.entryPrice}</span></span>
              {trade.sl ? (
                <span className="text-red-400">SL {trade.sl}</span>
              ) : null}
              {trade.tp ? (
                <span className="text-emerald-400">TP {trade.tp}</span>
              ) : null}
            </div>

            {/* Close button */}
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="h-6 gap-1 rounded-lg px-2 text-[10px] hover:border-red-500/50 hover:text-red-500"
                onClick={() => onClose?.(trade, currentPrice ?? trade.entryPrice)}
              >
                <X className="h-3 w-3" />
                Close @ market
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
