'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import PixelCharacter, { CharacterCustomization, DEFAULT_CHARACTER } from './PixelCharacter'
import { cn } from '@/lib/utils'

const DEMO_USER_ID = 'demo-user-001'
const ENTRIES_PER_PAGE = 2

interface Reflection {
  id: string
  createdAt: string
  domains: string[]
  skillId: string | null
  skillName: string | null
  primaryResponse: string
  followUpResponse: string | null
}

interface Props {
  onExit: () => void
}

// Rotating prompts to keep it fresh
const JOURNAL_PROMPTS = [
  "What happened in your teaching today?",
  "What moment from class is sticking with you?",
  "What's on your mind about your practice?",
  "Describe a moment from today's teaching.",
  "What did you notice in your classroom today?",
]

export default function JournalRoom({ onExit }: Props) {
  const [character, setCharacter] = useState<CharacterCustomization>(DEFAULT_CHARACTER)
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState<'left' | 'right'>('right')

  // Terminal state
  const [isWriting, setIsWriting] = useState(false)
  const [input, setInput] = useState('')
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [terminalHistory, setTerminalHistory] = useState<Array<{ type: 'system' | 'user' | 'prompt'; text: string }>>([
    { type: 'system', text: 'TEACHER JOURNAL v2.1' },
    { type: 'system', text: 'Type "new" to start a reflection, or browse entries above.' },
  ])
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  // Load character
  useEffect(() => {
    const profileStr = localStorage.getItem('teacher-profile')
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr)
        if (profile.character) setCharacter(profile.character)
      } catch (e) { /* ignore */ }
    }
  }, [])

  // Fetch reflections
  const fetchReflections = useCallback(async () => {
    try {
      const response = await fetch(`/api/reflections?userId=${DEMO_USER_ID}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setReflections(data.reflections)
      }
    } catch (err) {
      console.error('Failed to fetch reflections:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReflections()
  }, [fetchReflections])

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalHistory])

  // Focus input
  useEffect(() => {
    inputRef.current?.focus()
  }, [isWriting])

  const totalPages = Math.ceil(reflections.length / ENTRIES_PER_PAGE)
  const currentEntries = reflections.slice(
    currentPage * ENTRIES_PER_PAGE,
    (currentPage + 1) * ENTRIES_PER_PAGE
  )

  const goToPage = useCallback((newPage: number) => {
    if (newPage < 0 || newPage >= totalPages || isFlipping) return
    setFlipDirection(newPage > currentPage ? 'right' : 'left')
    setIsFlipping(true)
    setTimeout(() => {
      setCurrentPage(newPage)
      setIsFlipping(false)
    }, 300)
  }, [currentPage, totalPages, isFlipping])

  // Keyboard navigation for book
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === inputRef.current) return
      if (e.key === 'ArrowLeft') goToPage(currentPage - 1)
      else if (e.key === 'ArrowRight') goToPage(currentPage + 1)
      else if (e.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, goToPage, onExit])

  const addToHistory = (type: 'system' | 'user' | 'prompt', text: string) => {
    setTerminalHistory(prev => [...prev, { type, text }])
  }

  const getRandomPrompt = () => {
    return JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)]
  }

  const handleCommand = async (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase()

    if (!isWriting) {
      // Idle state - waiting for "new" command
      if (trimmed === 'new' || trimmed === 'n') {
        addToHistory('user', cmd)
        const prompt = getRandomPrompt()
        setCurrentPrompt(prompt)
        addToHistory('system', '')
        addToHistory('prompt', prompt)
        setIsWriting(true)
      } else if (trimmed === 'exit' || trimmed === 'quit' || trimmed === 'q') {
        onExit()
      } else if (trimmed) {
        addToHistory('user', cmd)
        addToHistory('system', 'Type "new" to start a reflection.')
      }
    } else {
      // Writing state - capture the reflection
      if (cmd.trim().length < 10) {
        addToHistory('user', cmd)
        addToHistory('system', 'Write a bit more (at least 10 characters).')
        setInput('')
        return
      }

      addToHistory('user', cmd)
      addToHistory('system', '')
      addToHistory('system', 'Saving...')
      setIsSaving(true)

      try {
        const response = await fetch('/api/reflections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: DEMO_USER_ID,
            primaryResponse: cmd.trim(),
            prompt: currentPrompt,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const tagged = data.reflection?.skillName || data.reflection?.domains?.[0]
          if (tagged) {
            addToHistory('system', `Saved! Tagged as: ${tagged}`)
          } else {
            addToHistory('system', 'Saved!')
          }
          addToHistory('system', '')
          addToHistory('system', 'Type "new" to add another entry.')
          await fetchReflections()
          setCurrentPage(0)
        } else {
          addToHistory('system', 'Error saving. Try again.')
        }
      } catch (err) {
        addToHistory('system', 'Error saving. Try again.')
      }

      setIsWriting(false)
      setCurrentPrompt('')
      setIsSaving(false)
    }

    setInput('')
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className="relative flex flex-col items-center p-4 h-full">
      {/* Header */}
      <div className="w-full max-w-[680px] flex items-center justify-between mb-4">
        <button
          onClick={onExit}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Classroom</span>
        </button>
      </div>

      {/* Journal Book */}
      <div className="relative" style={{ perspective: '1500px' }}>
        <div
          className="relative bg-gradient-to-r from-[#4A3728] via-[#5D4037] to-[#4A3728] rounded-lg p-2"
          style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.3)' }}
        >
          <div className="absolute left-1/2 top-0 bottom-0 w-4 -translate-x-1/2 bg-gradient-to-r from-[#3E2723] via-[#5D4037] to-[#3E2723]" />

          <div className="flex">
            {/* Left page */}
            <motion.div
              className="w-[320px] h-[340px] bg-[#FDF5E6] rounded-l-sm p-4 relative overflow-hidden"
              style={{
                boxShadow: 'inset -5px 0 15px rgba(0,0,0,0.1)',
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #E8D5C4 28px)',
              }}
              animate={isFlipping && flipDirection === 'left' ? { rotateY: [0, -15, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl from-[#E8D5C4] to-transparent" />
              <div className="absolute bottom-2 left-4 text-xs text-[#8B7355] font-serif">
                {currentPage * 2 + 1}
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                    <BookOpen className="w-8 h-8 text-[#8B7355]" />
                  </motion.div>
                </div>
              ) : currentEntries[0] ? (
                <JournalEntry entry={currentEntries[0]} character={character} formatDate={formatDate} formatTime={formatTime} />
              ) : reflections.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <BookOpen className="w-12 h-12 text-[#C4A060] mb-4" />
                  <p className="text-[#5D4037] font-serif text-lg mb-2">Your journal awaits</p>
                  <p className="text-[#8B7355] text-sm">Type &quot;new&quot; below to start.</p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-[#C4A060] font-serif italic">
                  End of entries
                </div>
              )}
            </motion.div>

            {/* Right page */}
            <motion.div
              className="w-[320px] h-[340px] bg-[#FDF5E6] rounded-r-sm p-4 relative overflow-hidden"
              style={{
                boxShadow: 'inset 5px 0 15px rgba(0,0,0,0.1)',
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #E8D5C4 28px)',
              }}
              animate={isFlipping && flipDirection === 'right' ? { rotateY: [0, 15, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute bottom-0 left-0 w-8 h-8 bg-gradient-to-tr from-[#E8D5C4] to-transparent" />
              <div className="absolute bottom-2 right-4 text-xs text-[#8B7355] font-serif">
                {currentPage * 2 + 2}
              </div>

              {isLoading ? (
                <div className="h-full" />
              ) : currentEntries[1] ? (
                <JournalEntry entry={currentEntries[1]} character={character} formatDate={formatDate} formatTime={formatTime} />
              ) : currentEntries[0] && reflections.length > 1 ? (
                <div className="flex items-center justify-center h-full text-[#C4A060] font-serif italic">
                  Turn page for more...
                </div>
              ) : null}
            </motion.div>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-3">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0 || isFlipping}
              className={cn(
                'p-2 rounded-lg transition-colors',
                currentPage === 0 || isFlipping ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs text-slate-400 font-medium">Page {currentPage + 1} of {totalPages}</span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1 || isFlipping}
              className={cn(
                'p-2 rounded-lg transition-colors',
                currentPage >= totalPages - 1 || isFlipping ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Terminal Input */}
      <div
        className="w-full max-w-[680px] mt-4 bg-black border-2 border-[#333] rounded-lg overflow-hidden font-mono text-sm"
        style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}
      >
        <div ref={terminalRef} className="h-28 overflow-y-auto p-3 space-y-1">
          {terminalHistory.map((line, i) => (
            <div
              key={i}
              className={cn(
                line.type === 'system' && 'text-[#00ff00]',
                line.type === 'user' && 'text-[#ffff00]',
                line.type === 'prompt' && 'text-[#00ffff] font-bold',
              )}
            >
              {line.type === 'user' && <span className="text-[#888]">&gt; </span>}
              {line.text}
            </div>
          ))}
        </div>

        <div className="border-t border-[#333] p-3 flex items-center gap-2">
          <span className="text-[#00ff00]">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isSaving) {
                handleCommand(input)
              }
            }}
            disabled={isSaving}
            className="flex-1 bg-transparent text-[#00ff00] outline-none caret-[#00ff00] disabled:opacity-50"
            placeholder={isWriting ? 'Write your reflection...' : 'Type "new" to start...'}
            autoFocus
          />
          <span className="text-[#00ff00] animate-pulse">_</span>
        </div>
      </div>
    </div>
  )
}

function JournalEntry({
  entry,
  character,
  formatDate,
  formatTime
}: {
  entry: Reflection
  character: CharacterCustomization
  formatDate: (d: string) => string
  formatTime: (d: string) => string
}) {
  const domainLabels: Record<string, string> = {
    planning: 'Planning',
    environment: 'Environment',
    instruction: 'Instruction',
    assessment: 'Assessment',
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start gap-2 mb-3 pb-2 border-b border-[#E8D5C4]">
        <div className="w-8 h-8 shrink-0">
          <PixelCharacter customization={character} size="sm" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-[#8B7355] font-medium">
            {formatDate(entry.createdAt)} • {formatTime(entry.createdAt)}
          </p>
          {entry.skillName && (
            <p className="text-xs text-[#6B5B95] font-semibold truncate">{entry.skillName}</p>
          )}
        </div>
      </div>

      {entry.domains[0] && (
        <div className="mb-2">
          <span className="text-[9px] px-1.5 py-0.5 bg-[#E8D5C4] text-[#5D4037] rounded font-medium uppercase tracking-wide">
            {domainLabels[entry.domains[0]] || entry.domains[0]}
          </span>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <p className="text-sm text-[#2C1810] leading-[28px]" style={{ fontFamily: 'Georgia, serif' }}>
          {entry.primaryResponse}
        </p>
      </div>
    </div>
  )
}
