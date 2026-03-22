import { useState, useEffect, useRef } from 'react'

const URGENCY_COLORS = {
  Critical: '#ff1744',
  High: '#ff6d00',
  Medium: '#ffd600',
  Low: '#00e676',
}

const URGENCY_ICONS = {
  Critical: '\u{1F534}',
  High: '\u{1F7E0}',
  Medium: '\u{1F7E1}',
  Low: '\u{1F7E2}',
}

const CATEGORY_COLORS = {
  Bug: '#ff6b6b',
  'Feature Request': '#4ecdc4',
  Complaint: '#ffa726',
  Billing: '#ab47bc',
  General: '#78909c',
}

const CATEGORY_ICONS = {
  Bug: '\u{1F41B}',
  'Feature Request': '\u2728',
  Complaint: '\u{1F4E2}',
  Billing: '\u{1F4B3}',
  General: '\u{1F4E9}',
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

  const openCount = stats.byStatus?.find(s => s.status === 'open')?.count || 0
  const resolvedCount = stats.byStatus?.find(s => s.status === 'resolved')?.count || 0

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
          <AnimatedNumber value={openCount} className="stat-chip-num" />
          <span className="stat-chip-label">OPEN</span>
        </div>

        <div className="stat-chip" style={{ borderColor: '#66bb6a', boxShadow: '0 0 8px rgba(102, 187, 106, 0.15)' }}>
          <AnimatedNumber value={resolvedCount} className="stat-chip-num" style={{ color: '#66bb6a' }} />
          <span className="stat-chip-label">DONE</span>
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
                <span className="stat-filter-icon">{URGENCY_ICONS[item.urgency]}</span>
                <span className="stat-filter-name">{item.urgency}</span>
                {item.count > 0 && <span className="stat-filter-count">{item.count}</span>}
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
                <span className="stat-filter-icon">{CATEGORY_ICONS[item.category]}</span>
                <span className="stat-filter-name">{item.category}</span>
                {item.count > 0 && <span className="stat-filter-count">{item.count}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
