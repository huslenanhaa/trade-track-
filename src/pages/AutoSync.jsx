import React from "react";
import { Link2 } from "lucide-react";

import MT5ConnectFlow from "@/components/mt5/MT5ConnectFlow";

export default function AutoSync() {
  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-2.5">
          <Link2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Connect Broker</h1>
          <p className="text-xs text-muted-foreground">
            Set up MetaTrader 5 once and let Trade Track pull in your journal data automatically.
          </p>
        </div>
      </div>

      <MT5ConnectFlow />
    </div>
  );
}
