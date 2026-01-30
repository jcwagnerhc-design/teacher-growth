'use client'

import { useMemo } from 'react'
import { format, parseISO, startOfWeek, addDays, subWeeks, isAfter, isBefore } from 'date-fns'
import { cn } from '@/lib/utils'

interface ActivityEntry {
  date: string
  signalCount: number
  reflectionCount: number
  totalCount: number
  level: number
}

interface ActivityHeatmapProps {
  data: ActivityEntry[]
  period: 'week' | 'month' | 'quarter'
}

const LEVEL_COLORS = [
  'bg-slate-700/50', // 0 - no activity
  'bg-emerald-900/60', // 1 - light
  'bg-emerald-700/70', // 2 - medium-light
  'bg-emerald-500/80', // 3 - medium
  'bg-emerald-400', // 4 - high
]

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function ActivityHeatmap({ data, period }: ActivityHeatmapProps) {
  // Calculate number of weeks to show based on period
  const numWeeks = period === 'week' ? 1 : period === 'month' ? 5 : 13

  // Organize data into a calendar grid
  const { weeks, weekLabels } = useMemo(() => {
    const dataMap = new Map(data.map(d => [d.date, d]))
    const weeks: (ActivityEntry | null)[][] = []
    const weekLabels: string[] = []

    // Start from current week and go back
    const today = new Date()
    const currentWeekStart = startOfWeek(today)

    for (let weekIdx = numWeeks - 1; weekIdx >= 0; weekIdx--) {
      const weekStart = subWeeks(currentWeekStart, weekIdx)
      const week: (ActivityEntry | null)[] = []

      // Generate label for this week
      weekLabels.push(format(weekStart, 'MMM d'))

      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        const date = addDays(weekStart, dayIdx)
        const dateStr = format(date, 'yyyy-MM-dd')

        // Don't show future dates
        if (isAfter(date, today)) {
          week.push(null)
        } else {
          const entry = dataMap.get(dateStr)
          week.push(entry || { date: dateStr, signalCount: 0, reflectionCount: 0, totalCount: 0, level: 0 })
        }
      }

      weeks.push(week)
    }

    return { weeks, weekLabels }
  }, [data, numWeeks])

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No activity data available
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header row with day labels */}
      <div className="grid grid-cols-8 gap-1 text-xs text-slate-400">
        <div className="w-16"></div>
        {DAY_LABELS.map((day, i) => (
          <div key={i} className="text-center font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-8 gap-1">
            {/* Week label */}
            <div className="w-16 text-xs text-slate-500 flex items-center pr-2 justify-end">
              {weekLabels[weekIdx]}
            </div>

            {/* Days in week */}
            {week.map((day, dayIdx) => (
              <div
                key={dayIdx}
                className={cn(
                  'aspect-square rounded-md transition-all flex items-center justify-center text-xs',
                  day === null
                    ? 'bg-slate-800/30'
                    : LEVEL_COLORS[day.level],
                  day && day.level > 0 && 'hover:ring-2 hover:ring-white/40 cursor-pointer'
                )}
                title={
                  day && day.level > 0
                    ? `${format(parseISO(day.date), 'EEEE, MMM d')}: ${day.totalCount} ${day.totalCount === 1 ? 'reflection' : 'reflections'}`
                    : day
                    ? format(parseISO(day.date), 'EEEE, MMM d')
                    : undefined
                }
              >
                {day && day.totalCount > 0 && (
                  <span className="text-white/90 font-medium">{day.totalCount}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-700/50">
        <span>Activity:</span>
        <div className="flex items-center gap-1">
          <span>None</span>
          {LEVEL_COLORS.map((color, i) => (
            <div key={i} className={cn('w-4 h-4 rounded', color)} />
          ))}
          <span>High</span>
        </div>
      </div>
    </div>
  )
}

export default ActivityHeatmap
