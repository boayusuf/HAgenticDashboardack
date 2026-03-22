import { sendDM } from '../bot/luffa'
import { getTicketById } from '../db/database'
import { addActivity } from './activity'

const VERIFY_DELAY = 5 * 60 * 1000 // 5 minutes instead of 2

const pendingVerifications = new Set<number>()

export function scheduleVerification(ticketId: number, uid: string) {
  if (pendingVerifications.has(ticketId)) return

  pendingVerifications.add(ticketId)

  setTimeout(async () => {
    pendingVerifications.delete(ticketId)

    // Check if ticket is still resolved (not already closed or reopened)
    const ticket = getTicketById(ticketId)
    if (!ticket || ticket.status !== 'resolved') return

    const msg = `Ticket #${ticketId} was marked resolved. Reply /confirm to close, or /reopen ${ticketId} if the issue persists.`
    await sendDM(uid, msg)
    addActivity('verification', `Verification sent for #${ticketId}`, 'info')
    console.log(`[verification] Sent verification check for ticket #${ticketId}`)
  }, VERIFY_DELAY)
}
