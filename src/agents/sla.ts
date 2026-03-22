import { getDb } from '../db/database'

interface SLAMetrics {
  avgResponseMinutes: number
  openCount: number
  breachCount: number
  oldestOpenMinutes: number
}

export function getSLAMetrics(): SLAMetrics {
  const db = getDb()

  const avgResult = db.exec(`
    SELECT AVG(
      (julianday(CASE WHEN status != 'open' THEN timestamp ELSE datetime('now') END) - julianday(timestamp)) * 1440
    ) as avg
    FROM tickets
  `)
  const avg = avgResult.length ? avgResult[0].values[0][0] as number : 0

  const openResult = db.exec(`SELECT COUNT(*) as c FROM tickets WHERE status = 'open'`)
  const openCount = openResult.length ? openResult[0].values[0][0] as number : 0

  const breachResult = db.exec(`
    SELECT COUNT(*) as c FROM tickets
    WHERE status = 'open'
      AND (julianday('now') - julianday(timestamp)) * 1440 > 60
  `)
  const breachCount = breachResult.length ? breachResult[0].values[0][0] as number : 0

  const oldestResult = db.exec(`SELECT MIN(timestamp) as oldest FROM tickets WHERE status = 'open'`)
  let oldestOpenMinutes = 0
  if (oldestResult.length && oldestResult[0].values[0][0]) {
    const oldest = oldestResult[0].values[0][0] as string
    oldestOpenMinutes = Math.round(
      (Date.now() - new Date(oldest + 'Z').getTime()) / 60000
    )
  }

  return {
    avgResponseMinutes: Math.round((avg || 0) * 100) / 100,
    openCount,
    breachCount,
    oldestOpenMinutes,
  }
}
