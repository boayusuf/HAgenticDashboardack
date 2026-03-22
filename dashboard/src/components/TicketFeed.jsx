import { useRef, useEffect, useState } from 'react'
import TicketModal from './TicketModal'

const URGENCY_COLORS = {
  Critical: '#ff1744',
  High: '#ff6d00',
  Medium: '#ffd600',
  Low: '#00e676',
}

const CATEGORY_ICONS = {
  Bug: '\u{1F41B}',
  'Feature Request': '\u2728',
  Complaint: '\u{1F624}',
  Billing: '\u{1F4B3}',
  General: '\u{1F4E9}',
}

export default function TicketFeed({ tickets, filters, onTicketUpdate }) {
  const feedRef = useRef(null)
  const [activeTab, setActiveTab] = useState('open')
  const [selectedTicket, setSelectedTicket] = useState(null)

  let filtered = tickets
  if (filters) {
    if (filters.urgency) {
      filtered = filtered.filter(t => t.urgency === filters.urgency)
    }
    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category)
    }
  }

  const openTickets = filtered.filter(
    t => t.status === 'open' || t.status === 'in_progress'
  )
  const resolvedTickets = filtered.filter(
    t => t.status === 'resolved' || t.status === 'closed'
  )

  const displayedTickets = activeTab === 'open' ? openTickets : resolvedTickets

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0
    }
  }, [activeTab, tickets.length])

  // Keep modal ticket in sync with live data
  useEffect(() => {
    if (selectedTicket) {
      const updated = tickets.find(t => t.id === selectedTicket.id)
      if (updated) setSelectedTicket(updated)
    }
  }, [tickets])

  const handleTicketUpdate = (updatedTicket) => {
    setSelectedTicket(updatedTicket)
    if (onTicketUpdate) onTicketUpdate(updatedTicket)
  }

  return (
    <div className="feed-tabbed">
      <div className="feed-tabs">
        <button
          className={`feed-tab ${activeTab === 'open' ? 'feed-tab-active' : ''}`}
          onClick={() => setActiveTab('open')}
        >
          OPEN
          <span className="feed-tab-badge">{openTickets.length}</span>
        </button>
        <button
          className={`feed-tab ${activeTab === 'resolved' ? 'feed-tab-active' : ''}`}
          onClick={() => setActiveTab('resolved')}
        >
          RESOLVED
          <span className="feed-tab-badge">{resolvedTickets.length}</span>
        </button>
      </div>

      {displayedTickets.length === 0 ? (
        <div className="feed-empty">
          <div className="feed-empty-icon">
            <span className="blink-cursor">_</span>
          </div>
          <p>
            {activeTab === 'open'
              ? 'AWAITING INCOMING TRANSMISSIONS...'
              : 'NO RESOLVED TICKETS YET...'}
          </p>
        </div>
      ) : (
        <div className="feed" ref={feedRef}>
          {displayedTickets.map((ticket, idx) => (
            <div
              key={ticket.id}
              className={`ticket-card urgency-${ticket.urgency.toLowerCase()} ${
                activeTab === 'resolved' ? 'ticket-resolved' : ''
              }`}
              style={{ animationDelay: `${idx * 0.05}s`, cursor: 'pointer' }}
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="ticket-header">
                <span className="ticket-id">T-{ticket.id}</span>
                <span className="ticket-category">
                  {CATEGORY_ICONS[ticket.category] || ''} {ticket.category}
                </span>
                <span
                  className="ticket-urgency"
                  style={{
                    color: URGENCY_COLORS[ticket.urgency] || '#78909c',
                    borderColor: URGENCY_COLORS[ticket.urgency] || '#78909c',
                  }}
                >
                  {ticket.urgency}
                </span>
                <span className={`ticket-status ${ticket.status}`}>
                  {ticket.status}
                </span>
              </div>

              <div className="ticket-message">{ticket.message}</div>

              <div className="ticket-reply">
                <span className="reply-label">&gt; AI_REPLY:</span>
                <span className="reply-text">{ticket.reply}</span>
              </div>

              <div className="ticket-meta">
                <span className="ticket-sender">
                  {ticket.uid}{ticket.isGroup ? ' [GRP]' : ' [DM]'}
                </span>
                <span className="ticket-time">
                  {new Date(ticket.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={handleTicketUpdate}
        />
      )}
    </div>
  )
}
