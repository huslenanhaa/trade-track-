import React from "react";
import { Link, Outlet } from "react-router-dom";
import LegalFooter from "./LegalFooter";

export default function PublicLegalLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-background/95">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/brand/tradetrack-pro-mark.svg" alt="TradeTrack Pro" className="h-9 w-9 rounded-lg" />
            <span className="text-base font-bold tracking-tight">
              Trade<span className="text-primary">Track</span> Pro
            </span>
          </Link>
          <Link to="/" className="text-sm font-semibold text-muted-foreground hover:text-primary">
            Sign in
          </Link>
        </div>
      </header>
      <main className="flex-1 px-6 py-10">
        <Outlet />
      </main>
      <LegalFooter />
    </div>
  );
}
