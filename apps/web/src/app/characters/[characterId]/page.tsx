'use client'

import { useEffect, useState, useRef, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface CharacterInfo {
  characterId: string
  name: string
  house: string
  currentState: {
    chapterId: number
    emotionalState: string
    location: string
  }
  personality: {
    values: string[]
    speechPatterns: string[]
  }
}

export default function CharacterChatPage({ 
  params 
}: { 
  params: Promise<{ characterId: string }> 
}) {
  const { characterId } = use(params)
  
  const [character, setCharacter] = useState<CharacterInfo | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [xp, setXp] = useState(0)
  const [level, setLevel] = useState(1)
  const [secretsUnlocked, setSecretsUnlocked] = useState<string[]>([])
  const [showSecretModal, setShowSecretModal] = useState(false)
  const [latestSecret, setLatestSecret] = useState('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load character info
  useEffect(() => {
    fetch(`/api/character-chat?characterId=${characterId}`)
      .then(res => res.json())
      .then(data => setCharacter(data))
      .catch(console.error)
  }, [characterId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load conversation from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`chat-${characterId}`)
    if (saved) {
      const data = JSON.parse(saved)
      setMessages(data.messages || [])
      setXp(data.xp || 0)
      setLevel(data.level || 1)
      setSecretsUnlocked(data.secretsUnlocked || [])
    }
  }, [characterId])

  // Save conversation to localStorage
  const saveConversation = (newMessages: Message[], newXp: number, newLevel: number, secrets: string[]) => {
    localStorage.setItem(`chat-${characterId}`, JSON.stringify({
      messages: newMessages,
      xp: newXp,
      level: newLevel,
      secretsUnlocked: secrets
    }))
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/character-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId,
          userId: 'user-1', // TODO: Replace with actual user ID from auth
          message: input.trim(),
          conversationHistory: messages,
          currentXp: xp
        })
      })

      const data = await response.json()

      if (response.ok) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }

        const updatedMessages = [...newMessages, assistantMessage]
        setMessages(updatedMessages)
        setXp(data.xp)
        setLevel(data.level)

        // Handle newly unlocked secrets
        if (data.secretsUnlocked && data.secretsUnlocked.length > 0) {
          const allSecrets = [...secretsUnlocked, ...data.secretsUnlocked]
          setSecretsUnlocked(allSecrets)
          setLatestSecret(data.secretsUnlocked[0])
          setShowSecretModal(true)
          saveConversation(updatedMessages, data.xp, data.level, allSecrets)
        } else {
          saveConversation(updatedMessages, data.xp, data.level, secretsUnlocked)
        }
      } else {
        console.error('API error:', data.error)
        // Remove user message on error
        setMessages(messages)
      }
    } catch (error) {
      console.error('Send message error:', error)
      setMessages(messages)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading character...</div>
      </div>
    )
  }

  const xpForNextLevel = (level) * 50
  const xpProgress = ((xp % 50) / 50) * 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/characters"
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">{character.name}</h1>
                <p className="text-sm text-gray-500">{character.house}</p>
              </div>
            </div>

            {/* Relationship Level */}
            <div className="bg-gray-800/50 rounded-lg px-6 py-3 border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Relationship Level</div>
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-blue-400">Level {level}</div>
                <div className="flex-1 min-w-[120px]">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${xpProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {xp % 50}/{50} XP
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 container mx-auto px-4 py-6 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                Start a conversation with {character.name}
              </div>
              <div className="max-w-md mx-auto space-y-2 text-sm text-gray-600">
                <p>• Ask about their past</p>
                <p>• Discuss current events</p>
                <p>• Build trust to unlock secrets</p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-200 border border-gray-700'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <div className="text-xs opacity-60 mt-2">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-800 pt-4">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${character.name}...`}
              className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Send
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>

      {/* Secret Unlock Modal */}
      <AnimatePresence>
        {showSecretModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSecretModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border-2 border-blue-500 rounded-lg p-8 max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="text-5xl mb-4">🔓</div>
                <h3 className="text-2xl font-bold text-white mb-2">Secret Unlocked!</h3>
                <p className="text-gray-400 mb-6">
                  {character.name} trusts you enough to reveal:
                </p>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
                  <p className="text-gray-200 italic">"{latestSecret}"</p>
                </div>
                <button
                  onClick={() => setShowSecretModal(false)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Continue Conversation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
