import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CandlestickChart,
  CheckCircle2,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Hero3DScene from "@/components/hero/Hero3DScene";
import FloatingStatCard from "@/components/hero/FloatingStatCard";
import ThemeToggle from "@/components/theme/ThemeToggle";

const TRUST_METRICS = [
  { value: "1.24M", label: "journaled trades" },
  { value: "72/100", label: "discipline score" },
  { value: "<60 sec", label: "MT5 sync cycle" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-slate-300 bg-slate-50 text-slate-950 dark:border-white/10 dark:bg-[#050816] dark:text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(249,115,22,0.18),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(14,165,233,0.14),transparent_22%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_48%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_18%_18%,rgba(251,146,60,0.18),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(56,189,248,0.15),transparent_22%),radial-gradient(circle_at_50%_72%,rgba(76,29,149,0.18),transparent_34%),linear-gradient(180deg,#07101f_0%,#050816_44%,#040611_100%)]" />
      <div className="absolute inset-0 text-slate-300 opacity-50 dark:text-white dark:opacity-60" style={{ backgroundImage: "radial-gradient(currentColor 0.6px, transparent 0.8px)", backgroundSize: "42px 42px" }} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.36),transparent_22%,transparent_80%,rgba(255,255,255,0.22))] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%,transparent_80%,rgba(255,255,255,0.03))]" />

      <div className="relative mx-auto max-w-[1380px] px-5 pb-20 pt-5 sm:px-8 lg:px-10 lg:pb-24 lg:pt-6">
        <nav className="flex items-center justify-between rounded-full border border-slate-300 bg-white/90 px-4 py-3 shadow-[0_18px_54px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/brand/tradetrack-pro-mark.svg"
              alt="TradeTrack Pro"
              className="h-11 w-11 rounded-2xl object-cover shadow-[0_16px_34px_rgba(249,115,22,0.28)]"
            />
            <div>
              <div className="text-sm font-semibold tracking-[-0.02em] text-slate-950 dark:text-white sm:text-base">
                Trade <span className="text-orange-600 dark:text-orange-300">Track</span> Pro
              </div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-600 dark:text-slate-300">
                Trading intelligence
              </div>
            </div>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-700 dark:text-slate-300 lg:flex">
            <a href="#features" className="transition-colors hover:text-slate-950 dark:hover:text-white">Features</a>
            <a href="#showcase" className="transition-colors hover:text-slate-950 dark:hover:text-white">Analytics</a>
            <a href="#cta" className="transition-colors hover:text-slate-950 dark:hover:text-white">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login" className="hidden rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:border-orange-500 sm:inline-flex dark:border-white/10 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white">
              Sign in
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#fb923c,#f97316)] px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(249,115,22,0.34)] transition-transform hover:translate-y-[-1px]"
            >
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>

        <div className="grid gap-12 pb-10 pt-12 lg:grid-cols-[minmax(0,0.94fr)_minmax(440px,1.06fr)] lg:items-center lg:pt-16">
          <div className="max-w-[640px]">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-300/60 bg-orange-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-orange-700 dark:border-orange-300/20 dark:bg-orange-300/8 dark:text-orange-200"
            >
              <Sparkles className="h-4 w-4" />
              Premium 3D review workspace
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.72, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[13ch] text-[3rem] font-semibold leading-[0.92] tracking-[-0.05em] text-slate-950 dark:text-white sm:text-[4.4rem] lg:text-[5.3rem]"
            >
              Your trading edge,{" "}
              <span className="bg-[linear-gradient(135deg,#fdba74_0%,#fb923c_45%,#60a5fa_100%)] bg-clip-text text-transparent">
                mapped in motion.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.72, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-[56ch] text-base leading-8 text-slate-700 dark:text-slate-300 sm:text-lg"
            >
              Journal every trade, replay historical sessions, sync closed positions from MT5,
              and surface the patterns that actually move your P&amp;L. Built for traders who
              want a review workflow that feels as sharp as the dashboard itself.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.72, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#fb923c,#f97316)] px-6 py-4 text-sm font-semibold text-white shadow-[0_26px_60px_rgba(249,115,22,0.32)] transition-transform hover:translate-y-[-1px]"
              >
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#showcase"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white/90 px-6 py-4 text-sm font-semibold text-slate-950 backdrop-blur-xl transition-colors hover:border-orange-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-100 dark:hover:border-white/20 dark:hover:bg-white/[0.05]"
              >
                <Play className="h-4 w-4" />
                Explore the workflow
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.72, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                14-day free trial
              </div>
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                No card required
              </div>
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                MT5 and CSV import
              </div>
            </motion.div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {TRUST_METRICS.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.72, delay: 0.28 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-[24px] border border-slate-300 bg-white/92 px-4 py-4 shadow-[0_18px_54px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_54px_rgba(0,0,0,0.2)]"
                >
                  <div className="text-[1.7rem] font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
                    {metric.value}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-600 dark:text-slate-300">
                    {metric.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[760px] lg:max-w-none">
            <div className="relative min-h-[560px] overflow-hidden rounded-[36px] border border-slate-300 bg-white/85 p-4 shadow-[0_40px_120px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[0_40px_120px_rgba(0,0,0,0.45)] sm:p-6">
              <div className="absolute left-6 right-6 top-6 h-16 rounded-full border border-white/8 bg-white/[0.04] blur-2xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_52%,rgba(249,115,22,0.1),transparent_28%),radial-gradient(circle_at_52%_50%,rgba(59,130,246,0.1),transparent_26%)]" />

              <div className="relative h-full min-h-[520px] overflow-hidden rounded-[30px] border border-slate-800 bg-[#020617] dark:border-white/8 dark:bg-[#060c18]">
                <Hero3DScene />

                <div className="pointer-events-none absolute inset-0 hidden sm:block">
                  <FloatingStatCard
                    eyebrow="Live P&L"
                    value="+24.8%"
                    detail="$56,392.45 net over 24h"
                    delay={0.2}
                    className="absolute left-5 top-5 w-52"
                  >
                    <div className="flex items-center justify-between text-xs font-medium text-slate-100">
                      <span>Momentum</span>
                      <span className="text-emerald-400">+12.4%</span>
                    </div>
                    <div className="mt-3 h-16 rounded-2xl bg-[linear-gradient(180deg,rgba(59,130,246,0.12),rgba(15,23,42,0.04))] p-3">
                      <svg viewBox="0 0 120 40" className="h-full w-full">
                        <path d="M2 31 C14 24, 21 10, 35 15 S54 30, 66 22 S86 7, 118 10" fill="none" stroke="#fb923c" strokeWidth="2.6" strokeLinecap="round" />
                      </svg>
                    </div>
                  </FloatingStatCard>

                  <FloatingStatCard
                    eyebrow="Risk health"
                    title="Discipline score"
                    value="72/100"
                    detail="Position sizing and loss control are inside tolerance."
                    delay={0.28}
                    className="absolute bottom-5 right-5 w-56"
                  >
                    <div className="h-2 rounded-full bg-white/20">
                      <div className="h-full w-[72%] rounded-full bg-[linear-gradient(90deg,#f59e0b,#fb923c)]" />
                    </div>
                  </FloatingStatCard>

                  <FloatingStatCard
                    eyebrow="Satellites"
                    title="Orbiting review panels"
                    detail="Analytics, backtesting, and execution stats move around a single source of truth."
                    delay={0.36}
                    className="absolute right-6 top-[18%] w-60"
                  >
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-center text-[11px] text-sky-100">Charts</div>
                      <div className="rounded-2xl border border-orange-300/20 bg-orange-300/10 px-3 py-2 text-center text-[11px] text-orange-100">Stats</div>
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-center text-[11px] text-emerald-100">Replay</div>
                    </div>
                  </FloatingStatCard>

                  <FloatingStatCard
                    eyebrow="Trade flow"
                    title="Auto-sync closed trades"
                    detail="MT5 terminal sends closed positions every 60 seconds."
                    delay={0.44}
                    className="absolute bottom-10 left-4 w-60"
                  >
                    <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/[0.08] px-3 py-3 text-xs font-medium text-white">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      Broker credentials never leave your machine
                    </div>
                  </FloatingStatCard>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:hidden">
              <FloatingStatCard eyebrow="Live P&L" value="+24.8%" detail="$56,392.45 net over 24h">
                <div className="flex items-center gap-2 text-xs text-slate-100">
                  <CandlestickChart className="h-4 w-4 text-orange-300" />
                  Orbiting review panels stay light on mobile.
                </div>
              </FloatingStatCard>
              <FloatingStatCard eyebrow="Risk health" value="72/100" detail="Built to keep the signal sharper than the noise." />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
