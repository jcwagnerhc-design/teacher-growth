import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'default' | 'success' | 'warning' | 'indigo'
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, showLabel = false, size = 'md', color = 'default', ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))

    const heights = {
      sm: 'h-1.5',
      md: 'h-2.5',
      lg: 'h-4',
    }

    const colors = {
      default: 'bg-slate-600',
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      indigo: 'bg-indigo-600',
    }

    return (
      <div className={cn('w-full', className)} ref={ref} {...props}>
        <div className={cn('w-full rounded-full bg-slate-200', heights[size])}>
          <div
            className={cn('rounded-full transition-all duration-300', heights[size], colors[color])}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>{value}</span>
            <span>{max}</span>
          </div>
        )}
      </div>
    )
  }
)
Progress.displayName = 'Progress'

export { Progress }
