'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, FlaskConical, Lightbulb, Check, Clipboard, TestTube } from 'lucide-react'
import PixelCharacter, { CharacterCustomization, DEFAULT_CHARACTER } from './PixelCharacter'
import { cn } from '@/lib/utils'

const DEMO_USER_ID = 'demo-user-001'

// Canvas dimensions
const CANVAS_W = 400
const CANVAS_H = 220

// Character colors
const SKIN_TONES = ['#FFDFC4', '#F0C8A0', '#D4A574', '#A67B5B', '#8B6544', '#5C4033']
const HAIR_COLORS = ['#2C1810', '#4A3728', '#8B4513', '#CD853F', '#FFD700', '#FF6B35', '#9B59B6', '#3498DB']
const OUTFIT_COLORS = [
  { primary: '#3B82F6', secondary: '#1D4ED8' },
  { primary: '#10B981', secondary: '#059669' },
  { primary: '#8B5CF6', secondary: '#7C3AED' },
  { primary: '#F59E0B', secondary: '#D97706' },
  { primary: '#EC4899', secondary: '#DB2777' },
  { primary: '#EF4444', secondary: '#DC2626' },
]

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

const TUBE_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B']

export default function GoalsRoom({ onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
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

  // Draw lab scene
  const renderLab = useCallback((ctx: CanvasRenderingContext2D) => {
    const w = CANVAS_W
    const h = CANVAS_H

    // Background - lab wall
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, w, h)

    // Tile pattern on wall
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 1
    for (let y = 0; y < h * 0.6; y += 20) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h * 0.6)
      ctx.stroke()
    }

    // Lab bench (counter)
    ctx.fillStyle = '#475569'
    ctx.fillRect(0, h * 0.55, w, 15)
    ctx.fillStyle = '#334155'
    ctx.fillRect(0, h * 0.55 + 15, w, h * 0.45 - 15)

    // Cabinet under bench
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(20, h * 0.65, 80, h * 0.35 - 10)
    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 2
    ctx.strokeRect(20, h * 0.65, 80, h * 0.35 - 10)
    // Cabinet handle
    ctx.fillStyle = '#64748b'
    ctx.fillRect(85, h * 0.78, 8, 20)

    // Shelf on wall
    ctx.fillStyle = '#475569'
    ctx.fillRect(20, 40, 150, 8)
    ctx.fillStyle = '#334155'
    ctx.fillRect(20, 48, 150, 4)

    // Beakers on shelf
    drawBeaker(ctx, 35, 10, '#10B981', 0.6)
    drawBeaker(ctx, 70, 15, '#3B82F6', 0.4)
    drawBeaker(ctx, 105, 8, '#F59E0B', 0.7)
    drawBeaker(ctx, 140, 12, '#8B5CF6', 0.5)

    // Large flask on bench
    drawFlask(ctx, 280, h * 0.55 - 50, '#10B981')

    // Test tube rack on bench
    drawTestTubeRack(ctx, 330, h * 0.55 - 35)

    // Microscope on bench
    drawMicroscope(ctx, 180, h * 0.55 - 45)

    // Clipboard on bench
    ctx.fillStyle = '#92400e'
    ctx.fillRect(120, h * 0.55 - 30, 40, 50)
    ctx.fillStyle = '#fef3c7'
    ctx.fillRect(123, h * 0.55 - 25, 34, 42)
    // Clip
    ctx.fillStyle = '#64748b'
    ctx.fillRect(130, h * 0.55 - 32, 20, 6)

    // Player character at bench
    drawPlayer(ctx, 230, h * 0.55 - 55, character)

    // Ceiling light
    ctx.fillStyle = '#64748b'
    ctx.fillRect(w / 2 - 40, 0, 80, 8)
    ctx.fillStyle = '#fef9c3'
    ctx.fillRect(w / 2 - 35, 8, 70, 6)
    // Light glow
    const glow = ctx.createRadialGradient(w / 2, 30, 0, w / 2, 30, 100)
    glow.addColorStop(0, 'rgba(254, 249, 195, 0.15)')
    glow.addColorStop(1, 'rgba(254, 249, 195, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, w, h * 0.6)

  }, [character])

  const drawBeaker = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, fillLevel: number) => {
    // Beaker outline
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - 5, y + 30)
    ctx.lineTo(x + 25, y + 30)
    ctx.lineTo(x + 20, y)
    ctx.stroke()

    // Liquid
    const liquidHeight = 30 * fillLevel
    ctx.fillStyle = color
    ctx.globalAlpha = 0.7
    ctx.beginPath()
    ctx.moveTo(x - 5 + (1 - fillLevel) * 2.5, y + 30 - liquidHeight)
    ctx.lineTo(x - 5, y + 30)
    ctx.lineTo(x + 25, y + 30)
    ctx.lineTo(x + 20 + (1 - fillLevel) * 2.5, y + 30 - liquidHeight)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  const drawFlask = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    // Flask body
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x + 15, y)
    ctx.lineTo(x + 15, y + 15)
    ctx.lineTo(x, y + 45)
    ctx.lineTo(x, y + 50)
    ctx.lineTo(x + 40, y + 50)
    ctx.lineTo(x + 40, y + 45)
    ctx.lineTo(x + 25, y + 15)
    ctx.lineTo(x + 25, y)
    ctx.stroke()

    // Liquid
    ctx.fillStyle = color
    ctx.globalAlpha = 0.6
    ctx.beginPath()
    ctx.moveTo(x + 5, y + 35)
    ctx.lineTo(x + 2, y + 50)
    ctx.lineTo(x + 38, y + 50)
    ctx.lineTo(x + 35, y + 35)
    ctx.fill()
    ctx.globalAlpha = 1

    // Bubbles
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.beginPath()
    ctx.arc(x + 15, y + 42, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x + 25, y + 45, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  const drawTestTubeRack = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Rack base
    ctx.fillStyle = '#5D4037'
    ctx.fillRect(x, y + 30, 50, 5)
    ctx.fillRect(x, y + 5, 50, 5)

    // Test tubes
    const tubeColors = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899']
    tubeColors.forEach((color, i) => {
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x + 8 + i * 12, y + 5)
      ctx.lineTo(x + 8 + i * 12, y + 28)
      ctx.arc(x + 8 + i * 12, y + 28, 4, Math.PI, 0, true)
      ctx.lineTo(x + 16 + i * 12, y + 5)
      ctx.stroke()

      // Liquid in tube
      ctx.fillStyle = color
      ctx.globalAlpha = 0.7
      ctx.fillRect(x + 9 + i * 12, y + 15, 6, 15)
      ctx.beginPath()
      ctx.arc(x + 12 + i * 12, y + 28, 3, 0, Math.PI)
      ctx.fill()
      ctx.globalAlpha = 1
    })
  }

  const drawMicroscope = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Base
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(x, y + 35, 40, 10)

    // Arm
    ctx.fillStyle = '#334155'
    ctx.fillRect(x + 30, y, 8, 45)

    // Eyepiece
    ctx.fillStyle = '#475569'
    ctx.fillRect(x + 28, y - 5, 12, 8)
    ctx.fillStyle = '#1e293b'
    ctx.beginPath()
    ctx.arc(x + 34, y - 5, 5, 0, Math.PI * 2)
    ctx.fill()

    // Objective
    ctx.fillStyle = '#475569'
    ctx.fillRect(x + 26, y + 25, 16, 8)

    // Stage
    ctx.fillStyle = '#64748b'
    ctx.fillRect(x + 5, y + 30, 30, 5)
  }

  const drawPlayer = (ctx: CanvasRenderingContext2D, x: number, y: number, char: CharacterCustomization) => {
    const skinColor = SKIN_TONES[char.skinTone] || SKIN_TONES[1]
    const hairColor = HAIR_COLORS[char.hairColor] || HAIR_COLORS[2]
    const outfit = OUTFIT_COLORS[char.outfit] || OUTFIT_COLORS[0]

    // Lab coat (white)
    ctx.fillStyle = '#f1f5f9'
    ctx.fillRect(x - 12, y + 20, 24, 35)

    // Body under coat
    ctx.fillStyle = outfit.primary
    ctx.fillRect(x - 8, y + 22, 16, 15)

    // Head
    ctx.fillStyle = skinColor
    ctx.beginPath()
    ctx.arc(x, y + 10, 12, 0, Math.PI * 2)
    ctx.fill()

    // Hair
    ctx.fillStyle = hairColor
    ctx.beginPath()
    ctx.arc(x, y + 6, 12, Math.PI, 0, true)
    ctx.fill()

    // Safety goggles
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(x - 10, y + 6, 20, 6)
    ctx.fillStyle = '#60a5fa'
    ctx.globalAlpha = 0.5
    ctx.fillRect(x - 9, y + 7, 8, 4)
    ctx.fillRect(x + 1, y + 7, 8, 4)
    ctx.globalAlpha = 1

    // Arms
    ctx.fillStyle = '#f1f5f9'
    ctx.fillRect(x - 18, y + 22, 8, 20)
    ctx.fillRect(x + 10, y + 22, 8, 20)

    // Hands
    ctx.fillStyle = skinColor
    ctx.fillRect(x - 17, y + 40, 6, 6)
    ctx.fillRect(x + 11, y + 40, 6, 6)
  }

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    const loop = () => {
      renderLab(ctx)
      animationId = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(animationId)
  }, [renderLab])

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
      <div className="w-full max-w-[700px] flex items-center justify-between mb-3">
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

      {/* Lab Scene + Bulletin Board */}
      <div className="w-full max-w-[700px] mb-3 flex gap-4">
        {/* Lab Scene Canvas */}
        <div className="flex-shrink-0">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="rounded-lg border-2 border-slate-700"
            style={{
              imageRendering: 'pixelated',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}
          />
        </div>

        {/* Cork Bulletin Board */}
        <div
          className="flex-1 rounded-lg border-4 border-amber-900 p-3 min-h-[220px]"
          style={{
            background: 'linear-gradient(135deg, #c4a574 0%, #a67c52 50%, #8b6544 100%)',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)',
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Experiment Board
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Active Experiment - Yellow sticky note */}
            {activeExperiment && (
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: Math.random() * 6 - 3 }}
                className="relative"
              >
                {/* Pin */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-500 border border-red-700 shadow-md z-10" />
                <div
                  className="w-24 pt-3 pb-2 px-2 shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)',
                    transform: `rotate(${Math.random() * 4 - 2}deg)`,
                  }}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-bold text-amber-800 uppercase">Active</span>
                  </div>
                  <p className="text-[10px] text-amber-900 font-medium line-clamp-3 leading-tight">
                    {activeExperiment.title}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Completed Experiments - Various colored notes */}
            {completedExperiments.map((exp, i) => {
              const noteColors = [
                'linear-gradient(135deg, #bbf7d0 0%, #86efac 100%)',
                'linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)',
                'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
                'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%)',
              ]
              const textColors = ['#166534', '#1e40af', '#991b1b', '#6b21a8']
              return (
                <motion.div
                  key={exp.id}
                  initial={{ scale: 0, rotate: 10 }}
                  animate={{ scale: 1, rotate: Math.random() * 8 - 4 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative"
                >
                  {/* Pin */}
                  <div
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border shadow-md z-10"
                    style={{
                      background: TUBE_COLORS[i % TUBE_COLORS.length],
                      borderColor: TUBE_COLORS[i % TUBE_COLORS.length],
                    }}
                  />
                  <div
                    className="w-20 pt-3 pb-2 px-2 shadow-lg opacity-80"
                    style={{
                      background: noteColors[i % noteColors.length],
                      transform: `rotate(${Math.random() * 6 - 3}deg)`,
                    }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Check className="w-2 h-2" style={{ color: textColors[i % textColors.length] }} />
                      <span className="text-[7px] font-bold uppercase" style={{ color: textColors[i % textColors.length] }}>Done</span>
                    </div>
                    <p className="text-[9px] font-medium line-clamp-2 leading-tight" style={{ color: textColors[i % textColors.length] }}>
                      {exp.title}
                    </p>
                  </div>
                </motion.div>
              )
            })}

            {/* Empty state */}
            {!activeExperiment && completedExperiments.length === 0 && (
              <div className="w-full flex items-center justify-center h-32">
                <p className="text-amber-800/60 text-xs italic text-center">
                  No experiments yet.<br/>
                  Type "new" below to start.
                </p>
              </div>
            )}
          </div>
        </div>
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

        <div ref={terminalRef} className="h-24 overflow-y-auto p-3 space-y-1">
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
