import { Router, Request, Response } from 'express'
import {
  getTickets,
  getTicketById,
  getStats,
  searchTickets,
  getTicketsByUser,
  updateTicketStatus,
  updateTicketUrgency,
  updateTicketReply,
  assignTicket,
} from '../db/database'
import { getAgentStatuses } from '../agents/status'
import { getSLAMetrics } from '../agents/sla'
import { getActivities } from '../agents/activity'
import { handleCommand } from '../bot/commands'
import { sendDM, sendGroup } from '../bot/luffa'
import { addActivity } from '../agents/activity'
import { scheduleVerification } from '../agents/verification'
import { getActiveIncidents } from '../agents/incident'

const router = Router()

router.get('/tickets', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50
  const offset = parseInt(req.query.offset as string) || 0
  res.json(getTickets(limit, offset))
})

router.get('/stats', (_req: Request, res: Response) => {
  const counts = getStats() as any
  const sla = getSLAMetrics()

  const byUrgency = ['Critical', 'High', 'Medium', 'Low'].map(u => ({
    urgency: u,
    count: counts[u.toLowerCase()] || 0,
  }))

  const byCategory = ['Bug', 'Feature Request', 'Complaint', 'Billing', 'General'].map(c => ({
    category: c,
    count: counts[`cat_${c}`] || 0,
  }))

  res.json({
    total: counts.total || 0,
    recentCount: counts.recentCount || 0,
    byUrgency,
    byCategory,
    byStatus: [
      { status: 'open', count: counts.open || 0 },
      { status: 'in_progress', count: counts.inProgress || 0 },
      { status: 'resolved', count: counts.resolved || 0 },
      { status: 'closed', count: counts.closed || 0 },
    ],
    sla,
  })
})

router.get('/agent-status', (_req: Request, res: Response) => {
  res.json(getAgentStatuses())
})

router.get('/activity', (_req: Request, res: Response) => {
  res.json(getActivities())
})

router.get('/incidents', (_req: Request, res: Response) => {
  res.json(getActiveIncidents())
})

router.get('/tickets/search', (req: Request, res: Response) => {
  const q = req.query.q as string
  if (!q) return res.json([])
  res.json(searchTickets(q))
})

router.get('/tickets/user/:uid', (req: Request, res: Response) => {
  res.json(getTicketsByUser(req.params.uid))
})

router.post('/command', async (req: Request, res: Response) => {
  const { command } = req.body
  if (!command || typeof command !== 'string') {
    return res.status(400).json({ error: 'command field required' })
  }
  const result = await handleCommand(command, 'dashboard')
  res.json({ reply: result })
})

router.patch('/tickets/:id/status', (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { status } = req.body
  if (!status) return res.status(400).json({ error: 'status field required' })
  const ticket = updateTicketStatus(id, status)
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' })
  res.json(ticket)
})

router.patch('/tickets/:id/urgency', (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { urgency } = req.body
  if (!urgency) return res.status(400).json({ error: 'urgency field required' })
  const ticket = updateTicketUrgency(id, urgency)
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' })
  res.json(ticket)
})

router.patch('/tickets/:id/assign', (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { assignedTo } = req.body
  if (!assignedTo) return res.status(400).json({ error: 'assignedTo field required' })
  const ticket = assignTicket(id, assignedTo)
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' })
  res.json(ticket)
})

// Dashboard reply: send a custom reply to the user and optionally resolve the ticket
router.post('/tickets/:id/reply', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { reply, resolve } = req.body
  if (!reply || typeof reply !== 'string') {
    return res.status(400).json({ error: 'reply field required' })
  }

  const ticket = getTicketById(id)
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' })

  // Send reply to user via Luffa (fire and forget — message delivers reliably)
  const replyMsg = `[Re: Ticket #${id}] ${reply}`
  if (ticket.isGroup && ticket.groupId) {
    sendGroup(ticket.groupId, replyMsg).catch(() => {})
  } else {
    sendDM(ticket.uid, replyMsg).catch(() => {})
  }

  // Update the reply in DB
  updateTicketReply(id, reply)

  // Optionally resolve the ticket
  if (resolve) {
    updateTicketStatus(id, 'resolved')
    scheduleVerification(id, ticket.uid)
    addActivity('dashboard', `Ticket #${id} resolved by operator`, 'success')
  } else {
    addActivity('dashboard', `Reply sent for ticket #${id}`, 'info')
  }

  const updated = getTicketById(id)
  res.json(updated)
})

export default router
