'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Target, Plus, ChevronDown, Star, CheckCircle2 } from 'lucide-react'
import { CharacterCustomization } from './PixelCharacter'
import { Goal, CreateGoalModal } from './goals'
import { cn } from '@/lib/utils'

// Tile size
const TILE = 48
const ROOM_W = 10
const ROOM_H = 8

// Color palettes
const SKIN_TONES = [
  '#FFDFC4', '#F0C8A0', '#D4A574', '#A67B5B', '#8B6544', '#5C4033',
]
const HAIR_COLORS = [
  '#2C1810', '#4A3728', '#8B4513', '#CD853F', '#FFD700', '#FF6B35', '#9B59B6', '#3498DB',
]
const OUTFIT_COLORS = [
  { primary: '#3B82F6', secondary: '#1D4ED8' },
  { primary: '#10B981', secondary: '#059669' },
  { primary: '#8B5CF6', secondary: '#7C3AED' },
  { primary: '#F59E0B', secondary: '#D97706' },
  { primary: '#EC4899', secondary: '#DB2777' },
  { primary: '#EF4444', secondary: '#DC2626' },
]

const DEFAULT_CHARACTER: CharacterCustomization = {
  skinTone: 1, hairStyle: 0, hairColor: 2, outfit: 0,
  accessory: 0, bodyType: 0, facialHair: 0, makeup: 0,
}

const DEMO_USER_ID = 'demo-user-001'

interface Props {
  onExit: () => void
}

export default function GoalsRoom({ onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [character, setCharacter] = useState<CharacterCustomization>(DEFAULT_CHARACTER)
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

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

  // Fetch goals
  const fetchGoals = useCallback(async () => {
    try {
      const response = await fetch(`/api/goals?userId=${DEMO_USER_ID}`)
      if (response.ok) {
        const data = await response.json()
        setGoals(data.goals)
      }
    } catch (err) {
      console.error('Failed to fetch goals:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  const handleCreateGoal = async (goalInput: {
    title: string
    description?: string
    goalType: 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
    targetType: 'REFLECTION_COUNT' | 'SKILL_FOCUS' | 'DOMAIN_FOCUS'
    targetValue: number
    targetSkillId?: string
    targetDomain?: string
  }) => {
    const response = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: DEMO_USER_ID, ...goalInput }),
    })

    if (!response.ok) throw new Error('Failed to create goal')
    await fetchGoals()
  }

  const handleUpdateGoal = async (goalId: string, status: 'COMPLETED' | 'ABANDONED') => {
    try {
      const response = await fetch('/api/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId, status }),
      })
      if (response.ok) await fetchGoals()
    } catch (err) {
      console.error('Failed to update goal:', err)
    }
  }

  // Draw the room - vision board room
  const render = useCallback((ctx: CanvasRenderingContext2D) => {
    const w = ROOM_W * TILE
    const h = ROOM_H * TILE

    // Warm inspirational room
    const floorGrad = ctx.createLinearGradient(0, h * 0.5, 0, h)
    floorGrad.addColorStop(0, '#8B7355')
    floorGrad.addColorStop(1, '#6B5344')
    ctx.fillStyle = floorGrad
    ctx.fillRect(0, 0, w, h)

    // Walls - warm white/cream
    ctx.fillStyle = '#FDF5E6'
    ctx.fillRect(0, 0, w, h * 0.45)

    // Gold accent stripe
    ctx.fillStyle = '#B8860B'
    ctx.fillRect(0, h * 0.35, w, h * 0.1)
    ctx.fillStyle = '#DAA520'
    ctx.fillRect(0, h * 0.35, w, 4)
    ctx.fillRect(0, h * 0.44, w, 4)

    // Floor planks
    ctx.strokeStyle = '#5D4037'
    ctx.lineWidth = 1
    for (let y = h * 0.5; y < h; y += TILE / 2) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    // Large cork board on back wall (vision board)
    ctx.fillStyle = '#D2691E'
    ctx.fillRect(60, 30, 240, 120)
    // Cork texture
    ctx.fillStyle = '#CD853F'
    for (let i = 0; i < 30; i++) {
      ctx.fillRect(70 + (i % 6) * 38, 40 + Math.floor(i / 6) * 20, 30, 15)
    }
    // Frame
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 8
    ctx.strokeRect(60, 30, 240, 120)

    // Pinned items on board (goals represented as cards)
    const pinColors = ['#FFD700', '#87CEEB', '#98FB98', '#FFB6C1', '#DDA0DD']
    const cardPositions = [
      { x: 80, y: 45, w: 50, h: 40 },
      { x: 145, y: 50, w: 55, h: 35 },
      { x: 215, y: 42, w: 45, h: 45 },
      { x: 90, y: 95, w: 60, h: 35 },
      { x: 170, y: 100, w: 50, h: 40 },
      { x: 240, y: 95, w: 45, h: 38 },
    ]
    cardPositions.forEach((card, i) => {
      // Card
      ctx.fillStyle = '#FFFAF0'
      ctx.fillRect(card.x, card.y, card.w, card.h)
      // Lines representing text
      ctx.fillStyle = '#A0A0A0'
      ctx.fillRect(card.x + 5, card.y + 8, card.w - 10, 3)
      ctx.fillRect(card.x + 5, card.y + 15, card.w - 15, 3)
      // Push pin
      ctx.fillStyle = pinColors[i % pinColors.length]
      ctx.beginPath()
      ctx.arc(card.x + card.w / 2, card.y, 5, 0, Math.PI * 2)
      ctx.fill()
    })

    // Side table with planning materials
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(w - 90, h * 0.55, 70, 50)
    ctx.fillStyle = '#A0522D'
    ctx.fillRect(w - 85, h * 0.55, 60, 8)
    // Stack of paper
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(w - 75, h * 0.48, 35, 20)
    ctx.fillStyle = '#F5F5F5'
    ctx.fillRect(w - 73, h * 0.49, 35, 20)
    // Pen
    ctx.fillStyle = '#FFD700'
    ctx.fillRect(w - 35, h * 0.50, 20, 4)

    // Comfy chair (viewing the board)
    ctx.fillStyle = '#DAA520'
    ctx.fillRect(150, 200, 80, 60)
    ctx.fillStyle = '#F0C040'
    ctx.fillRect(155, 205, 70, 45)
    // Chair back
    ctx.fillStyle = '#B8860B'
    ctx.fillRect(155, 180, 70, 25)

    // Player sitting in chair looking at board
    drawPlayer(ctx, 190, 170, character)

    // Inspirational window with sunlight
    ctx.fillStyle = '#87CEEB'
    ctx.fillRect(w - 80, 30, 60, 80)
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 6
    ctx.strokeRect(w - 80, 30, 60, 80)
    ctx.beginPath()
    ctx.moveTo(w - 50, 30)
    ctx.lineTo(w - 50, 110)
    ctx.stroke()
    // Sunbeam effect
    const sunGlow = ctx.createRadialGradient(w - 50, 70, 10, w - 50, 70, 100)
    sunGlow.addColorStop(0, 'rgba(255, 215, 0, 0.3)')
    sunGlow.addColorStop(1, 'rgba(255, 215, 0, 0)')
    ctx.fillStyle = sunGlow
    ctx.fillRect(w - 150, 0, 150, h * 0.6)

    // Potted plant
    ctx.fillStyle = '#E07B4A'
    ctx.beginPath()
    ctx.moveTo(20, h - 30)
    ctx.lineTo(45, h - 30)
    ctx.lineTo(40, h - 65)
    ctx.lineTo(25, h - 65)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#228B22'
    ctx.beginPath()
    ctx.ellipse(32, h - 85, 22, 30, 0, 0, Math.PI * 2)
    ctx.fill()

  }, [character])

  // Draw the player
  const drawPlayer = (ctx: CanvasRenderingContext2D, x: number, y: number, char: CharacterCustomization) => {
    const skinColor = SKIN_TONES[char.skinTone] || SKIN_TONES[1]
    const hairColor = HAIR_COLORS[char.hairColor] || HAIR_COLORS[2]
    const outfit = OUTFIT_COLORS[char.outfit] || OUTFIT_COLORS[0]
    const scale = 2.5

    // Head (facing up at board)
    ctx.fillStyle = skinColor
    ctx.beginPath()
    ctx.arc(x, y + 10, 11 * scale, 0, Math.PI * 2)
    ctx.fill()

    // Hair (back view)
    ctx.fillStyle = hairColor
    ctx.beginPath()
    ctx.arc(x, y + 8, 13 * scale, 0, Math.PI * 2)
    ctx.fill()

    // Body (sitting, back view)
    ctx.fillStyle = outfit.primary
    ctx.fillRect(x - 15, y + 35, 30, 40)
  }

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    const loop = () => {
      render(ctx)
      animationId = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(animationId)
  }, [render])

  const activeGoals = goals.filter(g => g.status === 'ACTIVE')
  const completedGoals = goals.filter(g => g.status === 'COMPLETED')

  return (
    <div className="relative flex flex-col items-center">
      {/* Room canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={ROOM_W * TILE}
          height={ROOM_H * TILE}
          className="border-4 border-[#B8860B] rounded-lg"
          style={{
            imageRendering: 'pixelated',
            boxShadow: '0 4px 20px rgba(184, 134, 11, 0.4)',
          }}
        />

        {/* Exit button */}
        <button
          onClick={onExit}
          className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Classroom
        </button>
      </div>

      {/* Goals interface */}
      <div className="w-full max-w-[480px] mt-4 bg-slate-900/90 rounded-xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#DAA520]" />
            <h2 className="font-bold text-white">My Commitments</h2>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#B8860B] hover:bg-[#DAA520] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>

        {/* Goals list */}
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Star className="w-6 h-6 text-[#DAA520]" />
              </motion.div>
            </div>
          ) : activeGoals.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Target className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No active commitments yet.</p>
              <p className="text-slate-500 text-xs mt-1">Set an intention to guide your growth.</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {activeGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm">{goal.title}</p>
                      {goal.description && (
                        <p className="text-xs text-slate-400 mt-1">{goal.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleUpdateGoal(goal.id, 'COMPLETED')}
                      className="p-1.5 text-slate-500 hover:text-[#DAA520] transition-colors"
                      title="Mark complete"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">Progress</span>
                      <span className="text-[#DAA520]">{goal.currentValue}/{goal.targetValue}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${goal.progress}%` }}
                        className="h-full bg-gradient-to-r from-[#B8860B] to-[#DAA520] rounded-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Completed section */}
          {completedGoals.length > 0 && (
            <div className="border-t border-slate-700">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
              >
                <span className="text-sm text-slate-400">
                  Completed ({completedGoals.length})
                </span>
                <ChevronDown className={cn('w-4 h-4 text-slate-500 transition-transform', showCompleted && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {showCompleted && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2">
                      {completedGoals.map((goal) => (
                        <div
                          key={goal.id}
                          className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 opacity-70"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#DAA520]" />
                            <p className="text-sm text-slate-400">{goal.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Create Goal Modal */}
      <CreateGoalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateGoal={handleCreateGoal}
      />
    </div>
  )
}
