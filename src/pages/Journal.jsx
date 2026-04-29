import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import TradeFormDialog from "../components/journal/TradeFormDialog";
import { Link } from "react-router-dom";

export default function Journal() {
  const [showForm, setShowForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [sortField, setSortField] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const queryClient = useQueryClient();

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["trades"],
    queryFn: () => appClient.entities.Trade.list("-date", 1000),
  });

  // Check URL for add param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("add") === "true") {
      setShowForm(true);
      window.history.replaceState({}, "", "/Journal");
    }
  }, []);

  const handleDelete = async (id) => {
    await appClient.entities.Trade.delete(id);
    queryClient.invalidateQueries({ queryKey: ["trades"] });
  };

  const filtered = trades.filter(t => {
    if (search && !t.symbol?.toLowerCase().includes(search.toLowerCase()) &&
      !t.strategy?.toLowerCase().includes(search.toLowerCase()) &&
      !t.notes?.toLowerCase().includes(search.toLowerCase())) return false;
    if (directionFilter !== "all" && t.direction !== directionFilter) return false;
    if (outcomeFilter !== "all" && t.outcome !== outcomeFilter) return false;
    if (sessionFilter !== "all" && t.session !== sessionFilter) return false;
    return true;
  }).sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (sortField === "date") return sortDir === "desc" ? new Date(bVal) - new Date(aVal) : new Date(aVal) - new Date(bVal);
    if (typeof aVal === "number") return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trade Journal</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} trades</p>
        </div>
        <Button onClick={() => { setEditingTrade(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />Add Trade
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search symbol, strategy, notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={directionFilter} onValueChange={setDirectionFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Direction" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="long">Long</SelectItem>
              <SelectItem value="short">Short</SelectItem>
            </SelectContent>
          </Select>
          <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Outcome" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="win">Win</SelectItem>
              <SelectItem value="loss">Loss</SelectItem>
              <SelectItem value="breakeven">Breakeven</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sessionFilter} onValueChange={setSessionFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Session" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="asian">Asian</SelectItem>
              <SelectItem value="london">London</SelectItem>
              <SelectItem value="new_york">New York</SelectItem>
              <SelectItem value="overlap">Overlap</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Trades Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  {[
                    { key: "date", label: "Date" },
                    { key: "symbol", label: "Symbol" },
                    { key: "direction", label: "Dir" },
                    { key: "entry_price", label: "Entry" },
                    { key: "exit_price", label: "Exit" },
                    { key: "lot_size", label: "Lots" },
                    { key: "pnl", label: "P&L" },
                    { key: "risk_reward", label: "RR" },
                    { key: "session", label: "Session" },
                  ].map(col => (
                    <th key={col.key}
                      className="text-left text-xs font-medium text-muted-foreground px-4 py-3 cursor-pointer hover:text-foreground transition"
                      onClick={() => { setSortField(col.key); setSortDir(d => d === "asc" ? "desc" : "asc"); }}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {sortField === col.key && <ArrowUpDown className="w-3 h-3" />}
                      </span>
                    </th>
                  ))}
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((trade) => (
                  <tr key={trade.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm">{format(new Date(trade.date), "MMM dd, yyyy")}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{trade.symbol}</td>
                    <td className="px-4 py-3">
                      <Badge variant={trade.direction === "long" ? "default" : "secondary"} className="text-xs capitalize">{trade.direction}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{trade.entry_price}</td>
                    <td className="px-4 py-3 text-sm">{trade.exit_price || "—"}</td>
                    <td className="px-4 py-3 text-sm">{trade.lot_size || "—"}</td>
                    <td className={`px-4 py-3 text-sm font-semibold ${(trade.pnl || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {(trade.pnl || 0) >= 0 ? "+" : ""}${(trade.pnl || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">{trade.risk_reward || "—"}</td>
                    <td className="px-4 py-3 text-sm capitalize">{trade.session?.replace("_", " ") || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/TradeDetail?id=${trade.id}`}><Eye className="w-4 h-4 mr-2" />View</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setEditingTrade(trade); setShowForm(true); }}>
                            <Pencil className="w-4 h-4 mr-2" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(trade.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      {search || directionFilter !== "all" || outcomeFilter !== "all"
                        ? "No trades match your filters."
                        : "No trades yet. Click \"Add Trade\" to get started."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <TradeFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        trade={editingTrade}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["trades"] })}
      />
    </div>
  );
}
