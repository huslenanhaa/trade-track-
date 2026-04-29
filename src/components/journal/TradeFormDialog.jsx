import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { appClient } from "@/api/appClient";
import { calculatePnL, calculateRiskReward, calculateOutcome } from "../../lib/tradeCalculations";
import { X, Image } from "lucide-react";
import { toast } from "sonner";

const defaultTrade = {
  symbol: "", date: new Date().toISOString().slice(0, 16), direction: "long",
  entry_price: "", stop_loss: "", take_profit: "", exit_price: "",
  lot_size: "", session: "", strategy: "", notes: "", tags: [],
  mistakes: [], screenshots: [], status: "closed", account: ""
};

const getNumericValue = (value) => {
  const numberValue = parseFloat(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const hasCalculationFieldChanged = (trade, tradeData) => {
  if (!trade?.id) {
    return true;
  }

  if ((trade.direction || "long") !== tradeData.direction) {
    return true;
  }

  return ["entry_price", "exit_price", "stop_loss", "lot_size"].some(
    (field) => getNumericValue(trade[field]) !== getNumericValue(tradeData[field]),
  );
};

const getValidOutcome = (outcome, pnl) =>
  ["win", "loss", "breakeven"].includes(outcome) ? outcome : calculateOutcome(pnl);

export default function TradeFormDialog({ open, onOpenChange, trade, onSaved }) {
  const [form, setForm] = useState(defaultTrade);
  const [tagInput, setTagInput] = useState("");
  const [mistakeInput, setMistakeInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (trade) {
      setForm({
        ...defaultTrade,
        ...trade,
        date: trade.date ? new Date(trade.date).toISOString().slice(0, 16) : defaultTrade.date,
        entry_price: trade.entry_price || "",
        stop_loss: trade.stop_loss || "",
        take_profit: trade.take_profit || "",
        exit_price: trade.exit_price || "",
        lot_size: trade.lot_size || "",
        tags: trade.tags || [],
        mistakes: trade.mistakes || [],
        screenshots: trade.screenshots || [],
      });
    } else {
      setForm(defaultTrade);
    }
  }, [trade, open]);

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      updateField("tags", [...form.tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const addMistake = () => {
    if (mistakeInput.trim() && !form.mistakes.includes(mistakeInput.trim())) {
      updateField("mistakes", [...form.mistakes, mistakeInput.trim()]);
      setMistakeInput("");
    }
  };

  const handleUploadScreenshot = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const { file_url } = await appClient.files.uploadImage(file);
      updateField("screenshots", [...(form.screenshots || []), file_url]);
    } catch (error) {
      toast.error(error.message || "Unable to save that screenshot locally.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const tradeData = {
        ...form,
        entry_price: getNumericValue(form.entry_price),
        stop_loss: getNumericValue(form.stop_loss),
        take_profit: getNumericValue(form.take_profit),
        exit_price: getNumericValue(form.exit_price),
        lot_size: getNumericValue(form.lot_size),
        date: new Date(form.date).toISOString(),
      };

      if (hasCalculationFieldChanged(trade, tradeData)) {
        tradeData.pnl = calculatePnL(tradeData);
        tradeData.risk_reward = calculateRiskReward(tradeData);
        tradeData.outcome = calculateOutcome(tradeData.pnl);
      } else {
        tradeData.pnl = getNumericValue(trade.pnl);
        tradeData.risk_reward = getNumericValue(trade.risk_reward);
        tradeData.outcome = getValidOutcome(trade.outcome, tradeData.pnl);
      }

      if (trade?.id) {
        await appClient.entities.Trade.update(trade.id, tradeData);
      } else {
        await appClient.entities.Trade.create(tradeData);
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error.message || "Unable to save this trade.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{trade ? "Edit Trade" : "Add New Trade"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="text-xs">Symbol</Label>
            <Input placeholder="e.g. XAUUSD" value={form.symbol} onChange={(e) => updateField("symbol", e.target.value.toUpperCase())} />
          </div>
          <div>
            <Label className="text-xs">Date & Time</Label>
            <Input type="datetime-local" value={form.date} onChange={(e) => updateField("date", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Direction</Label>
            <Select value={form.direction} onValueChange={(v) => updateField("direction", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="long">Long</SelectItem>
                <SelectItem value="short">Short</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Session</Label>
            <Select value={form.session} onValueChange={(v) => updateField("session", v)}>
              <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="asian">Asian</SelectItem>
                <SelectItem value="london">London</SelectItem>
                <SelectItem value="new_york">New York</SelectItem>
                <SelectItem value="overlap">Overlap</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Entry Price</Label>
            <Input type="number" step="any" value={form.entry_price} onChange={(e) => updateField("entry_price", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Exit Price</Label>
            <Input type="number" step="any" value={form.exit_price} onChange={(e) => updateField("exit_price", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Stop Loss</Label>
            <Input type="number" step="any" value={form.stop_loss} onChange={(e) => updateField("stop_loss", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Take Profit</Label>
            <Input type="number" step="any" value={form.take_profit} onChange={(e) => updateField("take_profit", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Lot Size</Label>
            <Input type="number" step="any" value={form.lot_size} onChange={(e) => updateField("lot_size", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Strategy</Label>
            <Input placeholder="e.g. Breakout" value={form.strategy} onChange={(e) => updateField("strategy", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Account</Label>
            <Input placeholder="e.g. FTMO" value={form.account} onChange={(e) => updateField("account", e.target.value)} />
          </div>
        </div>

        <div className="mt-4">
          <Label className="text-xs">Notes</Label>
          <Textarea placeholder="Trade notes..." value={form.notes} onChange={(e) => updateField("notes", e.target.value)} rows={3} />
        </div>

        {/* Tags */}
        <div className="mt-4">
          <Label className="text-xs">Tags</Label>
          <div className="flex gap-2 mt-1">
            <Input placeholder="Add tag" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} />
            <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.tags.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">
                {tag}
                <button onClick={() => updateField("tags", form.tags.filter((_, j) => j !== i))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Mistakes */}
        <div className="mt-4">
          <Label className="text-xs">Mistakes</Label>
          <div className="flex gap-2 mt-1">
            <Input placeholder="Add mistake" value={mistakeInput} onChange={(e) => setMistakeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMistake())} />
            <Button type="button" variant="outline" size="sm" onClick={addMistake}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.mistakes.map((m, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-destructive/10 text-destructive font-medium">
                {m}
                <button onClick={() => updateField("mistakes", form.mistakes.filter((_, j) => j !== i))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Screenshots */}
        <div className="mt-4">
          <Label className="text-xs">Screenshots</Label>
          <div className="flex gap-2 mt-1 flex-wrap">
            {(form.screenshots || []).map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => updateField("screenshots", form.screenshots.filter((_, j) => j !== i))}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              ) : (
                <Image className="w-5 h-5 text-muted-foreground" />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadScreenshot} />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.symbol}>
            {saving ? "Saving..." : trade ? "Update Trade" : "Add Trade"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
