/** Rotating 3D-ish globe with orbital node markers.
 * CSS-only photorealism is impossible, so we fake it with:
 *  - a deep-blue radial-gradient sphere (ocean)
 *  - an SVG continent overlay (stylized landmasses) that rotates
 *  - latitude / longitude grid lines
 *  - orbital ring(s) with glowing nodes that counter-rotate
 *  - an outer haloed glow
 * Props: size, nodes=[{label,symbol,angle,delay}], speed
 */

import React, { useId } from 'react';

export function Globe({ size = 520, nodes = [], speed = 60, showOrbit = true, tone = 'terracotta' }) {
  const id = useId();
  const brandColor = tone === 'terracotta' ? '#E8833A' : '#F97316';
  const oceanA = '#0a3d5c', oceanB = '#061a2c';
  const continentColor = '#1c5b7a';

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      {/* Outer halo */}
      <div style={{
        position: 'absolute', inset: '-18%', borderRadius: '50%',
        background: `radial-gradient(circle at 50% 50%, ${brandColor}33 0%, transparent 55%)`,
        filter: 'blur(30px)', pointerEvents: 'none',
      }} />

      {/* Orbit ring 1 (tilted) */}
      {showOrbit && (
        <div style={{
          position: 'absolute', inset: '-6%',
          borderRadius: '50%',
          border: `1px dashed ${brandColor}55`,
          transform: 'rotateX(70deg) rotateZ(0deg)',
          animation: `tt-orbit-spin ${speed}s linear infinite`,
        }}>
          {nodes.slice(0, 3).map((n, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: 12, height: 12, marginLeft: -6, marginTop: -6,
              borderRadius: '50%', background: brandColor,
              boxShadow: `0 0 12px ${brandColor}, 0 0 24px ${brandColor}88`,
              transform: `rotate(${(360 / Math.max(nodes.length, 3)) * i}deg) translateX(${size / 2 + size * 0.06}px)`,
            }} />
          ))}
        </div>
      )}

      {/* Orbit ring 2 (different tilt) */}
      {showOrbit && (
        <div style={{
          position: 'absolute', inset: '-2%',
          borderRadius: '50%',
          border: `1px dashed ${brandColor}33`,
          transform: 'rotateX(60deg) rotateY(30deg)',
          animation: `tt-orbit-spin-rev ${speed * 1.3}s linear infinite`,
        }} />
      )}

      {/* The globe itself */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden',
        background: `radial-gradient(circle at 35% 30%, ${oceanA} 0%, ${oceanB} 65%, #020812 100%)`,
        boxShadow: `inset -30px -40px 80px rgba(0,0,0,0.6), inset 20px 25px 60px rgba(100,180,230,0.15), 0 20px 60px rgba(0,0,0,0.5)`,
      }}>
        {/* Rotating continents */}
        <div style={{
          position: 'absolute', inset: 0,
          animation: `tt-globe-rotate ${speed}s linear infinite`,
        }}>
          <svg viewBox="0 0 400 400" width="100%" height="100%" style={{ opacity: 0.85 }}>
            <defs>
              <clipPath id={`${id}-clip`}>
                <circle cx="200" cy="200" r="200" />
              </clipPath>
            </defs>
            <g clipPath={`url(#${id}-clip)`} fill={continentColor}>
              {/* Stylized continents — blob shapes */}
              <path d="M60,120 Q90,100 120,110 Q140,130 135,165 Q120,190 95,185 Q70,175 60,150 Z" />
              <path d="M150,90 Q190,80 220,100 Q240,140 210,170 Q180,180 160,155 Q145,125 150,90 Z" />
              <path d="M250,110 Q290,95 330,120 Q350,155 320,180 Q285,185 260,165 Q245,135 250,110 Z" />
              <path d="M90,220 Q130,210 170,230 Q190,265 160,295 Q120,305 95,280 Q75,250 90,220 Z" />
              <path d="M220,220 Q260,215 290,240 Q305,275 275,300 Q240,310 220,285 Q205,255 220,220 Z" />
              <path d="M320,230 Q345,225 360,250 Q360,280 335,290 Q315,285 310,265 Z" />
              {/* Lat/lng grid */}
              <g stroke="#4a8bb0" strokeWidth="0.5" fill="none" opacity="0.25">
                <ellipse cx="200" cy="200" rx="200" ry="60" />
                <ellipse cx="200" cy="200" rx="200" ry="120" />
                <ellipse cx="200" cy="200" rx="60" ry="200" />
                <ellipse cx="200" cy="200" rx="120" ry="200" />
                <line x1="0" y1="200" x2="400" y2="200" />
                <line x1="200" y1="0" x2="200" y2="400" />
              </g>
            </g>
          </svg>
        </div>

        {/* Static specular highlight */}
        <div style={{
          position: 'absolute', top: '8%', left: '15%', width: '45%', height: '35%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.18) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Floating node pins with labels */}
      {nodes.map((n, i) => {
        const ang = (n.angle || (i * 60)) * Math.PI / 180;
        const r = size * 0.42;
        const x = size / 2 + Math.cos(ang) * r;
        const y = size / 2 + Math.sin(ang) * r;
        return (
          <div key={`pin-${i}`} style={{
            position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)',
            animation: `tt-pulse 2.5s ease-in-out ${n.delay || 0}s infinite`,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'rgba(255,255,255,0.95)',
              boxShadow: `0 4px 14px rgba(0,0,0,0.25), 0 0 0 2px ${brandColor}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, color: '#0E2A24', letterSpacing: '-0.02em',
            }}>{n.symbol}</div>
          </div>
        );
      })}

      <style>{`
        @keyframes tt-globe-rotate { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes tt-orbit-spin { from { transform: rotateX(70deg) rotateZ(0) } to { transform: rotateX(70deg) rotateZ(360deg) } }
        @keyframes tt-orbit-spin-rev { from { transform: rotateX(60deg) rotateY(30deg) rotateZ(360deg) } to { transform: rotateX(60deg) rotateY(30deg) rotateZ(0) } }
        @keyframes tt-pulse { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 1 } 50% { transform: translate(-50%,-50%) scale(1.08); opacity: 0.9 } }
      `}</style>
    </div>
  );
}

export default Globe;
