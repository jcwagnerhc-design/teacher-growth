'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'

interface TimelineEntry {
  date: string
  total: number
  signal: number
  reflection: number
  quest: number
  streak: number
  variety: number
}

interface XpChartProps {
  data: TimelineEntry[]
  period: 'week' | 'month' | 'quarter'
  showBreakdown?: boolean
}

const COLORS = {
  total: '#22d3ee', // cyan-400
  signal: '#a78bfa', // violet-400
  reflection: '#f472b6', // pink-400
  quest: '#fbbf24', // amber-400
  streak: '#34d399', // emerald-400
  variety: '#f97316', // orange-400
}

export function XpChart({ data, period, showBreakdown = false }: XpChartProps) {
  const formattedData = useMemo(() => {
    return data.map(entry => ({
      ...entry,
      displayDate: format(parseISO(entry.date), period === 'week' ? 'EEE' : 'MMM d'),
    }))
  }, [data, period])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0].payload
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-slate-400 text-sm mb-2">
          {format(parseISO(data.date), 'EEEE, MMM d')}
        </p>
        <p className="text-cyan-400 font-bold text-lg">
          {data.total} XP
        </p>
        {showBreakdown && data.total > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-700 space-y-1 text-xs">
            {data.signal > 0 && (
              <p className="flex justify-between">
                <span className="text-violet-400">Signals</span>
                <span className="text-slate-300">+{data.signal}</span>
              </p>
            )}
            {data.reflection > 0 && (
              <p className="flex justify-between">
                <span className="text-pink-400">Reflections</span>
                <span className="text-slate-300">+{data.reflection}</span>
              </p>
            )}
            {data.quest > 0 && (
              <p className="flex justify-between">
                <span className="text-amber-400">Quests</span>
                <span className="text-slate-300">+{data.quest}</span>
              </p>
            )}
            {data.streak > 0 && (
              <p className="flex justify-between">
                <span className="text-emerald-400">Streak</span>
                <span className="text-slate-300">+{data.streak}</span>
              </p>
            )}
            {data.variety > 0 && (
              <p className="flex justify-between">
                <span className="text-orange-400">Bonuses</span>
                <span className="text-slate-300">+{data.variety}</span>
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.total} stopOpacity={0.4} />
              <stop offset="95%" stopColor={COLORS.total} stopOpacity={0} />
            </linearGradient>
            {showBreakdown && (
              <>
                <linearGradient id="signalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.signal} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={COLORS.signal} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="reflectionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.reflection} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={COLORS.reflection} stopOpacity={0} />
                </linearGradient>
              </>
            )}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="displayDate"
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
          />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          {showBreakdown ? (
            <>
              <Area
                type="monotone"
                dataKey="signal"
                stackId="1"
                stroke={COLORS.signal}
                fill="url(#signalGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="reflection"
                stackId="1"
                stroke={COLORS.reflection}
                fill="url(#reflectionGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="quest"
                stackId="1"
                stroke={COLORS.quest}
                fill={COLORS.quest}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </>
          ) : (
            <Area
              type="monotone"
              dataKey="total"
              stroke={COLORS.total}
              fill="url(#totalGradient)"
              strokeWidth={2}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default XpChart
