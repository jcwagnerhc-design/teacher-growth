'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, FlaskConical, Lightbulb, Check, Clipboard, TestTube } from 'lucide-react'
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
    "Try 5-second wait time after every question",
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

// Test tube colors for completed experiments
const TUBE_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B']

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
    { type: 'system', text: 'Run weekly experiments. Learn what works.' },
    { type: 'system', text: '' },
    { type: 'system', text: '"new" = start experiment | "done" = complete & reflect' },
  ])

  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

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
        addToHistory('prompt', "What are you going to try this week?")
        addToHistory('system', '')
        addToHistory('system', 'Suggested experiments:')
        suggestions.forEach((s, i) => {
          addToHistory('suggestion', `  ${i + 1}. ${s}`)
        })
        addToHistory('system', '')
        addToHistory('system', 'Pick a number or write your own hypothesis.')
        setMode('new')
      } else if (trimmed === 'done' || trimmed === 'd') {
        if (!activeExperiment) {
          addToHistory('user', cmd)
          addToHistory('system', "No experiment running. Type 'new' to start one.")
          setInput('')
          return
        }
        addToHistory('user', cmd)
        addToHistory('system', '')
        addToHistory('prompt', `Experiment complete: "${activeExperiment.title}"`)
        addToHistory('system', 'What did you observe? (Enter to skip)')
        setSelectedExperiment(activeExperiment)
        setMode('complete')
      } else if (trimmed === 'exit' || trimmed === 'quit' || trimmed === 'q') {
        onExit()
      } else if (trimmed) {
        addToHistory('user', cmd)
        addToHistory('system', '"new" = start | "done" = complete')
      }
    } else if (mode === 'new') {
      addToHistory('user', cmd)

      let experimentTitle = cmd.trim()

      const num = parseInt(trimmed)
      if (num >= 1 && num <= suggestions.length) {
        experimentTitle = suggestions[num - 1]
      }

      if (experimentTitle.length < 5) {
        addToHistory('system', 'Describe your experiment (5+ chars)')
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
      addToHistory('system', 'Experiment started. Good luck this week!')
      addToHistory('system', 'Type "done" when ready to record observations.')
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
      addToHistory('system', 'Results recorded. Ready for next experiment.')
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
        <div className="flex items-center gap-2 text-emerald-400">
          <FlaskConical className="w-5 h-5" />
          <span className="text-sm font-medium">Teaching Lab</span>
        </div>
      </div>

      {/* Lab Bench */}
      <div
        className="w-full max-w-[700px] mb-4 rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          border: '2px solid #334155',
        }}
      >
        {/* Lab shelf/counter surface */}
        <div
          className="h-3"
          style={{
            background: 'linear-gradient(180deg, #475569 0%, #334155 100%)',
          }}
        />

        <div className="p-5">
          <div className="flex gap-6">
            {/* Active Experiment - Clipboard */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Clipboard className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider">
                  This Week&apos;s Experiment
                </span>
              </div>

              {isLoading ? (
                <div className="h-32 flex items-center justify-center text-slate-500">
                  Loading...
                </div>
              ) : activeExperiment ? (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="relative"
                >
                  {/* Clipboard */}
                  <div
                    className="bg-amber-50 rounded-lg p-4 relative"
                    style={{
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}
                  >
                    {/* Clipboard clip */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-gradient-to-b from-slate-400 to-slate-500 rounded-t-lg" />
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-12 h-2 bg-slate-600 rounded-sm" />

                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8">
                          <PixelCharacter customization={character} size="sm" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-amber-600 uppercase tracking-wide font-medium">
                            Hypothesis
                          </p>
                        </div>
                      </div>

                      <p className="text-amber-900 font-medium text-sm leading-relaxed mb-3 font-mono">
                        &quot;{activeExperiment.title}&quot;
                      </p>

                      <div className="flex items-center gap-2 text-xs text-amber-600">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>In progress since {formatDate(activeExperiment.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div
                  className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-lg text-slate-500"
                >
                  <Lightbulb className="w-8 h-8 mb-2 text-slate-600" />
                  <p className="text-sm">No experiment running</p>
                  <p className="text-xs mt-1 text-slate-600">Type &quot;new&quot; to begin</p>
                </div>
              )}
            </div>

            {/* Completed Experiments - Test Tubes */}
            <div className="w-44">
              <div className="flex items-center gap-2 mb-3">
                <TestTube className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  Past Results
                </span>
              </div>

              {completedExperiments.length === 0 ? (
                <div className="text-xs text-slate-600 py-8 text-center">
                  No completed experiments
                </div>
              ) : (
                <div className="space-y-2">
                  {completedExperiments.map((exp, i) => (
                    <motion.div
                      key={exp.id}
                      initial={{ x: 10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-2 p-2 rounded bg-slate-800/50 border border-slate-700/50"
                    >
                      {/* Mini test tube icon */}
                      <div
                        className="w-3 h-6 rounded-b-full mt-0.5 shrink-0"
                        style={{
                          background: `linear-gradient(180deg, transparent 30%, ${TUBE_COLORS[i % TUBE_COLORS.length]} 30%)`,
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 line-clamp-2 leading-tight">
                          {exp.title}
                        </p>
                        {exp.reflection && (
                          <p className="text-[10px] text-slate-500 mt-1 italic line-clamp-1">
                            {exp.reflection}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lab bench edge */}
        <div
          className="h-2"
          style={{
            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
            borderTop: '1px solid #334155',
          }}
        />
      </div>

      {/* Terminal */}
      <div
        className="w-full max-w-[700px] bg-black border-2 border-emerald-900/50 rounded-lg overflow-hidden font-mono text-sm"
        style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.1)' }}
      >
        <div className="bg-emerald-900/30 px-3 py-1.5 border-b border-emerald-900/50 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-emerald-400 text-xs">lab-terminal</span>
        </div>

        <div ref={terminalRef} className="h-28 overflow-y-auto p-3 space-y-1">
          {terminalHistory.map((line, i) => (
            <div
              key={i}
              className={cn(
                line.type === 'system' && 'text-emerald-400',
                line.type === 'user' && 'text-white',
                line.type === 'prompt' && 'text-cyan-400 font-bold',
                line.type === 'suggestion' && 'text-amber-400',
              )}
            >
              {line.type === 'user' && <span className="text-emerald-600">$ </span>}
              {line.text}
            </div>
          ))}
        </div>

        <div className="border-t border-emerald-900/50 p-3 flex items-center gap-2">
          <span className="text-emerald-600">$</span>
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
            className="flex-1 bg-transparent text-emerald-400 outline-none caret-emerald-400 placeholder:text-emerald-800"
            placeholder={mode === 'idle' ? 'new | done' : 'enter response...'}
            autoFocus
          />
        </div>
      </div>
    </div>
  )
}
