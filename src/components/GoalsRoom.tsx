'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Beaker, Lightbulb, Check, Clock } from 'lucide-react'
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
    { type: 'system', text: 'A place for experiments.' },
    { type: 'system', text: '' },
    { type: 'system', text: 'Commands: "new" to start an experiment, "done" to complete one' },
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
  const completedExperiments = experiments.filter(e => e.status === 'completed').slice(0, 5)

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
      addToHistory('system', `Experiment started: "${experimentTitle}"`)
      addToHistory('system', 'Good luck! Type "done" when you want to reflect on it.')
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
      <div className="w-full max-w-[600px] flex items-center justify-between mb-4">
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

      {/* Current Experiment Card */}
      <div className="w-full max-w-[600px] mb-4">
        {isLoading ? (
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 text-center">
            <p className="text-slate-500">Loading...</p>
          </div>
        ) : activeExperiment ? (
          <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/20 border border-amber-600/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 shrink-0">
                <PixelCharacter customization={character} size="sm" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-amber-400/70 uppercase tracking-wide font-medium">This Week&apos;s Experiment</span>
                  <Clock className="w-3 h-3 text-amber-400/50" />
                </div>
                <p className="text-white font-medium">{activeExperiment.title}</p>
                <p className="text-xs text-slate-400 mt-1">Started {formatDate(activeExperiment.createdAt)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 text-center">
            <Lightbulb className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No active experiment</p>
            <p className="text-slate-500 text-xs mt-1">Type &quot;new&quot; below to start one</p>
          </div>
        )}
      </div>

      {/* Past Experiments */}
      {completedExperiments.length > 0 && (
        <div className="w-full max-w-[600px] mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 px-1">Recent Experiments</p>
          <div className="space-y-2">
            {completedExperiments.map(exp => (
              <div
                key={exp.id}
                className="bg-slate-900/30 border border-slate-800 rounded-lg p-3 flex items-start gap-3"
              >
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300">{exp.title}</p>
                  {exp.reflection && (
                    <p className="text-xs text-slate-500 mt-1 italic">&quot;{exp.reflection}&quot;</p>
                  )}
                  <p className="text-xs text-slate-600 mt-1">{formatDate(exp.completedAt || exp.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terminal Input */}
      <div
        className="w-full max-w-[600px] bg-black border-2 border-[#333] rounded-lg overflow-hidden font-mono text-sm"
        style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}
      >
        <div ref={terminalRef} className="h-36 overflow-y-auto p-3 space-y-1">
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
