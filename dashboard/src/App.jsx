import { useState, useEffect, useCallback } from 'react'
import PixelWorld from './components/PixelWorld'
import TicketFeed from './components/TicketFeed'
import StatsBar from './components/StatsBar'
import CommandPanel from './components/CommandPanel'
import ActivityLog from './components/ActivityLog'
import './App.css'

const AGENT_KEYS = ['receiver', 'classifier', 'urgency', 'replier', 'sender']

function normalizeAgentStatus(data) {
  const normalized = {}
  AGENT_KEYS.forEach(key => {
    const val = data[key]
    if (!val) {
      normalized[key] = { status: 'idle', message: '', lastActive: 0 }
    } else if (typeof val === 'string') {
      normalized[key] = { status: val, message: '', lastActive: 0 }
    } else {
      normalized[key] = {
        status: val.status || 'idle',
        message: val.message || '',
        lastActive: val.lastActive || 0,
      }
    }
  })
  return normalized
}

function App() {
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState(null)
  const [agentStatus, setAgentStatus] = useState({
    receiver:   { status: 'idle', message: '', lastActive: 0 },
    classifier: { status: 'idle', message: '', lastActive: 0 },
    urgency:    { status: 'idle', message: '', lastActive: 0 },
    replier:    { status: 'idle', message: '', lastActive: 0 },
    sender:     { status: 'idle', message: '', lastActive: 0 },
  })
  const [activities, setActivities] = useState([])
  const [filters, setFilters] = useState({ urgency: null, category: null })

  // Poll agent status faster (500ms) so postman tracks pipeline in real-time
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/agent-status')
        const data = await res.json()
        setAgentStatus(normalizeAgentStatus(data))
      } catch {}
    }
    fetchStatus()
    const interval = setInterval(fetchStatus, 500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch('/api/activity')
        const data = await res.json()
        if (Array.isArray(data)) {
          setActivities(data.slice(-20))
        }
      } catch {}
    }
    fetchActivity()
    const interval = setInterval(fetchActivity, 2000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        fetch('/api/tickets?limit=50'),
        fetch('/api/stats'),
      ])
      setTickets(await ticketsRes.json())
      setStats(await statsRes.json())
    } catch {}
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Postman position: tracks the FURTHEST agent that's working or done (not idle)
  // This means the postman follows the pipeline as it progresses
  const { letterPosition, letterVisible } = (() => {
    let lastActive = -1
    for (let i = 0; i < AGENT_KEYS.length; i++) {
      const st = agentStatus[AGENT_KEYS[i]]
      const status = typeof st === 'string' ? st : (st && st.status) || 'idle'
      if (status === 'working' || status === 'done') {
        lastActive = i
      }
    }
    return {
      letterPosition: lastActive >= 0 ? lastActive : 0,
      letterVisible: lastActive >= 0,
    }
  })()

  const handleFilterClick = (type, value) => {
    if (!type) {
      setFilters({ urgency: null, category: null })
      return
    }
    setFilters(prev => ({
      ...prev,
      [type]: prev[type] === value ? null : value,
    }))
  }

  return (
    <div className="app">
      <StatsBar stats={stats} filters={filters} onFilterClick={handleFilterClick} />

      <div className="world-section">
        <PixelWorld
          agentStatus={agentStatus}
          letterPosition={letterPosition}
          letterVisible={letterVisible}
        />
      </div>

      <ActivityLog activities={activities} />

      <div className="bottom-section">
        <CommandPanel agentStatus={agentStatus} />
        <div className="feed-container">
          <div className="feed-label">
            {'// TICKET FEED'}
            {filters.urgency && (
              <span className="feed-filter-badge" onClick={() => setFilters(f => ({ ...f, urgency: null }))}>
                {filters.urgency} x
              </span>
            )}
            {filters.category && (
              <span className="feed-filter-badge" onClick={() => setFilters(f => ({ ...f, category: null }))}>
                {filters.category} x
              </span>
            )}
          </div>
          <TicketFeed tickets={tickets} filters={filters} onTicketUpdate={() => fetchData()} />
        </div>
      </div>
    </div>
  )
}

export default App
