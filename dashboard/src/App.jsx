import { useState, useEffect, useCallback, useRef } from 'react'
import PixelWorld from './components/PixelWorld'
import TicketFeed from './components/TicketFeed'
import StatsBar from './components/StatsBar'
import CommandPanel from './components/CommandPanel'
import ActivityLog from './components/ActivityLog'
import './App.css'

function normalizeAgentStatus(data) {
  const normalized = {}
  const agents = ['receiver', 'classifier', 'urgency', 'replier', 'sender']
  agents.forEach(key => {
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
  const [letterPosition, setLetterPosition] = useState(-1)
  const [letterVisible, setLetterVisible] = useState(false)
  const [filters, setFilters] = useState({ urgency: null, category: null })
  const prevTicketCount = useRef(0)
  const animating = useRef(false)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/agent-status')
        const data = await res.json()
        setAgentStatus(normalizeAgentStatus(data))
      } catch {}
    }
    fetchStatus()
    const interval = setInterval(fetchStatus, 1000)
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
      const ticketsData = await ticketsRes.json()
      const statsData = await statsRes.json()

      if (ticketsData.length > 0 && ticketsData.length > prevTicketCount.current) {
        triggerLetterAnimation()
      }
      prevTicketCount.current = ticketsData.length

      setTickets(ticketsData)
      setStats(statsData)
    } catch {}
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  const triggerLetterAnimation = () => {
    if (animating.current) return
    animating.current = true
    setLetterVisible(true)
    setLetterPosition(0)

    const steps = [0, 1, 2, 3, 4]
    steps.forEach((step, i) => {
      setTimeout(() => {
        setLetterPosition(step)
      }, i * 600)
    })

    setTimeout(() => {
      setLetterVisible(false)
      setLetterPosition(-1)
      animating.current = false
    }, steps.length * 600 + 400)
  }

  useEffect(() => {
    const agents = ['receiver', 'classifier', 'urgency', 'replier', 'sender']
    const workingIndex = agents.findIndex(a => {
      const st = agentStatus[a]
      const status = typeof st === 'string' ? st : (st && st.status) || 'idle'
      return status === 'working'
    })
    if (workingIndex >= 0 && !letterVisible) {
      setLetterVisible(true)
      setLetterPosition(workingIndex)
    }
  }, [agentStatus, letterVisible])

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
