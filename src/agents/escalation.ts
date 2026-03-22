import { sendDM } from '../bot/luffa'
import { Ticket } from '../db/database'

export async function escalateIfCritical(ticket: Ticket): Promise<void> {
  if (ticket.urgency !== 'Critical') return

  const adminUid = process.env.ADMIN_UID
  if (!adminUid) {
    console.warn('[escalation] No ADMIN_UID set, skipping escalation')
    return
  }

  const msg = `🚨 CRITICAL TICKET #${ticket.id}\n` +
    `From: ${ticket.uid}\n` +
    `Category: ${ticket.category}\n` +
    `Message: ${ticket.message}\n\n` +
    `Use /status ${ticket.id} for details.`

  await sendDM(adminUid, msg)
  console.log(`[escalation] Critical ticket #${ticket.id} escalated to admin`)
}
