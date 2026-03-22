import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import path from 'path'
import router from './api/routes'
import { startPolling } from './bot/poller'
// import { checkStaleTickets } from './agents/followup'
import { initDatabase } from './db/database'

async function main() {
  await initDatabase()
  console.log('[db] SQLite initialized')

  const app = express()
  const PORT = parseInt(process.env.PORT || '3000')

  app.use(cors())
  app.use(express.json())
  app.use('/api', router)

  // serve dashboard build in production
  const dashboardBuild = path.join(__dirname, '..', 'dashboard', 'build')
  app.use(express.static(dashboardBuild))

  app.listen(PORT, () => {
    console.log(`[server] Running on port ${PORT}`)
    startPolling()

    // follow-up disabled — no unsolicited messages to users
  })
}

main().catch(err => {
  console.error('Failed to start:', err)
  process.exit(1)
})
