import { useState, useEffect, useMemo, useRef } from 'react'
import { AGENT_PALETTES } from './PixelAgent'
import SpeechBubble from './SpeechBubble'

const BUILDINGS = [
  { key: 'receiver',   name: 'INBOX',       x: 10, y: 48 },
  { key: 'classifier', name: 'CLASSIFY',   x: 30, y: 16 },
  { key: 'urgency',    name: 'PRIORITY',   x: 50, y: 56 },
  { key: 'replier',    name: 'DRAFT',      x: 70, y: 16 },
  { key: 'sender',     name: 'OUTBOX',     x: 90, y: 48 },
]

const TREES = [
  { x: 3, y: 18, s: 0.9 },
  { x: 3, y: 74, s: 0.7 },
  { x: 22, y: 40, s: 0.6 },
  { x: 42, y: 8, s: 0.8 },
  { x: 58, y: 8, s: 0.65 },
  { x: 40, y: 80, s: 0.55 },
  { x: 62, y: 80, s: 0.7 },
  { x: 80, y: 40, s: 0.6 },
  { x: 97, y: 18, s: 0.65 },
  { x: 97, y: 74, s: 0.75 },
  { x: 18, y: 76, s: 0.5 },
  { x: 82, y: 76, s: 0.55 },
]

const BUSHES = [
  { x: 15, y: 30, s: 0.7 },
  { x: 38, y: 70, s: 0.6 },
  { x: 55, y: 36, s: 0.5 },
  { x: 75, y: 36, s: 0.6 },
  { x: 92, y: 62, s: 0.5 },
]

const FLOWERS = [
  { x: 8, y: 60, c: '#ff6b9d' },
  { x: 25, y: 55, c: '#ffd700' },
  { x: 35, y: 30, c: '#ff6b9d' },
  { x: 45, y: 78, c: '#87ceeb' },
  { x: 65, y: 42, c: '#ffd700' },
  { x: 75, y: 68, c: '#ff6b9d' },
  { x: 88, y: 30, c: '#87ceeb' },
  { x: 12, y: 85, c: '#ffd700' },
  { x: 52, y: 4, c: '#ff6b9d' },
  { x: 93, y: 85, c: '#87ceeb' },
]

const ROCKS = [
  { x: 6, y: 40, s: 0.8 },
  { x: 46, y: 36, s: 0.6 },
  { x: 78, y: 60, s: 0.7 },
  { x: 28, y: 82, s: 0.5 },
  { x: 68, y: 82, s: 0.6 },
]

// Small pond near the village center
const POND = { x: 48, y: 36 }

function getState(o) {
  if (!o) return { status: 'idle', message: '' }
  if (typeof o === 'string') return { status: o, message: '' }
  return { status: o.status || 'idle', message: o.message || '' }
}

function Building({ color, dark, state, type }) {
  const active = state === 'working' || state === 'done'
  const winColor = active ? '#ffe066' : '#1a2a3a'
  const glow = state === 'working'
    ? `drop-shadow(0 0 12px ${color})`
    : state === 'done'
    ? 'drop-shadow(0 0 8px #00e676)'
    : 'none'

  return (
    <svg viewBox="0 0 60 52" width={60} height={52}
      style={{ imageRendering: 'pixelated', filter: glow, display: 'block' }}>
      {/* Walls */}
      <rect x="4" y="20" width="52" height="28" fill="#2a2a4a" stroke="#1a1a3a" strokeWidth="0.5" />

      {/* Roof */}
      <polygon points="-1,22 30,3 61,22" fill={dark} />
      <polygon points="0,22 30,5 60,22" fill={color} />

      {/* Chimney */}
      <rect x="40" y="6" width="6" height="12" fill={dark} />

      {/* Smoke when working */}
      {state === 'working' && (
        <g>
          <circle cx="43" cy="2" r="2" fill="rgba(200,200,200,0.5)">
            <animate attributeName="cy" values="2;-10" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="45" cy="-1" r="2.5" fill="rgba(200,200,200,0.4)">
            <animate attributeName="cy" values="-1;-14" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="41" cy="4" r="1.5" fill="rgba(200,200,200,0.3)">
            <animate attributeName="cy" values="4;-8" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* Door */}
      <rect x="23" y="32" width="14" height="16" fill={active ? '#3a2a1a' : '#1a1a2a'} rx="1" />
      <circle cx="35" cy="42" r="1.2" fill={active ? '#ffd700' : '#333'} />
      {active && <rect x="23" y="32" width="14" height="16" fill={color} opacity="0.12" rx="1" />}

      {/* Windows */}
      <rect x="7" y="25" width="12" height="10" fill={winColor} stroke="#1a1a3a" strokeWidth="0.5" />
      <rect x="41" y="25" width="12" height="10" fill={winColor} stroke="#1a1a3a" strokeWidth="0.5" />
      <line x1="7" y1="30" x2="19" y2="30" stroke="#1a1a3a" strokeWidth="0.4" />
      <line x1="13" y1="25" x2="13" y2="35" stroke="#1a1a3a" strokeWidth="0.4" />
      <line x1="41" y1="30" x2="53" y2="30" stroke="#1a1a3a" strokeWidth="0.4" />
      <line x1="47" y1="25" x2="47" y2="35" stroke="#1a1a3a" strokeWidth="0.4" />

      {/* Window glow */}
      {active && (
        <>
          <rect x="7" y="25" width="12" height="10" fill={color} opacity="0.3" />
          <rect x="41" y="25" width="12" height="10" fill={color} opacity="0.3" />
        </>
      )}

      {/* Type-specific accessory */}
      {type === 'receiver' && (
        <g>
          <rect x="56" y="36" width="5" height="8" fill="#3366cc" rx="0.5" />
          <rect x="55" y="34" width="7" height="3" fill="#3366cc" rx="0.5" />
          <rect x="57" y="44" width="2" height="5" fill="#555" />
          <rect x="61" y="38" width="2" height="1" fill="#ff4444" opacity={active ? 1 : 0.3} />
        </g>
      )}
      {type === 'classifier' && (
        <g>
          <circle cx="-2" cy="10" r="6" fill="none" stroke="#555" strokeWidth="1" />
          <circle cx="-2" cy="10" r="4" fill="none" stroke={active ? color : '#333'} strokeWidth="1.5" />
          <rect x="-6" y="8" width="8" height="1" fill={active ? color : '#555'} />
          {active && <circle cx="-2" cy="10" r="2" fill={color} opacity="0.3" />}
        </g>
      )}
      {type === 'urgency' && (
        <g>
          <rect x="-5" y="22" width="6" height="20" fill="#333" rx="1" />
          <rect x="-4" y="24" width="4" height="6" fill={active ? '#ff1744' : '#440000'} rx="0.5">
            {active && <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" />}
          </rect>
          <rect x="-4" y="32" width="4" height="4" fill={active ? '#ffd600' : '#332200'} rx="0.5" />
          <rect x="-4" y="38" width="4" height="2" fill={active ? '#00e676' : '#002200'} rx="0.5" />
        </g>
      )}
      {type === 'replier' && (
        <g>
          <rect x="6" y="48" width="48" height="3" fill="#2a2a4a" rx="0.5" />
          <rect x="8" y="46" width="12" height="3" fill={active ? '#335' : '#222'} rx="0.5" />
          <rect x="22" y="46" width="12" height="3" fill={active ? '#335' : '#222'} rx="0.5" />
          <rect x="36" y="46" width="12" height="3" fill={active ? '#335' : '#222'} rx="0.5" />
          {active && (
            <rect x="8" y="46" width="4" height="2" fill={color} opacity="0.6" rx="0.5">
              <animate attributeName="x" values="8;22;36;8" dur="0.6s" repeatCount="indefinite" />
            </rect>
          )}
        </g>
      )}
      {type === 'sender' && (
        <g>
          <polygon points="58,20 66,26 58,32" fill={active ? '#66bb6a' : '#2a4a2a'} opacity={active ? 1 : 0.5}>
            {active && <animate attributeName="opacity" values="1;0.4;1" dur="0.5s" repeatCount="indefinite" />}
          </polygon>
          <polygon points="54,22 62,26 54,30" fill={active ? '#90e094' : '#1a3a1a'} opacity={active ? 0.6 : 0.3} />
        </g>
      )}
    </svg>
  )
}

function Tree({ s = 1 }) {
  return (
    <svg viewBox="0 0 18 26" width={18 * s} height={26 * s} style={{ imageRendering: 'pixelated' }}>
      <circle cx="9" cy="8" r="7" fill="#1a4a1a" />
      <circle cx="9" cy="10" r="5.5" fill="#2a6a2a" />
      <circle cx="7" cy="7" r="3.5" fill="#3a7a3a" opacity="0.8" />
      <circle cx="12" cy="9" r="2" fill="#2d5d2d" opacity="0.6" />
      <rect x="7" y="15" width="4" height="8" fill="#4a2a0a" />
    </svg>
  )
}

function Bush({ s = 1 }) {
  return (
    <svg viewBox="0 0 16 10" width={16 * s} height={10 * s} style={{ imageRendering: 'pixelated' }}>
      <ellipse cx="5" cy="6" rx="5" ry="4" fill="#1a4a1a" />
      <ellipse cx="11" cy="6" rx="5" ry="3.5" fill="#2a5a2a" />
      <ellipse cx="8" cy="5" rx="4" ry="3" fill="#3a6a3a" opacity="0.7" />
    </svg>
  )
}

function Flower({ color }) {
  return (
    <svg viewBox="0 0 8 10" width={8} height={10} style={{ imageRendering: 'pixelated' }}>
      <rect x="3" y="5" width="2" height="5" fill="#2a6a2a" />
      <circle cx="4" cy="4" r="2.5" fill={color} opacity="0.9" />
      <circle cx="4" cy="4" r="1" fill="#fff" opacity="0.6" />
    </svg>
  )
}

function Rock({ s = 1 }) {
  return (
    <svg viewBox="0 0 12 8" width={12 * s} height={8 * s} style={{ imageRendering: 'pixelated' }}>
      <ellipse cx="6" cy="5" rx="5.5" ry="3" fill="#3a3a4a" />
      <ellipse cx="5" cy="4" rx="3" ry="2" fill="#4a4a5a" opacity="0.6" />
      <rect x="2" y="3" width="2" height="1" fill="#5a5a6a" opacity="0.4" />
    </svg>
  )
}

function Pond() {
  return (
    <svg viewBox="0 0 40 20" width={48} height={24} style={{ imageRendering: 'pixelated' }}>
      <ellipse cx="20" cy="10" rx="18" ry="9" fill="#0a2a4a" />
      <ellipse cx="20" cy="10" rx="15" ry="7" fill="#0d3a6a" />
      <ellipse cx="18" cy="9" rx="8" ry="4" fill="#1a4a8a" opacity="0.5" />
      {/* Ripple */}
      <ellipse cx="20" cy="10" rx="10" ry="5" fill="none" stroke="#3a6a9a" strokeWidth="0.3" opacity="0.5">
        <animate attributeName="rx" values="6;12;6" dur="3s" repeatCount="indefinite" />
        <animate attributeName="ry" values="3;6;3" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0.1;0.5" dur="3s" repeatCount="indefinite" />
      </ellipse>
      {/* Lily pad */}
      <circle cx="14" cy="8" r="2.5" fill="#2a5a2a" />
      <circle cx="14" cy="8" r="2.5" fill="#3a7a3a" opacity="0.5" />
      <line x1="14" y1="5.5" x2="14" y2="8" stroke="#2a5a2a" strokeWidth="0.3" />
    </svg>
  )
}

function FencePost() {
  return (
    <svg viewBox="0 0 6 10" width={6} height={10} style={{ imageRendering: 'pixelated' }}>
      <rect x="2" y="0" width="2" height="10" fill="#5a3a1a" />
      <rect x="1" y="0" width="4" height="2" fill="#6a4a2a" rx="0.5" />
    </svg>
  )
}

function Postman({ hasLetter, facingRight }) {
  return (
    <svg viewBox="0 0 16 22" width={28} height={38}
      style={{
        imageRendering: 'pixelated',
        display: 'block',
        transform: facingRight ? 'none' : 'scaleX(-1)',
      }}>
      {/* Shadow */}
      <ellipse cx="8" cy="21" rx="5" ry="1.2" fill="rgba(0,0,0,0.35)" />

      {/* Feet */}
      <rect className="pfoot-l" x="3" y="17" width="4" height="3" fill="#1a1a3a" rx="0.5" />
      <rect className="pfoot-r" x="9" y="17" width="4" height="3" fill="#1a1a3a" rx="0.5" />

      {/* Body */}
      <rect x="3" y="9" width="10" height="8" fill="#2255aa" rx="1" />
      <rect x="4" y="10" width="8" height="2.5" fill="#3366cc" rx="0.5" />
      {/* Belt */}
      <rect x="3" y="15" width="10" height="1.5" fill="#1a3366" />

      {/* Arms */}
      <rect x="1" y="10" width="2" height="5" fill="#2255aa" rx="0.5" />
      <rect x="13" y="10" width="2" height="5" fill="#2255aa" rx="0.5" />

      {/* Mail bag */}
      <rect x="12" y="11" width="4" height="4" fill="#8B4513" rx="0.5" />
      <rect x="13" y="12" width="2" height="0.8" fill="#a0652a" />

      {/* Head */}
      <circle cx="8" cy="6" r="3.5" fill="#ffcc99" />

      {/* Hat */}
      <rect x="4" y="2" width="8" height="3" fill="#1a3366" rx="1" />
      <rect x="3" y="4" width="10" height="1.5" fill="#1a3366" />
      <rect x="4" y="2" width="8" height="1" fill="#2244aa" rx="0.5" />

      {/* Eyes */}
      <rect x="6" y="5" width="1" height="1.5" fill="#111" rx="0.3" />
      <rect x="9" y="5" width="1" height="1.5" fill="#111" rx="0.3" />

      {/* Mouth */}
      <rect x="7" y="8" width="2" height="0.5" fill="#cc9977" rx="0.5" />

      {/* Letter being carried */}
      {hasLetter && (
        <g className="carried-letter">
          <rect x="-2" y="12" width="5" height="3.5" fill="#fff" rx="0.5"
            stroke="#4ecdc4" strokeWidth="0.3" />
          <polygon points="-2,12 0.5,13.5 3,12" fill="#e0e0e0" />
          <circle cx="0.5" cy="13" r="0.8" fill="#4ecdc4" opacity="0.9" />
        </g>
      )}
    </svg>
  )
}

export default function PixelWorld({ agentStatus, letterPosition, letterVisible }) {
  const lastXRef = useRef(BUILDINGS[0].x)

  const postmanTarget = useMemo(() => {
    if (letterVisible && letterPosition >= 0 && letterPosition < BUILDINGS.length) {
      return BUILDINGS[letterPosition]
    }
    return BUILDINGS[0]
  }, [letterPosition, letterVisible])

  const facingRight = postmanTarget.x >= lastXRef.current

  useEffect(() => {
    lastXRef.current = postmanTarget.x
  }, [postmanTarget.x])

  const fireflies = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      left: `${(i * 37 + 13) % 100}%`,
      top: `${(i * 23 + 7) % 95}%`,
      delay: `${(i * 0.9) % 5}s`,
      color: i % 4 === 0 ? '#4ecdc4' : i % 4 === 1 ? '#ffa726' : i % 4 === 2 ? '#66bb6a' : '#ab47bc',
    })), [])

  return (
    <div className="pixel-world">
      <div className="tile-floor" />

      {/* Fireflies */}
      <div className="stars">
        {fireflies.map((f, i) => (
          <div key={i} className="star"
            style={{ left: f.left, top: f.top, animationDelay: f.delay, background: f.color }} />
        ))}
      </div>

      {/* Dirt path connecting buildings */}
      <svg className="village-path" viewBox="0 0 100 100" preserveAspectRatio="none">
        {BUILDINGS.slice(0, -1).map((b, i) => {
          const next = BUILDINGS[i + 1]
          const isActive = letterVisible && (letterPosition === i || letterPosition === i + 1)
          return (
            <g key={`p${i}`}>
              {/* Main dirt path */}
              <line x1={b.x} y1={b.y} x2={next.x} y2={next.y}
                stroke="#2a1a0a" strokeWidth="3" strokeLinecap="round"
                vectorEffect="non-scaling-stroke" opacity="0.6" />
              {/* Path texture dots */}
              <line x1={b.x} y1={b.y} x2={next.x} y2={next.y}
                stroke="#3a2a1a" strokeWidth="1.5" strokeLinecap="round"
                vectorEffect="non-scaling-stroke" strokeDasharray="4 8" opacity="0.4" />
              {/* Glow when active */}
              {isActive && (
                <line x1={b.x} y1={b.y} x2={next.x} y2={next.y}
                  stroke="#4ecdc4" strokeWidth="4" strokeLinecap="round"
                  vectorEffect="non-scaling-stroke" opacity="0.12"
                  className="path-glow-line" />
              )}
            </g>
          )
        })}
      </svg>

      {/* Trees */}
      {TREES.map((t, i) => (
        <div key={`t${i}`} className="village-tree"
          style={{ left: `${t.x}%`, top: `${t.y}%` }}>
          <Tree s={t.s} />
        </div>
      ))}

      {/* Bushes */}
      {BUSHES.map((b, i) => (
        <div key={`b${i}`} className="village-tree"
          style={{ left: `${b.x}%`, top: `${b.y}%` }}>
          <Bush s={b.s} />
        </div>
      ))}

      {/* Flowers */}
      {FLOWERS.map((f, i) => (
        <div key={`f${i}`} className="village-tree"
          style={{ left: `${f.x}%`, top: `${f.y}%` }}>
          <Flower color={f.c} />
        </div>
      ))}

      {/* Rocks */}
      {ROCKS.map((r, i) => (
        <div key={`r${i}`} className="village-tree"
          style={{ left: `${r.x}%`, top: `${r.y}%` }}>
          <Rock s={r.s} />
        </div>
      ))}

      {/* Pond */}
      <div className="village-tree" style={{ left: `${POND.x}%`, top: `${POND.y}%` }}>
        <Pond />
      </div>

      {/* Fence posts along paths */}
      {BUILDINGS.slice(0, -1).map((b, i) => {
        const next = BUILDINGS[i + 1]
        const posts = []
        for (let t = 0.2; t <= 0.8; t += 0.3) {
          const px = b.x + (next.x - b.x) * t
          const py = b.y + (next.y - b.y) * t - 3
          posts.push(
            <div key={`fp${i}-${t}`} className="village-tree"
              style={{ left: `${px}%`, top: `${py}%` }}>
              <FencePost />
            </div>
          )
        }
        return posts
      })}

      {/* Buildings */}
      {BUILDINGS.map((b) => {
        const st = getState(agentStatus[b.key])
        const p = AGENT_PALETTES[b.key]
        return (
          <div key={b.key}
            className={`village-building village-building-${st.status}`}
            style={{ left: `${b.x}%`, top: `${b.y}%`, '--agent-color': p.accent }}>
            <SpeechBubble
              message={st.message}
              color={p.accent}
              visible={st.status === 'working' || st.status === 'done'}
              position={b.y < 30 ? 'below' : 'above'}
            />
            <Building color={p.accent} dark={p.dark} state={st.status} type={b.key} />
            <div className="building-sign" style={{ '--sign-color': p.accent }}>{b.name}</div>
          </div>
        )
      })}

      {/* Postman */}
      <div className={`postman-container${!letterVisible ? ' postman-returning' : ''}`}
        style={{ left: `${postmanTarget.x}%`, top: `${postmanTarget.y - 12}%` }}>
        <div className={letterVisible && letterPosition >= 0 ? 'postman-walking' : ''}>
          <Postman hasLetter={letterVisible} facingRight={facingRight} />
        </div>
      </div>

      <div className="scanlines" />
      <div className="crt-vignette" />
    </div>
  )
}
