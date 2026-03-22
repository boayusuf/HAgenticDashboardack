import { useState } from 'react'

const URGENCY_COLORS = {
  Critical: '#ff1744',
  High: '#ff6d00',
  Medium: '#ffd600',
  Low: '#00e676',
}

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed']
const URGENCY_OPTIONS = ['Critical', 'High', 'Medium', 'Low']

export default function TicketModal({ ticket, onClose, onUpdate }) {
  const [reply, setReply] = useState('')
  const [resolveOnReply, setResolveOnReply] = useState(false)
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState(null)

  if (!ticket) return null

  const sendReply = async () => {
    if (!reply.trim()) return
    setSending(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: reply.trim(), resolve: resolveOnReply }),
      })
      const data = await res.json()
      if (res.ok) {
        setFeedback({ type: 'success', text: resolveOnReply ? 'Sent & resolved!' : 'Reply sent!' })
        setReply('')
        setResolveOnReply(false)
        onUpdate(data)
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to send' })
      }
    } catch {
      setFeedback({ type: 'error', text: 'Connection error' })
    }
    setSending(false)
  }

  const changeStatus = async (status) => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (res.ok) onUpdate(data)
    } catch {}
  }

  const changeUrgency = async (urgency) => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/urgency`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urgency }),
      })
      const data = await res.json()
      if (res.ok) onUpdate(data)
    } catch {}
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-ticket-id">T-{ticket.id}</span>
            <span
              className="modal-urgency"
              style={{ color: URGENCY_COLORS[ticket.urgency], borderColor: URGENCY_COLORS[ticket.urgency] }}
            >
              {ticket.urgency}
            </span>
            <span className={`modal-status ${ticket.status}`}>{ticket.status}</span>
          </div>
          <button className="modal-close" onClick={onClose}>X</button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <span className="modal-label">FROM</span>
            <span className="modal-value">{ticket.uid} {ticket.isGroup ? '[GROUP]' : '[DM]'}</span>
          </div>

          <div className="modal-section">
            <span className="modal-label">CATEGORY</span>
            <span className="modal-value">{ticket.category}</span>
          </div>

          <div className="modal-section">
            <span className="modal-label">ASSIGNED TO</span>
            <span className="modal-value">{ticket.assignedTo || 'Unassigned'}</span>
          </div>

          <div className="modal-section">
            <span className="modal-label">MESSAGE</span>
            <div className="modal-message">{ticket.message}</div>
          </div>

          <div className="modal-section">
            <span className="modal-label">CURRENT REPLY</span>
            <div className="modal-reply">{ticket.reply || 'No reply yet'}</div>
          </div>

          <div className="modal-divider" />

          <div className="modal-section">
            <span className="modal-label">CHANGE STATUS</span>
            <div className="modal-actions-row">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  className={`modal-action-btn ${ticket.status === s ? 'active' : ''}`}
                  onClick={() => changeStatus(s)}
                  disabled={ticket.status === s}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-section">
            <span className="modal-label">CHANGE PRIORITY</span>
            <div className="modal-actions-row">
              {URGENCY_OPTIONS.map(u => (
                <button
                  key={u}
                  className={`modal-action-btn ${ticket.urgency === u ? 'active' : ''}`}
                  onClick={() => changeUrgency(u)}
                  disabled={ticket.urgency === u}
                  style={{ '--btn-color': URGENCY_COLORS[u] }}
                >
                  {u.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-divider" />

          <div className="modal-section">
            <span className="modal-label">SEND REPLY TO USER</span>
            <textarea
              className="modal-reply-input"
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="Type your reply to the user..."
              rows={3}
            />
            <div className="modal-reply-actions">
              <label className="modal-resolve-check">
                <input
                  type="checkbox"
                  checked={resolveOnReply}
                  onChange={e => setResolveOnReply(e.target.checked)}
                />
                <span>Resolve on send</span>
              </label>
              <button
                className="modal-send-btn"
                onClick={sendReply}
                disabled={sending || !reply.trim()}
              >
                {sending ? 'SENDING...' : resolveOnReply ? 'SEND & RESOLVE' : 'SEND REPLY'}
              </button>
            </div>
            {feedback && (
              <div className={`modal-feedback ${feedback.type}`}>{feedback.text}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
