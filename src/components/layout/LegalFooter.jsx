import React from "react";
import { Link } from "react-router-dom";
import { LEGAL_POLICY_LINKS } from "@/content/legalPolicies";

export default function LegalFooter({ className = "" }) {
  return (
    <footer className={`border-t border-border bg-background/95 ${className}`}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-6 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} TradeTrack Pro. All rights reserved.</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Legal links">
          {LEGAL_POLICY_LINKS.map((link, index) => (
            <React.Fragment key={link.path}>
              {index > 0 && <span className="text-border" aria-hidden="true">|</span>}
              <Link to={link.path} className="font-medium hover:text-primary hover:underline">
                {link.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>
      </div>
    </footer>
  );
}
