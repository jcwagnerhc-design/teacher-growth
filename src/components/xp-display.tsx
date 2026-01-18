'use client'

import { cn } from '@/lib/utils'
import { Zap } from 'lucide-react'

interface XpDisplayProps {
  xp: number
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
  animated?: boolean
}

export function XpDisplay({ xp, size = 'md', showIcon = true, className, animated = false }: XpDisplayProps) {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl font-semibold',
  }

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 text-amber-600',
        sizes[size],
        animated && 'animate-pulse',
        className
      )}
    >
      {showIcon && <Zap size={iconSizes[size]} className="fill-amber-500" />}
      <span>{xp.toLocaleString()} XP</span>
    </div>
  )
}
