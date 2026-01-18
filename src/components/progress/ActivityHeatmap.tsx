'use client'

import { useMemo } from 'react'
import { format, parseISO, startOfWeek, addDays, getDay } from 'date-fns'
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
  'bg-slate-800', // 0 - no activity
  'bg-emerald-900/50', // 1 - light
  'bg-emerald-700/60', // 2 - medium-light
  'bg-emerald-500/70', // 3 - medium
  'bg-emerald-400', // 4 - high
]

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function ActivityHeatmap({ data, period }: ActivityHeatmapProps) {
  // Organize data into weeks for grid display
  const { weeks, monthLabels } = useMemo(() => {
    if (data.length === 0) return { weeks: [], monthLabels: [] }

    const dataMap = new Map(data.map(d => [d.date, d]))
    const weeks: (ActivityEntry | null)[][] = []
    const monthLabels: { weekIndex: number; label: string }[] = []

    // Get the start date (first day in data) and ensure we start from a Sunday
    const firstDate = parseISO(data[0].date)
    const weekStart = startOfWeek(firstDate)

    // Calculate how many weeks we need
    const lastDate = parseISO(data[data.length - 1].date)
    const numWeeks = Math.ceil((lastDate.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1

    let currentMonth = ''

    for (let weekIdx = 0; weekIdx < numWeeks; weekIdx++) {
      const week: (ActivityEntry | null)[] = []

      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        const date = addDays(weekStart, weekIdx * 7 + dayIdx)
        const dateStr = format(date, 'yyyy-MM-dd')
        const entry = dataMap.get(dateStr)

        // Track month labels
        const monthLabel = format(date, 'MMM')
        if (monthLabel !== currentMonth && dayIdx === 0) {
          currentMonth = monthLabel
          monthLabels.push({ weekIndex: weekIdx, label: monthLabel })
        }

        if (entry) {
          week.push(entry)
        } else {
          // Date outside our data range - show as null
          week.push(null)
        }
      }

      weeks.push(week)
    }

    return { weeks, monthLabels }
  }, [data])

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No activity data available
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Month labels */}
      <div className="flex gap-1 pl-6 text-xs text-slate-500">
        {monthLabels.map((m, i) => (
          <span
            key={i}
            className="absolute"
            style={{ marginLeft: `${m.weekIndex * 16 + 24}px` }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        {/* Day labels */}
        <div className="flex flex-col gap-1 text-xs text-slate-500">
          {DAY_LABELS.map((day, i) => (
            <div key={i} className="h-3 flex items-center justify-center w-4">
              {i % 2 === 1 ? day : ''}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1">
              {week.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  className={cn(
                    'w-3 h-3 rounded-sm transition-colors cursor-pointer',
                    day === null
                      ? 'bg-slate-900/30'
                      : LEVEL_COLORS[day.level],
                    day && day.level > 0 && 'hover:ring-2 hover:ring-white/30'
                  )}
                  title={
                    day
                      ? `${format(parseISO(day.date), 'MMM d, yyyy')}: ${day.totalCount} activities`
                      : undefined
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-xs text-slate-500 mt-2">
        <span>Less</span>
        {LEVEL_COLORS.map((color, i) => (
          <div key={i} className={cn('w-3 h-3 rounded-sm', color)} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

export default ActivityHeatmap
