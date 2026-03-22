import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import fs from 'fs'
import path from 'path'

export interface Ticket {
  id: number
  msgId: string
  uid: string
  senderName: string
  message: string
  category: string
  urgency: string
  reply: string
  timestamp: string
  status: string
  isGroup: number
  groupId: string | null
  assignedTo: string | null
  followedUp: number
}

const DB_PATH = path.join(process.cwd(), 'tickets.db')
let db: SqlJsDatabase

export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs()

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      msgId TEXT UNIQUE,
      uid TEXT NOT NULL,
      senderName TEXT DEFAULT '',
      message TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      urgency TEXT NOT NULL DEFAULT 'Low',
      reply TEXT DEFAULT '',
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      status TEXT NOT NULL DEFAULT 'open',
      isGroup INTEGER NOT NULL DEFAULT 0,
      groupId TEXT DEFAULT NULL,
      assignedTo TEXT DEFAULT NULL,
      followedUp INTEGER NOT NULL DEFAULT 0
    )
  `)
  save()
}

function save() {
  const data = db.export()
  fs.writeFileSync(DB_PATH, Buffer.from(data))
}

function rowsToTickets(result: any): Ticket[] {
  if (!result.length) return []
  const cols = result[0].columns as string[]
  return (result[0].values as any[][]).map(row => {
    const obj: any = {}
    cols.forEach((col, i) => { obj[col] = row[i] })
    return obj as Ticket
  })
}

function queryTickets(sql: string, params: any[] = []): Ticket[] {
  const result = db.exec(sql, params)
  return rowsToTickets(result)
}

export function insertTicket(ticket: Omit<Ticket, 'id' | 'timestamp' | 'followedUp'>): Ticket | null {
  try {
    db.run(
      `INSERT INTO tickets (msgId, uid, senderName, message, category, urgency, reply, status, isGroup, groupId, assignedTo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ticket.msgId, ticket.uid, ticket.senderName, ticket.message, ticket.category,
       ticket.urgency, ticket.reply, ticket.status, ticket.isGroup, ticket.groupId, ticket.assignedTo]
    )
    save()
    const rows = queryTickets('SELECT * FROM tickets WHERE msgId = ?', [ticket.msgId])
    return rows[0] || null
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) return null
    throw err
  }
}

export function getTickets(limit = 50, offset = 0): Ticket[] {
  return queryTickets('SELECT * FROM tickets ORDER BY id DESC LIMIT ? OFFSET ?', [limit, offset])
}

export function getTicketById(id: number): Ticket | null {
  const rows = queryTickets('SELECT * FROM tickets WHERE id = ?', [id])
  return rows[0] || null
}

export function updateTicketStatus(id: number, status: string): Ticket | null {
  db.run('UPDATE tickets SET status = ? WHERE id = ?', [status, id])
  save()
  return getTicketById(id)
}

export function updateTicketUrgency(id: number, urgency: string): Ticket | null {
  db.run('UPDATE tickets SET urgency = ? WHERE id = ?', [urgency, id])
  save()
  return getTicketById(id)
}

export function assignTicket(id: number, assignedTo: string): Ticket | null {
  db.run('UPDATE tickets SET assignedTo = ? WHERE id = ?', [assignedTo, id])
  save()
  return getTicketById(id)
}

export function appendToTicket(id: number, message: string): Ticket | null {
  const ticket = getTicketById(id)
  if (!ticket) return null
  const updated = ticket.message + '\n---\n' + message
  db.run('UPDATE tickets SET message = ?, status = ? WHERE id = ?', [updated, 'open', id])
  save()
  return getTicketById(id)
}

export function updateTicketReply(id: number, reply: string): Ticket | null {
  db.run('UPDATE tickets SET reply = ? WHERE id = ?', [reply, id])
  save()
  return getTicketById(id)
}

export function searchTickets(query: string): Ticket[] {
  return queryTickets('SELECT * FROM tickets WHERE message LIKE ? ORDER BY id DESC', [`%${query}%`])
}

export function getTicketsByUser(uid: string): Ticket[] {
  return queryTickets('SELECT * FROM tickets WHERE uid = ? ORDER BY id DESC', [uid])
}

export function getStats() {
  const result = db.exec(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgress,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
      SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
      SUM(CASE WHEN urgency = 'Critical' THEN 1 ELSE 0 END) as critical,
      SUM(CASE WHEN urgency = 'High' THEN 1 ELSE 0 END) as high,
      SUM(CASE WHEN urgency = 'Medium' THEN 1 ELSE 0 END) as medium,
      SUM(CASE WHEN urgency = 'Low' THEN 1 ELSE 0 END) as low,
      SUM(CASE WHEN category = 'Bug' THEN 1 ELSE 0 END) as cat_Bug,
      SUM(CASE WHEN category = 'Feature Request' THEN 1 ELSE 0 END) as "cat_Feature Request",
      SUM(CASE WHEN category = 'Complaint' THEN 1 ELSE 0 END) as cat_Complaint,
      SUM(CASE WHEN category = 'Billing' THEN 1 ELSE 0 END) as cat_Billing,
      SUM(CASE WHEN category = 'General' THEN 1 ELSE 0 END) as cat_General,
      SUM(CASE WHEN datetime(timestamp) >= datetime('now', '-1 hour') THEN 1 ELSE 0 END) as recentCount
    FROM tickets
  `)
  if (!result.length) {
    return { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0,
      critical: 0, high: 0, medium: 0, low: 0,
      cat_Bug: 0, 'cat_Feature Request': 0, cat_Complaint: 0, cat_Billing: 0, cat_General: 0,
      recentCount: 0 }
  }
  const cols = result[0].columns
  const vals = result[0].values[0]
  const obj: any = {}
  cols.forEach((col, i) => { obj[col] = vals[i] || 0 })
  return obj
}

export function hasMsgId(msgId: string): boolean {
  const result = db.exec('SELECT 1 FROM tickets WHERE msgId = ?', [msgId])
  return result.length > 0 && result[0].values.length > 0
}

export function getStaleTickets(minutesOld = 30): Ticket[] {
  return queryTickets(`
    SELECT * FROM tickets
    WHERE status = 'open'
      AND followedUp = 0
      AND datetime(timestamp) <= datetime('now', '-' || ? || ' minutes')
    ORDER BY id ASC
  `, [minutesOld])
}

export function markFollowedUp(id: number) {
  db.run('UPDATE tickets SET followedUp = 1 WHERE id = ?', [id])
  save()
}

export function getRecentTickets(n = 5): Ticket[] {
  return queryTickets('SELECT * FROM tickets ORDER BY id DESC LIMIT ?', [n])
}

export function getDb() {
  return db
}
