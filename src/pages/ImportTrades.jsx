import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  Minus,
  PenLine,
  RefreshCw,
  Settings2,
  Trash2,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { appClient } from "@/api/appClient";
import MT5ConnectFlow from "@/components/mt5/MT5ConnectFlow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { exportTradesToCsv, parseMt5HtmlReport, parseTradeCsv } from "@/lib/tradeCsv";

function OutcomeBadge({ outcome }) {
  if (outcome === "win") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
        <TrendingUp className="h-3 w-3" />
        Win
      </span>
    );
  }

  if (outcome === "loss") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
        <TrendingDown className="h-3 w-3" />
        Loss
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
      <Minus className="h-3 w-3" />
      BE
    </span>
  );
}

const SUPPORTED_FORMATS = [
  { name: "MT4 / MT5", cols: "Open Time, Type, Item, Size, Price, S/L, T/P, Close Price, Profit" },
  { name: "TradingView", cols: "Date, Symbol, Side, Qty, Entry Price, Exit Price, P&L" },
  { name: "Generic CSV", cols: "date, symbol, direction, entry_price, exit_price, pnl, outcome" },
  { name: "Custom", cols: "Any column names - auto-detected" },
];

function CsvTab({ onResult }) {
  const queryClient = useQueryClient();
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);

  const parseForPreview = async (file) => {
    try {
      const text = await file.text();
      const ext = file.name.toLowerCase().split(".").pop();
      const parsed = (ext === "htm" || ext === "html") ? parseMt5HtmlReport(text) : parseTradeCsv(text);
      if (parsed.trades.length === 0) {
        toast.error("No valid trades found in this file.");
        return;
      }

      setPreview({
        fileName: file.name,
        skipped: parsed.skippedRows,
        trades: parsed.trades,
      });
    } catch (error) {
      toast.error(error.message || "Failed to parse file.");
    }
  };

  const confirmImport = async () => {
    if (!preview) return;

    setImporting(true);
    try {
      const response = await appClient.entities.Trade.bulkCreate(preview.trades);
      queryClient.invalidateQueries({ queryKey: ["trades"] });

      const importedTrades = response?.trades ?? [];
      const imported = response?.imported ?? importedTrades.length;
      const failed = response?.failed ?? 0;
      const wins = importedTrades.filter((trade) => trade.outcome === "win").length;
      const losses = importedTrades.filter((trade) => trade.outcome === "loss").length;
      const be = importedTrades.filter((trade) => trade.outcome === "breakeven").length;
      const totalPnl = importedTrades.reduce((sum, trade) => sum + (parseFloat(trade.pnl) || 0), 0);

      onResult({
        be,
        errors: response?.errors ?? [],
        failed,
        skipped: preview.skipped,
        total: imported,
        totalPnl,
        wins,
        losses,
      });

      setPreview(null);

      if (imported === 0 && failed > 0) {
        toast.error(`Import failed - ${failed} rows rejected.`);
      } else if (failed > 0) {
        toast.warning(`Imported ${imported} trades, ${failed} rejected.`);
      } else {
        toast.success(`Imported ${imported} trades.`);
      }
    } catch (error) {
      toast.error(error.message || "Import failed.");
    } finally {
      setImporting(false);
    }
  };

  const previewStats = preview
    ? {
        losses: preview.trades.filter((trade) => trade.outcome === "loss").length,
        totalPnl: preview.trades.reduce((sum, trade) => sum + (parseFloat(trade.pnl) || 0), 0),
        wins: preview.trades.filter((trade) => trade.outcome === "win").length,
      }
    : null;

  if (preview) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button className="h-8 w-8 rounded-xl" onClick={() => setPreview(null)} size="icon" variant="ghost">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-sm font-bold">{preview.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {preview.trades.length} trades found
                {preview.skipped > 0 ? ` - ${preview.skipped} skipped` : ""}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="rounded-xl" onClick={() => setPreview(null)} size="sm" variant="outline">
              Cancel
            </Button>
            <Button className="gap-1.5 rounded-xl" disabled={importing} onClick={confirmImport} size="sm">
              {importing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Import {preview.trades.length} Trades
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            { label: "Total", value: preview.trades.length, cls: "" },
            { label: "Wins", value: previewStats.wins, cls: "text-green-600" },
            { label: "Losses", value: previewStats.losses, cls: "text-red-600" },
            {
              label: "P&L",
              value: `${previewStats.totalPnl >= 0 ? "+" : ""}$${previewStats.totalPnl.toFixed(2)}`,
              cls: previewStats.totalPnl >= 0 ? "text-green-600" : "text-red-600",
            },
          ].map((stat) => (
            <Card className="rounded-xl p-3 text-center" key={stat.label}>
              <p className="mb-0.5 text-[10px] text-muted-foreground">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.cls}`}>{stat.value}</p>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden rounded-xl">
          <div className="max-h-72 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 border-b border-border bg-muted/50">
                <tr>
                  {["Date", "Symbol", "Dir", "Entry", "Exit", "Lot", "P&L", "Outcome"].map((header) => (
                    <th
                      className="whitespace-nowrap px-3 py-2.5 text-left font-semibold text-muted-foreground"
                      key={header}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.trades.map((trade, index) => {
                  const pnl = parseFloat(trade.pnl) || 0;

                  return (
                    <tr
                      className={`border-b border-border/40 ${index % 2 ? "bg-muted/20" : ""}`}
                      key={`${trade.symbol}-${trade.date}-${index}`}
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                        {trade.date ? format(new Date(trade.date), "MMM dd, yy") : "-"}
                      </td>
                      <td className="px-3 py-2 font-bold">{trade.symbol}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                            trade.direction === "long"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {trade.direction === "long" ? "L" : "S"}
                        </span>
                      </td>
                      <td className="px-3 py-2">{trade.entry_price || "-"}</td>
                      <td className="px-3 py-2">{trade.exit_price || "-"}</td>
                      <td className="px-3 py-2">{trade.lot_size || "-"}</td>
                      <td
                        className={`px-3 py-2 font-bold ${
                          pnl > 0 ? "text-green-600" : pnl < 0 ? "text-red-600" : "text-muted-foreground"
                        }`}
                      >
                        {trade.pnl !== "" && trade.pnl !== undefined ? `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}` : "-"}
                      </td>
                      <td className="px-3 py-2">
                        <OutcomeBadge outcome={trade.outcome} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/20"
        }`}
        onClick={() => document.getElementById("csv-import-file")?.click()}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files[0];
          if (file && /\.(csv|htm|html)$/i.test(file.name)) {
            parseForPreview(file);
          } else {
            toast.error("Please drop a .csv or .htm file.");
          }
        }}
      >
        <Upload className={`mx-auto mb-3 h-9 w-9 ${dragging ? "text-primary" : "text-muted-foreground"}`} />
        <p className="text-sm font-semibold">{dragging ? "Drop to preview" : "Drop CSV or MT5 report here"}</p>
        <p className="mt-1 text-xs text-muted-foreground">Supports .csv and .htm — preview shown before importing</p>
        <input
          accept=".csv,.htm,.html"
          className="hidden"
          id="csv-import-file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) parseForPreview(file);
            event.target.value = "";
          }}
          type="file"
        />
      </div>

      <Button className="w-full gap-2 rounded-xl" onClick={() => document.getElementById("csv-import-file")?.click()}>
        <Upload className="h-4 w-4" />
        Select CSV File
      </Button>

      <div className="space-y-2 rounded-xl bg-muted/40 p-4">
        <p className="mb-2 text-xs font-semibold">Supported platforms</p>
        {SUPPORTED_FORMATS.map((formatInfo) => (
          <div className="flex gap-2" key={formatInfo.name}>
            <span className="w-28 shrink-0 text-xs font-semibold text-primary">{formatInfo.name}</span>
            <span className="font-mono text-xs text-muted-foreground">{formatInfo.cols}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Broker Guide Tab ──────────────────────────────────────────────────────────

const BROKER_GUIDES = {
  ftmo: {
    name: "FTMO",
    color: "bg-orange-50 border-orange-200",
    fileNote: "Download from FTMO dashboard — no desktop app needed",
    steps: [
      "On any browser (phone or computer), go to app.ftmo.com and log in.",
      'Click "My Accounts" and select your account.',
      'Go to the "Trading" tab → "History" section.',
      'Click "Export" or the download icon to download your trade history as CSV.',
      "Drop that file into the zone below.",
    ],
  },
  mt5: {
    name: "MetaTrader 5",
    color: "bg-blue-50 border-blue-200",
    fileNote: "Export as CSV for best results",
    steps: [
      "Open MT5 and log in to your account.",
      'Click the "History" tab at the bottom panel (next to Trade and Exposure).',
      "Right-click anywhere in the History list.",
      'Click "Save as Report" → choose "CSV Format (*.csv)".',
      "Save the file, then drop it into the zone below.",
    ],
  },
  mt4: {
    name: "MetaTrader 4",
    color: "bg-indigo-50 border-indigo-200",
    fileNote: "Export as CSV",
    steps: [
      "Open MT4 and go to the Account History tab (bottom panel).",
      "Right-click the history list.",
      'Click "Save as Report" → "CSV Report".',
      "Drop the saved file into the zone below.",
    ],
  },
  tradingview: {
    name: "TradingView",
    color: "bg-teal-50 border-teal-200",
    fileNote: "Download Trade History CSV",
    steps: [
      "Open TradingView and go to Paper Trading or your connected broker.",
      'Click the "Trade" tab → "History" sub-tab in the bottom panel.',
      "Click the download icon at the top-right of the History panel.",
      "Drop the downloaded CSV file below.",
    ],
  },
  ctrader: {
    name: "cTrader",
    color: "bg-cyan-50 border-cyan-200",
    fileNote: "Export as CSV",
    steps: [
      "Open cTrader and click the History tab in the bottom panel.",
      "Set your date range using the date pickers.",
      "Click the export icon at the top-right of the History panel.",
      'Choose "CSV" format, save, then drop it below.',
    ],
  },
  binance: {
    name: "Binance",
    color: "bg-yellow-50 border-yellow-200",
    fileNote: "Trade History CSV (sent via email)",
    steps: [
      "Log in to Binance → Orders → Trade History (Spot or Futures).",
      "Set your date range (max 3 months per export).",
      'Click "Export" → "Export Trade History".',
      "Download the CSV from the email Binance sends (usually within a minute).",
      "Drop that file below.",
    ],
  },
  other: {
    name: "Other / Generic",
    color: "bg-gray-50 border-gray-200",
    fileNote: "Any CSV with date, symbol, and direction columns",
    steps: [
      "Export your closed trades as a CSV from your broker or platform.",
      "Make sure the file has at least: a date column, a symbol/pair column, and a buy/sell direction column.",
      "P&L, entry/exit prices, and lot size are imported automatically if present.",
      "Drop the file below — the parser handles most column naming variations.",
    ],
  },
};

const BROKER_LIST = [
  { key: "ftmo", emoji: "🏆" },
  { key: "mt5", emoji: "📊" },
  { key: "mt4", emoji: "📈" },
  { key: "tradingview", emoji: "🔭" },
  { key: "ctrader", emoji: "⚡" },
  { key: "binance", emoji: "🟡" },
  { key: "other", emoji: "📂" },
];

function BrokerGuideTab({ onResult }) {
  const [selected, setSelected] = useState(null);
  const guide = selected ? BROKER_GUIDES[selected] : null;

  if (guide) {
    return (
      <div className="space-y-5">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />Back to broker list
        </button>

        <div className={`rounded-xl border p-4 ${guide.color}`}>
          <p className="text-sm font-bold mb-1">{guide.name} — How to export</p>
          <p className="text-xs text-muted-foreground mb-3">{guide.fileNote}</p>
          <ol className="space-y-2">
            {guide.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-white/70 text-[10px] font-bold flex items-center justify-center border border-black/10">
                  {i + 1}
                </span>
                <p className="text-xs leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Drop your exported file here</p>
          <CsvTab onResult={onResult} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select your broker to see exactly how to export your trades — no software installation needed.
      </p>
      <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3">
        <span className="text-base">📱</span>
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Trade on your phone?</span> Use the{" "}
          <span className="font-semibold text-primary">Add Trade</span> button in the top bar to log each trade after you close it. For bulk history, pick your broker below — most have a web dashboard you can access from any device.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {BROKER_LIST.map(({ key, emoji }) => {
          const g = BROKER_GUIDES[key];
          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all hover:scale-[1.02] hover:shadow-sm ${g.color}`}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-sm font-semibold">{g.name}</span>
              <span className="text-[10px] text-muted-foreground leading-snug">{g.fileNote}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-3">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs text-muted-foreground">
          No plugins or EA installation required. Just export from your broker and drop the file here.
        </p>
      </div>
    </div>
  );
}

export default function ImportTrades() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("guide");
  const [result, setResult] = useState(null);

  const { data: trades = [] } = useQuery({
    queryKey: ["trades"],
    queryFn: () => appClient.entities.Trade.list("-date", 5000),
  });

  const handleExport = () => {
    if (trades.length === 0) {
      toast.error("No trades to export.");
      return;
    }

    const csv = exportTradesToCsv(trades);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trades_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = async () => {
    if (!window.confirm(`Delete all ${trades.length} trades? This cannot be undone.`)) return;

    const { deletedCount } = await appClient.system.clearTradeHistory();
    queryClient.setQueryData(["trades"], []);
    queryClient.invalidateQueries({ queryKey: ["trades"] });
    toast.success(`Deleted ${deletedCount} trades.`);
  };

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Upload className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Import & Sync</h1>
          <p className="text-xs text-muted-foreground">
            Upload a CSV or connect MetaTrader 5 in a guided flow.
          </p>
        </div>
      </div>

      {result && (
        <Card
          className={`rounded-2xl p-4 ${
            result.total === 0
              ? "border-red-200 bg-red-50/70"
              : result.failed > 0
                ? "border-yellow-200 bg-yellow-50/70"
                : "border-green-200 bg-green-50/70"
          }`}
        >
          <div className="flex items-start gap-3">
            {result.total === 0 ? (
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            ) : result.failed > 0 ? (
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            )}

            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-bold ${
                  result.total === 0
                    ? "text-red-900"
                    : result.failed > 0
                      ? "text-yellow-900"
                      : "text-green-900"
                }`}
              >
                {result.total === 0
                  ? `Import failed - 0 trades added (${result.failed} rejected)`
                  : `Imported ${result.total} trades${result.failed > 0 ? ` - ${result.failed} rejected` : ""}`}
              </p>

              {result.total > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-4 text-xs">
                  <span className="font-semibold text-green-700">+ {result.wins} wins</span>
                  <span className="font-semibold text-red-700">- {result.losses} losses</span>
                  <span className={`font-bold ${result.totalPnl >= 0 ? "text-green-700" : "text-red-700"}`}>
                    {result.totalPnl >= 0 ? "+" : ""}${result.totalPnl.toFixed(2)} P&L
                  </span>
                </div>
              )}
            </div>

            <button
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setResult(null)}
              type="button"
            >
              Dismiss
            </button>
          </div>
        </Card>
      )}

      <Card className="rounded-2xl p-1.5">
        <div className="flex gap-1">
          <button
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${tab === "guide" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setTab("guide")}
            type="button"
          >
            <span className="flex items-center justify-center gap-2">
              <BookOpen className="h-4 w-4" />Broker Guide
            </span>
          </button>
          <button
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${tab === "csv" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setTab("csv")}
            type="button"
          >
            <span className="flex items-center justify-center gap-2">
              <FileText className="h-4 w-4" />CSV Import
            </span>
          </button>
          <button
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${tab === "mt5" ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setTab("mt5")}
            type="button"
          >
            <span className="flex items-center justify-center gap-2">
              <Settings2 className="h-4 w-4" />Advanced Sync
            </span>
          </button>
        </div>
      </Card>

      <Card className="rounded-2xl p-5">
        {tab === "guide" && <BrokerGuideTab onResult={setResult} />}
        {tab === "csv" && <CsvTab onResult={setResult} />}
        {tab === "mt5" && <MT5ConnectFlow />}
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="flex items-center justify-between rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-green-50">
              <PenLine className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-semibold">Manual Entry</p>
              <p className="text-[10px] text-muted-foreground">Add trades one by one</p>
            </div>
          </div>
          <a href="/Journal?add=true">
            <Button className="rounded-xl text-xs" size="sm" variant="outline">
              + Add
            </Button>
          </a>
        </Card>

        <Card className="flex items-center justify-between rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <Download className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold">Export CSV</p>
              <p className="text-[10px] text-muted-foreground">{trades.length} trades ready</p>
            </div>
          </div>
          <Button
            className="rounded-xl text-xs"
            disabled={trades.length === 0}
            onClick={handleExport}
            size="sm"
            variant="outline"
          >
            Export
          </Button>
        </Card>

        <Card className="flex items-center justify-between rounded-2xl border-red-200 bg-red-50/40 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100">
              <Trash2 className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-red-900">Clear History</p>
              <p className="text-[10px] text-red-700">Delete all {trades.length} trades</p>
            </div>
          </div>
          <Button
            className="rounded-xl text-xs"
            disabled={trades.length === 0}
            onClick={handleClear}
            size="sm"
            variant="destructive"
          >
            Delete
          </Button>
        </Card>
      </div>
    </div>
  );
}
