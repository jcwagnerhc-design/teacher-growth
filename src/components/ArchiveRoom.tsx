'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Archive, Calendar, BarChart3, Star, Sparkles, Flame } from 'lucide-react'
import { CharacterCustomization } from './PixelCharacter'
import { ActivityHeatmap, DomainBreakdown } from './progress'
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

type Period = 'week' | 'month' | 'quarter'
type ViewMode = 'activity' | 'domains' | 'insights'

interface ActivityEntry {
  date: string
  signalCount: number
  reflectionCount: number
  totalCount: number
  level: number
}

interface ActivityData {
  activity: ActivityEntry[]
  streak: {
    current: number
    longest: number
    lastLogDate: string | null
  }
  domainBreakdown: Record<string, number>
  summary: {
    totalActivities: number
    totalSignals: number
    totalReflections: number
    activeDays: number
    totalDays: number
  }
}

interface Props {
  onExit: () => void
}

export default function ArchiveRoom({ onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [character, setCharacter] = useState<CharacterCustomization>(DEFAULT_CHARACTER)
  const [period, setPeriod] = useState<Period>('month')
  const [viewMode, setViewMode] = useState<ViewMode>('activity')
  const [activityData, setActivityData] = useState<ActivityData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [insights, setInsights] = useState<string[]>([])

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

  // Fetch data
  const fetchData = useCallback(async (selectedPeriod: Period) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/progress/activity?userId=${DEMO_USER_ID}&period=${selectedPeriod}`)
      if (response.ok) {
        const data = await response.json()
        setActivityData(data)

        // Generate insights based on data
        const newInsights: string[] = []
        if (data.streak?.current > 0) {
          newInsights.push(`You've been reflecting for ${data.streak.current} days in a row. Consistency builds insight.`)
        }
        if (data.summary?.activeDays > 0) {
          newInsights.push(`You've been active ${data.summary.activeDays} days this ${selectedPeriod}. Each reflection adds to your story.`)
        }
        const domains = Object.entries(data.domainBreakdown || {})
        if (domains.length > 0) {
          const sorted = domains.sort((a, b) => (b[1] as number) - (a[1] as number))
          if (sorted[0]) {
            const domainNames: Record<string, string> = {
              planning: 'Planning & Prep',
              environment: 'Classroom Culture',
              instruction: 'Instruction',
              assessment: 'Assessment',
            }
            newInsights.push(`You've focused most on ${domainNames[sorted[0][0]] || sorted[0][0]}. What patterns are you noticing?`)
          }
        }
        if (newInsights.length === 0) {
          newInsights.push('Start reflecting to see patterns emerge over time.')
        }
        setInsights(newInsights)
      }
    } catch (err) {
      console.error('Failed to fetch activity data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(period)
  }, [period, fetchData])

  // Draw the room - library/archive
  const render = useCallback((ctx: CanvasRenderingContext2D) => {
    const w = ROOM_W * TILE
    const h = ROOM_H * TILE

    // Library atmosphere - dark wood
    const floorGrad = ctx.createLinearGradient(0, h * 0.5, 0, h)
    floorGrad.addColorStop(0, '#4A4A4A')
    floorGrad.addColorStop(1, '#3A3A3A')
    ctx.fillStyle = floorGrad
    ctx.fillRect(0, 0, w, h)

    // Walls - rich dark green/gray
    ctx.fillStyle = '#2F4F4F'
    ctx.fillRect(0, 0, w, h * 0.45)

    // Silver accent stripe
    ctx.fillStyle = '#708090'
    ctx.fillRect(0, h * 0.35, w, h * 0.1)
    ctx.fillStyle = '#A9A9A9'
    ctx.fillRect(0, h * 0.35, w, 4)
    ctx.fillRect(0, h * 0.44, w, 4)

    // Floor planks - dark wood
    ctx.strokeStyle = '#2D2D2D'
    ctx.lineWidth = 1
    for (let y = h * 0.5; y < h; y += TILE / 2) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    // Tall bookshelves on back wall
    for (let shelf = 0; shelf < 3; shelf++) {
      const sx = 20 + shelf * 130
      ctx.fillStyle = '#4A3728'
      ctx.fillRect(sx, 20, 100, 160)

      // Shelves
      ctx.fillStyle = '#5D4037'
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(sx, 35 + i * 30, 100, 6)
      }

      // Books on shelves
      const bookColors = ['#708090', '#4682B4', '#5F9EA0', '#2F4F4F', '#696969', '#778899']
      for (let s = 0; s < 4; s++) {
        let bx = sx + 8
        for (let b = 0; b < 6; b++) {
          const bh = 16 + ((s + b) % 3) * 4
          ctx.fillStyle = bookColors[(s + b) % bookColors.length]
          ctx.fillRect(bx, 40 + s * 30 - bh, 12, bh)
          bx += 15
        }
      }
    }

    // Filing cabinet
    ctx.fillStyle = '#696969'
    ctx.fillRect(w - 80, h * 0.45, 60, 100)
    // Drawers
    for (let d = 0; d < 3; d++) {
      ctx.fillStyle = '#5F5F5F'
      ctx.fillRect(w - 75, h * 0.47 + d * 32, 50, 28)
      ctx.fillStyle = '#A9A9A9'
      ctx.fillRect(w - 55, h * 0.51 + d * 32, 10, 4)
    }

    // Reading desk with lamp
    ctx.fillStyle = '#3D3D3D'
    ctx.fillRect(100, h * 0.58, 120, 50)
    ctx.fillStyle = '#4A4A4A'
    ctx.fillRect(105, h * 0.58, 110, 8)

    // Old documents on desk
    ctx.fillStyle = '#F5F5DC'
    ctx.fillRect(120, h * 0.52, 40, 30)
    ctx.fillStyle = '#FFFAF0'
    ctx.fillRect(125, h * 0.53, 40, 30)

    // Desk lamp - classic green banker's lamp
    ctx.fillStyle = '#2F4F4F'
    ctx.beginPath()
    ctx.ellipse(200, h * 0.50, 25, 12, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#708090'
    ctx.fillRect(195, h * 0.52, 10, 20)
    ctx.fillRect(185, h * 0.58, 30, 8)
    // Lamp glow
    const lampGlow = ctx.createRadialGradient(200, h * 0.55, 5, 200, h * 0.55, 60)
    lampGlow.addColorStop(0, 'rgba(144, 238, 144, 0.3)')
    lampGlow.addColorStop(1, 'rgba(144, 238, 144, 0)')
    ctx.fillStyle = lampGlow
    ctx.fillRect(140, h * 0.40, 120, 80)

    // Comfortable reading chair
    ctx.fillStyle = '#8B0000'
    ctx.fillRect(250, h * 0.60, 70, 60)
    ctx.fillStyle = '#A52A2A'
    ctx.fillRect(255, h * 0.65, 60, 50)
    // Chair back
    ctx.fillStyle = '#800000'
    ctx.fillRect(255, h * 0.50, 60, 35)

    // Player at desk examining documents
    drawPlayer(ctx, 160, h * 0.48, character)

    // Globe on stand
    ctx.fillStyle = '#5F9EA0'
    ctx.beginPath()
    ctx.arc(50, h * 0.65, 20, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#708090'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(50, h * 0.65, 20, 8, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(50, h * 0.65 - 20)
    ctx.lineTo(50, h * 0.65 + 20)
    ctx.stroke()
    // Stand
    ctx.fillStyle = '#4A3728'
    ctx.fillRect(45, h * 0.72, 10, 25)
    ctx.fillRect(35, h * 0.78, 30, 8)

  }, [character])

  // Draw the player
  const drawPlayer = (ctx: CanvasRenderingContext2D, x: number, y: number, char: CharacterCustomization) => {
    const skinColor = SKIN_TONES[char.skinTone] || SKIN_TONES[1]
    const hairColor = HAIR_COLORS[char.hairColor] || HAIR_COLORS[2]
    const outfit = OUTFIT_COLORS[char.outfit] || OUTFIT_COLORS[0]
    const scale = 2.5

    // Head (facing down at documents)
    ctx.fillStyle = skinColor
    ctx.beginPath()
    ctx.arc(x, y + 10, 11 * scale, 0, Math.PI * 2)
    ctx.fill()

    // Hair
    ctx.fillStyle = hairColor
    ctx.beginPath()
    ctx.arc(x, y + 5, 12 * scale, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(x - 12 * scale, y, 24 * scale, 8)

    // Eyes (looking down)
    ctx.fillStyle = '#2C1810'
    ctx.fillRect(x - 6, y + 14, 4, 2)
    ctx.fillRect(x + 3, y + 14, 4, 2)

    // Body
    ctx.fillStyle = outfit.primary
    ctx.fillRect(x - 15, y + 35, 30, 40)
    ctx.fillStyle = outfit.secondary
    ctx.fillRect(x - 5, y + 35, 10, 25)

    // Arms on desk
    ctx.fillStyle = skinColor
    ctx.fillRect(x - 25, y + 50, 20, 8)
    ctx.fillRect(x + 10, y + 50, 20, 8)
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

  const periodLabels: Record<Period, string> = {
    week: 'Week',
    month: 'Month',
    quarter: 'Quarter',
  }

  return (
    <div className="relative flex flex-col items-center">
      {/* Room canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={ROOM_W * TILE}
          height={ROOM_H * TILE}
          className="border-4 border-[#708090] rounded-lg"
          style={{
            imageRendering: 'pixelated',
            boxShadow: '0 4px 20px rgba(112, 128, 144, 0.4)',
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

      {/* Archive interface */}
      <div className="w-full max-w-[480px] mt-4 bg-slate-900/90 rounded-xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-[#A9A9A9]" />
              <h2 className="font-bold text-white">Growth Archive</h2>
            </div>
            <div className="flex gap-1">
              {(['week', 'month', 'quarter'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'px-2 py-1 text-xs font-medium rounded transition-colors',
                    period === p
                      ? 'bg-[#708090] text-white'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>
          </div>

          {/* View tabs */}
          <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
            {[
              { id: 'activity', label: 'Activity', icon: Calendar },
              { id: 'domains', label: 'Focus Areas', icon: BarChart3 },
              { id: 'insights', label: 'Patterns', icon: Sparkles },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id as ViewMode)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors',
                  viewMode === tab.id
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Star className="w-6 h-6 text-[#A9A9A9]" />
              </motion.div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {viewMode === 'activity' && activityData && (
                <motion.div
                  key="activity"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Streak info */}
                  {activityData.streak.current > 0 && (
                    <div className="flex items-center gap-2 mb-4 text-sm">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span className="text-slate-300">
                        {activityData.streak.current} day streak
                      </span>
                      {activityData.streak.longest > activityData.streak.current && (
                        <span className="text-slate-500">
                          (best: {activityData.streak.longest})
                        </span>
                      )}
                    </div>
                  )}
                  <ActivityHeatmap
                    data={activityData.activity}
                    period={period}
                  />
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-white">{activityData.summary.activeDays}</p>
                      <p className="text-xs text-slate-400">Days Active</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-white">{activityData.summary.totalReflections}</p>
                      <p className="text-xs text-slate-400">Reflections</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {viewMode === 'domains' && activityData && (
                <motion.div
                  key="domains"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <DomainBreakdown
                    data={activityData.domainBreakdown}
                    variant="bar"
                  />
                </motion.div>
              )}

              {viewMode === 'insights' && (
                <motion.div
                  key="insights"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {insights.map((insight, i) => (
                    <div
                      key={i}
                      className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3"
                    >
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-[#A9A9A9] mt-0.5 shrink-0" />
                        <p className="text-sm text-slate-300">{insight}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}
