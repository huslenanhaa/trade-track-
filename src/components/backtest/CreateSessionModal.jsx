import { useState } from "react";
import { FlaskConical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SYMBOL_GROUPS } from "@/lib/backtestSymbols";

// ---------------------------------------------------------------------------
// CreateSessionModal
// Full-featured session creation modal with prop firm mode toggle.
// ---------------------------------------------------------------------------

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1H", "4H", "1D", "1W"];

const ASSET_TYPE_OPTIONS = [
  { value: "forex",     label: "Forex" },
  { value: "crypto",    label: "Crypto" },
  { value: "indices",   label: "Indices" },
  { value: "commodity", label: "Commodity" },
];

const EMPTY_FORM = {
  name:            "",
  symbol:          "EURUSD",
  timeframe:       "15m",
  assetType:       "forex",
  startDate:       "",
  startingBalance: "10000",
  riskPercent:     "1",
  isPrivate:       true,
  propFirmMode:    false,
  propDailyDD:     "5",
  propMaxDD:       "10",
  propTarget:      "10",
};

export function CreateSessionModal({ open, onOpenChange, onSubmit, isLoading = false }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = () => {
    if (!form.name.trim() || !form.startDate) return;

    const payload = {
      name:            form.name.trim(),
      symbol:          form.symbol,
      timeframe:       form.timeframe,
      assetType:       form.assetType,
      startingBalance: parseFloat(form.startingBalance) || 10000,
      startDate:       form.startDate,
      isPrivate:       form.isPrivate,
      propFirmMode:    form.propFirmMode,
      propRules:       form.propFirmMode
        ? {
            dailyDrawdown: parseFloat(form.propDailyDD) || 5,
            maxDrawdown:   parseFloat(form.propMaxDD)   || 10,
            profitTarget:  parseFloat(form.propTarget)  || 10,
          }
        : null,
      notes: JSON.stringify({ riskPercent: parseFloat(form.riskPercent) || 1 }),
    };

    onSubmit?.(payload);
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[520px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            New Backtesting Session
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {/* Session name */}
          <div>
            <Label className="text-xs">Session Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. ICT London Break — EUR/USD"
              className="mt-1"
              autoFocus
            />
          </div>

          {/* Symbol + asset type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Symbol</Label>
              <Select value={form.symbol} onValueChange={(v) => set("symbol", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {SYMBOL_GROUPS.map((group) => (
                    <SelectGroup key={group.group}>
                      <SelectLabel className="text-xs text-muted-foreground">
                        {group.group}
                      </SelectLabel>
                      {group.symbols.map((sym) => (
                        <SelectItem key={sym.id} value={sym.id}>
                          {sym.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Asset Type</Label>
              <Select value={form.assetType} onValueChange={(v) => set("assetType", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Timeframe pills */}
          <div>
            <Label className="text-xs">Timeframe</Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => set("timeframe", tf)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    form.timeframe === tf
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Start date */}
          <div>
            <Label className="text-xs">Start Date *</Label>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Chart starts here — future candles are hidden until you advance.
            </p>
          </div>

          {/* Balance + risk */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Starting Balance ($)</Label>
              <Input
                type="number"
                value={form.startingBalance}
                onChange={(e) => set("startingBalance", e.target.value)}
                placeholder="10000"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Risk % per Trade</Label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                value={form.riskPercent}
                onChange={(e) => set("riskPercent", e.target.value)}
                placeholder="1"
                className="mt-1"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPrivate}
                onChange={(e) => set("isPrivate", e.target.checked)}
                className="h-4 w-4 rounded accent-primary"
              />
              <span className="text-xs">Private session</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.propFirmMode}
                onChange={(e) => set("propFirmMode", e.target.checked)}
                className="h-4 w-4 rounded accent-primary"
              />
              <span className="text-xs">Prop Firm Mode</span>
            </label>
          </div>

          {/* Prop firm rules */}
          {form.propFirmMode && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-3">
              <p className="text-xs font-semibold text-amber-500">Prop Firm Rules</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Daily DD %</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.propDailyDD}
                    onChange={(e) => set("propDailyDD", e.target.value)}
                    className="mt-1 text-xs"
                    placeholder="5"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Max DD %</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.propMaxDD}
                    onChange={(e) => set("propMaxDD", e.target.value)}
                    className="mt-1 text-xs"
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Target %</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.propTarget}
                    onChange={(e) => set("propTarget", e.target.value)}
                    className="mt-1 text-xs"
                    placeholder="10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" className="rounded-xl" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              onClick={handleSubmit}
              disabled={!form.name.trim() || !form.startDate || isLoading}
            >
              {isLoading ? "Creating…" : "Create & Start Replay"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
