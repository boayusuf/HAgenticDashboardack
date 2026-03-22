import { LuffaEnvelope, parseMessages, sendDM, sendGroup } from './luffa'
import { handleCommand } from './commands'
import { classify } from '../agents/classifier'
import { setAgentStatus } from '../agents/status'
import { insertTicket, hasMsgId } from '../db/database'
import { escalateIfCritical } from '../agents/escalation'
import { scheduleVerification } from '../agents/verification'
import { addActivity } from '../agents/activity'
import { tryAutoResolve } from '../agents/resolver'
import {
  isShortMessage,
  hasPendingConversation,
  combineMessages,
  askFollowUp,
} from '../agents/conversation'

const seenMsgIds = new Set<string>()

const ROUTE_MAP: Record<string, string> = {
  Bug: 'dev-team',
  Billing: 'billing-team',
  Complaint: 'support-lead',
  'Feature Request': 'product-team',
  General: 'support-team',
}

function pruneSeenIds() {
  if (seenMsgIds.size > 10000) {
    const arr = Array.from(seenMsgIds)
    for (let i = 0; i < 5000; i++) {
      seenMsgIds.delete(arr[i])
    }
  }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function processEnvelopes(envelopes: LuffaEnvelope[]): Promise<void> {
  for (const envelope of envelopes) {
    const messages = parseMessages(envelope)
    const isGroup = envelope.type === 1
    const groupId = isGroup ? envelope.uid : undefined

    for (const msg of messages) {
      if (seenMsgIds.has(msg.msgId) || hasMsgId(msg.msgId)) continue
      seenMsgIds.add(msg.msgId)
      pruneSeenIds()

      const senderUid = envelope.uid
      const text = msg.text.trim()
      if (!text) continue

      // commands
      if (text.startsWith('/')) {
        const response = await handleCommand(text, senderUid)
        if (isGroup && groupId) {
          await sendGroup(groupId, response)
        } else {
          await sendDM(senderUid, response)
        }
        continue
      }

      // conversation: check for pending follow-up response
      let finalMessage = text
      if (hasPendingConversation(senderUid)) {
        finalMessage = combineMessages(senderUid, text)
      } else if (isShortMessage(text)) {
        await askFollowUp(senderUid, text, isGroup, groupId)
        continue
      }

      // ─── AGENT PIPELINE (paced for visual effect) ───

      // Stage 1: RECEIVER — message received
      setAgentStatus('receiver', 'working', `Incoming from ${senderUid.slice(0, 8)}...`)
      addActivity('receiver', `New message from ${senderUid.slice(0, 8)}...`, 'info')
      await delay(800)
      setAgentStatus('receiver', 'done', 'Message captured')

      // Stage 2: CLASSIFIER — AI analysis
      await delay(400)
      setAgentStatus('classifier', 'working', 'Analyzing with Gemini...')
      addActivity('classifier', 'Running AI classification...', 'info')
      const classification = await classify(finalMessage)
      setAgentStatus('classifier', 'done', `${classification.category} detected`)
      addActivity('classifier', `Classified: ${classification.category}`, 'success')

      // Stage 3: URGENCY — priority assessment
      await delay(600)
      setAgentStatus('urgency', 'working', `Assessing severity...`)
      addActivity('urgency', `Evaluating urgency...`, 'info')
      await delay(500)
      setAgentStatus('urgency', 'done', `${classification.urgency} priority`)
      addActivity('urgency', `Priority: ${classification.urgency}`, classification.urgency === 'Critical' ? 'error' : classification.urgency === 'High' ? 'warning' : 'info')

      const assignedTo = ROUTE_MAP[classification.category] || 'support-team'

      // Stage 4: REPLIER — draft response
      await delay(400)
      setAgentStatus('replier', 'working', 'Drafting reply...')
      addActivity('replier', 'Generating response...', 'info')

      // Try auto-resolution first
      const autoResolution = tryAutoResolve(finalMessage, classification.category)
      const finalReply = autoResolution || classification.reply
      const ticketStatus = autoResolution ? 'resolved' : 'open'

      await delay(600)
      setAgentStatus('replier', 'done', autoResolution ? 'Auto-resolved!' : 'Reply ready')
      addActivity('replier', autoResolution ? 'Auto-resolved with KB match' : 'Reply drafted', 'success')

      // store ticket
      const ticket = insertTicket({
        msgId: msg.msgId,
        uid: senderUid,
        senderName: '',
        message: finalMessage,
        category: classification.category,
        urgency: classification.urgency,
        reply: finalReply,
        status: ticketStatus,
        isGroup: isGroup ? 1 : 0,
        groupId: groupId || null,
        assignedTo,
      })

      if (!ticket) continue

      // Stage 5: SENDER — dispatch reply
      await delay(400)
      setAgentStatus('sender', 'working', `Sending to ${senderUid.slice(0, 8)}...`)
      addActivity('sender', `Dispatching reply...`, 'info')
      if (isGroup && groupId) {
        await sendGroup(groupId, finalReply)
      } else {
        await sendDM(senderUid, finalReply)
      }
      await delay(300)
      setAgentStatus('sender', 'done', 'Delivered!')
      addActivity('sender', `Reply sent → ${senderUid.slice(0, 8)}...`, 'success')

      console.log(`[handler] Ticket #${ticket.id}: ${classification.category}/${classification.urgency} → ${assignedTo}${autoResolution ? ' (auto-resolved)' : ''}`)

      // post-pipeline actions
      await escalateIfCritical(ticket)

      if (ticket.status === 'resolved') {
        scheduleVerification(ticket.id, ticket.uid)
      }
    }
  }
}
