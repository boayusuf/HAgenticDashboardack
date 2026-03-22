import { Ticket } from '../db/database'
import { sendDM } from '../bot/luffa'
import { addActivity } from './activity'

// Incident detection: watches for clusters of similar tickets
// If 3+ tickets with the same category arrive within 10 minutes, declare an incident

interface IncidentWindow {
  category: string
  tickets: { id: number; uid: string; timestamp: number }[]
  incidentDeclared: boolean
}

const windows: Map<string, IncidentWindow> = new Map()
const WINDOW_MS = 10 * 60 * 1000 // 10 minute window
const THRESHOLD = 3 // 3 similar tickets = incident

function cleanWindow(w: IncidentWindow): IncidentWindow {
  const cutoff = Date.now() - WINDOW_MS
  return {
    ...w,
    tickets: w.tickets.filter(t => t.timestamp > cutoff),
  }
}

export async function detectIncident(ticket: Ticket): Promise<boolean> {
  const key = ticket.category

  let window = windows.get(key) || {
    category: key,
    tickets: [],
    incidentDeclared: false,
  }

  // Clean expired entries
  window = cleanWindow(window)

  // Add current ticket
  window.tickets.push({
    id: ticket.id,
    uid: ticket.uid,
    timestamp: Date.now(),
  })

  windows.set(key, window)

  // Check threshold
  if (window.tickets.length >= THRESHOLD && !window.incidentDeclared) {
    window.incidentDeclared = true
    windows.set(key, window)

    const ticketIds = window.tickets.map(t => `#${t.id}`).join(', ')
    const uniqueUsers = new Set(window.tickets.map(t => t.uid)).size

    addActivity('incident', `INCIDENT: ${window.tickets.length} ${key} reports from ${uniqueUsers} users`, 'error')
    console.log(`[incident] Declared ${key} incident: ${ticketIds}`)

    // Notify admin
    const adminUid = process.env.ADMIN_UID
    if (adminUid) {
      await sendDM(adminUid,
        `INCIDENT DETECTED\n` +
        `Category: ${key}\n` +
        `${window.tickets.length} reports in 10 minutes from ${uniqueUsers} user(s)\n` +
        `Tickets: ${ticketIds}\n` +
        `Possible widespread issue — investigate immediately.`
      )
    }

    return true
  }

  return false
}

export function getActiveIncidents(): { category: string; count: number; since: number }[] {
  const incidents: { category: string; count: number; since: number }[] = []
  for (const [, w] of windows) {
    const cleaned = cleanWindow(w)
    if (cleaned.incidentDeclared && cleaned.tickets.length >= THRESHOLD) {
      incidents.push({
        category: cleaned.category,
        count: cleaned.tickets.length,
        since: Math.min(...cleaned.tickets.map(t => t.timestamp)),
      })
    }
  }
  return incidents
}
