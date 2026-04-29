import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Ban,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Key,
  Link2,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const ALLOWED_URL = API_URL;
const CONNECTOR_FILE = "TradeTrackConnector.mq5";

function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/20"
      type="button"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function ConnectionBadge({ isActive }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
      {isActive ? "Active" : "Stopped"}
    </span>
  );
}

function getConnectionState(keys, status) {
  if (status?.lastSync) {
    return {
      label: "Connected",
      tone: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
      note: "Trades have started syncing into your journal.",
    };
  }

  if (keys.length > 0) {
    return {
      label: "Ready To Connect",
      tone: "bg-amber-500/15 text-amber-200 border-amber-400/30",
      note: "Your connection code is ready. Finish the MT5 steps below.",
    };
  }

  return {
    label: "Not Connected",
    tone: "bg-white/10 text-white/70 border-white/10",
    note: "Create your first connection code to get started.",
  };
}

function generateEaContent(endpoint) {
  return `//+------------------------------------------------------------------+
//|  TradeTrackConnector.mq5                                         |
//|  MT5 connector for Trade Track Pro                               |
//+------------------------------------------------------------------+
#property copyright "Trade Track Pro"
#property version   "1.00"
#property description "MT5 connector: imports closed trades into your journal."

input string ApiEndpoint    = "${endpoint}";
input string ConnectionCode = "";
input int    SyncInterval   = 60;
input int    MaxRetries     = 3;
input bool   SyncOnStart    = true;

datetime g_lastCheckedTime = 0;
string   g_ticketsFile     = "tt_synced_tickets.txt";

// This connector never opens, closes, or modifies broker orders.
// It only reads closed deal history and sends it to Trade Track Pro.

int OnInit()
{
   if(StringLen(ConnectionCode) == 0) {
      Alert("TradeTrackPro: Connection code is empty. Open Inputs and paste it.");
      return INIT_FAILED;
   }
   Print("TradeTrackPro: initialized. Endpoint=", ApiEndpoint, " Interval=", SyncInterval);
   if(SyncOnStart) DoSync();
   EventSetTimer(SyncInterval);
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason) { EventKillTimer(); }
void OnTimer()
{
   Print("TradeTrackPro: timer triggered.");
   DoSync();
}

void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest &request,
                        const MqlTradeResult &result)
{
   Print("TradeTrackPro: transaction type=", (int)trans.type, " deal=", (long)trans.deal);
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD) {
      ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(trans.deal, DEAL_ENTRY);
      if(entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_INOUT) {
         Print("TradeTrackPro: closed deal detected. Starting sync.");
         Sleep(2000);
         DoSync();
      }
   }
}

void DoSync()
{
   datetime from = (g_lastCheckedTime > 0) ? g_lastCheckedTime - 60 : TimeCurrent() - 90*24*3600;
   datetime to   = TimeCurrent();
   if(!HistorySelect(from, to)) {
      Print("TradeTrackPro: HistorySelect failed. LastError=", GetLastError());
      return;
   }

   string syncedTickets[];
   LoadTickets(syncedTickets);

   string jsonTrades = "";
   int    count      = 0;
   int total = HistoryDealsTotal();

   for(int i = 0; i < total; i++) {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;

      ENUM_DEAL_ENTRY dEntry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);
      if(dEntry != DEAL_ENTRY_OUT && dEntry != DEAL_ENTRY_INOUT) continue;

      string tickStr = IntegerToString((long)ticket);
      if(HasTicket(syncedTickets, tickStr)) continue;

      string symbol    = HistoryDealGetString(ticket, DEAL_SYMBOL);
      ENUM_DEAL_TYPE t = (ENUM_DEAL_TYPE)HistoryDealGetInteger(ticket, DEAL_TYPE);
      string dtype     = (t == DEAL_TYPE_BUY) ? "buy" : "sell";
      double volume    = HistoryDealGetDouble(ticket, DEAL_VOLUME);
      double closeP    = HistoryDealGetDouble(ticket, DEAL_PRICE);
      double sl        = HistoryDealGetDouble(ticket, DEAL_SL);
      double tp        = HistoryDealGetDouble(ticket, DEAL_TP);
      double profit    = HistoryDealGetDouble(ticket, DEAL_PROFIT);
      datetime closeT  = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
      string comment   = HistoryDealGetString(ticket, DEAL_COMMENT);
      long posId       = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
      double   openP   = GetOpenPrice(posId);
      datetime openT   = GetOpenTime(posId);

      string escaped = comment;
      StringReplace(escaped, "\\\"", "'");

      if(count > 0) jsonTrades += ",";
      jsonTrades += StringFormat(
         "{\\\"ticket\\\":%d,\\\"symbol\\\":\\\"%s\\\",\\\"type\\\":\\\"%s\\\","
         "\\\"volume\\\":%.5f,\\\"open_price\\\":%.5f,\\\"close_price\\\":%.5f,"
         "\\\"open_time\\\":\\\"%s\\\",\\\"close_time\\\":\\\"%s\\\","
         "\\\"sl\\\":%.5f,\\\"tp\\\":%.5f,\\\"profit\\\":%.2f,\\\"comment\\\":\\\"%s\\\"}",
         (long)ticket,
         symbol,
         dtype,
         volume,
         openP,
         closeP,
         TimeToString(openT, TIME_DATE|TIME_SECONDS),
         TimeToString(closeT, TIME_DATE|TIME_SECONDS),
         sl,
         tp,
         profit,
         escaped
      );
      count++;
   }

   if(count == 0) {
      Print("TradeTrackPro: no new closed trades found.");
      g_lastCheckedTime = to;
      return;
   }

   Print("TradeTrackPro: prepared ", count, " trade(s) for sync.");

   string body    = "{\\\"trades\\\":[" + jsonTrades + "]}";
   string headers = "Content-Type: application/json\\r\\nX-Api-Key: " + ConnectionCode;
   char postData[];
   StringToCharArray(body, postData, 0, StringLen(body));
   char response[];
   string resHeaders;

   bool ok = false;
   for(int attempt = 0; attempt < MaxRetries; attempt++) {
      ResetLastError();
      int code = WebRequest("POST", ApiEndpoint, headers, 5000, postData, response, resHeaders);
      if(code == 200 || code == 201) {
         ok = true;
         break;
      }
      int lastErr = GetLastError();
      Print("TradeTrackPro: sync attempt ", attempt + 1, " failed. HTTP=", code, " LastError=", lastErr);
      Sleep(2000 * (attempt + 1));
   }

   if(ok) {
      AppendTickets(syncedTickets, count, jsonTrades);
      g_lastCheckedTime = to;
      Print("TradeTrackPro: synced ", count, " trade(s).");
   } else {
      Print("TradeTrackPro: sync failed after ", MaxRetries, " attempt(s).");
   }
}

double GetOpenPrice(long posId)
{
   int n = HistoryDealsTotal();
   for(int i = 0; i < n; i++) {
      ulong t = HistoryDealGetTicket(i);
      if((long)HistoryDealGetInteger(t, DEAL_POSITION_ID) != posId) continue;
      ENUM_DEAL_ENTRY e = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(t, DEAL_ENTRY);
      if(e == DEAL_ENTRY_IN || e == DEAL_ENTRY_INOUT) return HistoryDealGetDouble(t, DEAL_PRICE);
   }
   return 0.0;
}

datetime GetOpenTime(long posId)
{
   int n = HistoryDealsTotal();
   for(int i = 0; i < n; i++) {
      ulong t = HistoryDealGetTicket(i);
      if((long)HistoryDealGetInteger(t, DEAL_POSITION_ID) != posId) continue;
      ENUM_DEAL_ENTRY e = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(t, DEAL_ENTRY);
      if(e == DEAL_ENTRY_IN || e == DEAL_ENTRY_INOUT) return (datetime)HistoryDealGetInteger(t, DEAL_TIME);
   }
   return 0;
}

bool HasTicket(string &arr[], string val)
{
   for(int i = 0; i < ArraySize(arr); i++) if(arr[i] == val) return true;
   return false;
}

void LoadTickets(string &arr[])
{
   int h = FileOpen(g_ticketsFile, FILE_READ|FILE_TXT|FILE_SHARE_READ);
   if(h == INVALID_HANDLE) return;
   int i = 0;
   while(!FileIsEnding(h)) {
      string line = FileReadString(h);
      if(StringLen(line) > 0) {
         ArrayResize(arr, i + 1);
         arr[i++] = line;
      }
   }
   FileClose(h);
}

void AppendTickets(string &existing[], int newCount, string jsonBatch)
{
   int h = FileOpen(g_ticketsFile, FILE_WRITE|FILE_TXT);
   if(h == INVALID_HANDLE) return;

   for(int i = 0; i < ArraySize(existing); i++) FileWriteString(h, existing[i] + "\\n");

   string search = "\\\"ticket\\\":";
   int pos = 0;
   int written = 0;

   while(written < newCount) {
      int found = StringFind(jsonBatch, search, pos);
      if(found < 0) break;
      pos = found + StringLen(search);
      string sub = StringSubstr(jsonBatch, pos, 20);
      string num = "";
      for(int c = 0; c < StringLen(sub); c++) {
         ushort ch = StringGetCharacter(sub, c);
         if(ch >= '0' && ch <= '9') num += ShortToString(ch);
         else if(StringLen(num) > 0) break;
      }
      if(StringLen(num) > 0) {
         FileWriteString(h, num + "\\n");
         written++;
      }
   }

   FileClose(h);
}
`;
}

export default function MT5ConnectFlow() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newKeyData, setNewKeyData] = useState(null);

  const { data: keys = [], isLoading: keysLoading } = useQuery({
    queryKey: ["mt5-keys"],
    queryFn: () => appClient.MT5.listKeys(),
  });

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["mt5-status"],
    queryFn: () => appClient.MT5.getSyncStatus(),
    refetchInterval: 30_000,
  });

  const createKey = useMutation({
    mutationFn: (label) => appClient.MT5.createKey(label),
    onSuccess: (data) => {
      setNewKeyData(data);
      setNewLabel("");
      setShowCreateForm(false);
      queryClient.invalidateQueries({ queryKey: ["mt5-keys"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const revokeKey = useMutation({
    mutationFn: (id) => appClient.MT5.revokeKey(id),
    onSuccess: () => {
      toast.success("Connection stopped.");
      queryClient.invalidateQueries({ queryKey: ["mt5-keys"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteKey = useMutation({
    mutationFn: (id) => appClient.MT5.deleteKey(id),
    onSuccess: () => {
      toast.success("Connection removed.");
      queryClient.invalidateQueries({ queryKey: ["mt5-keys"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const handleCreate = (event) => {
    event.preventDefault();
    if (!newLabel.trim()) return;
    createKey.mutate(newLabel.trim());
  };

  const handleDownloadConnector = () => {
    const endpoint = `${API_URL}/api/mt5/sync`;
    const connector = generateEaContent(endpoint);
    const blob = new Blob([connector], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = CONNECTOR_FILE;
    link.click();
    URL.revokeObjectURL(url);
  };

  const state = getConnectionState(keys, status);
  const showForm = showCreateForm || (!keysLoading && keys.length === 0);

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-lg shadow-slate-950/20">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr,0.7fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
              <Link2 className="h-3.5 w-3.5 text-primary" />
              MetaTrader 5
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Connect your broker once</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
              Download the MT5 connector, paste your connection code into MetaTrader, and let your journal update automatically after you close trades.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                "One-time setup",
                "Works with demo and live accounts",
                "Never places trades for you",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Connection status</p>
            <div className={`mt-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${state.tone}`}>
              {state.label}
            </div>
            <p className="mt-3 text-sm text-white/70">{state.note}</p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-wide text-white/45">Trades synced</p>
                <p className="mt-1 text-2xl font-semibold text-white">{status?.count ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-wide text-white/45">Saved accounts</p>
                <p className="mt-1 text-2xl font-semibold text-white">{keys.length}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-black/20 p-3 text-sm text-white/70">
              {statusLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin text-white/50" />
              ) : (
                <Clock className="h-4 w-4 text-white/45" />
              )}
              <span>
                {status?.lastSync
                  ? `Last sync ${formatDistanceToNow(new Date(status.lastSync), { addSuffix: true })}`
                  : "Waiting for first sync"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {newKeyData && (
        <Card className="border-primary/30 bg-primary/5 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Step 1 complete: copy your connection code</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                You will paste this once into the MT5 connector. After you close this card, the code will not be shown again.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 break-all rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono">
                  {newKeyData.key}
                </code>
                <CopyButton text={newKeyData.key} label="Copy code" />
              </div>
            </div>
            <button
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setNewKeyData(null)}
              type="button"
            >
              Dismiss
            </button>
          </div>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="space-y-5">
          <Card className="rounded-3xl border-border/80 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                1
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">Create a connection code</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Name the account once so you can tell your broker connections apart later.
                    </p>
                  </div>
                  {!showForm && (
                    <Button
                      className="rounded-xl"
                      onClick={() => setShowCreateForm(true)}
                      type="button"
                    >
                      <Key className="mr-2 h-4 w-4" />
                      Create code
                    </Button>
                  )}
                </div>

                {showForm ? (
                  <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleCreate}>
                    <input
                      autoFocus
                      className="h-11 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      onChange={(event) => setNewLabel(event.target.value)}
                      placeholder='Example: "FTMO Swing" or "Personal MT5"'
                      value={newLabel}
                    />
                    <div className="flex gap-2">
                      <Button
                        className="h-11 rounded-xl"
                        disabled={createKey.isPending || !newLabel.trim()}
                        type="submit"
                      >
                        {createKey.isPending ? "Creating..." : "Create code"}
                      </Button>
                      {keys.length > 0 && (
                        <Button
                          className="h-11 rounded-xl"
                          onClick={() => setShowCreateForm(false)}
                          type="button"
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                    Your current connections are saved on the right. Create another code any time you want to attach a second MT5 account.
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border-border/80 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                2
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">Download the MT5 connector</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      This is the small file you place in MetaTrader once. The app fills in the sync endpoint for you.
                    </p>
                  </div>
                  <Button className="rounded-xl" onClick={handleDownloadConnector} type="button">
                    <Download className="mr-2 h-4 w-4" />
                    Download connector
                  </Button>
                </div>

                <div className="mt-4 rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Allowed URL</p>
                      <p className="mt-1 break-all font-mono text-sm text-foreground">{ALLOWED_URL}</p>
                    </div>
                    <CopyButton label="Copy URL" text={ALLOWED_URL} />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    In MT5 settings, add this URL to the allowed list so the connector can reach your journal.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border-border/80 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                3
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold">Finish in MetaTrader 5</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Once the connector is attached, future closed trades will flow into your journal automatically.
                </p>
                <ol className="mt-4 space-y-3">
                  {[
                    `Open MT5 -> File -> Open Data Folder -> MQL5 -> Experts, then drop in ${CONNECTOR_FILE}.`,
                    `Press F4, then F5 to compile. In Tools -> Options -> Expert Advisors, add ${ALLOWED_URL} to the allowed list.`,
                    "Drag the connector onto any chart, paste your connection code into Inputs, then click OK.",
                  ].map((step, index) => (
                    <li className="flex items-start gap-3" key={step}>
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-6 text-muted-foreground">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="rounded-3xl border-border/80 p-5">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Saved broker connections</h3>
            </div>

            {keysLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : keys.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/20 p-5 text-center">
                <Key className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium">No broker connected yet</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Create your first connection code on the left to start the MT5 setup.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {keys.map((key) => (
                  <div
                    className="rounded-2xl border border-border p-4 transition-colors hover:bg-muted/20"
                    key={key.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold">{key.label}</p>
                          <ConnectionBadge isActive={key.isActive} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {key.lastUsedAt
                            ? `Last used ${formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true })}`
                            : `Created ${formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {key.isActive && (
                          <button
                            className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-yellow-50 hover:text-yellow-700"
                            onClick={() => revokeKey.mutate(key.id)}
                            title="Stop connection"
                            type="button"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-red-50 hover:text-red-700"
                          onClick={() => {
                            if (window.confirm("Remove this broker connection? MT5 will stop syncing until you reconnect it.")) {
                              deleteKey.mutate(key.id);
                            }
                          }}
                          title="Remove connection"
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="rounded-3xl border-border/80 bg-primary/5 p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">What happens after you connect</h3>
            </div>
            <div className="mt-4 space-y-3">
              {[
                "Closed trades land in your journal automatically and update your PnL.",
                "Your analytics page can break down performance by setup, symbol, and session.",
                "Your broker login stays in MT5 on your machine. The connector never sends broker orders.",
              ].map((item) => (
                <div className="flex items-start gap-2" key={item}>
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
