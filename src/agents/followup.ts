import { getStaleTickets, markFollowedUp } from '../db/database'
import { sendDM } from '../bot/luffa'
import { addActivity } from './activity'

// Only follow up on tickets that have been open for 2+ hours, and only once
export async function checkStaleTickets(): Promise<number> {
  const stale = getStaleTickets(120) // 2 hours instead of 30 min
  let count = 0

  for (const ticket of stale) {
    const msg = `Ticket #${ticket.id} update: Your request "${ticket.message.slice(0, 50)}..." is still being worked on.\n` +
      `Reply /close ${ticket.id} if no longer needed.`

    const sent = await sendDM(ticket.uid, msg)
    if (sent) {
      markFollowedUp(ticket.id)
      count++
    }
  }

  if (count > 0) {
    addActivity('followup', `Checked in on ${count} stale ticket(s)`, 'info')
    console.log(`[followup] Sent ${count} follow-up reminders`)
  }
  return count
}
