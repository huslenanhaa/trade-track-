/** Trade Track Pro — Marketing light sections
 * Features grid, Equity Curve, Portfolio Donut, Risk Gauge, Top Performers, CTA, Footer.
 */

import React from 'react';
import { BookOpen, BarChart3, FlaskConical, Calculator } from 'lucide-react';
import { Logo } from './Heroes';

const BRAND = '#E8833A';
const INK = '#0E2A24';
const MUTED = '#6B6258';
const CREAM = '#F5EFE6';
const CARD_BG = '#FFFFFF';
const LINE = 'hsl(30 10% 88%)';

const ICONS = {
  'book-open': BookOpen,
  'bar-chart-3': BarChart3,
  'flask-conical': FlaskConical,
  'calculator': Calculator,
};

function Container({ children, maxWidth = 1200, style }) {
  return <div style={{ maxWidth, margin: '0 auto', padding: '0 40px', ...style }}>{children}</div>;
}

function SectionHead({ eyebrow, title, subtitle, center }) {
  return (
    <div style={{ textAlign: center ? 'center' : 'left', maxWidth: center ? 720 : 'none', margin: center ? '0 auto' : undefined }}>
      {eyebrow && (
        <div style={{
          display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: BRAND, marginBottom: 14,
        }}>{eyebrow}</div>
      )}
      <h2 style={{
        fontSize: 42, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.08,
        color: INK, margin: '0 0 14px',
      }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 16, color: MUTED, margin: 0, lineHeight: 1.55 }}>{subtitle}</p>}
    </div>
  );
}

/* ─── Features grid ─────────────────────────────────────── */
export function Features() {
  const items = [
    { icon: 'book-open',    t: 'Frictionless journaling',    d: 'Log a trade in 30 seconds. Tags, screenshots, R-multiple, session, strategy — captured once, queryable forever.' },
    { icon: 'bar-chart-3',  t: 'Analytics that answer',      d: 'Filter P&L by session, weekday, symbol, strategy. See where your real edge lives — and where it leaks.' },
    { icon: 'flask-conical', t: 'Replay historical candles', d: 'Build a backtesting session, step through bar by bar, simulate entries. Build reps before you risk capital.' },
    { icon: 'calculator',   t: 'Position sizing, done right', d: 'Risk calculator with SL/TP, RR, leverage. Size the trade before you take it — never again accidentally over-risk.' },
  ];
  return (
    <section style={{ background: CARD_BG, padding: '100px 0' }}>
      <Container>
        <SectionHead
          eyebrow="Features"
          title={<>Everything you need<br/>to identify your <span style={{ color: BRAND }}>edge.</span></>}
          subtitle="Four surfaces, one purpose: turn every trade into a data point, and every week into a review you can learn from."
          center
        />
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginTop: 56,
        }}>
          {items.map(f => {
            const Icon = ICONS[f.icon];
            return (
              <div key={f.t} style={{
                background: CREAM, border: `1px solid ${LINE}`, borderRadius: 20, padding: 28,
                transition: 'all 200ms',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: 'rgba(232,131,58,0.12)', color: BRAND,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  {Icon && <Icon style={{ width: 20, height: 20 }} />}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 8, letterSpacing: '-0.01em' }}>{f.t}</div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.55 }}>{f.d}</div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ─── Equity curve card ─────────────────────────────────── */
function EquityCard() {
  const points = [
    [0, 45], [6, 44], [12, 48], [18, 40], [24, 43], [30, 36],
    [36, 38], [42, 30], [48, 34], [54, 26], [60, 22], [66, 28],
    [72, 18], [78, 20], [84, 12], [90, 14], [100, 8],
  ];
  const W = 640, H = 260, pad = { l: 40, r: 20, t: 20, b: 30 };
  const path = points.map((p, i) => {
    const x = pad.l + (p[0] / 100) * (W - pad.l - pad.r);
    const y = pad.t + (p[1] / 60) * (H - pad.t - pad.b);
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');
  const area = `${path} L${W - pad.r},${H - pad.b} L${pad.l},${H - pad.b} Z`;
  return (
    <div style={{
      background: CARD_BG, border: `1px solid ${LINE}`, borderRadius: 20, padding: 24,
      boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED, marginBottom: 6 }}>Equity curve · YTD</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: INK, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>+$24,847</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#16A34A', background: '#DCFCE7', padding: '3px 8px', borderRadius: 8 }}>+18.2%</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', padding: 4, borderRadius: 10 }}>
          {['1M','3M','6M','YTD','ALL'].map((p, i) => (
            <button key={p} style={{
              padding: '6px 12px', borderRadius: 8, border: 0,
              background: i === 3 ? CARD_BG : 'transparent',
              color: i === 3 ? INK : MUTED, fontSize: 11, fontWeight: 600,
              fontFamily: 'inherit', cursor: 'pointer',
              boxShadow: i === 3 ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}>{p}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        <defs>
          <linearGradient id="eq-fill-mkt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND} stopOpacity="0.28" />
            <stop offset="100%" stopColor={BRAND} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map(i => (
          <line key={i} x1={pad.l} x2={W - pad.r}
            y1={pad.t + i * ((H - pad.t - pad.b) / 3)} y2={pad.t + i * ((H - pad.t - pad.b) / 3)}
            stroke={LINE} strokeDasharray="3 3" />
        ))}
        {[0, 1, 2, 3].map(i => (
          <text key={i} x={pad.l - 8} y={pad.t + i * ((H - pad.t - pad.b) / 3) + 4}
            fontSize="10" fill={MUTED} textAnchor="end">
            {['$30k','$22k','$14k','$6k'][i]}
          </text>
        ))}
        <path d={area} fill="url(#eq-fill-mkt)" />
        <path d={path} fill="none" stroke={BRAND} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {['Jan','Mar','May','Jul','Sep','Nov'].map((m, i) => (
          <text key={m} x={pad.l + (i / 5) * (W - pad.l - pad.r)} y={H - 8}
            fontSize="10" fill={MUTED} textAnchor="middle">{m}</text>
        ))}
      </svg>
    </div>
  );
}

/* ─── Portfolio donut ───────────────────────────────────── */
function DonutCard() {
  const slices = [
    { label: 'EURUSD',  pct: 28, color: BRAND },
    { label: 'XAUUSD',  pct: 22, color: '#F5A55B' },
    { label: 'GBPUSD',  pct: 18, color: '#16A34A' },
    { label: 'USDJPY',  pct: 14, color: '#2563EB' },
    { label: 'NAS100',  pct: 10, color: '#8B5CF6' },
    { label: 'Other',   pct: 8,  color: '#6B6258' },
  ];
  let offset = 0;
  const R = 70, C = 2 * Math.PI * R;
  return (
    <div style={{
      background: CARD_BG, border: `1px solid ${LINE}`, borderRadius: 20, padding: 24,
      boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED, marginBottom: 4 }}>Allocation by symbol</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: INK, marginBottom: 20, letterSpacing: '-0.01em' }}>Where your capital goes</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
          <svg viewBox="0 0 180 180" width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
            {slices.map(s => {
              const len = (s.pct / 100) * C;
              const gap = C - len;
              const dash = `${len} ${gap}`;
              const circle = (
                <circle key={s.label} cx="90" cy="90" r={R} fill="none"
                  stroke={s.color} strokeWidth="20"
                  strokeDasharray={dash} strokeDashoffset={-offset} />
              );
              offset += len;
              return circle;
            })}
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: INK, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>142</div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED }}>Trades</div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {slices.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
              <span style={{ flex: 1, fontSize: 12, color: INK, fontWeight: 500 }}>{s.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: INK, fontVariantNumeric: 'tabular-nums' }}>{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Risk gauge (the "72" dial) ────────────────────────── */
function RiskGauge() {
  const score = 72;
  const R = 80, C = Math.PI * R; // half-circle
  const filled = (score / 100) * C;
  return (
    <div style={{
      background: CARD_BG, border: `1px solid ${LINE}`, borderRadius: 20, padding: 24,
      boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED, marginBottom: 4 }}>Risk health</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: INK, marginBottom: 20, letterSpacing: '-0.01em' }}>How disciplined is your risk?</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ position: 'relative', width: 200, height: 120, flexShrink: 0 }}>
          <svg viewBox="0 0 200 120" width="200" height="120">
            <defs>
              <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#DC2626" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#16A34A" />
              </linearGradient>
            </defs>
            <path d={`M 20 100 A ${R} ${R} 0 0 1 180 100`}
              fill="none" stroke="#F3F4F6" strokeWidth="16" strokeLinecap="round" />
            <path d={`M 20 100 A ${R} ${R} 0 0 1 180 100`}
              fill="none" stroke="url(#gauge-grad)" strokeWidth="16" strokeLinecap="round"
              strokeDasharray={`${filled} ${C}`} />
          </svg>
          <div style={{ position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: INK, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1 }}>{score}</div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#16A34A', marginTop: 2 }}>Healthy</div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { k: 'Avg risk per trade', v: '0.8%', tone: '#16A34A' },
            { k: 'Max drawdown',       v: '4.2%', tone: '#16A34A' },
            { k: 'Oversized trades',   v: '3',    tone: '#F59E0B' },
            { k: 'Revenge trades',     v: '0',    tone: '#16A34A' },
          ].map(r => (
            <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: MUTED }}>{r.k}</span>
              <span style={{ fontWeight: 700, color: r.tone, fontVariantNumeric: 'tabular-nums' }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Top performers ────────────────────────────────────── */
function TopPerformers() {
  const rows = [
    { sym: 'XAUUSD', name: 'Gold spot',     pnl: +4220, trades: 18, wr: 72 },
    { sym: 'EURUSD', name: 'Euro / Dollar',  pnl: +3180, trades: 34, wr: 65 },
    { sym: 'GBPUSD', name: 'Cable',          pnl: +2410, trades: 22, wr: 59 },
    { sym: 'USDJPY', name: 'Dollar / Yen',   pnl: +1680, trades: 19, wr: 58 },
    { sym: 'AUDUSD', name: 'Aussie',         pnl:  -340, trades: 9,  wr: 33 },
  ];
  return (
    <div style={{
      background: CARD_BG, border: `1px solid ${LINE}`, borderRadius: 20, padding: 24,
      boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED, marginBottom: 4 }}>Top performers</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: INK, letterSpacing: '-0.01em' }}>Your best instruments, ranked</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: BRAND, cursor: 'pointer' }}>View all →</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rows.map((r, i) => (
          <div key={r.sym} style={{
            display: 'grid', gridTemplateColumns: '28px 1fr auto auto',
            gap: 14, alignItems: 'center',
            padding: '14px 0',
            borderTop: i > 0 ? `1px solid ${LINE}` : 'none',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: CREAM,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: INK,
            }}>{i + 1}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: INK, fontVariantNumeric: 'tabular-nums' }}>{r.sym}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{r.name} · {r.trades} trades · {r.wr}% WR</div>
            </div>
            {/* mini sparkline */}
            <svg width="60" height="24" viewBox="0 0 60 24">
              <polyline points={
                r.pnl > 0
                  ? '0,18 10,15 20,17 30,12 40,13 50,8 60,5'
                  : '0,8 10,10 20,6 30,12 40,10 50,15 60,18'
              } fill="none" stroke={r.pnl > 0 ? '#16A34A' : '#DC2626'} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            <div style={{
              fontSize: 13, fontWeight: 800, textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
              color: r.pnl > 0 ? '#16A34A' : '#DC2626',
              minWidth: 80,
            }}>{r.pnl > 0 ? '+' : '−'}${Math.abs(r.pnl).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── The full analytics block ──────────────────────────── */
export function AnalyticsBlock() {
  return (
    <section style={{ background: CREAM, padding: '100px 0' }}>
      <Container>
        <SectionHead
          eyebrow="Analytics"
          title={<>Your week, <span style={{ color: BRAND }}>graded.</span></>}
          subtitle="Trade Track Pro turns the noise of hundreds of trades into four things you can actually act on."
          center
        />
        <div style={{
          display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18, marginTop: 56,
        }}>
          <EquityCard />
          <DonutCard />
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 18, marginTop: 18,
        }}>
          <RiskGauge />
          <TopPerformers />
        </div>
      </Container>
    </section>
  );
}

/* ─── Testimonial / Quote ─────────────────────────────────── */
export function Quote() {
  return (
    <section style={{ background: CARD_BG, padding: '90px 0' }}>
      <Container maxWidth={900}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, color: BRAND, marginBottom: 20, letterSpacing: '-0.02em' }}>★★★★★</div>
          <div style={{
            fontSize: 30, fontWeight: 600, color: INK, lineHeight: 1.35, letterSpacing: '-0.02em',
            marginBottom: 28,
          }}>
            "I've used three journals before this. Trade Track Pro is the first one I actually open after every session. Finding out 80% of my losses were on Fridays before NFP was worth the subscription alone."
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'linear-gradient(135deg,#E8833A,#C8632A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 13, fontWeight: 800,
            }}>MR</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>Marcus Reyes</div>
              <div style={{ fontSize: 12, color: MUTED }}>Forex trader · 6 years live</div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ─── Final CTA ─────────────────────────────────────────── */
export function FinalCTA() {
  return (
    <section style={{
      background: 'linear-gradient(135deg, #0E2A24 0%, #1A3B33 100%)',
      padding: '90px 0', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 800, borderRadius: '50%',
        background: `radial-gradient(circle, ${BRAND}33 0%, transparent 65%)`, filter: 'blur(40px)',
      }} />
      <Container maxWidth={900} style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <h2 style={{
          fontSize: 52, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05,
          color: '#fff', margin: '0 0 20px',
        }}>
          Start grading your trading <span style={{ color: BRAND }}>this week.</span>
        </h2>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)', maxWidth: 580, margin: '0 auto 32px', lineHeight: 1.5 }}>
          14 days free. No credit card. Import your last 90 days from MT5 or CSV in under a minute.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <a href="/login" style={{
            height: 50, padding: '0 26px', borderRadius: 14, border: 0,
            background: BRAND, color: '#fff', fontSize: 14, fontWeight: 600,
            fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
            boxShadow: `0 8px 30px ${BRAND}66`, textDecoration: 'none',
          }}>Start free trial →</a>
          <button style={{
            height: 50, padding: '0 26px', borderRadius: 14,
            background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, fontWeight: 600,
            fontFamily: 'inherit', cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>Book a demo</button>
        </div>
      </Container>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────── */
export function Footer() {
  const cols = [
    { title: 'Product',   links: ['Features', 'Backtesting', 'Journal', 'Risk Calculator', 'Pricing'] },
    { title: 'Resources', links: ['Blog', 'Trader library', 'Webinars', 'Changelog'] },
    { title: 'Company',   links: ['About', 'Careers', 'Privacy', 'Terms'] },
  ];
  return (
    <footer style={{ background: '#0B1A16', padding: '60px 0 32px', color: 'rgba(255,255,255,0.7)' }}>
      <Container>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40 }}>
          <div>
            <Logo />
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55, marginTop: 16, maxWidth: 280 }}>
              The trading journal built for forex and gold traders who take the game seriously.
            </p>
          </div>
          {cols.map(c => (
            <div key={c.title}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', marginBottom: 14 }}>{c.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {c.links.map(l => (
                  <a key={l} href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>{l}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.4)',
        }}>
          <div>© 2026 Trade Track Pro. All rights reserved.</div>
          <div>Made for forex &amp; gold traders.</div>
        </div>
      </Container>
    </footer>
  );
}
