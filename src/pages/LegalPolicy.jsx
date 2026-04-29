import React from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { LEGAL_POLICIES, LEGAL_POLICY_LINKS } from "@/content/legalPolicies";

export default function LegalPolicy({ policyKey }) {
  const policy = LEGAL_POLICIES[policyKey];

  if (!policy) {
    return <Navigate to="/privacy-policy" replace />;
  }

  return (
    <article className="mx-auto w-full max-w-3xl">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to TradeTrack Pro
      </Link>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">TradeTrack Legal Policies</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{policy.title}</h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">{policy.description}</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Last updated {policy.updated}
        </p>

        <div className="mt-8 space-y-8 border-t border-border pt-8">
          {policy.sections.map((section) => (
            <section key={section.heading} className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        {policy.contactEmail && (
          <a
            href={`mailto:${policy.contactEmail}`}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
          >
            <Mail className="h-4 w-4" />
            Email support
          </a>
        )}
      </div>

      <nav className="mt-6 flex flex-wrap gap-3" aria-label="Other legal pages">
        {LEGAL_POLICY_LINKS.filter((link) => link.path !== policy.path).map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary"
          >
            {link.title}
          </Link>
        ))}
      </nav>
    </article>
  );
}
