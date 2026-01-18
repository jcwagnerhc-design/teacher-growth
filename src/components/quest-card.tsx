'use client'

import { Check, Target, Swords, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { XpDisplay } from '@/components/xp-display'
import type { QuestProgress } from '@/types'

interface QuestCardProps {
  quest: QuestProgress
  onSelect?: () => void
  isSelectable?: boolean
  isSelected?: boolean
}

export function QuestCard({
  quest,
  onSelect,
  isSelectable = false,
  isSelected = false,
}: QuestCardProps) {
  const { quest: q, progress, target, isCompleted } = quest

  const icons = {
    DAILY: Target,
    WEEKLY: Calendar,
    BOSS: Swords,
  }

  const Icon = icons[q.questType]

  const colors = {
    DAILY: 'bg-blue-50 border-blue-200 text-blue-700',
    WEEKLY: 'bg-purple-50 border-purple-200 text-purple-700',
    BOSS: 'bg-amber-50 border-amber-200 text-amber-700',
  }

  return (
    <div
      onClick={isSelectable && !isCompleted ? onSelect : undefined}
      className={cn(
        'p-4 rounded-lg border transition-all',
        isCompleted
          ? 'bg-emerald-50 border-emerald-200'
          : colors[q.questType],
        isSelectable && !isCompleted && 'cursor-pointer hover:shadow-md',
        isSelected && !isCompleted && 'ring-2 ring-indigo-500'
      )}
    >
      <div className="flex items-start gap-3">
        {isSelectable && (
          <div
            className={cn(
              'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5',
              isCompleted
                ? 'border-emerald-500 bg-emerald-500'
                : isSelected
                ? 'border-indigo-500 bg-indigo-500'
                : 'border-slate-300'
            )}
          >
            {(isCompleted || isSelected) && (
              <Check className="w-3 h-3 text-white" />
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">
              {q.questType}
            </span>
          </div>

          <h4 className="font-medium text-slate-900 mb-1">{q.title}</h4>

          {q.description && (
            <p className="text-sm text-slate-600 mb-2">{q.description}</p>
          )}

          {!isCompleted && target > 1 && (
            <div className="mt-2">
              <Progress
                value={progress}
                max={target}
                size="sm"
                color={isCompleted ? 'success' : 'default'}
              />
              <p className="text-xs text-slate-500 mt-1">
                {progress}/{target}
              </p>
            </div>
          )}

          {isCompleted && (
            <p className="text-sm text-emerald-600 font-medium">Completed</p>
          )}
        </div>

        <XpDisplay xp={q.xpReward} size="sm" />
      </div>
    </div>
  )
}
