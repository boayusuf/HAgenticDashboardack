import { useState, useEffect } from 'react'

const AGENT_PALETTES = {
  receiver:   { body: '#4ecdc4', dark: '#2ea8a0', light: '#7fffef', hat: '#3abab2', accent: '#4ecdc4' },
  classifier: { body: '#ffa726', dark: '#e09020', light: '#ffc866', hat: '#e8952a', accent: '#ffa726' },
  urgency:    { body: '#ff6b6b', dark: '#d04040', light: '#ff9999', hat: '#e05555', accent: '#ff6b6b' },
  replier:    { body: '#ab47bc', dark: '#8030a0', light: '#d080e0', hat: '#9a3aaa', accent: '#ab47bc' },
  sender:     { body: '#66bb6a', dark: '#40a044', light: '#90e094', hat: '#55aa55', accent: '#66bb6a' },
}

function PixelAgent({ role = 'receiver', state = 'idle', size = 64 }) {
  const [frame, setFrame] = useState(0)
  const p = AGENT_PALETTES[role] || AGENT_PALETTES.receiver

  useEffect(() => {
    const speed = state === 'working' ? 180 : state === 'done' ? 400 : 800
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 4)
    }, speed)
    return () => clearInterval(interval)
  }, [state])

  const isWorking = state === 'working'
  const isDone = state === 'done'
  const isSleeping = state === 'sleeping'

  return (
    <div className={`pixel-agent-cyber agent-${state}`}>
      <svg
        viewBox="0 0 20 24"
        width={size}
        height={size * 1.2}
        style={{ imageRendering: 'pixelated' }}
      >
        {isWorking && (
          <circle cx="10" cy="12" r="11"
            fill="none" stroke={p.accent} strokeWidth="0.3"
            opacity={frame % 2 === 0 ? 0.6 : 0.2}
          />
        )}

        <ellipse cx="10" cy="23" rx="6" ry="1.5"
          fill={isWorking ? p.accent : 'rgba(0,0,0,0.4)'}
          opacity={isWorking ? 0.3 : 0.5}
        />

        <rect x="6" y="10" width="8" height="8" fill={p.body} rx="1" />
        <rect x="5" y="11" width="1" height="6" fill={p.body} />
        <rect x="14" y="11" width="1" height="6" fill={p.body} />

        {isWorking ? (
          <>
            <rect x="4" y={frame < 2 ? '11' : '12'} width="1" height="3" fill={p.dark} />
            <rect x="15" y={frame < 2 ? '12' : '11'} width="1" height="3" fill={p.dark} />
          </>
        ) : (
          <>
            <rect x="4" y="12" width="1" height="3" fill={p.dark} />
            <rect x="15" y="12" width="1" height="3" fill={p.dark} />
          </>
        )}

        <rect x="5" y="3" width="10" height="9" fill={p.body} rx="3" />
        <rect x="6" y="2" width="8" height="3" fill={p.body} rx="1" />

        <rect x="6" y="2" width="8" height="4" fill={p.hat} rx="1" />
        <rect x="5" y="3" width="10" height="3" fill={p.hat} rx="1" />

        {isSleeping ? (
          <>
            <rect x="7" y="7" width="2" height="0.5" fill="#111" />
            <rect x="11" y="7" width="2" height="0.5" fill="#111" />
          </>
        ) : isWorking ? (
          <>
            <rect x="7" y="6" width="2" height="3" fill="#fff" />
            <rect x="11" y="6" width="2" height="3" fill="#fff" />
            <rect x={frame < 2 ? '7' : '8'} y={frame % 2 === 0 ? '6' : '7'} width="1" height="1.5" fill="#111" />
            <rect x={frame < 2 ? '11' : '12'} y={frame % 2 === 0 ? '6' : '7'} width="1" height="1.5" fill="#111" />
          </>
        ) : isDone ? (
          <>
            <rect x="7" y="7" width="2" height="1" fill="#111" />
            <rect x="11" y="7" width="2" height="1" fill="#111" />
            <rect x="8" y="9" width="4" height="1" fill="#111" rx="1" />
          </>
        ) : (
          <>
            <rect x="7" y="7" width="2" height="2" fill="#fff" />
            <rect x="11" y="7" width="2" height="2" fill="#fff" />
            <rect x="8" y="7" width="1" height="1" fill="#111" />
            <rect x="12" y="7" width="1" height="1" fill="#111" />
          </>
        )}

        <rect x="6" y="18" width="3" height="2" fill={p.dark} rx="0.5" />
        <rect x="11" y="18" width="3" height="2" fill={p.dark} rx="0.5" />
        {isWorking && (
          <>
            <rect x="6" y={frame % 2 === 0 ? '18' : '19'} width="3" height="2" fill={p.dark} rx="0.5" />
            <rect x="11" y={frame % 2 === 0 ? '19' : '18'} width="3" height="2" fill={p.dark} rx="0.5" />
          </>
        )}

        {role === 'receiver' && (
          <g>
            <rect x="16" y="1" width="1" height="5" fill="#6af" />
            <circle cx="16.5" cy="1" r="1.5" fill="none" stroke="#6af" strokeWidth="0.5"
              opacity={isWorking ? (frame % 2 === 0 ? 1 : 0.3) : 0.5} />
            <circle cx="16.5" cy="1" r="3" fill="none" stroke="#6af" strokeWidth="0.3"
              opacity={isWorking ? (frame % 2 === 0 ? 0.5 : 0.1) : 0.2} />
          </g>
        )}
        {role === 'classifier' && (
          <g>
            <circle cx={isWorking ? (frame < 2 ? '3' : '5') : '4'} cy="8" r="2" fill="none" stroke="#ffc866" strokeWidth="0.8" />
            <rect x={isWorking ? (frame < 2 ? '4.5' : '6.5') : '5.5'} y="9.5" width="0.8" height="3" fill="#e8952a"
              transform={`rotate(30 ${isWorking ? (frame < 2 ? '4.5' : '6.5') : '5.5'} 9.5)`} />
          </g>
        )}
        {role === 'urgency' && (
          <g>
            <rect x="17" y="3" width="2" height="4" fill={isWorking ? (frame % 2 === 0 ? '#ff1744' : '#ff6b6b') : '#ff6b6b'} rx="0.5" />
            <rect x="17" y="8" width="2" height="2" fill={isWorking ? (frame % 2 === 0 ? '#ff1744' : '#ff6b6b') : '#ff6b6b'} rx="0.5" />
          </g>
        )}
        {role === 'replier' && (
          <g>
            <rect x="3" y="16" width="14" height="3" fill="#3a3a5e" rx="0.5" />
            <rect x="4" y={isWorking ? (frame === 0 ? '16.5' : '17') : '17'} width="2" height="1" fill="#6a6a9e" />
            <rect x="7" y={isWorking ? (frame === 1 ? '16.5' : '17') : '17'} width="2" height="1" fill="#6a6a9e" />
            <rect x="10" y={isWorking ? (frame === 2 ? '16.5' : '17') : '17'} width="2" height="1" fill="#6a6a9e" />
            <rect x="13" y={isWorking ? (frame === 3 ? '16.5' : '17') : '17'} width="2" height="1" fill="#6a6a9e" />
          </g>
        )}
        {role === 'sender' && (
          <g>
            <polygon
              points={isWorking
                ? (frame < 2 ? '16,2 19,5 16,4' : '16,0 19,3 16,2')
                : '16,4 19,7 16,6'}
              fill="#90e094"
              opacity={isWorking ? 1 : 0.6}
            />
            <polygon
              points={isWorking
                ? (frame < 2 ? '16,4 19,5 16,6' : '16,2 19,3 16,4')
                : '16,6 19,7 16,8'}
              fill="#55aa55"
              opacity={isWorking ? 1 : 0.6}
            />
          </g>
        )}

        {isDone && (
          <g opacity={frame % 2 === 0 ? 1 : 0.6}>
            <rect x="14" y="1" width="1" height="1" fill="#00e676" />
            <rect x="15" y="0" width="1" height="1" fill="#00e676" />
            <rect x="16" y="-1" width="1" height="1" fill="#00e676" />
            <rect x="13" y="2" width="1" height="1" fill="#00e676" />
            <rect x="12" y="3" width="1" height="1" fill="#00e676" />
          </g>
        )}
      </svg>
    </div>
  )
}

export { AGENT_PALETTES }
export default PixelAgent
