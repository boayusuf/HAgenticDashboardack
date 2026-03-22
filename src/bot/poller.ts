import { receive } from './luffa'
import { processEnvelopes } from './handler'
import { setAgentStatus } from '../agents/status'

const POLL_INTERVAL = 2000

let polling = false

export function startPolling() {
  if (polling) return
  polling = true
  console.log('[poller] Started polling Luffa API every 2s')
  poll()
}

async function poll() {
  if (!polling) return

  try {
    setAgentStatus('receiver', 'working')
    const envelopes = await receive()

    if (envelopes.length > 0) {
      setAgentStatus('receiver', 'done')
      await processEnvelopes(envelopes)
    } else {
      setAgentStatus('receiver', 'idle')
    }
  } catch (err) {
    console.error('[poller] Error:', (err as Error).message)
  }

  setTimeout(poll, POLL_INTERVAL)
}

export function stopPolling() {
  polling = false
  console.log('[poller] Stopped polling')
}
