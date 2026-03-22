export interface AgentState {
  status: 'idle' | 'working' | 'done'
  message: string
  lastActive: number
}

type AgentName = 'receiver' | 'classifier' | 'urgency' | 'replier' | 'sender'

const RESET_DELAY = 6000

const agents: Record<AgentName, AgentState> = {
  receiver: { status: 'idle', message: '', lastActive: Date.now() },
  classifier: { status: 'idle', message: '', lastActive: Date.now() },
  urgency: { status: 'idle', message: '', lastActive: Date.now() },
  replier: { status: 'idle', message: '', lastActive: Date.now() },
  sender: { status: 'idle', message: '', lastActive: Date.now() },
}

const timers: Record<string, ReturnType<typeof setTimeout>> = {}

export function setAgentStatus(name: AgentName, status: AgentState['status'], message = '') {
  agents[name] = { status, message, lastActive: Date.now() }

  if (timers[name]) clearTimeout(timers[name])

  if (status === 'working' || status === 'done') {
    timers[name] = setTimeout(() => {
      agents[name] = { status: 'idle', message: '', lastActive: Date.now() }
    }, RESET_DELAY)
  }
}

export function getAgentStatuses(): Record<AgentName, AgentState> {
  return { ...agents }
}
