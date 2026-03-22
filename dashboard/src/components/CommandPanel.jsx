import { useState, useRef, useEffect } from 'react'

const COMMANDS = [
  { name: '/help', desc: 'All commands' },
  { name: '/status', desc: 'Overview' },
  { name: '/recent', desc: 'Latest tickets' },
  { name: '/search ', desc: 'Search', needsInput: true },
  { name: '/resolve ', desc: 'Resolve', needsInput: true },
  { name: '/close ', desc: 'Close', needsInput: true },
  { name: '/reopen ', desc: 'Reopen', needsInput: true },
  { name: '/escalate ', desc: 'Escalate', needsInput: true },
  { name: '/priority ', desc: 'Set priority', needsInput: true },
  { name: '/assign ', desc: 'Assign', needsInput: true },
]

export default function CommandPanel({ agentStatus }) {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [cmdHistory, setCmdHistory] = useState([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const outputRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [history])

  const executeCommand = async (cmd) => {
    const trimmed = cmd.trim()
    if (!trimmed) return

    setHistory(h => [...h, { type: 'input', text: trimmed }])
    setCmdHistory(h => [trimmed, ...h])
    setHistoryIdx(-1)
    setInput('')

    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: trimmed }),
      })
      const data = await res.json()
      setHistory(h => [...h, { type: 'output', text: data.reply || data.error || 'Done.' }])
    } catch {
      setHistory(h => [...h, { type: 'error', text: 'Connection error' }])
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      executeCommand(input)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (cmdHistory.length > 0) {
        const newIdx = Math.min(historyIdx + 1, cmdHistory.length - 1)
        setHistoryIdx(newIdx)
        setInput(cmdHistory[newIdx])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIdx > 0) {
        const newIdx = historyIdx - 1
        setHistoryIdx(newIdx)
        setInput(cmdHistory[newIdx])
      } else {
        setHistoryIdx(-1)
        setInput('')
      }
    }
  }

  const handleQuickCmd = (cmd) => {
    if (cmd.needsInput) {
      setInput(cmd.name)
      inputRef.current?.focus()
    } else {
      executeCommand(cmd.name)
    }
  }

  return (
    <div className="command-panel" onClick={() => inputRef.current?.focus()}>
      <div className="cmd-header">{'// COMMAND CONSOLE'}</div>

      <div className="cmd-shortcuts">
        {COMMANDS.map(cmd => (
          <button
            key={cmd.name}
            className="cmd-shortcut-btn"
            onClick={(e) => { e.stopPropagation(); handleQuickCmd(cmd) }}
            title={cmd.desc}
          >
            {cmd.name.trim()}
          </button>
        ))}
      </div>

      <div className="cmd-output" ref={outputRef}>
        {history.length === 0 && (
          <div className="cmd-welcome">Type a command or click above. Try /help</div>
        )}
        {history.map((entry, i) => (
          <div key={i} className={`cmd-entry cmd-${entry.type}`}>
            {entry.type === 'input' && <span className="cmd-prompt">&gt; </span>}
            <span className="cmd-text">{entry.text}</span>
          </div>
        ))}
      </div>

      <div className="cmd-input-line">
        <span className="cmd-prompt">&gt; </span>
        <input
          ref={inputRef}
          type="text"
          className="cmd-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="/help"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  )
}
