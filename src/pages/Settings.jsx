import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { appClient } from "@/api/appClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ArrowUpRight,
  Database,
  Download,
  FileText,
  Loader2,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { exportTradesToCsv, parseTradeCsv } from "@/lib/tradeCsv";
import { LEGAL_POLICY_LINKS } from "@/content/legalPolicies";

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

function MetricTile({ label, value, tone = "default" }) {
  const toneClass = {
    default: "text-foreground",
    positive: "text-green-600",
    negative: "text-red-600",
  }[tone];

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}

const SETTINGS_NAV_SECTIONS = [
  {
    label: "USER",
    icon: User,
    items: ["Profile", "Security", "Subscription"],
  },
  {
    label: "GENERAL",
    icon: Settings2,
    items: [
      "Accounts",
      "PT / SL settings",
      "Commissions & fees",
      "Trade settings",
      "Global settings",
      "Legal & Privacy",
      "Tags management",
      "Import history",
      "Log history",
      "Report subscriptions",
      "Support access",
    ],
  },
];

function SettingsNavigation({ activeItem, onSelect }) {
  return (
    <Card className="h-fit rounded-lg border-border p-3 shadow-sm">
      <nav className="space-y-8">
        {SETTINGS_NAV_SECTIONS.map(({ label, icon: Icon, items }) => (
          <div key={label}>
            <div className="mb-3 flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-[0.22em] text-primary/70">
              <Icon className="h-4 w-4" />
              {label}
            </div>
            <div className="space-y-1 border-l border-border pl-3">
              {items.map((item) => {
                const isActive = item === activeItem;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onSelect(item)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm font-semibold transition ${
                      isActive
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </Card>
  );
}

function LegalPrivacyPanel() {
  return (
    <div className="space-y-5">
      <Card className="rounded-lg border-border p-5 shadow-sm">
        <div className="flex flex-col gap-5">
          <SectionHeader
            icon={ShieldCheck}
            title="Legal & Privacy"
            description="Review the current TradeTrack Pro legal and support pages."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {LEGAL_POLICY_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="group flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/20 p-4 hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{link.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{link.description}</p>
                  </div>
                </div>
                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function EmptySettingsPanel({ title }) {
  return (
    <Card className="rounded-lg border-border p-8 text-center shadow-sm">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        <Settings2 className="h-4 w-4 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        This section is reserved for future account and trading controls.
      </p>
    </Card>
  );
}

export default function Settings() {
  const [profileForm, setProfileForm] = useState({ full_name: "", email: "" });
  const [activeSetting, setActiveSetting] = useState("Legal & Privacy");
  const [savingProfile, setSavingProfile] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);
  const [clearingTrades, setClearingTrades] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => appClient.auth.me(),
  });

  const { data: trades = [] } = useQuery({
    queryKey: ["trades"],
    queryFn: () => appClient.entities.Trade.list("-date", 5000),
  });

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      full_name: user.full_name || "",
      email: user.email || "",
    });
  }, [user]);

  const dataSummary = useMemo(() => {
    const totalPnl = trades.reduce((sum, trade) => sum + (Number(trade.pnl) || 0), 0);
    const closedTrades = trades.filter((trade) => trade.status === "closed" || !trade.status);
    const wins = closedTrades.filter((trade) => trade.outcome === "win").length;
    const winRate = closedTrades.length > 0 ? ((wins / closedTrades.length) * 100).toFixed(1) : "0.0";

    return {
      totalPnl,
      closedTrades: closedTrades.length,
      winRate,
    };
  }, [trades]);

  const profileInitial = (profileForm.full_name || profileForm.email || "T").trim().charAt(0).toUpperCase();
  const formattedPnl = `${dataSummary.totalPnl >= 0 ? "+" : ""}$${dataSummary.totalPnl.toFixed(2)}`;

  const saveProfile = async () => {
    if (!profileForm.full_name.trim()) return;

    try {
      setSavingProfile(true);
      await appClient.auth.updateProfile({
        full_name: profileForm.full_name.trim(),
        email: profileForm.email.trim(),
      });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.message || "Unable to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const exportCSV = () => {
    if (trades.length === 0) {
      toast.error("No trades to export");
      return;
    }

    const csv = exportTradesToCsv(trades);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trades_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Trades exported");
  };

  const importCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportingCsv(true);
      const text = await file.text();
      const { trades: tradeData, importedRows, skippedRows } = parseTradeCsv(text);

      if (tradeData.length === 0) {
        toast.error("No valid trade rows found");
        return;
      }

      const response = await appClient.entities.Trade.bulkCreate(tradeData);
      queryClient.invalidateQueries({ queryKey: ["trades"] });

      const imported = response?.imported ?? importedRows;
      const failed = response?.failed ?? 0;
      const skippedText = skippedRows > 0 ? `, ${skippedRows} skipped while parsing` : "";
      const failedText = failed > 0 ? `, ${failed} rejected` : "";
      toast.success(`Imported ${imported} trades${failedText}${skippedText}`);
    } catch (error) {
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setImportingCsv(false);
      e.target.value = "";
    }
  };

  const clearTradeHistory = async () => {
    if (trades.length === 0) {
      toast.error("There are no trades to delete");
      return;
    }

    const shouldDelete = window.confirm(`Delete all ${trades.length} trades? This cannot be undone.`);
    if (!shouldDelete) return;

    try {
      setClearingTrades(true);
      const { deletedCount } = await appClient.system.clearTradeHistory();
      queryClient.setQueryData(["trades"], []);
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      toast.success(`Deleted ${deletedCount} trade${deletedCount === 1 ? "" : "s"}`);
    } catch (error) {
      toast.error(error.message || "Unable to delete trade history");
    } finally {
      setClearingTrades(false);
    }
  };

  const renderSettingsContent = () => {
    if (activeSetting === "Legal & Privacy") {
      return <LegalPrivacyPanel />;
    }

    if (activeSetting !== "Profile") {
      return <EmptySettingsPanel title={activeSetting} />;
    }

    return (
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-lg border-border p-5 shadow-sm">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between gap-4">
                <SectionHeader icon={User} title="Profile" description="Shown across your journal workspace" />
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white shadow-sm">
                  {profileInitial}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</Label>
                  <Input
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm((current) => ({ ...current, full_name: e.target.value }))}
                    placeholder="Your name"
                    className="h-10 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</Label>
                  <Input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((current) => ({ ...current, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="h-10 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end border-t border-border pt-4">
                <Button onClick={saveProfile} disabled={savingProfile || !profileForm.full_name.trim()} className="rounded-lg">
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Profile
                </Button>
              </div>
            </div>
          </Card>

          <Card className="rounded-lg border-border p-5 shadow-sm">
            <div className="space-y-5">
              <SectionHeader icon={Database} title="Trade Data" description={`${dataSummary.closedTrades} closed trades tracked`} />

              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="outline" onClick={exportCSV} disabled={trades.length === 0} className="h-10 rounded-lg justify-start">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("settings-csv-upload").click()}
                  disabled={importingCsv}
                  className="h-10 rounded-lg justify-start"
                >
                  {importingCsv ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Import CSV
                </Button>
                <input id="settings-csv-upload" type="file" accept=".csv" className="hidden" onChange={importCSV} />
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-xs leading-5 text-muted-foreground">
                    CSV import accepts Trade Track exports, MT4/MT5-style exports, and common broker date/number formats.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="rounded-lg border-red-200 bg-red-50/60 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-950">Delete Trade History</h3>
                <p className="mt-0.5 text-xs text-red-700">{trades.length} stored trade{trades.length === 1 ? "" : "s"} will be removed</p>
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={clearTradeHistory}
              disabled={clearingTrades || trades.length === 0}
              className="rounded-lg"
            >
              {clearingTrades ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete All Trades
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Account, policies, and trade data controls</p>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5 rounded-lg bg-background px-3 py-1.5 text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
          Local workspace
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricTile label="Trades" value={trades.length} />
        <MetricTile label="Win Rate" value={`${dataSummary.winRate}%`} />
        <MetricTile
          label="Net P&L"
          value={formattedPnl}
          tone={dataSummary.totalPnl > 0 ? "positive" : dataSummary.totalPnl < 0 ? "negative" : "default"}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <SettingsNavigation activeItem={activeSetting} onSelect={setActiveSetting} />
        {renderSettingsContent()}
      </div>
    </div>
  );
}
