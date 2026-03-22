# Luffa Ticket Agent

```
    ╔══════════════════════════════════════════╗
    ║                                          ║
    ║      ┌──────┐   ┌──────┐   ┌────────┐   ║
    ║      │RECIVE│──▶│CLASS │──▶│PRIORITY│   ║
    ║      │ ┌──┐ │   │ (◉‿◉)│   │ ⚠ !!  │   ║
    ║      │ │✉ │ │   │  /|\ │   │  /|\   │   ║
    ║      │ └──┘ │   │  / \ │   │  / \   │   ║
    ║      └──────┘   └──────┘   └────────┘   ║
    ║          ┌─────────────────────┐         ║
    ║          │    📮 POSTMAN 📮     │         ║
    ║          └─────────────────────┘         ║
    ║      ┌──────┐              ┌───────┐    ║
    ║      │DRAFT │◀─────────────│DELIVER│    ║
    ║      │  ⌨⌨  │              │  ➤➤   │    ║
    ║      │  ⌨⌨  │──────────────▶│  ➤➤   │    ║
    ║      └──────┘              └───────┘    ║
    ║                                          ║
    ╚══════════════════════════════════════════╝
```

An **autonomous support ticket system** built on [Luffa](https://luffa.im). Not a chatbot — a multi-agent pipeline that classifies, resolves, detects incidents, and coordinates operators in real-time.

Built for the **LuffaNator (Agentic Track)** at AI London 2026.

---

## What It Does

A user messages the Luffa bot. Five autonomous agents process it:

1. **Receive** — captures the incoming message from Luffa API
2. **Classify** — Gemini 2.0 Flash AI analyzes category + urgency + drafts a reply
3. **Priority** — assesses severity, routes to the right team
4. **Draft** — checks the knowledge base for auto-resolution, or uses the AI reply
5. **Deliver** — sends the response back to the user on Luffa

Three background agents run independently:
- **Incident Detector** — watches for patterns (3+ similar tickets in 10 min → declares incident, alerts admin)
- **Auto-Resolver** — matches against 8 known issue patterns and resolves without human intervention
- **Escalation Agent** — critical tickets trigger instant admin notification via Luffa DM

Operators manage everything from a **live cyberpunk dashboard** with a Pokemon-style village visualization.

---

## Features

| Feature | Description |
|---|---|
| Gemini AI Classification | Real AI categorization + custom replies per message |
| Auto-Resolution | Knowledge base matches resolve tickets autonomously |
| Incident Detection | Pattern recognition across tickets, auto-declares incidents |
| Dashboard Ticket Management | Reply to users, resolve, change priority/status from the browser |
| Ticket Follow-ups | Users send `#8 still broken` to append to existing tickets |
| 12 Slash Commands | `/status`, `/resolve`, `/escalate`, `/summary` (AI-powered), and more |
| Pokemon Village | Top-down pixel art visualization with postman walking the agent pipeline |
| SLA Monitoring | Response times, breach tracking, oldest open ticket |
| Smart Routing | Auto-assigns to dev-team, billing-team, support-lead, or product-team |

---

## Tech Stack

- **Backend:** Node.js, Express, TypeScript, SQLite (sql.js)
- **AI:** Google Gemini 2.0 Flash
- **Bot Platform:** Luffa Messaging API
- **Frontend:** React, Vite
- **Visualization:** Custom SVG pixel art

---

## Quick Start

```bash
# Install
npm run setup

# Add your keys to .env
cp .env.example .env

# Run backend (port 3000)
npm run dev

# Run dashboard (port 3001)
cd dashboard && npm run dev
```

---

## Architecture

```
Phone (Luffa App)
  │
  ▼
Luffa Bot API ◄──── Polling (2s) ────► Express Backend
  │                                        │
  ▼                                        ▼
Receiver → Classifier → Triage → Replier → Sender
  (Gemini AI)                (KB Match)      │
                                             ▼
                                      SQLite Database
                                             │
                              ┌──────────────┼──────────────┐
                              ▼              ▼              ▼
                      Incident Agent   Escalation    Auto-Resolver
                     (pattern detect)  (critical DM)  (KB resolve)
                                             │
                                             ▼
                                    React Dashboard
                                  (Pokemon Village)
```

---

## Team

Solo build by **Yusuf** — AI London 2026
