import { useRef, useEffect } from 'react'

const TYPE_COLORS = {
  info: '#4ecdc4',
  success: '#00e676',
  warning: '#ffa726',
  error: '#ff1744',
}

export default function ActivityLog({ activities = [] }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [activities.length])

  return (
    <div className="activity-ticker" ref={scrollRef}>
      <span className="activity-ticker-label">&gt; LOG:</span>
      {activities.length === 0 ? (
        <span className="activity-entry" style={{ color: '#2a4a5a' }}>
          AWAITING AGENT ACTIVITY...
        </span>
      ) : (
        activities.map((entry, i) => (
          <span
            key={i}
            className="activity-entry"
            style={{
              color: TYPE_COLORS[entry.type] || TYPE_COLORS.info,
              animationDelay: `${i * 0.05}s`,
            }}
          >
            <span className="activity-time">
              [{entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : '--:--'}]
            </span>{' '}
            <span className="activity-agent">{entry.agent}:</span>{' '}
            <span className="activity-action">{entry.action}</span>
            {i < activities.length - 1 && (
              <span className="activity-separator">|</span>
            )}
          </span>
        ))
      )}
    </div>
  )
}
