import { sendDM, sendGroup } from '../bot/luffa'

const SHORT_THRESHOLD = 15
const TIMEOUT_MS = 5 * 60 * 1000

interface PendingConversation {
  uid: string
  originalMessage: string
  timestamp: number
  isGroup: boolean
  groupId?: string
}

const pending = new Map<string, PendingConversation>()

function cleanupExpired() {
  const now = Date.now()
  for (const [key, conv] of pending) {
    if (now - conv.timestamp > TIMEOUT_MS) {
      pending.delete(key)
    }
  }
}

export function isShortMessage(text: string): boolean {
  return text.trim().length < SHORT_THRESHOLD
}

export function hasPendingConversation(uid: string): boolean {
  cleanupExpired()
  return pending.has(uid)
}

export function getPendingMessage(uid: string): string | null {
  const conv = pending.get(uid)
  if (!conv) return null
  pending.delete(uid)
  return conv.originalMessage
}

export function combineMessages(uid: string, newMessage: string): string {
  const original = getPendingMessage(uid)
  if (original) return `${original} — ${newMessage}`
  return newMessage
}

export async function askFollowUp(
  uid: string,
  message: string,
  isGroup: boolean,
  groupId?: string
): Promise<void> {
  pending.set(uid, {
    uid,
    originalMessage: message,
    timestamp: Date.now(),
    isGroup,
    groupId,
  })

  const followUpText = 'Could you describe your issue in more detail? This helps us assist you faster.'

  if (isGroup && groupId) {
    await sendGroup(groupId, followUpText)
  } else {
    await sendDM(uid, followUpText)
  }
}
