import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";

// ---------------------------------------------------------------------------
// TradePanel
// Buy / Sell entry form: size, entry price, SL, TP
// ---------------------------------------------------------------------------

export function TradePanel({
  currentCandle,
  symbol = "",
  onOpenTrade,
  isSaving = false,
  disabled = false,
}) {
  const currentPrice = currentCandle?.close ?? "";

  const [direction,   setDirection]   = useState("long");
  const [entryPrice,  setEntryPrice]  = useState("");
  const [stopLoss,    setStopLoss]    = useState("");
  const [takeProfit,  setTakeProfit]  = useState("");
  const [lotSize,     setLotSize]     = useState("1");
  const [setupTag,    setSetupTag]    = useState("");
  const [notes,       setNotes]       = useState("");

  // Auto-fill entry price from current candle when it changes
  const [lastCandleTime, setLastCandleTime] = useState(null);
  if (currentCandle?.time !== lastCandleTime) {
    setLastCandleTime(currentCandle?.time ?? null);
    if (currentCandle && !entryPrice) {
      setEntryPrice(String(currentCandle.close));
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!onOpenTrade) return;

    const entry = parseFloat(entryPrice);
    const sl    = parseFloat(stopLoss)   || null;
    const tp    = parseFloat(takeProfit) || null;
    const size  = parseFloat(lotSize)    || 1;

    if (!isFinite(entry) || size <= 0) return;

    await onOpenTrade({
      direction,
      entryPrice: entry,
      sl,
      tp,
      lotSize: size,
      entryCandle: currentCandle,
      setupTag,
      notes,
    });

    // Reset form (keep direction + price auto-fill)
    setStopLoss("");
    setTakeProfit("");
    setSetupTag("");
    setNotes("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Direction buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setDirection("long")}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors ${
            direction === "long"
              ? "bg-emerald-500 text-white"
              : "bg-muted text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500"
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Buy Long
        </button>
        <button
          type="button"
          onClick={() => setDirection("short")}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors ${
            direction === "short"
              ? "bg-red-500 text-white"
              : "bg-muted text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
          }`}
        >
          <TrendingDown className="h-3.5 w-3.5" />
          Sell Short
        </button>
      </div>

      {/* Entry price */}
      <div>
        <Label className="text-xs text-muted-foreground">Entry Price</Label>
        <Input
          type="number"
          step="any"
          value={entryPrice}
          onChange={(e) => setEntryPrice(e.target.value)}
          placeholder={String(currentPrice)}
          className="mt-1 font-mono text-sm"
          required
        />
      </div>

      {/* SL / TP row */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">Stop Loss</Label>
          <Input
            type="number"
            step="any"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder="0.00"
            className="mt-1 font-mono text-sm border-red-500/30 focus-visible:ring-red-500/30"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Take Profit</Label>
          <Input
            type="number"
            step="any"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            placeholder="0.00"
            className="mt-1 font-mono text-sm border-emerald-500/30 focus-visible:ring-emerald-500/30"
          />
        </div>
      </div>

      {/* Lot size */}
      <div>
        <Label className="text-xs text-muted-foreground">Position Size (lots)</Label>
        <Input
          type="number"
          step="any"
          min="0.01"
          value={lotSize}
          onChange={(e) => setLotSize(e.target.value)}
          placeholder="1"
          className="mt-1 font-mono text-sm"
        />
      </div>

      {/* Setup tag */}
      <div>
        <Label className="text-xs text-muted-foreground">Setup Tag (optional)</Label>
        <Input
          value={setupTag}
          onChange={(e) => setSetupTag(e.target.value)}
          placeholder="e.g. BOS, FVG, OB"
          className="mt-1 text-sm"
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={disabled || isSaving || !entryPrice}
        className={`w-full rounded-lg font-semibold ${
          direction === "long"
            ? "bg-emerald-500 hover:bg-emerald-600"
            : "bg-red-500 hover:bg-red-600"
        }`}
      >
        {isSaving
          ? "Opening…"
          : direction === "long"
            ? "▲ Open Long"
            : "▼ Open Short"}
      </Button>
    </form>
  );
}
