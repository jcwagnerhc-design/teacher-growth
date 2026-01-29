'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  MessageCircle,
  Send,
  BookOpen,
  Sparkles,
  Star,
  ChevronRight,
  Lightbulb,
  Clock,
  Rocket,
  Target,
  TrendingUp,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const DEMO_USER_ID = 'demo-user-001'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface Conversation {
  id: string
  startedAt: string
  preview: string
  messages: ChatMessage[]
  reflectionId?: string
}

interface RecentReflection {
  id: string
  createdAt: string
  primaryResponse: string
  domains: string[]
  skillName: string | null
}

export default function CoachPage() {
  const router = useRouter()
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [recentReflections, setRecentReflections] = useState<RecentReflection[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isLoadingReflections, setIsLoadingReflections] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load conversations from localStorage and fetch recent reflections
  useEffect(() => {
    const saved = localStorage.getItem('coach-conversations')
    if (saved) {
      try {
        setConversations(JSON.parse(saved))
      } catch {
        console.error('Failed to parse conversations')
      }
    }

    fetchRecentReflections()
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px'
    }
  }, [inputValue])

  const fetchRecentReflections = async () => {
    setIsLoadingReflections(true)
    try {
      const response = await fetch(`/api/reflections?userId=${DEMO_USER_ID}&limit=5`)
      if (response.ok) {
        const data = await response.json()
        setRecentReflections(data.reflections || [])
      }
    } catch (err) {
      console.error('Failed to fetch reflections:', err)
    } finally {
      setIsLoadingReflections(false)
    }
  }

  const saveConversation = useCallback((msgs: ChatMessage[]) => {
    if (msgs.length < 2) return

    const newConversation: Conversation = {
      id: Date.now().toString(),
      startedAt: new Date().toISOString(),
      preview: msgs[0]?.content.slice(0, 60) + '...',
      messages: msgs,
    }

    const updated = [newConversation, ...conversations].slice(0, 10)
    setConversations(updated)
    localStorage.setItem('coach-conversations', JSON.stringify(updated))
  }, [conversations])

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: ChatMessage = { role: 'user', content: content.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputValue('')
    setIsLoading(true)
    setSuggestions([])

    try {
      const response = await fetch('/api/coaching/open-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: DEMO_USER_ID,
          messages: newMessages,
        }),
      })

      const data = await response.json()

      if (data.available && data.response) {
        const assistantMessage: ChatMessage = { role: 'assistant', content: data.response }
        const updatedMessages = [...newMessages, assistantMessage]
        setMessages(updatedMessages)
        saveConversation(updatedMessages)

        if (data.followUps && data.followUps.length > 0) {
          setSuggestions(data.followUps)
        }
      } else {
        // Fallback response if AI not available
        const fallbackMessage: ChatMessage = {
          role: 'assistant',
          content: "I'm here to help you think through your teaching practice. What's on your mind today?",
        }
        setMessages([...newMessages, fallbackMessage])
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
      }
      setMessages([...newMessages, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const startFromReflection = (reflection: RecentReflection) => {
    const prompt = `I'd like to think more about my recent reflection: "${reflection.primaryResponse.slice(0, 200)}${reflection.primaryResponse.length > 200 ? '...' : ''}"`
    sendMessage(prompt)
  }

  const loadConversation = (conversation: Conversation) => {
    setMessages(conversation.messages)
    setShowHistory(false)
  }

  const startNewChat = () => {
    if (messages.length > 0) {
      saveConversation(messages)
    }
    setMessages([])
    setSuggestions([])
    setShowHistory(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputValue)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const hasActiveChat = messages.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f2744] to-[#0a1628] text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0a1628] border-b-4 border-[#2d4a6f] p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-black flex items-center gap-2 uppercase tracking-wider">
            <MessageCircle className="w-5 h-5 text-[#7db4e0]" />
            Coach
          </h1>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {showHistory ? (
            // History View
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg">Conversations</h2>
                <button
                  onClick={startNewChat}
                  className="text-sm text-[#7db4e0] hover:text-white transition-colors"
                >
                  + New Chat
                </button>
              </div>

              {conversations.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500">No previous conversations yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv)}
                      className="w-full p-4 bg-[#0f2744] border-2 border-[#2d4a6f] text-left hover:bg-[#1e3a5f]/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500">{formatDate(conv.startedAt)}</span>
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-2">{conv.preview}</p>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : hasActiveChat ? (
            // Active Chat View
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-lg px-4 py-3 text-sm',
                        msg.role === 'user'
                          ? 'bg-[#2d5a87] text-white border-2 border-[#4a7ba8]'
                          : 'bg-[#0f2744] text-white border-2 border-[#2d4a6f]'
                      )}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-[#0f2744] text-slate-400 rounded-lg px-4 py-3 text-sm flex items-center gap-2 border-2 border-[#2d4a6f]">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Star className="w-4 h-4" />
                      </motion.div>
                      Thinking...
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="px-4 pb-2">
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(suggestion)}
                        disabled={isLoading}
                        className="text-xs bg-[#1e3a5f]/50 hover:bg-[#2d5a87]/50 text-[#7db4e0] px-3 py-2 rounded-lg border border-[#4a7ba8]/30 transition-colors disabled:opacity-50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            // Welcome View
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 p-4 space-y-6"
            >
              {/* Main Prompt */}
              <div className="text-center pt-8 pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#2d5a87] border-4 border-[#4a7ba8] rounded-full flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black mb-2">What&apos;s on your mind?</h2>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">
                  I&apos;m here to help you think through your teaching practice - not to tell you what to do.
                </p>
              </div>

              {/* Quick Starters */}
              <div className="space-y-3">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-bold px-1">Quick starters</p>
                <div className="space-y-2">
                  <button
                    onClick={() => sendMessage("Something happened in class today that I want to think through.")}
                    className="w-full p-4 bg-[#0f2744] border-2 border-[#2d4a6f] text-left hover:bg-[#1e3a5f]/50 transition-colors flex items-center gap-3"
                  >
                    <Lightbulb className="w-5 h-5 text-[#7db4e0] shrink-0" />
                    <span className="text-sm">Something happened in class today...</span>
                  </button>
                  <button
                    onClick={() => sendMessage("I'm struggling with something and want to talk it through.")}
                    className="w-full p-4 bg-[#0f2744] border-2 border-[#2d4a6f] text-left hover:bg-[#1e3a5f]/50 transition-colors flex items-center gap-3"
                  >
                    <Sparkles className="w-5 h-5 text-[#a0c4e8] shrink-0" />
                    <span className="text-sm">I&apos;m struggling with something...</span>
                  </button>
                </div>
              </div>

              {/* Recent Reflections */}
              {!isLoadingReflections && recentReflections.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">Discuss a recent reflection</p>
                    <button
                      onClick={() => router.push('/play/journal')}
                      className="text-xs text-[#7db4e0] hover:text-white transition-colors"
                    >
                      View all
                    </button>
                  </div>
                  <div className="space-y-2">
                    {recentReflections.slice(0, 3).map((reflection) => (
                      <button
                        key={reflection.id}
                        onClick={() => startFromReflection(reflection)}
                        className="w-full p-3 bg-[#0f2744] border-2 border-[#2d4a6f] text-left hover:bg-[#1e3a5f]/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                            {formatDate(reflection.createdAt)}
                          </span>
                          {reflection.skillName && (
                            <span className="text-[10px] text-[#7db4e0]">{reflection.skillName}</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-300 line-clamp-2">{reflection.primaryResponse}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Conversations */}
              {conversations.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">Continue a conversation</p>
                    <button
                      onClick={() => setShowHistory(true)}
                      className="text-xs text-[#7db4e0] hover:text-white transition-colors"
                    >
                      View all
                    </button>
                  </div>
                  <div className="space-y-2">
                    {conversations.slice(0, 2).map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => loadConversation(conv)}
                        className="w-full p-3 bg-[#0f2744] border-2 border-[#2d4a6f] text-left hover:bg-[#1e3a5f]/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-500">{formatDate(conv.startedAt)}</span>
                          <ChevronRight className="w-3 h-3 text-slate-600" />
                        </div>
                        <p className="text-sm text-slate-300 line-clamp-1">{conv.preview}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area - Always visible except in history */}
        {!showHistory && (
          <div className="p-4 border-t-2 border-[#2d4a6f] bg-[#0a1628]">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What's on your mind?"
                disabled={isLoading}
                rows={1}
                className="flex-1 bg-[#0f2744] border-2 border-[#2d4a6f] rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#4a7ba8] focus:outline-none disabled:opacity-50 resize-none min-h-[48px]"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="px-4 py-3 bg-[#2d5a87] hover:bg-[#4a7ba8] disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors border-2 border-[#4a7ba8] disabled:border-slate-600"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            {hasActiveChat && (
              <button
                onClick={startNewChat}
                className="mt-2 text-xs text-slate-500 hover:text-[#7db4e0] transition-colors"
              >
                Start new conversation
              </button>
            )}
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="sticky bottom-0 bg-[#0a1628] border-t-4 border-[#2d4a6f] z-30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            <button onClick={() => router.push('/play')} className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-[#7db4e0] transition-colors p-2">
              <Rocket className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wide">Base</span>
            </button>
            <button onClick={() => router.push('/play/reflect')} className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-[#a0c4e8] transition-colors p-2">
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wide">Log</span>
            </button>
            <button className="flex flex-col items-center gap-0.5 text-[#7db4e0] p-2 border-2 border-[#4a7ba8] bg-[#1e3a5f]">
              <MessageCircle className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wide">Coach</span>
            </button>
            <button onClick={() => router.push('/play/goals')} className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-[#7db4e0] transition-colors p-2">
              <Target className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wide">Goals</span>
            </button>
            <button onClick={() => router.push('/play/progress')} className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-[#6ba3d6] transition-colors p-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wide">Progress</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}
