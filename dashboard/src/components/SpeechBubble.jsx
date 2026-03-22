function SpeechBubble({ message, color, visible, position = 'above' }) {
  if (!visible || !message) return null

  return (
    <div
      className={`speech-bubble speech-bubble-${position}`}
      style={{ '--agent-color': color }}
    >
      <span className="speech-bubble-text">{message}</span>
    </div>
  )
}

export default SpeechBubble
