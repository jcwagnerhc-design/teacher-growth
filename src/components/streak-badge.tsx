'use client'

import { cn } from '@/lib/utils'
import { Flame } from 'lucide-react'

interface StreakBadgeProps {
  streak: number
  longestStreak?: number
  size?: 'sm' | 'md' | 'lg'
  showLongest?: boolean
  className?: string
}

export function StreakBadge({
  streak,
  longestStreak,
  size = 'md',
  showLongest = false,
  className,
}: StreakBadgeProps) {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl font-semibold',
  }

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 24,
  }

  const isActive = streak > 0

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-3 py-1',
          isActive ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500',
          sizes[size]
        )}
      >
        <Flame
          size={iconSizes[size]}
          className={cn(isActive ? 'fill-orange-500 text-orange-500' : 'text-slate-400')}
        />
        <span>{streak} day{streak !== 1 ? 's' : ''}</span>
      </div>
      {showLongest && longestStreak !== undefined && longestStreak > streak && (
        <span className="text-xs text-slate-400">Best: {longestStreak}</span>
      )}
    </div>
  )
}
