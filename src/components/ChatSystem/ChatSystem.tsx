import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import './ChatSystem.css'

interface ChatMessage {
  id: string
  sender: string
  message: string
  timestamp: number
  type: 'player' | 'system' | 'team'
}

const ChatSystem = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const currentPlayer = useGameStore(state => state.currentPlayer)
  const session = useGameStore(state => state.session)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  // Listen for incoming messages from network
  useEffect(() => {
    const handleIncomingMessage = (event: Event) => {
      const customEvent = event as CustomEvent<ChatMessage>
      setMessages(prev => [...prev, customEvent.detail])
    }

    window.addEventListener('chatMessage', handleIncomingMessage)

    return () => {
      window.removeEventListener('chatMessage', handleIncomingMessage)
    }
  }, [])

  const handleSendMessage = () => {
    if (!inputValue.trim() || !currentPlayer) return

    // Use crypto.randomUUID if available, fallback to timestamp+random
    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID()
      }
      return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    }

    const message: ChatMessage = {
      id: generateId(),
      sender: currentPlayer.username,
      message: inputValue.trim(),
      timestamp: Date.now(),
      type: 'player',
    }

    // Add to local messages
    setMessages(prev => [...prev, message])

    // Send to network (if multiplayer)
    if (session && session.settings.maxPlayers > 1) {
      // TODO: Send via NetworkManager when backend is ready
      window.dispatchEvent(new CustomEvent('sendChatMessage', { detail: message }))
    }

    setInputValue('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    } else if (e.key === 'Escape') {
      setIsExpanded(false)
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'system':
        return 'var(--accent)'
      case 'team':
        return '#4ade80'
      default:
        return 'var(--text-primary)'
    }
  }

  return (
    <div className={`chat-system ${isExpanded ? 'expanded' : 'minimized'}`}>
      <div className="chat-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="chat-icon">💬</span>
        <span className="chat-title">Chat</span>
        {!isExpanded && messages.length > 0 && (
          <span className="chat-badge">{messages.length}</span>
        )}
        <span className="chat-toggle">{isExpanded ? '▼' : '▲'}</span>
      </div>

      {isExpanded && (
        <>
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">No messages yet. Say hello!</div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`chat-message ${msg.type}`}>
                  <span className="chat-time">{formatTime(msg.timestamp)}</span>
                  <span 
                    className="chat-sender" 
                    style={{ color: getMessageColor(msg.type) }}
                  >
                    {msg.sender}:
                  </span>
                  <span className="chat-text">{msg.message}</span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Type a message... (Enter to send, Esc to close)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              maxLength={200}
            />
            <button 
              className="chat-send-button" 
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ChatSystem
