import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FlaskConical, AlertCircle, Plus } from "lucide-react";
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts";

import { Card }   from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { backtestApi } from "@/api/backtestApi";
import { useAuth }     from "@/lib/AuthContext";
import { SessionCard } from "@/components/backtest/SessionCard";
import { CreateSessionModal } from "@/components/backtest/CreateSessionModal";

// ── Helpers ────────────────────────────────────────────────────────────────

function computeOverallStats(sessions) {
  if (!sessions.length) return { totalPnl: 0, winRate: 0, tradeCount: 0, wins: 0 };

  const allTrades  = sessions.reduce((s, x) => s + (x.tradesCount ?? 0), 0);
  const totalPnl   = sessions.reduce((s, x) => s + ((x.currentBalance ?? 0) - (x.startingBalance ?? 0)), 0);
  const winRateAvg = sessions.filter((s) => s.tradesCount > 0).length > 0
    ? sessions.filter((s) => s.tradesCount > 0).reduce((s, x) => s + (x.winRate ?? 0), 0) /
      sessions.filter((s) => s.tradesCount > 0).length
    : 0;
  const wins = Math.round((winRateAvg / 100) * allTrades);

  return { totalPnl, winRate: winRateAvg, tradeCount: allTrades, wins };
}

// Build a simple bar chart dataset — sessions ordered by creation date, showing P&L
function buildPnlChartData(sessions) {
  return sessions.slice(-10).map((s, i) => ({
    name: s.name?.slice(0, 10) || `S${i + 1}`,
    pnl:  parseFloat(((s.currentBalance ?? 0) - (s.startingBalance ?? 0)).toFixed(2)),
    fill: ((s.currentBalance ?? 0) - (s.startingBalance ?? 0)) >= 0 ? "#22c55e" : "#ef4444",
  }));
}

// ── Win-rate gauge ─────────────────────────────────────────────────────────

function WinGauge({ winRate = 0, wins = 0, total = 0 }) {
  const data = [{ value: winRate, fill: winRate >= 50 ? "#22c55e" : "#ef4444" }];
  return (
    <Card className="flex flex-col items-center justify-center rounded-2xl p-5 gap-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">Overall Win Rate</p>
      <div className="relative h-28 w-28">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="68%" outerRadius="100%" data={data} startAngle={225} endAngle={-45}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "#1e293b" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold tabular-nums ${winRate >= 50 ? "text-emerald-500" : "text-red-500"}`}>
            {winRate.toFixed(0)}%
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{wins}W / {total - wins}L across {total} trades</p>
    </Card>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function Backtesting() {
  const navigate      = useNavigate();
  const queryClient   = useQueryClient();
  const { user, isLoadingAuth } = useAuth();

  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // ── Fetch sessions ─────────────────────────────────────────────────────
  const { data, isLoading: isLoadingSessions, isError, error: sessionsError } = useQuery({
    queryKey: ["backtest-sessions"],
    queryFn:  () => backtestApi.sessions.list(),
    enabled:  !!user?.id,
  });

  const sessions = data?.sessions ?? [];
  const isLoading = isLoadingAuth || (!!user?.id && isLoadingSessions);

  const overall  = computeOverallStats(sessions);
  const chartData = buildPnlChartData(sessions);

  // ── Create session ─────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload) => backtestApi.sessions.create(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["backtest-sessions"] });
      setShowCreate(false);
      toast.success("Session created — opening trading room");
      navigate(`/BacktestingReplay/${res.session.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  // ── Delete session ─────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id) => backtestApi.sessions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backtest-sessions"] });
      setDeletingId(null);
      toast.success("Session deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Backtesting Sessions</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Replay historical candles and sharpen your edge — session by session.
          </p>
        </div>
        <Button className="gap-1.5 rounded-xl" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          New Session
        </Button>
      </div>

      {/* ── Stats overview ─────────────────────────────────────────────── */}
      {!isLoading && sessions.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Win rate gauge */}
          <WinGauge
            winRate={overall.winRate}
            wins={overall.wins}
            total={overall.tradeCount}
          />

          {/* P&L over sessions bar chart */}
          <Card className="col-span-2 rounded-2xl p-5">
            <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              P&L by Session (last 10)
            </p>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={chartData} barSize={18}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v) => [`$${v}`, "P&L"]}
                    contentStyle={{
                      background: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">No trade data yet</p>
            )}
          </Card>
        </div>
      )}

      {/* Quick stat chips */}
      {!isLoading && sessions.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Sessions",   value: sessions.length },
            { label: "Total Trades", value: overall.tradeCount },
            {
              label: "Total P&L",
              value: `${overall.totalPnl >= 0 ? "+" : ""}$${overall.totalPnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
              color: overall.totalPnl >= 0 ? "text-emerald-500" : "text-red-500",
            },
            { label: "Data Source", value: "Twelve Data", color: "text-primary" },
          ].map(({ label, value, color }) => (
            <Card key={label} className="rounded-xl border-border bg-card px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`mt-0.5 text-lg font-bold tabular-nums ${color ?? "text-foreground"}`}>
                {value}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <Card className="flex flex-col items-center justify-center rounded-2xl px-8 py-12 text-center">
          <AlertCircle className="mb-3 h-8 w-8 text-red-400" />
          <p className="font-semibold text-red-400">Could not load sessions</p>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {sessionsError?.message || "Supabase returned an error."}
          </p>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && !isError && sessions.length === 0 && (
        <Card className="flex flex-col items-center justify-center rounded-2xl px-8 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <FlaskConical className="h-8 w-8 text-primary/60" />
          </div>
          <p className="font-semibold">No sessions yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Create a backtesting session to replay historical candles and practice trading.
          </p>
          <Button className="mt-5 gap-1.5 rounded-xl" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Create first session
          </Button>
        </Card>
      )}

      {/* Session cards grid */}
      {!isLoading && !isError && sessions.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onOpen={() => navigate(`/BacktestingReplay/${session.id}`)}
              onDelete={() => setDeletingId(session.id)}
            />
          ))}
        </div>
      )}

      {/* Create session modal */}
      <CreateSessionModal
        open={showCreate}
        onOpenChange={setShowCreate}
        isLoading={createMutation.isPending}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />

      {/* Delete confirm modal */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Delete Session
            </DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-sm text-muted-foreground">
            This will permanently delete the session and all its trade history.
            This cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deletingId)}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
