import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Pencil, Trash2, CheckCircle2, XCircle, Tag,
  ImagePlus, X, ZoomIn, ChevronLeft, ChevronRight, Upload
} from "lucide-react";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import TradeFormDialog from "../components/journal/TradeFormDialog";
import { toast } from "sonner";

const CHECKLIST = [
  "Followed my trading plan",
  "Correct session entry",
  "News risk respected",
  "Proper stop placement",
  "No emotional bias",
  "Confirmed entry signal",
];

export default function TradeDetail() {
  const params = new URLSearchParams(window.location.search);
  const tradeId = params.get("id");
  const [editing, setEditing] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: trades = [] } = useQuery({
    queryKey: ["trades"],
    queryFn: () => appClient.entities.Trade.list("-date", 2000),
  });

  const trade = trades.find(t => t.id === tradeId);
  const screenshots = trade?.screenshots || [];

  const handleDelete = async () => {
    if (!window.confirm("Delete this trade?")) return;
    await appClient.entities.Trade.delete(tradeId);
    queryClient.invalidateQueries({ queryKey: ["trades"] });
    toast.success("Trade deleted");
    navigate("/Journal");
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await appClient.files.uploadImage(file);
      const updated = [...screenshots, file_url];
      await appClient.entities.Trade.update(tradeId, { ...trade, screenshots: updated });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      setActiveScreenshot(updated.length - 1);
      toast.success("Screenshot added");
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveScreenshot = async (index) => {
    const updated = screenshots.filter((_, i) => i !== index);
    await appClient.entities.Trade.update(tradeId, { ...trade, screenshots: updated });
    queryClient.invalidateQueries({ queryKey: ["trades"] });
    setActiveScreenshot(Math.max(0, index - 1));
    toast.success("Screenshot removed");
  };

  if (!trade) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-muted-foreground">Trade not found</p>
      <Link to="/Journal"><Button variant="outline">Back to Journal</Button></Link>
    </div>
  );

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/Journal">
            <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{trade.symbol}</h1>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${trade.direction === "long" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {trade.direction === "long" ? "Long ↑" : "Short ↓"}
              </span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${trade.outcome === "win" ? "bg-green-50 text-green-700 border-green-200" : trade.outcome === "loss" ? "bg-red-50 text-red-700 border-red-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                {trade.outcome || "Open"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {format(new Date(trade.date), "EEEE, MMMM dd yyyy · HH:mm")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => setEditing(true)}>
            <Pencil className="w-3.5 h-3.5" />Edit
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={handleDelete}>
            <Trash2 className="w-3.5 h-3.5" />Delete
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Chart / Screenshot area */}
          <Card className="rounded-2xl overflow-hidden">
            {screenshots.length > 0 ? (
              <div>
                {/* Main image */}
                <div className="relative bg-slate-950 h-80 group">
                  <img
                    src={screenshots[activeScreenshot]}
                    alt={`Chart ${activeScreenshot + 1}`}
                    className="w-full h-full object-contain"
                  />
                  {/* Overlay controls */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-between px-3 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => setActiveScreenshot(i => Math.max(0, i - 1))}
                      disabled={activeScreenshot === 0}
                      className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/80 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setLightbox(true)}
                      className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveScreenshot(i => Math.min(screenshots.length - 1, i + 1))}
                      disabled={activeScreenshot === screenshots.length - 1}
                      className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/80 transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Counter */}
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    {activeScreenshot + 1} / {screenshots.length}
                  </div>
                </div>
                {/* Thumbnails */}
                <div className="flex gap-2 p-3 bg-slate-900/50 overflow-x-auto">
                  {screenshots.map((url, i) => (
                    <div key={i} className="relative shrink-0 group/thumb">
                      <button
                        onClick={() => setActiveScreenshot(i)}
                        className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition ${activeScreenshot === i ? "border-primary" : "border-transparent hover:border-white/30"}`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                      <button
                        onClick={() => handleRemoveScreenshot(i)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover/thumb:opacity-100 transition"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  {/* Add more */}
                  <label className="shrink-0 w-16 h-12 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-primary/60 transition">
                    {uploading
                      ? <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      : <ImagePlus className="w-4 h-4 text-white/40" />}
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                  </label>
                </div>
              </div>
            ) : (
              /* Empty state — upload zone */
              <div className="h-72 bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white/30" />
                </div>
                <div className="text-center">
                  <p className="text-white/60 text-sm font-medium">No chart screenshots yet</p>
                  <p className="text-white/30 text-xs mt-1">Take a screenshot from TradingView or MT4/MT5 and upload it here</p>
                </div>
                <label className="cursor-pointer">
                  <div className="px-4 py-2 rounded-xl bg-primary/20 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/30 transition flex items-center gap-1.5">
                    {uploading
                      ? <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      : <ImagePlus className="w-3.5 h-3.5" />}
                    Upload Screenshot
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </label>
              </div>
            )}
          </Card>

          {/* Execution notes */}
          <Card className="p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-semibold">Execution Notes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-muted/40">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Why I entered</p>
                <p className="text-sm">{trade.notes || "No entry reasoning logged."}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Strategy</p>
                <p className="text-sm">{trade.strategy || "—"}</p>
              </div>
            </div>
            {(trade.mistakes || []).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Mistakes noted</p>
                <div className="flex flex-wrap gap-1.5">
                  {trade.mistakes.map((m, i) => (
                    <span key={i} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full">{m}</span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Trade stats */}
          <Card className="p-5 rounded-2xl">
            <h3 className="text-sm font-semibold mb-3">Trade Statistics</h3>
            <div className="space-y-2.5">
              {[
                { label: "Entry Price", val: trade.entry_price },
                { label: "Exit Price", val: trade.exit_price || "—" },
                { label: "Stop Loss", val: trade.stop_loss || "—" },
                { label: "Take Profit", val: trade.take_profit || "—" },
                { label: "Position Size", val: trade.lot_size || "—" },
                { label: "Risk:Reward", val: trade.risk_reward || "—" },
                { label: "Session", val: trade.session?.replace("_", " ") || "—" },
                { label: "Account", val: trade.account || "—" },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-xs text-muted-foreground">{r.label}</span>
                  <span className="text-xs font-semibold capitalize">{r.val}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">Net P&L</span>
                <span className={`text-base font-bold ${(trade.pnl || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {(trade.pnl || 0) >= 0 ? "+" : ""}${(trade.pnl || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </Card>

          {/* Checklist */}
          <Card className="p-5 rounded-2xl">
            <h3 className="text-sm font-semibold mb-3">Pre-Trade Checklist</h3>
            <div className="space-y-2">
              {CHECKLIST.map((item, i) => {
                const checked = i < 4;
                return (
                  <div key={i} className="flex items-center gap-2.5 text-xs">
                    {checked
                      ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      : <XCircle className="w-4 h-4 text-muted-foreground/30 shrink-0" />}
                    <span className={checked ? "text-foreground" : "text-muted-foreground"}>{item}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Tags */}
          <Card className="p-5 rounded-2xl">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" />Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(trade.tags || []).length > 0
                ? trade.tags.map((t, i) => (
                  <span key={i} className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-0.5 rounded-full">{t}</span>
                ))
                : <p className="text-xs text-muted-foreground">No tags added</p>}
            </div>
          </Card>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && screenshots.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition">
            <X className="w-5 h-5" />
          </button>
          {screenshots.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveScreenshot(i => Math.max(0, i - 1)); }}
                disabled={activeScreenshot === 0}
                className="absolute left-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/20 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveScreenshot(i => Math.min(screenshots.length - 1, i + 1)); }}
                disabled={activeScreenshot === screenshots.length - 1}
                className="absolute right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/20 transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          <img
            src={screenshots[activeScreenshot]}
            alt="Chart"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
          <div className="absolute bottom-4 text-white/50 text-sm">
            {activeScreenshot + 1} / {screenshots.length} — click outside to close
          </div>
        </div>
      )}

      <TradeFormDialog
        open={editing}
        onOpenChange={setEditing}
        trade={trade}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["trades"] })}
      />
    </div>
  );
}
