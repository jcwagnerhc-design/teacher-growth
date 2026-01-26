'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Target,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Flame,
  Star,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface GoalProgress {
  id: string
  title: string
  currentValue: number
  targetValue: number
  progress: number
}

interface SuggestedFocus {
  domain: string
  skill?: string
  reason: string
}

interface CoachCornerProps {
  userId: string
  className?: string
  defaultExpanded?: boolean
}

const DOMAIN_NAMES: Record<string, string> = {
  planning: 'Planning & Prep',
  environment: 'Classroom Culture',
  instruction: 'Instruction',
  assessment: 'Assessment',
}

export default function CoachCorner({ userId, className, defaultExpanded = true }: CoachCornerProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<{
    patternInsight: string
    goalNudge: string | null
    suggestedFocus: SuggestedFocus | null
    streakMessage: string | null
    goals: GoalProgress[]
    streak: number
  } | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchInsights()
  }, [userId])

  const fetchInsights = async () => {
    setIsLoading(true)
    setError(false)

    try {
      const response = await fetch(`/api/coaching/dashboard?userId=${userId}`)
      const result = await response.json()

      if (result.available) {
        setData({
          patternInsight: result.patternInsight,
          goalNudge: result.goalNudge,
          suggestedFocus: result.suggestedFocus,
          streakMessage: result.streakMessage,
          goals: result.goals || [],
          streak: result.streak || 0,
        })
      } else {
        setError(true)
      }
    } catch (err) {
      console.error('Failed to fetch coach insights:', err)
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartReflection = () => {
    // Navigate to reflection with suggested focus if available
    if (data?.suggestedFocus) {
      // Store suggestion for the reflection page to pick up
      localStorage.setItem('coachSuggestion', JSON.stringify(data.suggestedFocus))
    }
    router.push('/play/reflect')
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn('bg-gradient-to-br from-[#1e3a5f]/80 to-[#0f2744]/80 rounded-xl border border-[#4a7ba8]/30', className)}>
        <div className="p-4">
          <div className="flex items-center gap-2 text-[#7db4e0]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Star className="w-4 h-4" />
            </motion.div>
            <span className="text-sm font-medium">Loading coach insights...</span>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !data) {
    return (
      <div className={cn('bg-slate-900/80 rounded-xl border border-slate-700', className)}>
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-500">Coach insights unavailable</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-gradient-to-br from-[#1e3a5f]/80 to-[#0f2744]/80 rounded-xl border border-[#4a7ba8]/30 overflow-hidden',
        className
      )}
    >
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#1e3a5f]/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#7db4e0]" />
          <span className="text-sm font-bold text-[#7db4e0]">Coach&apos;s Corner</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Pattern Insight */}
              <div>
                <p className="text-white text-sm leading-relaxed">{data.patternInsight}</p>
              </div>

              {/* Streak Message */}
              {data.streakMessage && data.streak > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-orange-300">{data.streakMessage}</span>
                </div>
              )}

              {/* Goal Progress */}
              {data.goals.length > 0 && data.goalNudge && (
                <div className="bg-[#2d5a87]/30 rounded-lg p-3 border border-[#4a7ba8]/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-[#7db4e0]" />
                    <span className="text-xs font-bold text-[#7db4e0] uppercase tracking-wide">Goal Progress</span>
                  </div>
                  <p className="text-sm text-white mb-3">{data.goalNudge}</p>

                  {/* Show first goal progress bar */}
                  {data.goals[0] && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 truncate max-w-[70%]">{data.goals[0].title}</span>
                        <span className="text-[#7db4e0]">
                          {data.goals[0].currentValue}/{data.goals[0].targetValue}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${data.goals[0].progress}%` }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          className="h-full bg-gradient-to-r from-[#2d5a87] to-[#7db4e0] rounded-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Suggested Focus */}
              {data.suggestedFocus && (
                <div className="bg-[#0f2744]/50 rounded-lg p-3 border border-[#4a7ba8]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-bold text-yellow-300 uppercase tracking-wide">Suggested Focus</span>
                  </div>
                  <p className="text-sm text-white mb-1">
                    {DOMAIN_NAMES[data.suggestedFocus.domain] || data.suggestedFocus.domain}
                    {data.suggestedFocus.skill && ` - ${data.suggestedFocus.skill}`}
                  </p>
                  <p className="text-xs text-slate-400">{data.suggestedFocus.reason}</p>
                </div>
              )}

              {/* CTA Button */}
              <button
                onClick={handleStartReflection}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#2d5a87] to-[#4a7ba8] hover:from-[#4a7ba8] hover:to-[#6ba3d6] text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-[#2d5a87]/30"
              >
                Start Guided Reflection
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
