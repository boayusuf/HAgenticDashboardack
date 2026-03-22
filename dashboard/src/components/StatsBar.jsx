import { useState, useEffect, useRef } from 'react'

const URGENCY_COLORS = {
  Critical: '#ff1744',
  High: '#ff6d00',
  Medium: '#ffd600',
  Low: '#00e676',
}

const CATEGORY_COLORS = {
  Bug: '#ff6b6b',
  'Feature Request': '#4ecdc4',
  Complaint: '#ffa726',
  Billing: '#ab47bc',
  General: '#78909c',
}

function AnimatedNumber({ value, className }) {
  const [display, setDisplay] = useState(value)
  const [counting, setCounting] = useState(false)
  const prevValue = useRef(value)

  useEffect(() => {
    if (value !== prevValue.current) {
      setCounting(true)
      const start = prevValue.current
      const end = value
      const diff = end - start
      const steps = Math.min(Math.abs(diff), 10)
      const stepTime = 200 / Math.max(steps, 1)

      for (let i = 1; i <= steps; i++) {
        setTimeout(() => {
          setDisplay(Math.round(start + (diff * i) / steps))
          if (i === steps) setCounting(false)
        }, stepTime * i)
      }

      prevValue.current = value
    }
  }, [value])

  return (
    <span className={`${className}${counting ? ' counting' : ''}`}>
      {display}
    </span>
  )
}

export default function StatsBar({ stats, filters, onFilterClick }) {
  if (!stats) {
    return (
      <div className="stats-bar">
        <div className="stats-bar-inner">
          <div className="stats-title">
            LUFFA TICKET AGENT
            <span className="version">v1.0</span>
          </div>
          <span className="stats-loading">LOADING STATS...</span>
        </div>
      </div>
    )
  }

  const isActive = (type, value) => filters && filters[type] === value

  return (
    <div className="stats-bar">
      <div className="stats-bar-inner">
        <div className="stats-title">
          LUFFA TICKET AGENT
          <span className="version">v1.0</span>
        </div>

        <div className="stat-chip total" onClick={() => onFilterClick && onFilterClick(null, null)} style={{ cursor: 'pointer' }}>
          <AnimatedNumber value={stats.total} className="stat-chip-num" />
          <span className="stat-chip-label">TOTAL</span>
        </div>

        <div className="stat-chip recent">
          <AnimatedNumber value={stats.recentCount || 0} className="stat-chip-num" />
          <span className="stat-chip-label">LAST HR</span>
        </div>

        <div className="stat-divider" />

        <div className="stat-group">
          <span className="stat-group-label">URGENCY</span>
          <div className="stat-group-items">
            {(stats.byUrgency || []).map(item => (
              <button
                key={item.urgency}
                className={`stat-filter-btn ${isActive('urgency', item.urgency) ? 'stat-filter-active' : ''}`}
                onClick={() => onFilterClick('urgency', item.urgency)}
                style={{ '--filter-color': URGENCY_COLORS[item.urgency] || '#78909c' }}
              >
                <span className={`stat-filter-dot${item.urgency === 'Critical' && item.count > 0 ? ' pulse-critical' : ''}`} />
                <span className="stat-filter-name">{item.urgency}</span>
                <span className="stat-filter-count">{item.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="stat-divider" />

        <div className="stat-group">
          <span className="stat-group-label">CATEGORY</span>
          <div className="stat-group-items">
            {(stats.byCategory || []).map(item => (
              <button
                key={item.category}
                className={`stat-filter-btn ${isActive('category', item.category) ? 'stat-filter-active' : ''}`}
                onClick={() => onFilterClick('category', item.category)}
                style={{ '--filter-color': CATEGORY_COLORS[item.category] || '#78909c' }}
              >
                <span className="stat-filter-dot" />
                <span className="stat-filter-name">{item.category}</span>
                <span className="stat-filter-count">{item.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
