const BASE_URL = 'https://apibot.luffa.im/robot'

export interface LuffaMessage {
  atList: string[]
  text: string
  urlLink: string | null
  msgId: string
}

export interface LuffaEnvelope {
  uid: string
  count: number
  message: string[]
  type: number
}

function getSecret(): string {
  const secret = process.env.LUFFA_SECRET
  if (!secret) throw new Error('LUFFA_SECRET not set')
  return secret
}

export async function receive(): Promise<LuffaEnvelope[]> {
  try {
    const res = await fetch(`${BASE_URL}/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: getSecret() }),
    })
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data as LuffaEnvelope[]
  } catch (err) {
    console.error('[luffa] receive error:', (err as Error).message)
    return []
  }
}

export async function sendDM(uid: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: getSecret(),
        uid,
        msg: JSON.stringify({ text }),
      }),
    })
    const data = await res.json()
    return data?.code !== 500
  } catch (err) {
    console.error('[luffa] sendDM error:', (err as Error).message)
    return false
  }
}

export async function sendGroup(groupId: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/sendGroup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: getSecret(),
        uid: groupId,
        msg: JSON.stringify({ text }),
        type: '1',
      }),
    })
    const data = await res.json()
    return data?.code !== 500
  } catch (err) {
    console.error('[luffa] sendGroup error:', (err as Error).message)
    return false
  }
}

export function parseMessages(envelope: LuffaEnvelope): LuffaMessage[] {
  const messages: LuffaMessage[] = []
  for (const raw of envelope.message) {
    try {
      const parsed = JSON.parse(raw) as LuffaMessage
      if (parsed.text) messages.push(parsed)
    } catch {
      // skip malformed messages
    }
  }
  return messages
}
