'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, MessageCircle, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface TeacherProfile {
  backstory?: string
  superpower?: string
}

interface CoachChatProps {
  context: {
    domain: string
    domainName: string
    skillName?: string
    primaryResponse: string
    followUpResponse?: string
    initialInsight: string
    initialStrategy: string
    profile?: TeacherProfile
  }
  className?: string
}

export default function CoachChat({ context, className }: CoachChatProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [limitReached, setLimitReached] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Generate initial suggestions when component mounts
  useEffect(() => {
    generateInitialSuggestions()
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  const generateInitialSuggestions = () => {
    // Generate context-specific initial suggestions
    const baseSuggestions = [
      'How do I time this better?',
      'What if students struggle with this?',
      'Tell me more about this strategy',
    ]

    if (context.skillName?.toLowerCase().includes('question')) {
      setSuggestions([
        'What if students won\'t answer?',
        'How do I ask better follow-up questions?',
        'How long should I wait for responses?',
      ])
    } else if (context.skillName?.toLowerCase().includes('engagement')) {
      setSuggestions([
        'What if some students won\'t participate?',
        'How do I keep momentum going?',
        'What are quick engagement strategies?',
      ])
    } else if (context.skillName?.toLowerCase().includes('feedback')) {
      setSuggestions([
        'How specific should my feedback be?',
        'What if a student gets defensive?',
        'How do I give feedback efficiently?',
      ])
    } else {
      setSuggestions(baseSuggestions)
    }
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading || limitReached) return

    const userMessage: ChatMessage = { role: 'user', content: content.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputValue('')
    setIsLoading(true)
    setSuggestions([])

    try {
      const response = await fetch('/api/coaching/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context,
          messages: newMessages,
        }),
      })

      const data = await response.json()

      if (data.available && data.response) {
        const assistantMessage: ChatMessage = { role: 'assistant', content: data.response }
        setMessages([...newMessages, assistantMessage])

        if (data.limitReached) {
          setLimitReached(true)
          setSuggestions([])
        } else if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions)
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Expand/Collapse Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-[#1e3a5f]/30 hover:bg-[#1e3a5f]/50 rounded-lg border border-[#4a7ba8]/30 transition-colors"
      >
        <span className="text-sm text-[#7db4e0] font-medium flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Continue exploring with your coach...
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 bg-[#0f2744]/80 rounded-lg border border-[#4a7ba8]/30 overflow-hidden">
              {/* Messages Area */}
              <div className="max-h-64 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    What would you like to explore further? I&apos;m here to help you think it through.
                  </p>
                ) : (
                  messages.map((msg, i) => (
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
                          'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                          msg.role === 'user'
                            ? 'bg-[#2d5a87] text-white'
                            : 'bg-slate-800 text-white border border-[#4a7ba8]/30'
                        )}
                      >
                        {msg.content}
                      </div>
                    </motion.div>
                  ))
                )}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-slate-800 text-slate-400 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Star className="w-3 h-3" />
                      </motion.div>
                      Thinking...
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestions */}
              {suggestions.length > 0 && !limitReached && (
                <div className="px-3 pb-2">
                  <p className="text-xs text-slate-500 mb-2">Quick questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(suggestion)}
                        disabled={isLoading}
                        className="text-xs bg-[#1e3a5f]/50 hover:bg-[#2d5a87]/50 text-[#7db4e0] px-3 py-1.5 rounded-full border border-[#4a7ba8]/30 transition-colors disabled:opacity-50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              {!limitReached ? (
                <form onSubmit={handleSubmit} className="p-3 border-t border-[#4a7ba8]/20">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Type your question..."
                      disabled={isLoading}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#4a7ba8] focus:outline-none disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!inputValue.trim() || isLoading}
                      className="px-3 py-2 bg-[#2d5a87] hover:bg-[#4a7ba8] disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    {5 - Math.floor(messages.length / 2)} questions remaining
                  </p>
                </form>
              ) : (
                <div className="p-3 border-t border-[#4a7ba8]/20 text-center">
                  <p className="text-sm text-slate-400">
                    Great conversation! Start a new reflection to chat more.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
