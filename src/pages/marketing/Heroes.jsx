/** Three hero variations for Trade Track Pro marketing page.
 * All dark. All feature a rotating globe. Each tries a different composition.
 */

import React from 'react';
import { Globe } from './Globe';

export const FX_NODES = [
  { symbol: 'EUR', label: 'EURUSD', angle: -30, delay: 0 },
  { symbol: 'GBP', label: 'GBPUSD', angle: 45,  delay: 0.4 },
  { symbol: 'XAU', label: 'Gold',   angle: 120, delay: 0.8 },
  { symbol: 'JPY', label: 'USDJPY', angle: 200, delay: 1.2 },
  { symbol: 'USD', label: 'DXY',    angle: 260, delay: 1.6 },
];

export function Logo({ color = '#E8833A', textColor = '#fff' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width="32" height="32" viewBox="0 0 64 64">
        <g stroke={color} strokeWidth="8" fill="none" strokeLinecap="butt" strokeLinejoin="miter">
          <path d="M 32 56 L 32 32 Q 32 22 22 22 L 22 18" />
          <path d="M 32 56 L 32 32 Q 32 22 42 22 L 42 18" />
          <path d="M 12 22 L 22 10 L 32 22" />
          <path d="M 32 22 L 42 10 L 52 22" />
        </g>
      </svg>
      <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: textColor }}>
        Trade <span style={{ color }}>Track</span> Pro
      </div>
    </div>
  );
}

function Nav() {
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 40px', position: 'relative', zIndex: 5,
    }}>
      <Logo />
      <div style={{ display: 'flex', gap: 32 }}>
        {['Features', 'Backtesting', 'Pricing', 'Blog'].map(l => (
          <a key={l} href="#" style={{
            color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500, textDecoration: 'none',
          }}>{l}</a>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <a href="/login" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>Sign in</a>
        <a href="/login" style={{
          height: 36, padding: '0 16px', borderRadius: 12, border: 0,
          background: '#E8833A', color: '#fff', fontSize: 13, fontWeight: 600,
          fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
          boxShadow: '0 4px 14px rgba(232,131,58,0.4)', textDecoration: 'none',
        }}>Start free</a>
      </div>
    </nav>
  );
}

/* ─── Variation 1: Centered globe, headline above ───────────── */
export function HeroA() {
  return (
    <section style={{
      position: 'relative', minHeight: 820,
      background: 'radial-gradient(ellipse at top, #0E2A3A 0%, #06121C 45%, #000 100%)',
      overflow: 'hidden',
    }}>
      {/* grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '48px 48px', pointerEvents: 'none',
      }} />
      <Nav />
      <div style={{ textAlign: 'center', padding: '60px 20px 0', position: 'relative', zIndex: 2, maxWidth: 920, margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999,
          background: 'rgba(232,131,58,0.12)', border: '1px solid rgba(232,131,58,0.3)',
          fontSize: 11, fontWeight: 600, color: '#E8833A', letterSpacing: '0.02em', marginBottom: 24,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8833A', boxShadow: '0 0 8px #E8833A' }} />
          Now supporting 60+ forex pairs and metals
        </div>
        <h1 style={{
          fontSize: 68, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.02,
          color: '#fff', margin: '0 0 20px',
        }}>
          The journal traders<br/>open <span style={{ color: '#E8833A' }}>after the close.</span>
        </h1>
        <p style={{
          fontSize: 18, color: 'rgba(255,255,255,0.65)', maxWidth: 620, margin: '0 auto 32px', lineHeight: 1.5,
        }}>
          Log every trade, grade your week, replay candles bar-by-bar. Built for forex and gold traders who take the game seriously.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <a href="/login" style={{
            height: 48, padding: '0 24px', borderRadius: 14, border: 0,
            background: '#E8833A', color: '#fff', fontSize: 14, fontWeight: 600,
            fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
            boxShadow: '0 8px 30px rgba(232,131,58,0.4)', textDecoration: 'none',
          }}>Start free trial →</a>
          <button style={{
            height: 48, padding: '0 24px', borderRadius: 14,
            background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, fontWeight: 600,
            fontFamily: 'inherit', cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>Watch demo</button>
        </div>
      </div>

      <div style={{ marginTop: 40, position: 'relative' }}>
        <Globe size={540} nodes={FX_NODES} speed={80} />
      </div>
    </section>
  );
}

/* ─── Variation 2: Split — copy left, globe right ─────────── */
export function HeroB() {
  return (
    <section style={{
      position: 'relative', minHeight: 780,
      background: 'linear-gradient(135deg, #111C22 0%, #0A1419 50%, #050B10 100%)',
      overflow: 'hidden',
    }}>
      {/* warm gradient blob */}
      <div style={{
        position: 'absolute', top: '10%', right: '-10%', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, #E8833A44 0%, transparent 65%)', filter: 'blur(40px)',
      }} />
      <Nav />
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center',
        padding: '60px 80px', maxWidth: 1320, margin: '0 auto', position: 'relative', zIndex: 2,
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 24,
          }}>
            <span style={{ color: '#E8833A' }}>★</span> Rated 4.9/5 by 12,000+ traders
          </div>
          <h1 style={{
            fontSize: 62, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.02,
            color: '#fff', margin: '0 0 20px',
          }}>
            Your edge is hiding <span style={{ color: '#E8833A' }}>in your own data.</span>
          </h1>
          <p style={{
            fontSize: 17, color: 'rgba(255,255,255,0.6)', maxWidth: 520, margin: '0 0 32px', lineHeight: 1.55,
          }}>
            Trade Track Pro is the journal built for forex and gold traders — log, review, backtest on historical candles, and find the setup that actually works for you.
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
            <a href="/login" style={{
              height: 48, padding: '0 22px', borderRadius: 14, border: 0,
              background: '#E8833A', color: '#fff', fontSize: 14, fontWeight: 600,
              fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
              boxShadow: '0 8px 30px rgba(232,131,58,0.4)', textDecoration: 'none',
            }}>Get started free</a>
            <button style={{
              height: 48, padding: '0 22px', borderRadius: 14,
              background: 'transparent', color: '#fff', fontSize: 14, fontWeight: 600,
              fontFamily: 'inherit', cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>See how it works</button>
          </div>
          {/* Trust metrics */}
          <div style={{ display: 'flex', gap: 32 }}>
            {[
              { v: '2.1M+', l: 'Trades logged' },
              { v: '60+', l: 'FX pairs' },
              { v: '14d', l: 'Free trial' },
            ].map(m => (
              <div key={m.l}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{m.v}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{m.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Globe size={480} nodes={FX_NODES} speed={60} />
        </div>
      </div>
    </section>
  );
}

/* ─── Variation 3: Globe as background, dashboard card floating over ─────── */
export function HeroC() {
  return (
    <section style={{
      position: 'relative', minHeight: 920,
      background: 'radial-gradient(ellipse at center, #0B1F2A 0%, #05101A 60%, #000 100%)',
      overflow: 'hidden',
    }}>
      <Nav />
      {/* Globe positioned as backdrop */}
      <div style={{
        position: 'absolute', top: 120, left: '50%', transform: 'translateX(-50%)',
        opacity: 0.55, filter: 'blur(1px)',
      }}>
        <Globe size={720} nodes={[]} speed={120} showOrbit={true} />
      </div>

      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '60px 20px 20px' }}>
        <h1 style={{
          fontSize: 76, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 0.98,
          color: '#fff', margin: '0 0 16px',
        }}>
          Trade smarter,<br/>
          <span style={{
            background: 'linear-gradient(135deg, #E8833A 0%, #F5A55B 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>not harder.</span>
        </h1>
        <p style={{
          fontSize: 17, color: 'rgba(255,255,255,0.65)', maxWidth: 560, margin: '0 auto 28px', lineHeight: 1.5,
        }}>
          The all-in-one journal for forex and gold traders. Built to help you identify your edge, manage risk, and grow your account consistently.
        </p>
        <a href="/login" style={{
          height: 50, padding: '0 28px', borderRadius: 14, border: 0,
          background: '#E8833A', color: '#fff', fontSize: 14, fontWeight: 600,
          fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
          boxShadow: '0 8px 30px rgba(232,131,58,0.45)', textDecoration: 'none',
        }}>Start free trial</a>
      </div>

      {/* Floating dashboard preview card */}
      <div style={{
        position: 'relative', zIndex: 2, maxWidth: 1100, margin: '60px auto 0', padding: '0 40px',
      }}>
        <div style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 16,
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
        }}>
          {/* Window chrome */}
          <div style={{ display: 'flex', gap: 6, padding: '4px 8px 12px' }}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map(c => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
            ))}
          </div>
          {/* Fake dashboard content */}
          <div style={{
            background: '#fff', borderRadius: 14, padding: 24,
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14,
          }}>
            {[
              { l: 'Net P&L',       v: '+$1,240',  tone: '#16A34A' },
              { l: 'Win Rate',      v: '62%',       tone: '#0E2A24' },
              { l: 'Avg R',         v: '1.48',      tone: '#0E2A24' },
              { l: 'Profit Factor', v: '1.82',      tone: '#0E2A24' },
            ].map(s => (
              <div key={s.l} style={{
                background: '#F5EFE6', borderRadius: 14, padding: 16,
              }}>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B6258' }}>{s.l}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.tone, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
