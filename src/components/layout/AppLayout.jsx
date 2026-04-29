import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "./Sidebar";
import LegalFooter from "./LegalFooter";
import ThemeToggle from "@/components/theme/ThemeToggle";

const PAGE_TITLES = {
  "/Dashboard": { title: "Dashboard", desc: "Your trading performance at a glance" },
  "/Journal": { title: "Trade Journal", desc: "Log, review and manage all your trades" },
  "/Analytics": { title: "Analytics", desc: "Deep performance analysis and insights" },
  "/Calendar": { title: "Calendar Review", desc: "Daily P&L overview by month" },
  "/ImportTrades": { title: "Import & Sync", desc: "Upload a CSV or connect MetaTrader 5 in a guided flow" },
  "/Settings": { title: "Settings", desc: "Manage your profile and preferences" },
  "/Backtesting": { title: "Backtesting Lab", desc: "Test your edge on historical trade data" },
  "/WeeklyReview": { title: "Weekly Review", desc: "Reflect on your week and set goals" },
  "/TradeDetail": { title: "Trade Detail", desc: "Full breakdown of a single trade" },
  "/RiskCalculator": { title: "Risk Calculator", desc: "Size your position before entering the market" },
  "/Markets": { title: "Markets", desc: "Market data and trading watchlists" },
  "/AutoSync": { title: "Connect Broker", desc: "Set up MetaTrader 5 once and let your journal update automatically" },
  "/privacy-policy": { title: "Privacy Policy", desc: "How TradeTrack Pro handles account and trading data" },
  "/terms": { title: "Terms & Conditions", desc: "The basic terms for using TradeTrack Pro" },
  "/cookies": { title: "Cookie Policy", desc: "How cookies support sessions and product experience" },
  "/risk-disclaimer": { title: "Risk Disclaimer", desc: "Important trading risk information" },
  "/contact": { title: "Contact / Support", desc: "How to contact TradeTrack Pro support" },
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const page = PAGE_TITLES[location.pathname] || { title: "Trade Track Pro", desc: "" };
  const isMarketsPage = location.pathname === "/Markets";

  return (
    <div className="min-h-screen flex">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? "ml-16" : "ml-60"}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border h-16 flex items-center justify-between px-6 shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground leading-tight">{page.title}</h2>
            <p className="text-xs text-muted-foreground">{page.desc}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/Journal?add=true">
              <Button size="sm" className="h-8 rounded-xl text-xs gap-1.5 bg-primary hover:bg-orange-600 text-white shadow-sm shadow-primary/20">
                <Plus className="w-3.5 h-3.5" />Add Trade
              </Button>
            </Link>
          </div>
        </header>

        {/* Main content */}
        <main className={isMarketsPage ? "flex-1 min-h-0 w-full" : "flex-1 p-6 max-w-[1400px] w-full mx-auto"}>
          <Outlet />
        </main>
        {!isMarketsPage && <LegalFooter />}
      </div>
    </div>
  );
}
