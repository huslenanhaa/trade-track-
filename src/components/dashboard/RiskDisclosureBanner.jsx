import React, { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

const STORAGE_KEY = "tradetrack:risk-disclosure-dismissed";

export default function RiskDisclosureBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "true");
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore storage failures; the in-memory state still dismisses the banner.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-sm font-medium">This app does not provide financial advice. Trading involves risk.</p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss risk disclosure"
        className="rounded-md p-1 text-amber-700 hover:bg-amber-100 hover:text-amber-950"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
