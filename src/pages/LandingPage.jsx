import React from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp, Search, Bell, ArrowRight, Brain, Shield,
  AlertCircle, Activity,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ── Data ──────────────────────────────────────────────────────────────────────
const perfData = [
  { v: 1800000 }, { v: 2100000 }, { v: 1950000 },
  { v: 2400000 }, { v: 2200000 }, { v: 2600000 }, { v: 2847392 },
];

const allocData = [
  { name: "Bitcoin",  pct: "47.3%", value: 47.3, color: "#f97316" },
  { name: "Ethereum", pct: "23.8%", value: 23.8, color: "#8b5cf6" },
  { name: "Solana",   pct: "15.2%", value: 15.2, color: "#06b6d4" },
  { name: "USDC",     pct: "8.7%",  value: 8.7,  color: "#22c55e" },
  { name: "Others",   pct: "5.0%",  value: 5.0,  color: "#64748b" },
];

const topPerformers = [
  { rank: 1, name: "SOL",  full: "Solana",    change: "+15.8%", price: "$126.45" },
  { rank: 2, name: "AVAX", full: "Avalanche", change: "+12.3%", price: "$45.67"  },
  { rank: 3, name: "MATIC",full: "Polygon",   change: "+8.7%",  price: "$0.98"   },
  { rank: 4, name: "DOT",  full: "Polkadot",  change: "+7.2%",  price: "$8.23"   },
];

const recentTxns = [
  { action: "Buy BTC",  amount: "0.25 BTC", value: "-$10,812.63", time: "2 min ago",    sell: false },
  { action: "Sell ETH", amount: "2.5 ETH",  value: "+$4,256.78",  time: "15 min ago",   sell: true  },
  { action: "Buy SOL",  amount: "10 SOL",   value: "-$1,847.50",  time: "1 hour ago",   sell: false },
  { action: "Buy AVAX", amount: "5 AVAX",   value: "-$567.25",    time: "2 hours ago",  sell: false },
];

const markets = [
  { name: "Bitcoin",   ticker: "BTC",  price: "$43,250.50", change: "+2.45%",  cap: "$848.2B", vol: "$28.4B", up: true  },
  { name: "Ethereum",  ticker: "ETH",  price: "$2,650.75",  change: "+1.87%",  cap: "$318.7B", vol: "$15.2B", up: true  },
  { name: "Solana",    ticker: "SOL",  price: "$126.45",    change: "+4.25%",  cap: "$55.8B",  vol: "$3.2B",  up: true  },
  { name: "Avalanche", ticker: "AVAX", price: "$45.67",     change: "+3.12%",  cap: "$18.7B",  vol: "$1.1B",  up: true  },
  { name: "Cardano",   ticker: "ADA",  price: "$0.48",      change: "-0.85%",  cap: "$17.1B",  vol: "$689M",  up: false },
];

const features = [
  { icon: Activity,     label: "Real-time Analytics",  desc: "Live market data and advanced charts" },
  { icon: Brain,        label: "AI Predictions",        desc: "Machine learning models predict market trends" },
  { icon: Shield,       label: "Smart Portfolio",       desc: "Optimize your portfolio for maximum returns" },
  { icon: AlertCircle,  label: "Risk Management",       desc: "Advanced risk metrics and alerts" },
];

// ── Sub-components ────────────────────────────────────────────────────────────
const Glass = ({ children, style = {}, glow = false }) => (
  <div style={{
    background: "rgba(11, 16, 45, 0.72)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: `1px solid ${glow ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 16,
    ...style,
  }}>
    {children}
  </div>
);

const Stars = () => {
  const pts = Array.from({ length: 130 }, (_, i) => ({
    x: ((i * 137.508) % 100).toFixed(2),
    y: ((i * 97.631)  % 100).toFixed(2),
    r: (((i * 31)  % 10) / 10 + 0.4).toFixed(1),
    o: (((i * 17)  % 6)  / 10 + 0.1).toFixed(1),
  }));
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      {pts.map((p, i) => <circle key={i} cx={`${p.x}%`} cy={`${p.y}%`} r={p.r} fill="white" opacity={p.o} />)}
    </svg>
  );
};

const CandleChart = () => {
  const c = [
    { o: 42800, h: 43500, l: 42500, c: 43200 },
    { o: 43200, h: 43800, l: 43000, c: 43600 },
    { o: 43600, h: 43900, l: 43100, c: 43300 },
    { o: 43300, h: 43700, l: 43000, c: 43500 },
    { o: 43500, h: 44000, l: 43200, c: 43800 },
    { o: 43800, h: 44200, l: 43400, c: 43250 },
    { o: 43250, h: 43600, l: 43000, c: 43450 },
  ];
  const all = c.flatMap(x => [x.h, x.l]);
  const mn = Math.min(...all), mx = Math.max(...all);
  const W = 160, H = 70, cw = W / c.length;
  const sy = v => H - ((v - mn) / (mx - mn)) * H;
  return (
    <svg width={W} height={H}>
      {c.map((x, i) => {
        const up = x.c >= x.o;
        const col = up ? "#22c55e" : "#ef4444";
        const px = i * cw + cw / 2;
        return (
          <g key={i}>
            <line x1={px} y1={sy(x.h)} x2={px} y2={sy(x.l)} stroke={col} strokeWidth={1} opacity={0.7} />
            <rect x={px - cw * 0.28} y={sy(Math.max(x.o, x.c))} width={cw * 0.56}
              height={Math.max(Math.abs(sy(x.o) - sy(x.c)), 1)} fill={col} rx={1} />
          </g>
        );
      })}
    </svg>
  );
};

const Ring = ({ w, h }) => (
  <div style={{
    position: "absolute", top: "50%", left: "50%",
    width: w, height: h,
    marginLeft: -w / 2, marginTop: -h / 2,
    border: "1px solid rgba(100,160,255,0.18)",
    borderRadius: "50%", pointerEvents: "none",
  }} />
);

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ background: "#050817", color: "white", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 64,
        background: "rgba(5,8,23,0.88)", backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", padding: "0 28px", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "hsl(24,95%,53%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(249,115,22,.4)" }}>
            <TrendingUp size={16} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-.3px" }}>
            Trade <span style={{ color: "hsl(24,95%,53%)" }}>Track</span> Pro
          </span>
        </div>

        <div style={{ flex: 1, maxWidth: 400, display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "8px 12px" }}>
          <Search size={13} color="rgba(255,255,255,0.3)" />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>Search assets, transactions, markets...</span>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bell size={15} color="rgba(255,255,255,0.6)" />
            <div style={{ position: "absolute", top: 8, right: 8, width: 6, height: 6, borderRadius: "50%", background: "#fb923c" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "5px 12px" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>A</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600 }}>Alex Johnson</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>Premium Trader</div>
            </div>
          </div>
          <Link to="/login" style={{ fontSize: 13, fontWeight: 600, background: "hsl(24,95%,53%)", color: "white", padding: "8px 18px", borderRadius: 10, textDecoration: "none", boxShadow: "0 4px 14px rgba(249,115,22,.3)" }}>
            Get Started
          </Link>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 64, minHeight: "100vh", position: "relative", overflow: "hidden" }}>
        {/* Galaxy BG */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 15% 60%, rgba(76,29,149,.22) 0%, transparent 45%), radial-gradient(ellipse at 85% 15%, rgba(29,78,216,.18) 0%, transparent 45%), radial-gradient(ellipse at 50% 90%, rgba(4,120,87,.1) 0%, transparent 40%)",
          }} />
          <Stars />
        </div>

        {/* Stats bar */}
        <div style={{ position: "relative", zIndex: 10, background: "rgba(5,8,23,.55)", borderBottom: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(8px)" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "10px 28px", display: "flex", gap: 44, overflowX: "auto" }}>
            {[
              { label: "Total Portfolio Value", value: "$2,847,392.45", change: "+24.5% 24h", up: true  },
              { label: "Total Profit",           value: "$562,392.45",   change: "+19.8% 24h", up: true  },
              { label: "24h Volume",             value: "$1,243,782,126",change: "+12.4% 24h", up: true  },
              { label: "Market Cap",             value: "$2.45 T",       change: "+8.6% 24h",  up: true  },
              { label: "BTC Dominance",          value: "52.6%",         change: "-1.2% 24h",  up: false },
            ].map(s => (
              <div key={s.label} style={{ flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 3 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: s.up ? "#34d399" : "#f87171", marginTop: 2 }}>{s.change}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 3-column dashboard hero */}
        <div style={{
          position: "relative", zIndex: 10,
          maxWidth: 1280, margin: "0 auto", padding: "28px 24px",
          display: "grid", gridTemplateColumns: "290px 1fr 290px", gap: 20,
          minHeight: "calc(100vh - 130px)", alignItems: "center",
        }}>

          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Portfolio allocation */}
            <Glass style={{ padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 10, color: "rgba(255,255,255,.8)" }}>Portfolio Allocation</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <PieChart width={88} height={88}>
                  <Pie data={allocData} dataKey="value" innerRadius={24} outerRadius={40} strokeWidth={0}>
                    {allocData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
                <div style={{ flex: 1 }}>
                  {allocData.map(a => (
                    <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,.55)", flex: 1 }}>{a.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 600 }}>{a.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Glass>

            {/* BTC/USDT chart */}
            <Glass style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(249,115,22,.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#f97316" }}>₿</div>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>BTC/USDT</span>
                </div>
                <span style={{ fontSize: 10, color: "#34d399", fontWeight: 600 }}>+2.45%</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>$43,250.50</div>
              <CandleChart />
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                {["1H","4H","1D","1W","1M","1Y"].map(t => (
                  <button key={t} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 5, background: t === "1D" ? "rgba(99,102,241,.22)" : "transparent", color: t === "1D" ? "#818cf8" : "rgba(255,255,255,.28)", border: "none", cursor: "pointer" }}>{t}</button>
                ))}
              </div>
            </Glass>

            {/* AI Predictions */}
            <Glass glow style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(139,92,246,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Brain size={14} color="#a78bfa" />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600 }}>AI Predictions</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#34d399", marginBottom: 2 }}>Strong Buy</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.38)", marginBottom: 10 }}>Confidence: 87.2%</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.45)" }}>BTC Price Target</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
                <span style={{ fontSize: 18, fontWeight: 700 }}>$48,500</span>
                <span style={{ fontSize: 11, color: "#34d399" }}>+12.1%</span>
              </div>
            </Glass>
          </div>

          {/* CENTER */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            {/* Top charts row */}
            <div style={{ display: "flex", gap: 12, width: "100%" }}>
              {/* Market Sentiment */}
              <Glass style={{ padding: 14, flex: "0 0 148px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Market Sentiment</div>
                <svg viewBox="0 0 100 55" style={{ width: "100%" }}>
                  <defs>
                    <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%"   stopColor="#ef4444" />
                      <stop offset="50%"  stopColor="#f97316" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                  <path d="M10,48 A38,38 0 0,1 90,48" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" strokeLinecap="round" />
                  <path d="M10,48 A38,38 0 0,1 90,48" fill="none" stroke="url(#sg)" strokeWidth="7" strokeLinecap="round" strokeDasharray="118 160" />
                  <text x="50" y="47" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">78</text>
                </svg>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginTop: 2 }}>
                  <span style={{ color: "#ef4444" }}>Fear</span>
                  <span style={{ color: "#22c55e", fontWeight: 600 }}>Greed</span>
                  <span style={{ color: "rgba(255,255,255,.35)" }}>100</span>
                </div>
              </Glass>

              {/* 24h Performance */}
              <Glass style={{ padding: 14, flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>24h Performance</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#34d399" }}>+24.5%</span>
                  <span style={{ fontSize: 11, color: "#34d399" }}>+$582,392.45</span>
                </div>
                <ResponsiveContainer width="100%" height={58}>
                  <AreaChart data={perfData}>
                    <defs>
                      <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="#06b6d4" strokeWidth={1.5} fill="url(#pg)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </Glass>
            </div>

            {/* Earth globe */}
            <div style={{ position: "relative", width: 260, height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ring w={420} h={100} />
              <Ring w={330} h={78}  />
              <Ring w={250} h={58}  />
              {/* Globe */}
              <div style={{
                width: 210, height: 210, borderRadius: "50%",
                background: "radial-gradient(circle at 35% 35%, #1e4d8c 0%, #0d2a5f 30%, #061540 60%, #02091a 100%)",
                boxShadow: "0 0 80px rgba(29,78,216,.55), 0 0 160px rgba(29,78,216,.15), inset -20px -20px 50px rgba(0,0,0,.55)",
                position: "relative", overflow: "hidden", flexShrink: 0,
              }}>
                {/* Continent blobs */}
                <div style={{ position: "absolute", top: "26%", left: "16%", width: "28%", height: "22%", background: "rgba(34,197,94,.18)", borderRadius: "50% 40% 60% 30%", filter: "blur(4px)" }} />
                <div style={{ position: "absolute", top: "16%", left: "50%", width: "34%", height: "40%", background: "rgba(34,197,94,.13)", borderRadius: "40% 60% 30% 50%", filter: "blur(5px)" }} />
                <div style={{ position: "absolute", top: "54%", left: "38%", width: "24%", height: "28%", background: "rgba(34,197,94,.12)", borderRadius: "60% 30% 50% 40%", filter: "blur(4px)" }} />
                <div style={{ position: "absolute", top: "60%", left: "8%",  width: "18%", height: "20%", background: "rgba(34,197,94,.14)", borderRadius: "30% 60% 40% 50%", filter: "blur(3px)" }} />
                {/* City light dots */}
                {[[30,30],[62,24],[46,60],[72,54],[20,50],[55,40]].map(([x,y],i) => (
                  <div key={i} style={{ position: "absolute", top: `${y}%`, left: `${x}%`, width: 2, height: 2, borderRadius: "50%", background: "rgba(255,255,200,0.8)", filter: "blur(.5px)" }} />
                ))}
                {/* Atmosphere */}
                <div style={{ position: "absolute", inset: -10, borderRadius: "50%", boxShadow: "inset 0 0 24px rgba(29,78,216,.5)" }} />
              </div>

              {/* Caption */}
              <div style={{ position: "absolute", bottom: -16, textAlign: "center", width: "130%" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)" }}>Welcome back 👋</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>Track, analyze and grow your trading portfolio in real-time.</div>
              </div>
            </div>

            {/* Recent Transactions */}
            <Glass style={{ padding: 14, width: "100%", marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600 }}>Recent Transactions</span>
                <span style={{ fontSize: 10, color: "#60a5fa", cursor: "pointer" }}>View All</span>
              </div>
              {recentTxns.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < recentTxns.length - 1 ? 8 : 0 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 8, background: t.sell ? "rgba(34,197,94,.15)" : "rgba(99,102,241,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <TrendingUp size={11} color={t.sell ? "#34d399" : "#818cf8"} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 600 }}>{t.action}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,.38)" }}>{t.amount}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: t.sell ? "#34d399" : "#f87171" }}>{t.value}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,.28)" }}>{t.time}</div>
                  </div>
                </div>
              ))}
            </Glass>
          </div>

          {/* RIGHT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Top Performers */}
            <Glass style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600 }}>Top Performers</span>
                <span style={{ fontSize: 10, color: "#60a5fa", cursor: "pointer" }}>View All</span>
              </div>
              {topPerformers.map(t => (
                <div key={t.rank} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)", width: 12 }}>{t.rank}</span>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(99,102,241,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#818cf8", flexShrink: 0 }}>{t.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,.38)" }}>{t.full}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#34d399", fontWeight: 600 }}>{t.change}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,.38)" }}>{t.price}</div>
                  </div>
                </div>
              ))}
            </Glass>

            {/* Trading Statistics */}
            <Glass style={{ padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 12 }}>Trading Statistics</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { label: "Total Trades",  value: "1,247", color: "white"    },
                  { label: "Win Rate",       value: "68.4%", color: "#34d399"  },
                  { label: "Profit Factor",  value: "2.34",  color: "#60a5fa"  },
                  { label: "Sharpe Ratio",   value: "1.87",  color: "#a78bfa"  },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,.38)", marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </Glass>

            {/* Risk Analysis */}
            <Glass style={{ padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 10 }}>Risk Analysis</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <svg viewBox="0 0 60 60" style={{ width: 56, height: 56, flexShrink: 0 }}>
                  <circle cx="30" cy="30" r="22" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
                  <circle cx="30" cy="30" r="22" fill="none" stroke="#f97316" strokeWidth="6"
                    strokeDasharray="80 138" strokeLinecap="round" transform="rotate(-90 30 30)" />
                  <text x="30" y="35" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">72</text>
                </svg>
                <div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)" }}>Risk Score</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#f97316" }}>Medium Risk</div>
                </div>
              </div>
              {[
                { label: "Market Volatility",   level: "High",   color: "#f87171" },
                { label: "Portfolio Diversity",  level: "Medium", color: "#fbbf24" },
                { label: "Liquidity Risk",       level: "Low",    color: "#34d399" },
                { label: "Correlation Risk",     level: "Medium", color: "#fbbf24" },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,.45)" }}>{r.label}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: r.color }}>{r.level}</span>
                </div>
              ))}
            </Glass>
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 28px", background: "rgba(8,12,35,.88)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 36, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: "0 0 260px" }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.25, marginBottom: 12 }}>Everything you need<br />to succeed in trading</h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.45)", lineHeight: 1.65, marginBottom: 20 }}>Powerful tools and insights to help you make smarter trading decisions.</p>
            <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(249,115,22,.1)", border: "1px solid rgba(249,115,22,.3)", color: "hsl(24,95%,53%)", fontSize: 13, fontWeight: 600, padding: "10px 20px", borderRadius: 12, textDecoration: "none" }}>
              Explore Features
            </Link>
          </div>
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, minWidth: 280 }}>
            {features.map(f => (
              <Glass key={f.label} glow style={{ padding: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(139,92,246,.16)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <f.icon size={18} color="#a78bfa" />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{f.label}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.42)", lineHeight: 1.55 }}>{f.desc}</div>
              </Glass>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARKET OVERVIEW ────────────────────────────────────────────────── */}
      <section style={{ padding: "60px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Market Overview</h2>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,.38)" }}>Stay updated with the latest market movements</p>
            </div>
            <Link to="/login" style={{ fontSize: 12, color: "#60a5fa", textDecoration: "none" }}>View All Markets →</Link>
          </div>
          <Glass>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                  {["Asset","Price","24h Change","Market Cap","24h Volume"].map((h,i) => (
                    <th key={h} style={{ textAlign: i === 0 ? "left" : "right", padding: "12px 16px", fontSize: 10, color: "rgba(255,255,255,.38)", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {markets.map(m => (
                  <tr key={m.ticker} style={{ borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(99,102,241,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#818cf8" }}>{m.ticker[0]}</div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{m.name}</div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,.38)" }}>{m.ticker}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", padding: "12px 16px", fontSize: 12, fontWeight: 600 }}>{m.price}</td>
                    <td style={{ textAlign: "right", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: m.up ? "#34d399" : "#f87171" }}>{m.change}</td>
                    <td style={{ textAlign: "right", padding: "12px 16px", fontSize: 11, color: "rgba(255,255,255,.55)" }}>{m.cap}</td>
                    <td style={{ textAlign: "right", padding: "12px 16px", fontSize: 11, color: "rgba(255,255,255,.55)" }}>{m.vol}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Glass>
        </div>
      </section>

      {/* ── PORTFOLIO + PROMO ──────────────────────────────────────────────── */}
      <section style={{ padding: "0 28px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Glass style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Your Portfolio Allocation</h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,.38)", marginBottom: 20 }}>Diversified across multiple assets</p>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <PieChart width={130} height={130}>
                  <Pie data={allocData} dataKey="value" innerRadius={42} outerRadius={60} strokeWidth={0}>
                    {allocData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>$2.84M</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,.38)" }}>Total Value</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {allocData.map(a => (
                  <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,.65)", flex: 1 }}>{a.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{a.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </Glass>

          <Glass glow style={{ padding: 24, position: "relative", overflow: "hidden", background: "rgba(15,10,45,.8)" }}>
            <div style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", fontSize: 90, opacity: 0.22, userSelect: "none", pointerEvents: "none" }}>🚀</div>
            <div style={{ position: "relative" }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.25, marginBottom: 12 }}>Ready to take<br />your trading to<br />the next level?</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginBottom: 22 }}>Unlock advanced features with Trade Track Pro</p>
              <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "hsl(24,95%,53%)", color: "white", fontSize: 13, fontWeight: 600, padding: "11px 22px", borderRadius: 12, textDecoration: "none", boxShadow: "0 4px 20px rgba(249,115,22,.38)" }}>
                Start for Free <ArrowRight size={14} />
              </Link>
            </div>
          </Glass>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{ padding: "44px 28px 24px", background: "rgba(3,5,18,.96)", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr 1fr", gap: 32, marginBottom: 32 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: 8, background: "hsl(24,95%,53%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TrendingUp size={12} color="white" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Trade <span style={{ color: "hsl(24,95%,53%)" }}>Track</span> Pro</span>
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,.38)", lineHeight: 1.65, marginBottom: 14 }}>Your all-in-one platform for trading analytics and portfolio management.</p>
              <div style={{ display: "flex", gap: 8 }}>
                {["𝕏","T","▶","⊕"].map(icon => (
                  <div key={icon} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 11 }}>{icon}</div>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Stay Updated</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,.38)", lineHeight: 1.65, marginBottom: 12 }}>Get the latest trading market insights and platform updates</p>
              <div style={{ display: "flex", gap: 6 }}>
                <input readOnly placeholder="Enter your email" style={{ flex: 1, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "8px 12px", color: "rgba(255,255,255,.55)", fontSize: 11, outline: "none" }} />
                <button style={{ background: "hsl(24,95%,53%)", color: "white", fontSize: 11, fontWeight: 600, padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer" }}>Subscribe</button>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Quick Links</p>
              {["About Us","Help Center","Privacy Policy","Terms of Service"].map(l => (
                <p key={l} style={{ fontSize: 11, color: "rgba(255,255,255,.38)", marginBottom: 8, cursor: "pointer" }}>{l}</p>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Support</p>
              {["Contact Us","Live Chat","System Status","API Documentation"].map(l => (
                <p key={l} style={{ fontSize: 11, color: "rgba(255,255,255,.38)", marginBottom: 8, cursor: "pointer" }}>{l}</p>
              ))}
            </div>
          </div>
          <div style={{ paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.05)", display: "flex", justifyContent: "space-between" }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,.28)" }}>© {new Date().getFullYear()} Trade Track Pro. All rights reserved.</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,.28)" }}>Made with ❤️ for traders</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
