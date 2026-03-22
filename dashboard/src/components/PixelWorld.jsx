import { useState, useEffect, useMemo } from 'react'
import PixelAgent, { AGENT_PALETTES } from './PixelAgent'
import SpeechBubble from './SpeechBubble'

const AGENTS = [
  { key: 'receiver',   name: 'RECEIVER',   role: 'receiver'   },
  { key: 'classifier', name: 'CLASSIFIER', role: 'classifier' },
  { key: 'urgency',    name: 'URGENCY',    role: 'urgency'    },
  { key: 'replier',    name: 'REPLIER',    role: 'replier'    },
  { key: 'sender',     name: 'SENDER',     role: 'sender'     },
]

function getAgentState(statusObj) {
  if (!statusObj) return { status: 'idle', message: '' }
  if (typeof statusObj === 'string') return { status: statusObj, message: '' }
  return { status: statusObj.status || 'idle', message: statusObj.message || '' }
}

function LetterSprite() {
  return (
    <svg viewBox="0 0 16 12" width="36" height="27" style={{ imageRendering: 'pixelated' }}>
      <rect x="1" y="2" width="14" height="9" fill="#0d1030" stroke="#4ecdc4" strokeWidth="0.5" rx="1" />
      <polygon points="1,2 8,7 15,2" fill="#0a0a2a" stroke="#4ecdc4" strokeWidth="0.5" />
      <circle cx="8" cy="7" r="2" fill="#4ecdc4" opacity="0.6" />
      <circle cx="8" cy="7" r="1" fill="#7fffef" opacity="0.8" />
      <rect x="13" y="0" width="1" height="1" fill="#4ecdc4" opacity="0.8" />
      <rect x="14" y="1" width="1" height="1" fill="#4ecdc4" opacity="0.5" />
      <rect x="0" y="0" width="1" height="1" fill="#4ecdc4" opacity="0.4" />
    </svg>
  )
}

export default function PixelWorld({ agentStatus, letterPosition, letterVisible }) {
  const [dataFlowFrame, setDataFlowFrame] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setDataFlowFrame(f => (f + 1) % 100)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const activeSegments = useMemo(() => {
    if (!letterVisible || letterPosition < 0) return []
    const segs = []
    if (letterPosition > 0) segs.push(letterPosition - 1)
    if (letterPosition < AGENTS.length - 1) segs.push(letterPosition)
    return segs
  }, [letterPosition, letterVisible])

  const stars = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      left: `${(i * 37 + 13) % 100}%`,
      top: `${(i * 23 + 7) % 100}%`,
      delay: `${(i * 0.7) % 4}s`,
      color: i % 4 === 0 ? '#4ecdc4' : i % 4 === 1 ? '#ffa726' : i % 4 === 2 ? '#ab47bc' : '#66bb6a',
      size: i % 3 === 0 ? 2 : 1,
    }))
  }, [])

  return (
    <div className="pixel-world">
      <div className="tile-floor" />

      <div className="stars">
        {stars.map((s, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: s.left,
              top: s.top,
              animationDelay: s.delay,
              background: s.color,
              width: `${s.size}px`,
              height: `${s.size}px`,
            }}
          />
        ))}
      </div>

      <svg className="pipeline-connections" viewBox="0 0 1000 300" preserveAspectRatio="none">
        {[0, 1, 2, 3].map(i => {
          const x1 = 100 + i * 200 + 40
          const x2 = 100 + (i + 1) * 200 - 40
          const isActive = activeSegments.includes(i)
          return (
            <g key={`seg-${i}`}>
              <line
                x1={x1} y1={150} x2={x2} y2={150}
                stroke="#1a2a3a" strokeWidth="2" strokeDasharray="8 6"
              />
              {isActive && (
                <line
                  x1={x1} y1={150} x2={x2} y2={150}
                  stroke={AGENT_PALETTES[AGENTS[i + 1].role].accent}
                  strokeWidth="2" strokeDasharray="8 6"
                  className="pipeline-active-line"
                  style={{ filter: `drop-shadow(0 0 6px ${AGENT_PALETTES[AGENTS[i + 1].role].accent})` }}
                />
              )}
              {[0, 1, 2].map(d => {
                const progress = ((dataFlowFrame + d * 33) % 100) / 100
                const dotX = x1 + (x2 - x1) * progress
                return (
                  <circle
                    key={`dot-${i}-${d}`}
                    cx={dotX} cy={150}
                    r={isActive ? 3 : 1.5}
                    fill={isActive ? '#4ecdc4' : '#1a2a3a'}
                    opacity={isActive ? 0.9 : 0.3}
                    style={isActive ? { filter: 'drop-shadow(0 0 4px #4ecdc4)' } : {}}
                  />
                )
              })}
            </g>
          )
        })}

        {AGENTS.map((agent, i) => {
          const cx = 100 + i * 200
          const st = getAgentState(agentStatus[agent.key])
          const palette = AGENT_PALETTES[agent.role]
          const isWorking = st.status === 'working'
          const isDone = st.status === 'done'
          return (
            <g key={`node-${i}`}>
              <circle
                cx={cx} cy={150} r={6}
                fill={isWorking ? palette.accent : isDone ? '#00e676' : '#0a0a1a'}
                stroke={isWorking ? palette.accent : isDone ? '#00e676' : '#1a2a3a'}
                strokeWidth="1.5"
                opacity={isWorking ? 1 : 0.7}
                style={isWorking ? { filter: `drop-shadow(0 0 8px ${palette.accent})` } : {}}
              />
            </g>
          )
        })}
      </svg>

      {letterVisible && letterPosition >= 0 && letterPosition < AGENTS.length && (
        <div
          className="letter-sprite"
          style={{
            left: `${10 + letterPosition * 20}%`,
            top: '26%',
          }}
        >
          <LetterSprite />
        </div>
      )}

      <div className="agent-stations">
        {AGENTS.map((agent, i) => {
          const st = getAgentState(agentStatus[agent.key])
          const palette = AGENT_PALETTES[agent.role]
          return (
            <div
              key={agent.key}
              className="agent-station"
              style={{
                left: `${10 + i * 20}%`,
                '--agent-color': palette.accent,
              }}
            >
              <SpeechBubble
                message={st.message}
                color={palette.accent}
                visible={st.status === 'working' || st.status === 'done'}
              />

              <div className={`agent-character ${st.status}`} style={{ '--agent-color': palette.accent }}>
                <PixelAgent role={agent.role} state={st.status} size={64} />
              </div>

              <div className={`agent-status-dot ${st.status}`} style={{ '--agent-color': palette.accent }} />

              <span className="agent-name-label">{agent.name}</span>

              <span className={`agent-state-text ${st.status}`} style={{ '--agent-color': palette.accent }}>
                {st.status.toUpperCase()}
              </span>
            </div>
          )
        })}
      </div>

      <div className="scanlines" />
      <div className="crt-vignette" />
    </div>
  )
}
