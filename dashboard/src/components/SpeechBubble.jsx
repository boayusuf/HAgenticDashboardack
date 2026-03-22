function SpeechBubble({ message, color, visible }) {
  if (!visible || !message) return null

  return (
    <div
      className="speech-bubble"
      style={{ '--agent-color': color }}
    >
      <span className="speech-bubble-text">{message}</span>
    </div>
  )
}

export default SpeechBubble
