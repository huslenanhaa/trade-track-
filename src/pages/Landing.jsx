import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Calculator,
  CandlestickChart,
  DatabaseZap,
  FlaskConical,
  NotebookPen,
  RotateCcw,
  ShieldCheck,
  Upload,
} from "lucide-react";
import HeroSection from "@/sections/HeroSection";

const FEATURE_CARDS = [
  {
    icon: Activity,
    title: "Journal with context",
    description:
      "Capture symbol, setup, screenshots, mistakes, and execution notes in one place so every review starts with complete data.",
  },
  {
    icon: CandlestickChart,
    title: "Replay with precision",
    description:
      "Step through historical candles bar by bar, test entries inside the simulator, and move the winning process into your live plan.",
  },
  {
    icon: DatabaseZap,
    title: "Auto-sync the close",
    description:
      "Use the MT5 workflow to pull closed trades into the journal without breaking your broker-side security model.",
  },
];

const SURFACES = [
  {
    icon: ShieldCheck,
    title: "Risk layer",
    value: "72 / 100",
    detail: "The system surfaces over-sizing, revenge trades, and session drift before they become habits.",
  },
  {
    icon: BrainCircuit,
    title: "Insight layer",
    value: "+18.2%",
    detail: "Track the symbols, weekdays, and setups that actually lift your equity curve instead of trusting memory.",
  },
  {
    icon: Upload,
    title: "Import layer",
    value: "< 1 min",
    detail: "CSV and MT5 imports reduce setup time so the review loop stays tight enough to use every day.",
  },
];

const WORKFLOW_TABS = [
  {
    key: "journal",
    label: "Journal",
    icon: NotebookPen,
    title: "Log every trade with the full story.",
    detail: "Capture entries, exits, screenshots, mistakes, setup tags, emotions, and notes so every review starts from clean evidence.",
    stats: ["147 trades", "12 setups", "8 mistake tags"],
  },
  {
    key: "analytics",
    label: "Analytics",
    icon: BarChart3,
    title: "Find what actually drives your P&L.",
    detail: "Break performance down by symbol, session, direction, weekday, setup, win rate, drawdown, and average R.",
    stats: ["68.4% WR", "2.63 PF", "+$24,847"],
  },
  {
    key: "risk",
    label: "Risk",
    icon: Calculator,
    title: "Size the trade before the trade owns you.",
    detail: "Model lot size, account risk, stop distance, profit targets, and scenario outcomes before placing a position.",
    stats: ["1.0% risk", "1:2.4 RR", "$105 max loss"],
  },
  {
    key: "backtesting",
    label: "Backtesting",
    icon: FlaskConical,
    title: "Build reps without risking capital.",
    detail: "Create sessions by market, timeframe, date, balance, risk limits, and strategy rules before opening the replay room.",
    stats: ["XAUUSD", "15m", "66.7% WR"],
  },
  {
    key: "replay",
    label: "Replay",
    icon: RotateCcw,
    title: "Step through candles like live market training.",
    detail: "Move bar by bar, place orders, track open positions, and review results directly on the chart.",
    stats: ["0.5x speed", "3 trades", "+$172.56"],
  },
  {
    key: "sync",
    label: "Import / Sync",
    icon: Upload,
    title: "Bring broker history into the review loop.",
    detail: "Import CSV files or connect MT5 so closed trades flow into the journal without manual copy-paste.",
    stats: ["CSV ready", "MT5 flow", "<60 sec"],
  },
];

function FeatureCard({ icon: Icon, title, description, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[28px] border border-slate-300 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_22px_70px_rgba(0,0,0,0.18)]"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(251,146,60,0.18),rgba(96,165,250,0.12))]">
        <Icon className="h-5 w-5 text-orange-600 dark:text-orange-200" />
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">{description}</p>
    </motion.div>
  );
}

function TradingViewLineChart({ tone = "green" }) {
  const green = tone === "green";
  const stroke = green ? "#089981" : "#f23645";
  const points = green
    ? "M14 92 L22 78 L31 86 L39 59 L48 74 L57 68 L66 85 L76 81 L86 61 L96 66 L107 46 L116 52 L127 38 L137 44 L148 33 L160 40 L171 34 L182 48 L192 45 L203 54 L215 41 L226 47 L238 36 L250 42 L262 24 L274 31 L286 18 L298 26 L310 21 L322 29 L337 16"
    : "M14 44 L25 52 L36 42 L47 58 L59 50 L70 68 L82 63 L94 75 L106 69 L118 86 L130 81 L143 88 L155 79 L168 92 L180 85 L193 96 L206 90 L218 102 L231 96 L244 105 L257 101 L270 92 L283 97 L296 87 L309 91 L322 82 L337 88";
  return (
    <svg viewBox="0 0 360 160" className="h-full w-full" role="img" aria-label="Trading chart preview">
      <defs>
        <linearGradient id={`chart-fill-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.24" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="360" height="160" rx="18" fill="#020403" />
      {[28, 56, 84, 112].map((y) => (
        <line key={y} x1="14" x2="346" y1={y} y2={y} stroke="#1f2937" strokeWidth="1" />
      ))}
      {[42, 108, 174, 240, 306].map((x) => (
        <line key={x} x1={x} x2={x} y1="12" y2="128" stroke="#111827" strokeWidth="1" />
      ))}
      <path d={`${points} L337 132 L14 132 Z`} fill={`url(#chart-fill-${tone})`} />
      <path d={points} fill="none" stroke={stroke} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      <text x="18" y="146" fill="#8b949e" fontSize="10">09:30</text>
      <text x="104" y="146" fill="#8b949e" fontSize="10">12:00</text>
      <text x="190" y="146" fill="#8b949e" fontSize="10">15:30</text>
      <text x="300" y="146" fill="#8b949e" fontSize="10">Close</text>
    </svg>
  );
}

function MarketRow({ icon, name, tag, price, change, positive = true }) {
  return (
    <div className="flex items-center justify-between border-t border-white/10 py-3 first:border-t-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">{name}</div>
          <div className="mt-1 inline-flex rounded bg-white/12 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">{tag}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold tabular-nums text-white">{price}</div>
        <div className={`mt-1 text-xs font-medium tabular-nums ${positive ? "text-[#089981]" : "text-[#f23645]"}`}>{change}</div>
      </div>
    </div>
  );
}

const SCREENSHOTS = {
  journal: "/screenshots/journal-list.png",
  analytics: "/screenshots/dashboard.png",
  risk: "/screenshots/dashboard.png",
  backtesting: "/screenshots/us100-trade-chart.png",
  replay: "/screenshots/us100-trade-chart.png",
  sync: "/screenshots/journal-table.png",
};

function ScreenshotCard({ src, alt, className = "", objectPosition = "center" }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-white/10 bg-slate-950 ${className}`}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        style={{ objectPosition }}
      />
    </div>
  );
}

function WorkflowPreview({ active }) {
  const screenshot = SCREENSHOTS[active.key] || SCREENSHOTS.journal;

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-300 bg-white shadow-[0_34px_100px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[#070b14] dark:shadow-[0_34px_100px_rgba(0,0,0,0.36)]">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-[#111827]">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <div className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Trade Track Pro / {active.label}</div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="min-h-[330px] bg-slate-950 p-4">
          <ScreenshotCard
            src={screenshot}
            alt={`${active.label} screen`}
            className="h-full min-h-[330px]"
            objectPosition={active.key === "analytics" || active.key === "risk" ? "50% 35%" : active.key === "journal" ? "50% 28%" : "50% 50%"}
          />
        </div>

        <div className="p-6">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">{active.title}</h3>
          <p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-300">{active.detail}</p>
          <div className="mt-6 grid gap-3">
            {active.stats.map((stat) => (
              <div key={stat} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Signal</span>
                <span className="text-sm font-bold text-slate-950 dark:text-white">{stat}</span>
              </div>
            ))}
          </div>
          <Link to="/login" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(249,115,22,0.28)]">
            Try this workflow
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function WorkflowTabsSection() {
  const [activeKey, setActiveKey] = React.useState("journal");
  const active = WORKFLOW_TABS.find((tab) => tab.key === activeKey) || WORKFLOW_TABS[0];

  return (
    <section className="border-y border-slate-300 bg-white px-5 py-20 dark:border-white/10 dark:bg-[#050816] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <div className="mx-auto max-w-[760px] text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-700 dark:text-orange-200">How traders use it</div>
          <h2 className="mt-4 text-[2.3rem] font-semibold tracking-[-0.05em] text-slate-950 dark:text-white sm:text-[3.4rem]">
            One app, every step of the review loop.
          </h2>
          <p className="mx-auto mt-5 max-w-[62ch] text-base leading-8 text-slate-700 dark:text-slate-300">
            Click through the core workflows to see how the product moves from logging trades to analyzing performance and replaying decisions.
          </p>
        </div>

        <div className="mt-10 overflow-x-auto pb-3">
          <div className="mx-auto flex min-w-max items-end justify-center gap-5">
            {WORKFLOW_TABS.map(({ key, label, icon: Icon }) => {
              const selected = key === activeKey;
              return (
                <button
                  key={key}
                  onClick={() => setActiveKey(key)}
                  className="group flex w-[128px] flex-col items-center gap-3"
                >
                  <div className={`flex h-16 w-16 items-center justify-center rounded-xl border transition-all ${selected ? "border-slate-950 bg-slate-950 text-white shadow-[0_16px_40px_rgba(15,23,42,0.24)] dark:border-white dark:bg-white dark:text-slate-950" : "border-transparent text-slate-600 group-hover:border-slate-300 group-hover:bg-slate-100 dark:text-slate-300 dark:group-hover:border-white/10 dark:group-hover:bg-white/[0.04]"}`}>
                    <Icon className="h-8 w-8" strokeWidth={1.6} />
                  </div>
                  <span className={`text-sm font-medium ${selected ? "text-slate-950 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <motion.div
          key={active.key}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8"
        >
          <WorkflowPreview active={active} />
        </motion.div>
      </div>
    </section>
  );
}

function RealScreenshotsSection() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const mainY = useTransform(scrollYProgress, [0, 1], [55, -45]);
  const journalY = useTransform(scrollYProgress, [0, 1], [120, -80]);
  const tableY = useTransform(scrollYProgress, [0, 1], [90, -70]);
  const chartY = useTransform(scrollYProgress, [0, 1], [135, -95]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#050816] px-5 py-24 text-white sm:px-8 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(249,115,22,0.16),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(14,165,233,0.14),transparent_24%),linear-gradient(180deg,#050816_0%,#08111f_48%,#030712_100%)]" />
      <div className="relative mx-auto max-w-[1320px]">
        <div className="mx-auto max-w-[780px] text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">Real product screens</div>
          <h2 className="mt-4 text-[2.4rem] font-semibold tracking-[-0.05em] sm:text-[3.5rem]">
            Show the app, not a fake dashboard.
          </h2>
          <p className="mx-auto mt-5 max-w-[64ch] text-base leading-8 text-slate-300">
            The landing page now uses real screens from Trade Track Pro so the flow feels practical:
            dashboard overview, journal table, trade chart evidence, and review workspace.
          </p>
        </div>

        <div className="relative mx-auto mt-16 min-h-[720px] max-w-[1120px] [perspective:1400px]">
          <motion.div style={{ y: mainY }} className="relative z-10 mx-auto w-full overflow-hidden rounded-[28px] border border-white/12 bg-white/5 p-2 shadow-[0_38px_130px_rgba(0,0,0,0.48)] backdrop-blur-xl">
            <img src="/screenshots/dashboard.png" alt="Trade Track Pro dashboard screen" className="h-auto w-full rounded-[22px]" />
          </motion.div>

          <motion.div style={{ y: journalY }} className="absolute -left-8 top-20 z-20 hidden w-[430px] -rotate-3 overflow-hidden rounded-2xl border border-white/15 bg-white p-1 shadow-2xl lg:block">
            <img src="/screenshots/journal-list.png" alt="Trade journal screen" className="h-[250px] w-full rounded-xl object-cover object-[50%_28%]" />
          </motion.div>

          <motion.div style={{ y: chartY }} className="absolute -right-10 top-28 z-30 hidden w-[420px] rotate-3 overflow-hidden rounded-2xl border border-white/15 bg-white p-1 shadow-2xl lg:block">
            <img src="/screenshots/us100-trade-chart.png" alt="US100 trade chart screenshot" className="h-[250px] w-full rounded-xl object-cover object-[50%_42%]" />
          </motion.div>

          <motion.div style={{ y: tableY }} className="absolute bottom-6 left-1/2 z-30 hidden w-[720px] -translate-x-1/2 rotate-[-1deg] overflow-hidden rounded-2xl border border-white/15 bg-white p-1 shadow-2xl md:block">
            <img src="/screenshots/journal-table.png" alt="Journal table screen" className="h-[210px] w-full rounded-xl object-cover object-[50%_36%]" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function JournalChartMock() {
  return (
    <svg viewBox="0 0 520 250" className="h-full w-full" aria-hidden="true">
      <rect width="520" height="250" fill="#e5e7eb" />
      {[35, 70, 105, 140, 175, 210].map((y) => (
        <line key={y} x1="18" x2="500" y1={y} y2={y} stroke="#cbd5e1" />
      ))}
      {[40, 92, 144, 196, 248, 300, 352, 404, 456].map((x) => (
        <line key={x} x1={x} x2={x} y1="20" y2="218" stroke="#d1d5db" />
      ))}
      <path d="M24 178 C70 166, 92 199, 124 182 S182 154, 218 158 S263 121, 304 105 S365 82, 413 74 S455 59, 496 62" fill="none" stroke="#1d4ed8" strokeWidth="2" />
      <path d="M24 181 C92 176, 156 168, 224 148 S353 95, 496 72" fill="none" stroke="#ef4444" strokeWidth="1.3" opacity="0.65" />
      <path d="M24 202 C105 184, 200 176, 274 138 S386 105, 496 86" fill="none" stroke="#64748b" strokeWidth="1.2" opacity="0.55" />
      <rect x="318" y="82" width="70" height="72" fill="#22c55e" opacity="0.24" />
      <rect x="318" y="154" width="70" height="35" fill="#ef4444" opacity="0.22" />
      <line x1="292" x2="414" y1="150" y2="150" stroke="#111827" strokeWidth="1.3" />
      <line x1="330" x2="388" y1="184" y2="96" stroke="#111827" strokeWidth="1.2" />
      {[48, 82, 126, 168, 224, 278, 326, 372, 424, 470].map((x, index) => (
        <rect key={x} x={x} y={216 - (18 + (index * 13) % 46)} width="6" height={18 + (index * 13) % 46} fill={index % 2 ? "#ef4444" : "#14b8a6"} opacity="0.45" />
      ))}
      <text x="24" y="18" fill="#111827" fontSize="9" fontWeight="700">US100.CASH / Long setup</text>
    </svg>
  );
}

function JournalStatsPanel() {
  const rows = [
    ["Entry Price", "27105.48"],
    ["Exit Price", "27173.83"],
    ["Stop Loss", "27105.97"],
    ["Take Profit", "27237.29"],
    ["Position Size", "0.5"],
    ["Risk:Reward", "139.49"],
    ["Net P&L", "+$25.32"],
  ];

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl">
      <h4 className="text-sm font-bold text-stone-950">Trade Statistics</h4>
      <div className="mt-3 divide-y divide-stone-200">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-2 text-xs">
            <span className="text-stone-500">{label}</span>
            <span className={`font-bold ${value.startsWith("+") ? "text-emerald-600" : "text-stone-950"}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function JournalNotesPanel() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl">
      <h4 className="text-sm font-bold text-stone-950">Execution Notes</h4>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-stone-50 p-3">
          <div className="text-xs font-semibold text-stone-500">Why I entered</div>
          <p className="mt-2 text-sm leading-6 text-stone-950">clean BOS PULL back bough in discount zone</p>
        </div>
        <div className="rounded-xl bg-stone-50 p-3">
          <div className="text-xs font-semibold text-stone-500">Strategy</div>
          <p className="mt-2 text-sm text-stone-950">-</p>
        </div>
      </div>
    </div>
  );
}

function JournalChecklistPanel() {
  const checks = [
    ["Followed my trading plan", true],
    ["Correct session entry", true],
    ["News risk respected", true],
    ["Proper stop placement", true],
    ["No emotional bias", false],
    ["Confirmed entry signal", false],
  ];

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl">
      <h4 className="text-sm font-bold text-stone-950">Pre-Trade Checklist</h4>
      <div className="mt-3 space-y-2">
        {checks.map(([label, done]) => (
          <div key={label} className="flex items-center gap-2 text-xs text-stone-700">
            <span className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${done ? "border-emerald-500 text-emerald-600" : "border-stone-300 text-stone-400"}`}>
              {done ? "✓" : "×"}
            </span>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function JournalDetailMock({ compact = false }) {
  return (
    <div className="h-full rounded-2xl bg-[#f6f2ed] p-4 text-stone-950">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-[-0.04em]">US100.CASH</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Long ↑</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">win</span>
          </div>
          <div className="mt-1 text-sm text-stone-600">Friday, April 24 2026 · 16:43</div>
        </div>
        {!compact && <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold">Edit</div>}
      </div>
      <div className={`grid gap-4 ${compact ? "" : "lg:grid-cols-[1.2fr_0.8fr]"}`}>
        <div className="overflow-hidden rounded-2xl border border-stone-300 bg-stone-900">
          <div className={compact ? "h-52" : "h-72"}>
            <img
              src="/screenshots/us100-trade-chart.png"
              alt="US100.CASH trade chart screenshot"
              className="h-full w-full object-cover object-center"
            />
          </div>
          <div className="flex gap-2 bg-stone-400 p-3">
            <div className="h-10 w-14 overflow-hidden rounded-xl border border-orange-500 bg-white p-1">
              <img
                src="/screenshots/us100-trade-chart.png"
                alt=""
                className="h-full w-full object-cover object-center"
              />
            </div>
            <div className="flex h-10 w-14 items-center justify-center rounded-xl border border-dashed border-white/40 text-white/60">+</div>
          </div>
        </div>
        {!compact && (
          <div className="space-y-4">
            <JournalStatsPanel />
            <JournalChecklistPanel />
          </div>
        )}
      </div>
    </div>
  );
}

function ReplayCandles() {
  const closes = [
    142, 148, 134, 150, 72, 96, 82, 110, 96, 102, 88, 92, 104, 86, 78,
    74, 70, 77, 82, 76, 92, 112, 96, 104, 98, 88, 90, 96, 84, 72, 68,
    78, 88, 98, 108, 100, 91, 83, 88, 95, 104, 96, 90, 83, 86, 78, 72,
    70, 92, 50, 83, 86, 96, 102, 94, 86, 80, 70, 64, 74, 82, 88, 78,
    72, 80, 66, 58, 62, 54, 60, 72, 84, 92, 86,
  ];
  const minClose = Math.min(...closes);
  const maxClose = Math.max(...closes);
  const chartTop = 30;
  const chartBottom = 132;
  const chartHeight = chartBottom - chartTop;
  const scaleY = (value) => chartBottom - ((value - minClose) / (maxClose - minClose)) * chartHeight;
  const bars = closes.map((close, index) => {
    const previous = index === 0 ? 138 : closes[index - 1];
    const x = 28 + index * 4.45;
    const high = scaleY(Math.max(previous, close) + (index % 11 === 0 ? 16 : 5 + (index % 3) * 2));
    const low = scaleY(Math.min(previous, close) - (index % 9 === 0 ? 18 : 5 + (index % 4) * 2));
    const openY = scaleY(previous);
    const closeY = scaleY(close);
    const volume = 8 + ((index * 17) % 28) + (index % 13 === 0 ? 18 : 0);
    return { x, openY, closeY, high, low, previous, close, volume };
  });

  return (
    <svg viewBox="0 0 430 180" className="h-full w-full" aria-hidden="true">
      <rect width="430" height="180" fill="#111111" />
      {[28, 49, 70, 91, 112, 133, 154].map((y) => (
        <line key={y} x1="0" x2="430" y1={y} y2={y} stroke="#242424" strokeWidth="1" />
      ))}
      {[30, 80, 130, 180, 230, 280, 330, 380].map((x) => (
        <line key={x} x1={x} x2={x} y1="0" y2="180" stroke="#242424" strokeWidth="1" />
      ))}
      <line x1="0" x2="430" y1="76" y2="76" stroke="#d1d5db" strokeDasharray="3 4" opacity="0.42" />
      <line x1="82" x2="82" y1="0" y2="180" stroke="#d1d5db" strokeDasharray="3 4" opacity="0.45" />
      <line x1="0" x2="430" y1="111" y2="111" stroke="#f23645" strokeDasharray="1 2" opacity="0.85" />

      {bars.map(({ x, close, previous, volume }) => {
        const color = close >= previous ? "#089981" : "#f23645";
        return (
          <rect
            key={`vol-${x}`}
            x={x - 1.5}
            y={174 - volume}
            width="3"
            height={volume}
            fill={color}
            opacity="0.48"
          />
        );
      })}

      {bars.map(({ x, openY, closeY, high, low, close, previous }) => {
        const up = close >= previous;
        const color = up ? "#089981" : "#f23645";
        const y = Math.min(openY, closeY);
        const h = Math.max(Math.abs(closeY - openY), 2.5);
        return (
          <g key={x}>
            <line x1={x} x2={x} y1={Math.max(chartTop, high)} y2={Math.min(chartBottom, low)} stroke={color} strokeWidth="0.9" opacity="0.92" />
            <rect x={x - 1.75} y={Math.max(chartTop, y)} width="3.5" height={Math.min(h, chartHeight)} rx="0.35" fill={color} />
          </g>
        );
      })}
      <rect x="8" y="7" width="382" height="18" rx="5" fill="#111111" opacity="0.9" />
      <text x="14" y="19" fill="#f8fafc" fontSize="7.5" fontWeight="700">Gold Spot / U.S. Dollar · 1h · OANDA</text>
      <text x="151" y="19" fill="#089981" fontSize="7.5" fontWeight="700">O4,746.060  H4,777.085  L4,738.655  C4,764.510  +18.440</text>
      <text x="14" y="36" fill="#f8fafc" fontSize="7.5" fontWeight="700">Vol · Ticks</text>
      <text x="62" y="36" fill="#089981" fontSize="7.5" fontWeight="700">79.43K</text>
      {["4,900.00", "4,860.00", "4,820.00", "4,780.00", "4,740.00", "4,700.00", "4,660.00"].map((label, index) => (
        <text key={label} x="387" y={31 + index * 21} fill="#d1d5db" fontSize="7.2" fontWeight="700">{label}</text>
      ))}
      <rect x="382" y="107" width="44" height="12" rx="1" fill="#f23645" />
      <text x="386" y="116" fill="#fff" fontSize="8" fontWeight="700">4,709.750</text>
      <text x="14" y="169" fill="#f8fafc" fontSize="8" fontWeight="700">7</text>
      <text x="84" y="169" fill="#f8fafc" fontSize="8" fontWeight="700">8</text>
      <text x="154" y="169" fill="#f8fafc" fontSize="8" fontWeight="700">12</text>
      <text x="224" y="169" fill="#f8fafc" fontSize="8" fontWeight="700">16</text>
      <text x="294" y="169" fill="#f8fafc" fontSize="8" fontWeight="700">22</text>
      <text x="365" y="169" fill="#f8fafc" fontSize="8" fontWeight="700">26</text>
    </svg>
  );
}

function ReplayRoomMock() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#0f172a] shadow-[0_34px_120px_rgba(0,0,0,0.42)]">
      <div className="flex h-8 items-center border-b border-white/10 bg-[#1f2430] text-[10px] font-semibold text-slate-400">
        <div className="flex w-8 justify-center text-slate-500">←</div>
        <div className="px-3 text-white">XAU/USD <span className="text-yellow-300">(Gold)</span></div>
        {["1m", "5m", "15m", "30m", "1H", "4H", "1D"].map((tf) => (
          <div key={tf} className={`px-2 py-1 ${tf === "15m" ? "rounded bg-blue-600 text-white" : ""}`}>{tf}</div>
        ))}
        <div className="ml-auto flex items-center gap-3 px-3">
          <span className="rounded bg-blue-600 px-2 py-1 text-white">Play</span>
          <span className="rounded bg-blue-600 px-1.5 py-1 text-white">0.5x</span>
        </div>
      </div>
      <div className="grid grid-cols-[24px_minmax(0,1fr)_150px]">
        <div className="border-r border-white/10 bg-[#1f2430]" />
        <div className="h-[318px]">
          <ReplayCandles />
        </div>
        <div className="border-l border-white/10 bg-[#20242f] p-3">
          <div className="mb-3 flex gap-4 text-[10px] text-slate-400">
            <span className="text-white">Order</span><span>Positions</span><span>History</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
            <div className="rounded bg-teal-500 px-2 py-2 text-center text-white">BUY / LONG</div>
            <div className="rounded border border-red-400/40 bg-red-500/10 px-2 py-2 text-center text-red-300">SELL / SHORT</div>
          </div>
          {["Entry Price", "Stop Loss", "Take Profit", "Lot Size"].map((label, index) => (
            <div key={label} className="mt-3">
              <div className="mb-1 text-[9px] text-slate-500">{label}</div>
              <div className="h-7 rounded border border-slate-700 bg-[#111827] px-2 py-1 text-[10px] text-white">
                {index === 0 ? "5517.02" : index === 3 ? "1" : ""}
              </div>
            </div>
          ))}
          <div className="mt-4 rounded bg-teal-500 py-2 text-center text-[10px] font-bold text-white">Place Buy Trade</div>
        </div>
      </div>
      <div className="grid h-24 grid-cols-[120px_minmax(0,1fr)] border-t border-white/10 bg-[#20242f] text-[10px]">
        <div className="grid grid-cols-3 grid-rows-2 border-r border-white/10">
          {["TRADES\n3", "WIN RATE\n66.7%", "PROFIT\n2.63", "AVG R\n0.00", "MAX DD\n$105.87", "EXPECT\n$57.52"].map((item) => {
            const [label, value] = item.split("\n");
            return (
              <div key={item} className="border-r border-t border-white/5 p-2">
                <div className="text-[8px] text-slate-500">{label}</div>
                <div className="mt-1 font-bold text-white">{value}</div>
              </div>
            );
          })}
        </div>
        <div className="p-2">
          <div className="grid grid-cols-[40px_1fr_1fr_1fr_1fr_1fr] border-b border-white/10 pb-1 text-slate-500">
            <span>#</span><span>Dir</span><span>Entry</span><span>Exit</span><span>P&L</span><span>Opened</span>
          </div>
          {[
            ["1", "S", "5531.4100", "5412.0302", "+$119.38", "01/30 01:00"],
            ["2", "S", "5378.9400", "5219.8941", "+$159.05", "01/30 09:00"],
            ["3", "L", "5216.5900", "5110.7205", "-$105.87", "01/30 15:00"],
          ].map((row) => (
            <div key={row[0]} className="grid grid-cols-[40px_1fr_1fr_1fr_1fr_1fr] py-1 text-white">
              {row.map((cell, index) => (
                <span key={`${row[0]}-${index}`} className={index === 1 ? (cell === "L" ? "text-teal-400" : "text-red-400") : index === 4 ? (cell.startsWith("+") ? "text-teal-400" : "text-red-400") : ""}>{cell}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrderTicketCrop() {
  return (
    <div className="w-[230px] rounded-xl border border-white/15 bg-[#20242f] p-3 shadow-2xl">
      <div className="mb-3 flex gap-5 text-[11px] text-slate-400"><span className="text-white">Order</span><span>Positions</span><span>History</span></div>
      <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
        <div className="rounded bg-teal-500 py-2 text-center text-white">BUY / LONG</div>
        <div className="rounded border border-red-400/40 bg-red-500/10 py-2 text-center text-red-300">SELL / SHORT</div>
      </div>
      {["Entry Price", "Stop Loss", "Take Profit", "Lot Size"].map((label, index) => (
        <div key={label} className="mt-3">
          <div className="mb-1 text-[10px] text-slate-500">{label}</div>
          <div className="h-7 rounded border border-slate-700 bg-[#111827] px-2 py-1 text-xs text-white">
            {index === 0 ? "5517.02" : index === 3 ? "1" : ""}
          </div>
        </div>
      ))}
      <div className="mt-4 rounded bg-teal-500 py-2 text-center text-xs font-bold text-white">Place Buy Trade</div>
    </div>
  );
}

function AccountStripCrop() {
  return (
    <div className="flex rounded-xl border border-white/15 bg-[#20242f] shadow-2xl">
      {[["BALANCE", "$10172.56", "text-white"], ["P&L", "+$172.56", "text-teal-400"], ["WIN%", "66.7%", "text-white"], ["TRADES", "3", "text-white"]].map(([label, value, color]) => (
        <div key={label} className="border-r border-white/10 px-4 py-2 last:border-r-0">
          <div className="text-[8px] uppercase tracking-wide text-slate-500">{label}</div>
          <div className={`mt-0.5 text-sm font-bold ${color}`}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function TradeTableCrop() {
  return (
    <div className="w-[680px] rounded-xl border border-white/15 bg-[#20242f] p-3 text-[11px] shadow-2xl">
      <div className="grid grid-cols-[48px_1fr_1fr_1fr_1fr_1fr] border-b border-white/10 pb-2 text-slate-500">
        <span>#</span><span>Dir</span><span>Entry</span><span>Exit</span><span>P&L</span><span>Opened</span>
      </div>
      {[
        ["1", "S", "5531.4100", "5412.0302", "+$119.38", "01/30 01:00"],
        ["2", "S", "5378.9400", "5219.8941", "+$159.05", "01/30 09:00"],
        ["3", "L", "5216.5900", "5110.7205", "-$105.87", "01/30 15:00"],
      ].map((row) => (
        <div key={row[0]} className="grid grid-cols-[48px_1fr_1fr_1fr_1fr_1fr] py-2 text-white">
          {row.map((cell, index) => (
            <span key={`${row[0]}-${index}`} className={index === 1 ? (cell === "L" ? "text-teal-400" : "text-red-400") : index === 4 ? (cell.startsWith("+") ? "text-teal-400" : "text-red-400") : ""}>{cell}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

function BacktestingStorySection() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const mainY = useTransform(scrollYProgress, [0, 1], [70, -50]);
  const orderY = useTransform(scrollYProgress, [0, 1], [120, -90]);
  const statsY = useTransform(scrollYProgress, [0, 1], [70, -70]);
  const tableY = useTransform(scrollYProgress, [0, 1], [130, -60]);
  const rotate = useTransform(scrollYProgress, [0, 1], [4, -3]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#050816] px-5 py-24 text-white sm:px-8 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(45,212,191,0.16),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(59,130,246,0.16),transparent_24%),linear-gradient(180deg,#050816_0%,#08111f_50%,#030712_100%)]" />
      <div className="relative mx-auto max-w-[1320px]">
        <div className="mx-auto max-w-[760px] text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-300">Backtesting replay</div>
          <h2 className="mt-4 text-[2.4rem] font-semibold tracking-[-0.05em] sm:text-[3.6rem]">
            Replay the market like a trading desk.
          </h2>
          <p className="mx-auto mt-5 max-w-[62ch] text-base leading-8 text-slate-300">
            The replay room turns historical candles into a training workflow: place orders,
            track P&L, review the table, and build confidence before risking capital.
          </p>
        </div>

        <div className="relative mx-auto mt-16 min-h-[620px] max-w-[1120px] [perspective:1400px]">
          <motion.div style={{ y: mainY, rotateX: rotate }} className="relative mx-auto w-full origin-center">
            <ReplayRoomMock />
          </motion.div>

          <motion.div style={{ y: orderY }} className="absolute right-0 top-24 hidden translate-x-10 rotate-3 lg:block">
            <OrderTicketCrop />
          </motion.div>
          <motion.div style={{ y: statsY }} className="absolute right-20 top-0 hidden -rotate-2 md:block">
            <AccountStripCrop />
          </motion.div>
          <motion.div style={{ y: tableY }} className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 rotate-[-1deg] lg:block">
            <TradeTableCrop />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function JournalStorySection() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], [70, -50]);
  const statsY = useTransform(scrollYProgress, [0, 1], [120, -100]);
  const notesY = useTransform(scrollYProgress, [0, 1], [95, -70]);
  const checklistY = useTransform(scrollYProgress, [0, 1], [150, -80]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#f6f2ed] px-5 py-24 text-stone-950 sm:px-8 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(249,115,22,0.12),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(16,185,129,0.12),transparent_24%)]" />
      <div className="relative mx-auto max-w-[1320px]">
        <div className="mx-auto max-w-[760px] text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">Journal review</div>
          <h2 className="mt-4 text-[2.4rem] font-semibold tracking-[-0.05em] sm:text-[3.5rem]">
            Turn screenshots into trade lessons.
          </h2>
          <p className="mx-auto mt-5 max-w-[62ch] text-base leading-8 text-stone-600">
            Each trade gets a clean evidence board: chart screenshots, execution notes,
            trade statistics, and the checklist that shows whether the setup was followed.
          </p>
        </div>

        <div className="relative mx-auto mt-14 min-h-[660px] max-w-[1120px]">
          <motion.div style={{ y: imageY }} className="w-full">
            <JournalDetailMock />
          </motion.div>
          <motion.div style={{ y: statsY }} className="absolute right-0 top-28 hidden w-[292px] translate-x-10 rotate-2 lg:block">
            <JournalStatsPanel />
          </motion.div>
          <motion.div style={{ y: notesY }} className="absolute bottom-24 left-0 hidden w-[600px] -translate-x-8 -rotate-1 lg:block">
            <JournalNotesPanel />
          </motion.div>
          <motion.div style={{ y: checklistY }} className="absolute bottom-8 right-8 hidden w-[292px] rotate-[-2deg] md:block">
            <JournalChecklistPanel />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-slate-300 bg-slate-50 px-5 py-8 text-slate-700 dark:border-white/10 dark:bg-[#040611] dark:text-slate-300 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div>(c) 2026 Trade Track Pro. Built for traders who review seriously.</div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="font-medium transition-colors hover:text-slate-950 dark:hover:text-white">Sign in</Link>
          <a href="#features" className="font-medium transition-colors hover:text-slate-950 dark:hover:text-white">Features</a>
          <a href="#cta" className="font-medium transition-colors hover:text-slate-950 dark:hover:text-white">Pricing</a>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#040611] dark:text-white">
      <HeroSection />

      <section id="features" className="border-y border-slate-300 bg-slate-100 px-5 py-20 dark:border-white/10 dark:bg-[#07111f] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1320px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-[720px]"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-700 dark:text-orange-200">
              Product surfaces
            </div>
            <h2 className="mt-4 text-[2.3rem] font-semibold tracking-[-0.05em] text-slate-950 dark:text-white sm:text-[3.35rem]">
              A cleaner front door for a serious trading product.
            </h2>
            <p className="mt-5 max-w-[58ch] text-base leading-8 text-slate-700 dark:text-slate-300">
              The goal is not decorative sci-fi. The goal is to make the brand feel sharper,
              more premium, and more trustworthy while still pointing straight at the product
              workflows that matter: journaling, analytics, backtesting, and sync.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {FEATURE_CARDS.map((card, index) => (
              <FeatureCard key={card.title} {...card} delay={index * 0.08} />
            ))}
          </div>
        </div>
      </section>

      <section id="showcase" className="bg-slate-50 px-5 py-20 dark:bg-[#050816] sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-200">
              Showcase
            </div>
            <h2 className="mt-4 text-[2.2rem] font-semibold tracking-[-0.05em] text-slate-950 dark:text-white sm:text-[3.2rem]">
              One review stack. Multiple ways to see the signal.
            </h2>
            <p className="mt-5 max-w-[60ch] text-base leading-8 text-slate-700 dark:text-slate-300">
              The marketing page should feel like a premium extension of the product itself.
              That means glass surfaces, depth, disciplined motion, and panels that communicate
              what the app actually does instead of generic SaaS filler.
            </p>

            <div className="mt-8 space-y-4">
              {SURFACES.map(({ icon: Icon, title, value, detail }, index) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-[24px] border border-slate-300 bg-white p-5 shadow-[0_14px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 dark:bg-white/[0.06]">
                      <Icon className="h-5 w-5 text-orange-600 dark:text-orange-200" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">{title}</h3>
                        <span className="text-xl font-semibold tracking-[-0.03em] text-orange-700 dark:text-orange-200">{value}</span>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{detail}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute inset-x-10 top-0 h-32 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[24px] border border-slate-800 bg-[#050505] p-4 shadow-[0_34px_110px_rgba(0,0,0,0.34)]">
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <img src="/brand/tradetrack-pro-mark-inverted.svg" alt="" className="h-7 w-7 rounded-md" />
                  TradeTrack Markets
                </div>
                <div className="hidden items-center gap-5 text-xs font-semibold text-slate-400 sm:flex">
                  <span>Journal</span>
                  <span>Replay</span>
                  <span>Markets</span>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[18px] border border-white/15 bg-black p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        Performance map
                      </div>
                      <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                        +$24,847
                      </div>
                    </div>
                    <div className="rounded bg-[#089981]/15 px-2.5 py-1 text-xs font-semibold text-[#00c087]">
                      +18.2%
                    </div>
                  </div>
                  <div className="mt-5 h-48 overflow-hidden rounded-[14px] border border-white/10 bg-black">
                    <TradingViewLineChart tone="green" />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      ["Best setup", "London BOS", "text-white"],
                      ["Avg R", "1.48R", "text-[#00c087]"],
                      ["Drawdown", "-3.2%", "text-[#f23645]"],
                    ].map(([label, value, color]) => (
                      <div key={label} className="rounded-[12px] border border-white/10 bg-white/[0.04] px-3 py-2">
                        <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
                        <div className={`mt-1 text-sm font-semibold ${color}`}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[18px] border border-white/15 bg-black p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-semibold text-white">US Dollar index</div>
                        <div className="mt-1 text-xs text-slate-500">DXY · 1 month</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold tabular-nums text-white">98.510</div>
                        <div className="mt-1 text-xs font-medium text-[#f23645]">-1.12%</div>
                      </div>
                    </div>
                    <div className="mt-4 h-28 overflow-hidden rounded-[12px] border border-white/10 bg-black">
                      <TradingViewLineChart tone="red" />
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-white/15 bg-black px-4 py-1">
                    <MarketRow icon="€" name="EUR/USD" tag="FX" price="1.08642" change="+0.42%" positive />
                    <MarketRow icon="₿" name="Bitcoin" tag="BTCUSD" price="78,015" change="+0.48%" positive />
                    <MarketRow icon="Au" name="Gold" tag="XAUUSD" price="4,740.9" change="+0.36%" positive />
                    <MarketRow icon="£" name="FTSE 100" tag="UKX" price="10,379.08" change="-0.75%" positive={false} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <JournalStorySection />

      <BacktestingStorySection />

      <section id="cta" className="border-t border-slate-300 bg-slate-50 px-5 py-20 dark:border-white/10 dark:bg-[#040611] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1320px] overflow-hidden rounded-[38px] border border-slate-300 bg-[radial-gradient(circle_at_20%_20%,rgba(251,146,60,0.16),transparent_22%),radial-gradient(circle_at_80%_24%,rgba(59,130,246,0.12),transparent_20%),linear-gradient(135deg,#ffffff_0%,#f1f5f9_100%)] p-8 shadow-[0_36px_120px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_20%_20%,rgba(251,146,60,0.16),transparent_22%),radial-gradient(circle_at_80%_24%,rgba(59,130,246,0.14),transparent_20%),linear-gradient(135deg,#08111f_0%,#091423_45%,#050816_100%)] dark:shadow-[0_36px_120px_rgba(0,0,0,0.35)] sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-700 dark:text-orange-200">
                Ready to ship
              </div>
              <h2 className="mt-4 max-w-[13ch] text-[2.4rem] font-semibold tracking-[-0.05em] text-slate-950 dark:text-white sm:text-[3.25rem]">
                Turn the first impression into something that feels fund-grade.
              </h2>
              <p className="mt-5 max-w-[58ch] text-base leading-8 text-slate-700 dark:text-slate-300">
                This direction keeps the page premium and cinematic without drifting into noisy
                concept art. The scene stays restrained, the UI stays legible, and the product
                value remains the focal point.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#fb923c,#f97316)] px-6 py-4 text-sm font-semibold text-white shadow-[0_20px_54px_rgba(249,115,22,0.34)]"
              >
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-4 text-sm font-semibold text-slate-950 backdrop-blur-xl hover:border-orange-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
              >
                Review features
              </a>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
