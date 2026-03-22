# Luffa Ticket Agent

```
    ╔══════════════════════════════════════════╗
    ║                                          ║
    ║      ┌──────┐   ┌──────┐   ┌────────┐   ║
    ║      │INBOX │──▶│CLASS │──▶│PRIORITY│   ║
    ║      │ ┌──┐ │   │ (◉‿◉)│   │ ⚠ !!  │   ║
    ║      │ │✉ │ │   │  /|\ │   │  /|\   │   ║
    ║      │ └──┘ │   │  / \ │   │  / \   │   ║
    ║      └──────┘   └──────┘   └────────┘   ║
    ║          ┌─────────────────────┐         ║
    ║          │    📮 POSTMAN 📮     │         ║
    ║          └─────────────────────┘         ║
    ║      ┌──────┐              ┌───────┐    ║
    ║      │DRAFT │◀─────────────│OUTBOX │    ║
    ║      │  ⌨⌨  │              │  ➤➤   │    ║
    ║      │  ⌨⌨  │──────────────▶│  ➤➤   │    ║
    ║      └──────┘              └───────┘    ║
    ║                                          ║
    ╚══════════════════════════════════════════╝
```

An **autonomous support ticket system** built on [Luffa](https://luffa.im). Not a chatbot — a multi-agent pipeline that automates tasks, coordinates users and operators, and interacts with external AI systems, all within the Luffa ecosystem.

Built for the **LuffaNator (Agentic Track)** at AI London 2026.

---

## What It Does

Users message a Luffa bot with support requests. The system **autonomously** processes every message through a 5-agent pipeline, makes decisions, takes actions, and responds — without a human in the loop.

### Agent Pipeline

1. **Inbox** — polls the Luffa Bot API every 2 seconds, captures incoming messages
2. **Classify** — sends the message to **Google Gemini 2.0 Flash** for AI-powered categorization (Bug, Billing, Complaint, Feature Request, General), urgency assessment (Critical → Low), and a custom reply
3. **Priority** — evaluates severity, auto-routes to the right team (dev-team, billing-team, support-lead, product-team)
4. **Draft** — checks a knowledge base of 8 common issue patterns for instant auto-resolution; falls back to the Gemini-generated reply
5. **Outbox** — delivers the response back to the user on Luffa with their ticket number

### Background Agents (run autonomously)

- **Incident Detector** — monitors ticket patterns across all users. If 3+ tickets of the same category arrive within 10 minutes, it autonomously declares an incident and alerts the admin via Luffa DM
- **Auto-Resolver** — matches incoming messages against known issues (password reset, cancel subscription, refund, app crash, etc.) and resolves tickets without any human intervention
- **Escalation Agent** — critical tickets trigger an instant notification to the admin via Luffa DM

### User Coordination

The system coordinates two types of users through a single platform:

- **End users** interact via the Luffa chat — submitting tickets, receiving AI responses, following up with `#8 message` to append to existing tickets
- **Operators** manage from a live web dashboard — replying to users (messages delivered via Luffa), changing priority/status, resolving tickets, running commands, filtering and searching across all ticket data

Both sides stay in sync in real-time. When an operator replies from the dashboard, it appears on the user's phone. When a user follows up, the ticket updates live on the dashboard.

---

## External Systems & Integrations

| System | How It's Used |
|---|---|
| **Luffa Bot API** | Polling for messages, sending DMs, sending group messages — the bot lives natively on Luffa |
| **Google Gemini 2.0 Flash** | AI classification, urgency assessment, custom reply generation, `/summary` command for AI-powered ticket summaries |
| **SQLite** | Persistent ticket storage with full CRUD, search, filtering, SLA metrics, and aggregate stats |

---

## Features

| Feature | Description |
|---|---|
| Gemini AI Classification | Real AI categorization + unique replies per message — not keyword matching |
| Auto-Resolution | Knowledge base matches resolve tickets autonomously (8 known patterns) |
| Incident Detection | Pattern recognition across tickets — auto-declares incidents, alerts admin |
| Dashboard Ticket Management | Reply to users, resolve, change priority/status from the browser |
| Ticket Follow-ups | Users send `#8 still broken` to append to existing tickets and reopen them |
| 12 Slash Commands | `/status`, `/resolve`, `/escalate`, `/assign`, `/search`, `/summary` (AI-powered), and more |
| Smart Routing | Auto-assigns to dev-team, billing-team, support-lead, or product-team |
| SLA Monitoring | Tracks response times, breach count, oldest open ticket |
| Real-time Activity Log | Every agent action logged and displayed live |
| Conversation Agent | Short/vague messages trigger a follow-up question before classification |
| Pokemon Village Dashboard | Top-down pixel art visualization — postman walks between agent buildings as tickets are processed |

---

## Tech Stack

- **Backend:** Node.js, Express, TypeScript
- **Database:** SQLite (sql.js) with persistent storage
- **AI:** Google Gemini 2.0 Flash API
- **Bot Platform:** Luffa Messaging Bot API (polling + send)
- **Frontend:** React 18, Vite
- **Visualization:** Custom SVG pixel art, CSS animations

---

## Quick Start

```bash
# Install all dependencies
npm run setup

# Configure environment
cp .env.example .env
# Add your LUFFA_SECRET, GEMINI_API_KEY, and ADMIN_UID

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
Inbox → Classify → Priority → Draft → Outbox
         (Gemini)              (KB)      │
                                         ▼
                                  SQLite Database
                                         │
                          ┌──────────────┼──────────────┐
                          ▼              ▼              ▼
                   Incident Agent   Escalation    Auto-Resolver
                  (pattern detect)  (critical DM)  (KB resolve)
                                         │
                                         ▼
                                React Dashboard  ◄──── Operator
                               (Pokemon Village)       (reply, resolve,
                                                        manage tickets)
```

---

## Solo Build

Built by **Yusuf** at AI London 2026 for the LuffaNator (Agentic Track).
