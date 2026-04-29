import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { appClient } from "@/api/appClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function QuickAddButton() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const [symbol, setSymbol] = useState("");
  const [direction, setDirection] = useState("long");
  const [outcome, setOutcome] = useState("win");
  const [pnl, setPnl] = useState("");
  const [date, setDate] = useState(today);

  const reset = () => {
    setSymbol("");
    setDirection("long");
    setOutcome("win");
    setPnl("");
    setDate(today);
  };

  const handleSave = async () => {
    const sym = symbol.trim().toUpperCase();
    if (!sym) { toast.error("Symbol is required."); return; }

    setSaving(true);
    try {
      await appClient.entities.Trade.create({
        symbol: sym,
        direction,
        outcome,
        pnl: pnl !== "" ? parseFloat(pnl) : 0,
        date: new Date(date + "T12:00:00").toISOString(),
        status: "closed",
        entry_price: "",
        exit_price: "",
        stop_loss: "",
        take_profit: "",
        lot_size: "",
        risk_reward: "",
        session: "",
        strategy: "",
        notes: "",
        tags: [],
        mistakes: [],
      });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      toast.success(`${sym} trade logged!`);
      reset();
      setOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to save trade.");
    } finally {
      setSaving(false);
    }
  };

  const toggleBase = "flex-1 py-2 rounded-lg text-xs font-semibold transition-all border";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Quick Add Trade"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-white shadow-lg shadow-primary/30 transition-all hover:bg-orange-600 hover:scale-105 active:scale-95"
      >
        <Plus className="h-4 w-4" />
        <span className="text-sm font-semibold">Quick Add</span>
      </button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Quick Add Trade</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Symbol</label>
              <input
                autoFocus
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. EURUSD, BTCUSD"
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Direction</label>
              <div className="flex gap-2">
                <button onClick={() => setDirection("long")} className={`${toggleBase} ${direction === "long" ? "border-green-500 bg-green-500 text-white" : "border-border text-muted-foreground hover:border-green-400"}`}>Long (Buy)</button>
                <button onClick={() => setDirection("short")} className={`${toggleBase} ${direction === "short" ? "border-red-500 bg-red-500 text-white" : "border-border text-muted-foreground hover:border-red-400"}`}>Short (Sell)</button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Result</label>
              <div className="flex gap-2">
                {[
                  { val: "win", label: "Win", active: "border-green-500 bg-green-500 text-white", hover: "hover:border-green-400" },
                  { val: "loss", label: "Loss", active: "border-red-500 bg-red-500 text-white", hover: "hover:border-red-400" },
                  { val: "breakeven", label: "BE", active: "border-gray-400 bg-gray-400 text-white", hover: "hover:border-gray-400" },
                ].map(({ val, label, active, hover }) => (
                  <button key={val} onClick={() => setOutcome(val)} className={`${toggleBase} ${outcome === val ? active : `border-border text-muted-foreground ${hover}`}`}>{label}</button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">P&L (optional)</label>
                <input type="number" step="0.01" value={pnl} onChange={(e) => setPnl(e.target.value)} placeholder="e.g. 45.50"
                  className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground">Entry/exit prices and details can be added later via Edit in the Journal.</p>

            <Button onClick={handleSave} disabled={saving} className="w-full gap-2 rounded-xl">
              {saving ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" />Saving...</> : "Log Trade"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
