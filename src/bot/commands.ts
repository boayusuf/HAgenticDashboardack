import {
  getTicketById,
  getStats,
  updateTicketStatus,
  updateTicketUrgency,
  assignTicket,
  searchTickets,
  getRecentTickets,
  Ticket,
} from '../db/database'
import { escalateIfCritical } from '../agents/escalation'
import { scheduleVerification } from '../agents/verification'
import { GoogleGenerativeAI } from '@google/generative-ai'

function formatTicket(t: Ticket): string {
  return `#${t.id} [${t.category}] [${t.urgency}] ${t.status}\n` +
    `  "${t.message.slice(0, 80)}"\n` +
    `  assigned: ${t.assignedTo || 'unassigned'}`
}

export async function handleCommand(text: string, uid: string): Promise<string> {
  const parts = text.trim().split(/\s+/)
  const cmd = parts[0].toLowerCase()

  switch (cmd) {
    case '/help':
      return [
        'Available commands:',
        '  /status — overview of all tickets',
        '  /status <id> — details for a ticket',
        '  /resolve <id> — mark as resolved',
        '  /close <id> — close a ticket',
        '  /reopen <id> — reopen a ticket',
        '  /escalate <id> — escalate to critical',
        '  /priority <id> <level> — set priority',
        '  /assign <id> <uid> — assign to user',
        '  /search <text> — search tickets',
        '  /recent [n] — show last n tickets',
        '  /summary — AI summary of open tickets',
        '  /confirm — confirm resolution',
      ].join('\n')

    case '/status': {
      if (parts[1]) {
        const id = parseInt(parts[1])
        if (isNaN(id)) return 'Invalid ticket ID.'
        const ticket = getTicketById(id)
        if (!ticket) return `Ticket #${id} not found.`
        return [
          `Ticket #${ticket.id}`,
          `Category: ${ticket.category}`,
          `Urgency: ${ticket.urgency}`,
          `Status: ${ticket.status}`,
          `From: ${ticket.uid}`,
          `Assigned: ${ticket.assignedTo || 'unassigned'}`,
          `Created: ${ticket.timestamp}`,
          `Message: ${ticket.message}`,
          ticket.reply ? `Reply: ${ticket.reply}` : '',
        ].filter(Boolean).join('\n')
      }
      const stats = getStats() as any
      return `Tickets: ${stats.total} total\n` +
        `  Open: ${stats.open} | In Progress: ${stats.inProgress}\n` +
        `  Resolved: ${stats.resolved} | Closed: ${stats.closed}\n` +
        `  Critical: ${stats.critical} | High: ${stats.high} | Medium: ${stats.medium} | Low: ${stats.low}`
    }

    case '/resolve': {
      const id = parseInt(parts[1])
      if (isNaN(id)) return 'Usage: /resolve <id>'
      const ticket = updateTicketStatus(id, 'resolved')
      if (!ticket) return `Ticket #${id} not found.`
      scheduleVerification(id, ticket.uid)
      return `Ticket #${id} marked as resolved.`
    }

    case '/close': {
      const id = parseInt(parts[1])
      if (isNaN(id)) return 'Usage: /close <id>'
      const ticket = updateTicketStatus(id, 'closed')
      if (!ticket) return `Ticket #${id} not found.`
      return `Ticket #${id} closed.`
    }

    case '/reopen': {
      const id = parseInt(parts[1])
      if (isNaN(id)) return 'Usage: /reopen <id>'
      const ticket = updateTicketStatus(id, 'open')
      if (!ticket) return `Ticket #${id} not found.`
      return `Ticket #${id} reopened.`
    }

    case '/escalate': {
      const id = parseInt(parts[1])
      if (isNaN(id)) return 'Usage: /escalate <id>'
      const ticket = updateTicketUrgency(id, 'Critical')
      if (!ticket) return `Ticket #${id} not found.`
      await escalateIfCritical(ticket)
      return `Ticket #${id} escalated to Critical.`
    }

    case '/priority': {
      const id = parseInt(parts[1])
      const level = parts[2]
      if (isNaN(id) || !level) return 'Usage: /priority <id> <Critical|High|Medium|Low>'
      const valid = ['Critical', 'High', 'Medium', 'Low']
      const matched = valid.find(v => v.toLowerCase() === level.toLowerCase())
      if (!matched) return `Invalid level. Use: ${valid.join(', ')}`
      const ticket = updateTicketUrgency(id, matched)
      if (!ticket) return `Ticket #${id} not found.`
      if (matched === 'Critical') await escalateIfCritical(ticket)
      return `Ticket #${id} priority set to ${matched}.`
    }

    case '/assign': {
      const id = parseInt(parts[1])
      const target = parts[2]
      if (isNaN(id) || !target) return 'Usage: /assign <id> <uid>'
      const ticket = assignTicket(id, target)
      if (!ticket) return `Ticket #${id} not found.`
      return `Ticket #${id} assigned to ${target}.`
    }

    case '/search': {
      const query = parts.slice(1).join(' ')
      if (!query) return 'Usage: /search <text>'
      const results = searchTickets(query)
      if (!results.length) return 'No tickets found.'
      return results.slice(0, 10).map(formatTicket).join('\n\n')
    }

    case '/recent': {
      const n = parseInt(parts[1]) || 5
      const tickets = getRecentTickets(n)
      if (!tickets.length) return 'No tickets yet.'
      return tickets.map(formatTicket).join('\n\n')
    }

    case '/summary': {
      const tickets = searchTickets('')
        .filter(t => t.status === 'open')
        .slice(0, 20)
      if (!tickets.length) return 'No open tickets.'

      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) {
        return `${tickets.length} open tickets:\n` +
          tickets.map(t => `#${t.id} [${t.category}/${t.urgency}]: ${t.message.slice(0, 50)}`).join('\n')
      }

      try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
        const ticketList = tickets.map(t =>
          `#${t.id} [${t.category}/${t.urgency}]: ${t.message}`
        ).join('\n')
        const result = await model.generateContent(
          `Summarize these support tickets in 3-4 bullet points. Be concise:\n${ticketList}`
        )
        return `Open ticket summary (${tickets.length} tickets):\n${result.response.text()}`
      } catch {
        return `${tickets.length} open tickets:\n` +
          tickets.map(t => `#${t.id} [${t.category}/${t.urgency}]: ${t.message.slice(0, 50)}`).join('\n')
      }
    }

    case '/confirm': {
      const userTickets = searchTickets('')
        .filter(t => t.uid === uid && t.status === 'resolved')
      if (!userTickets.length) return 'No resolved tickets to confirm.'
      const latest = userTickets[0]
      updateTicketStatus(latest.id, 'closed')
      return `Ticket #${latest.id} confirmed and closed. Thanks!`
    }

    default:
      return `Unknown command: ${cmd}. Try /help for available commands.`
  }
}
