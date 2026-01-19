'use client'

import { motion } from 'framer-motion'
import {
  BookOpen,
  Target,
  ClipboardList,
  Heart,
  Presentation,
  Star,
  Calendar,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Trophy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export interface Goal {
  id: string
  title: string
  description: string | null
  goalType: 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
  targetType: 'REFLECTION_COUNT' | 'SKILL_FOCUS' | 'DOMAIN_FOCUS'
  targetValue: number
  targetSkillId: string | null
  targetDomain: string | null
  currentValue: number
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED'
  dueDate: string | null
  completedAt: string | null
  createdAt: string
  progress: number
  daysRemaining: number | null
}

interface GoalCardProps {
  goal: Goal
  onComplete?: (goalId: string) => void
  onAbandon?: (goalId: string) => void
  variant?: 'full' | 'compact'
}

const DOMAIN_CONFIG: Record<string, { name: string; icon: typeof BookOpen; color: string }> = {
  planning: { name: 'Planning & Prep', icon: ClipboardList, color: 'navyLight' },
  environment: { name: 'Classroom Culture', icon: Heart, color: 'navy' },
  instruction: { name: 'Instruction', icon: Presentation, color: 'navyBright' },
  assessment: { name: 'Assessment', icon: Star, color: 'silver' },
}

const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    navyLight: { bg: 'bg-[#2d5a87]', text: 'text-[#7db4e0]', border: 'border-[#4a7ba8]' },
    navy: { bg: 'bg-[#1e3a5f]', text: 'text-[#6ba3d6]', border: 'border-[#3d5a7f]' },
    navyBright: { bg: 'bg-[#4a7ba8]', text: 'text-[#a0c4e8]', border: 'border-[#6ba3d6]' },
    silver: { bg: 'bg-[#6b7280]', text: 'text-[#c0c0c0]', border: 'border-[#9ca3af]' },
  }
  return colors[color] || colors.navy
}

export function GoalCard({ goal, onComplete, onAbandon, variant = 'full' }: GoalCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  // Determine icon and color based on target type
  const getIconAndColor = () => {
    if (goal.targetType === 'DOMAIN_FOCUS' && goal.targetDomain) {
      const domainConfig = DOMAIN_CONFIG[goal.targetDomain]
      if (domainConfig) {
        return {
          Icon: domainConfig.icon,
          color: domainConfig.color,
        }
      }
    }

    if (goal.targetType === 'SKILL_FOCUS') {
      return { Icon: Target, color: 'navyBright' }
    }

    // Default for REFLECTION_COUNT
    return { Icon: BookOpen, color: 'navyLight' }
  }

  const { Icon, color } = getIconAndColor()
  const colors = getColorClasses(color)

  const formatDueDate = () => {
    if (!goal.dueDate) return null
    if (goal.daysRemaining === null) return null

    if (goal.daysRemaining === 0) return 'Due today'
    if (goal.daysRemaining === 1) return '1 day left'
    if (goal.daysRemaining < 0) return 'Overdue'
    return `${goal.daysRemaining} days left`
  }

  const getGoalTypeLabel = () => {
    switch (goal.goalType) {
      case 'WEEKLY': return 'Weekly Goal'
      case 'MONTHLY': return 'Monthly Goal'
      case 'CUSTOM': return 'Custom Goal'
    }
  }

  const isCompleted = goal.status === 'COMPLETED'
  const isAbandoned = goal.status === 'ABANDONED'

  if (variant === 'compact') {
    return (
      <div className={cn(
        'bg-slate-900/50 border rounded-xl p-3',
        isCompleted ? 'border-[#4a7ba8]/50' : isAbandoned ? 'border-slate-700' : colors.border
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg shrink-0',
            isCompleted ? 'bg-[#2d5a87]' : isAbandoned ? 'bg-slate-700' : colors.bg
          )}>
            {isCompleted ? (
              <Trophy className="w-4 h-4 text-white" />
            ) : (
              <Icon className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              'font-medium text-sm truncate',
              isAbandoned && 'text-slate-500 line-through'
            )}>
              {goal.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    isCompleted ? 'bg-[#7db4e0]' : isAbandoned ? 'bg-slate-600' : colors.bg
                  )}
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 shrink-0">
                {goal.currentValue}/{goal.targetValue}
              </span>
            </div>
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
        'bg-slate-900/50 border rounded-xl p-4 relative',
        isCompleted ? 'border-[#4a7ba8]/50' : isAbandoned ? 'border-slate-700' : 'border-slate-800'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn(
          'p-2.5 rounded-xl shrink-0',
          isCompleted ? 'bg-[#2d5a87]' : isAbandoned ? 'bg-slate-700' : colors.bg
        )}>
          {isCompleted ? (
            <Trophy className="w-5 h-5 text-white" />
          ) : (
            <Icon className="w-5 h-5 text-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              isCompleted
                ? 'bg-[#2d5a87]/30 text-[#7db4e0]'
                : isAbandoned
                  ? 'bg-slate-700 text-slate-500'
                  : 'bg-slate-800 text-slate-400'
            )}>
              {getGoalTypeLabel()}
            </span>
            {isCompleted && (
              <span className="text-xs text-[#7db4e0] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Completed
              </span>
            )}
            {isAbandoned && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Abandoned
              </span>
            )}
          </div>

          <h3 className={cn(
            'font-semibold',
            isAbandoned && 'text-slate-500 line-through'
          )}>
            {goal.title}
          </h3>

          {goal.description && (
            <p className="text-sm text-slate-400 mt-1">{goal.description}</p>
          )}
        </div>

        {/* Actions menu for active goals */}
        {goal.status === 'ACTIVE' && (onComplete || onAbandon) && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-slate-500 hover:text-white transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-8 z-20 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden min-w-[140px]">
                  {onComplete && (
                    <button
                      onClick={() => {
                        onComplete(goal.id)
                        setShowMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-700 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#7db4e0]" />
                      Complete
                    </button>
                  )}
                  {onAbandon && (
                    <button
                      onClick={() => {
                        onAbandon(goal.id)
                        setShowMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-700 flex items-center gap-2 text-slate-400"
                    >
                      <XCircle className="w-4 h-4" />
                      Abandon
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-400">Progress</span>
          <span className={cn(
            'font-medium',
            isCompleted ? 'text-[#7db4e0]' : colors.text
          )}>
            {goal.currentValue} / {goal.targetValue}
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goal.progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full',
              isCompleted
                ? 'bg-gradient-to-r from-[#2d5a87] to-[#7db4e0]'
                : isAbandoned
                  ? 'bg-slate-600'
                  : `bg-gradient-to-r from-[#1e3a5f] to-[#4a7ba8]`
            )}
          />
        </div>
      </div>

      {/* Footer */}
      {goal.status === 'ACTIVE' && goal.dueDate && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span className={cn(
            goal.daysRemaining !== null && goal.daysRemaining <= 1 && 'text-[#a0c4e8]'
          )}>
            {formatDueDate()}
          </span>
        </div>
      )}

      {goal.status === 'COMPLETED' && goal.completedAt && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#7db4e0]" />
          <span>
            Completed {new Date(goal.completedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      )}
    </motion.div>
  )
}

export default GoalCard
