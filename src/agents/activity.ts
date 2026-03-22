export interface ActivityEntry {
  timestamp: string
  agent: string
  action: string
  type: 'info' | 'success' | 'warning' | 'error'
}

const log: ActivityEntry[] = []
const MAX_ENTRIES = 50

export function addActivity(agent: string, action: string, type: ActivityEntry['type'] = 'info') {
  log.push({
    timestamp: new Date().toISOString(),
    agent,
    action,
    type,
  })
  if (log.length > MAX_ENTRIES) log.splice(0, log.length - MAX_ENTRIES)
}

export function getActivities(): ActivityEntry[] {
  return log.slice(-20)
}
