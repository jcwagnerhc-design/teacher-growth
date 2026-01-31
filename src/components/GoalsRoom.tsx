'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Beaker, Lightbulb, Check, Pin, X } from 'lucide-react'
import PixelCharacter, { CharacterCustomization, DEFAULT_CHARACTER } from './PixelCharacter'
import { cn } from '@/lib/utils'

const DEMO_USER_ID = 'demo-user-001'

interface Experiment {
  id: string
  title: string
  status: 'active' | 'completed' | 'paused'
  createdAt: string
  completedAt?: string
  reflection?: string
  domain?: string
}

interface Props {
  onExit: () => void
}

// Suggested experiments based on domains
const EXPERIMENT_SUGGESTIONS: Record<string, string[]> = {
  instruction: [
    "Try 5-second wait time after every question tomorrow",
    "Ask 3 questions that start with 'Why' or 'How'",
    "Cold call 2 students who haven't spoken today",
    "Use think-pair-share for your main question",
  ],
  environment: [
    "Greet each student by name at the door",
    "Notice and name 3 positive behaviors today",
    "Have a 30-second conversation with a quiet student",
    "Start class with a quick community circle",
  ],
  assessment: [
    "Use exit tickets to check understanding",
    "Ask students to rate their confidence 1-5",
    "Have students explain a concept to a partner",
    "Use whiteboards to see everyone's thinking",
  ],
  planning: [
    "Write your learning objective on the board",
    "Plan one differentiated task for struggling learners",
    "Build in 2 minutes of processing time mid-lesson",
    "Prepare one extension question for early finishers",
  ],
}

// Pin colors for bulletin board
const PIN_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6']

export default function GoalsRoom({ onExit }: Props) {
  const [character, setCharacter] = useState<CharacterCustomization>(DEFAULT_CHARACTER)
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'idle' | 'new' | 'complete'>('idle')
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [terminalHistory, setTerminalHistory] = useState<Array<{ type: 'system' | 'user' | 'prompt' | 'suggestion'; text: string }>>([
    { type: 'system', text: 'TEACHING LAB v1.0' },
    { type: 'system', text: '' },
    { type: 'system', text: 'Commands: "new" to start, "done" to complete an experiment' },
  ])

  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  // Load character and experiments
  useEffect(() => {
    const profileStr = localStorage.getItem('teacher-profile')
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr)
        if (profile.character) setCharacter(profile.character)
      } catch (e) { /* ignore */ }
    }

    const savedExperiments = localStorage.getItem('teacher-experiments')
    if (savedExperiments) {
      try {
        setExperiments(JSON.parse(savedExperiments))
      } catch (e) { /* ignore */ }
    }

    setIsLoading(false)
  }, [])

  // Generate suggestions based on recent reflections
  useEffect(() => {
    const generateSuggestions = async () => {
      try {
        const response = await fetch(`/api/reflections?userId=${DEMO_USER_ID}&limit=10`)
        if (response.ok) {
          const data = await response.json()
          const reflections = data.reflections || []

          const domainCounts: Record<string, number> = {}
          reflections.forEach((r: { domains: string[] }) => {
            r.domains.forEach(d => {
              domainCounts[d] = (domainCounts[d] || 0) + 1
            })
          })

          const topDomain = Object.entries(domainCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'instruction'

          const domainSuggestions = EXPERIMENT_SUGGESTIONS[topDomain] || EXPERIMENT_SUGGESTIONS.instruction
          const shuffled = [...domainSuggestions].sort(() => Math.random() - 0.5)
          setSuggestions(shuffled.slice(0, 3))
        }
      } catch (err) {
        setSuggestions(EXPERIMENT_SUGGESTIONS.instruction.slice(0, 3))
      }
    }

    generateSuggestions()
  }, [])

  const saveExperiments = useCallback((exps: Experiment[]) => {
    setExperiments(exps)
    localStorage.setItem('teacher-experiments', JSON.stringify(exps))
  }, [])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalHistory])

  const addToHistory = (type: 'system' | 'user' | 'prompt' | 'suggestion', text: string) => {
    setTerminalHistory(prev => [...prev, { type, text }])
  }

  const activeExperiment = experiments.find(e => e.status === 'active')
  const completedExperiments = experiments.filter(e => e.status === 'completed').slice(0, 4)

  const handleCommand = async (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase()

    if (mode === 'idle') {
      if (trimmed === 'new' || trimmed === 'n') {
        addToHistory('user', cmd)
        addToHistory('system', '')
        addToHistory('prompt', "What do you want to try this week?")
        addToHistory('system', '')
        addToHistory('system', 'Based on your recent reflections:')
        suggestions.forEach((s, i) => {
          addToHistory('suggestion', `  ${i + 1}. ${s}`)
        })
        addToHistory('system', '')
        addToHistory('system', 'Type a number to select, or write your own.')
        setMode('new')
      } else if (trimmed === 'done' || trimmed === 'd') {
        if (!activeExperiment) {
          addToHistory('user', cmd)
          addToHistory('system', "No active experiment to complete.")
          setInput('')
          return
        }
        addToHistory('user', cmd)
        addToHistory('system', '')
        addToHistory('prompt', `Completing: "${activeExperiment.title}"`)
        addToHistory('system', 'What did you learn? (or press Enter to skip)')
        setSelectedExperiment(activeExperiment)
        setMode('complete')
      } else if (trimmed === 'exit' || trimmed === 'quit' || trimmed === 'q') {
        onExit()
      } else if (trimmed) {
        addToHistory('user', cmd)
        addToHistory('system', 'Commands: "new" to start, "done" to complete')
      }
    } else if (mode === 'new') {
      addToHistory('user', cmd)

      let experimentTitle = cmd.trim()

      const num = parseInt(trimmed)
      if (num >= 1 && num <= suggestions.length) {
        experimentTitle = suggestions[num - 1]
      }

      if (experimentTitle.length < 5) {
        addToHistory('system', 'Write a bit more (at least 5 characters)')
        setInput('')
        return
      }

      const newExperiment: Experiment = {
        id: Date.now().toString(),
        title: experimentTitle,
        status: 'active',
        createdAt: new Date().toISOString(),
      }

      const updated = experiments.map(e =>
        e.status === 'active' ? { ...e, status: 'paused' as const } : e
      )

      saveExperiments([newExperiment, ...updated])

      addToHistory('system', '')
      addToHistory('system', `Experiment started!`)
      addToHistory('system', 'Good luck! Type "done" when ready to reflect.')
      setMode('idle')
    } else if (mode === 'complete') {
      if (cmd.trim()) {
        addToHistory('user', cmd)
      }

      const updated = experiments.map(e =>
        e.id === selectedExperiment?.id
          ? { ...e, status: 'completed' as const, completedAt: new Date().toISOString(), reflection: cmd.trim() || undefined }
          : e
      )

      saveExperiments(updated)

      addToHistory('system', '')
      addToHistory('system', 'Experiment completed!')
      addToHistory('system', 'Type "new" to start another.')
      setSelectedExperiment(null)
      setMode('idle')
    }

    setInput('')
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="relative flex flex-col items-center p-4 h-full">
      {/* Header */}
      <div className="w-full max-w-[700px] flex items-center justify-between mb-4">
        <button
          onClick={onExit}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Classroom</span>
        </button>
        <div className="flex items-center gap-2 text-amber-400">
          <Beaker className="w-5 h-5" />
          <span className="text-sm font-medium">Teaching Lab</span>
        </div>
      </div>

      {/* Bulletin Board */}
      <div
        className="w-full max-w-[700px] mb-4 rounded-lg p-4 relative"
        style={{
          background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #8B4513 100%)',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.3)',
          border: '8px solid #5D3A1A',
        }}
      >
        {/* Cork texture overlay */}
        <div
          className="absolute inset-2 rounded opacity-30 pointer-events-none"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          }}
        />

        {/* Board Title */}
        <div className="text-center mb-4">
          <span className="bg-amber-100 text-amber-900 px-4 py-1 rounded font-bold text-sm tracking-wide shadow-md">
            EXPERIMENT BOARD
          </span>
        </div>

        <div className="flex gap-4 min-h-[180px]">
          {/* Active Experiment - Large Card */}
          <div className="flex-1">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-amber-200/50 text-sm">Loading...</div>
              </div>
            ) : activeExperiment ? (
              <motion.div
                initial={{ scale: 0.9, rotate: -2 }}
                animate={{ scale: 1, rotate: -1 }}
                className="relative bg-yellow-100 rounded shadow-lg p-4 h-full"
                style={{
                  transform: 'rotate(-1deg)',
                  boxShadow: '3px 3px 10px rgba(0,0,0,0.3)',
                }}
              >
                {/* Push pin */}
                <div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full shadow-md flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #EF4444, #B91C1C)' }}
                >
                  <div className="w-2 h-2 rounded-full bg-red-300" />
                </div>

                <div className="flex items-center gap-2 mb-2 mt-2">
                  <div className="w-8 h-8">
                    <PixelCharacter customization={character} size="sm" />
                  </div>
                  <span className="text-xs text-amber-700 font-medium uppercase tracking-wide">
                    This Week
                  </span>
                </div>

                <p className="text-amber-900 font-medium text-sm leading-snug mb-3">
                  {activeExperiment.title}
                </p>

                <p className="text-xs text-amber-600">
                  Started {formatDate(activeExperiment.createdAt)}
                </p>
              </motion.div>
            ) : (
              <div
                className="h-full flex flex-col items-center justify-center text-amber-200/60 border-2 border-dashed border-amber-200/30 rounded-lg"
              >
                <Lightbulb className="w-8 h-8 mb-2" />
                <p className="text-sm">No active experiment</p>
                <p className="text-xs mt-1">Type &quot;new&quot; to pin one</p>
              </div>
            )}
          </div>

          {/* Completed Experiments - Small Cards */}
          <div className="w-48 space-y-2">
            <p className="text-xs text-amber-200/70 font-medium uppercase tracking-wide px-1">
              Completed
            </p>
            {completedExperiments.length === 0 ? (
              <div className="text-xs text-amber-200/40 px-1 py-4 text-center">
                None yet
              </div>
            ) : (
              completedExperiments.map((exp, i) => (
                <motion.div
                  key={exp.id}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="relative bg-green-100 rounded shadow p-2"
                  style={{
                    transform: `rotate(${(i % 2 === 0 ? 1 : -1) * (1 + i * 0.5)}deg)`,
                  }}
                >
                  {/* Small push pin */}
                  <div
                    className="absolute -top-1.5 right-3 w-3 h-3 rounded-full shadow"
                    style={{ background: PIN_COLORS[i % PIN_COLORS.length] }}
                  />

                  <div className="flex items-start gap-1.5">
                    <Check className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-green-900 line-clamp-2 leading-tight">
                        {exp.title}
                      </p>
                      {exp.reflection && (
                        <p className="text-[10px] text-green-700/70 mt-1 italic line-clamp-1">
                          &quot;{exp.reflection}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Terminal Input */}
      <div
        className="w-full max-w-[700px] bg-black border-2 border-[#333] rounded-lg overflow-hidden font-mono text-sm"
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
                line.type === 'suggestion' && 'text-[#ff9900]',
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
              if (e.key === 'Enter') {
                handleCommand(input)
              }
            }}
            className="flex-1 bg-transparent text-[#00ff00] outline-none caret-[#00ff00]"
            placeholder={mode === 'idle' ? 'Type "new" or "done"...' : 'Type here...'}
            autoFocus
          />
          <span className="text-[#00ff00] animate-pulse">_</span>
        </div>
      </div>
    </div>
  )
}
