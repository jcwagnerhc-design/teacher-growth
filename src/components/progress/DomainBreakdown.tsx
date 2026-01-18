'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { ClipboardList, Heart, Presentation, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DomainBreakdownProps {
  data: Record<string, number>
  variant?: 'bar' | 'cards'
}

const DOMAIN_CONFIG = {
  planning: {
    name: 'Planning & Prep',
    icon: ClipboardList,
    color: '#10b981', // emerald-500
    bgColor: 'bg-emerald-500',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-400',
  },
  environment: {
    name: 'Classroom Culture',
    icon: Heart,
    color: '#f43f5e', // rose-500
    bgColor: 'bg-rose-500',
    textColor: 'text-rose-400',
    borderColor: 'border-rose-400',
  },
  instruction: {
    name: 'Instruction',
    icon: Presentation,
    color: '#8b5cf6', // violet-500
    bgColor: 'bg-violet-500',
    textColor: 'text-violet-400',
    borderColor: 'border-violet-400',
  },
  assessment: {
    name: 'Assessment',
    icon: BarChart3,
    color: '#f59e0b', // amber-500
    bgColor: 'bg-amber-500',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-400',
  },
}

export function DomainBreakdown({ data, variant = 'cards' }: DomainBreakdownProps) {
  const chartData = useMemo(() => {
    return Object.entries(DOMAIN_CONFIG).map(([id, config]) => ({
      id,
      name: config.name,
      count: data[id] || 0,
      color: config.color,
    }))
  }, [data])

  const total = chartData.reduce((sum, d) => sum + d.count, 0)

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null

    const { name, count, color } = payload[0].payload
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0

    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="font-medium" style={{ color }}>{name}</p>
        <p className="text-slate-300 text-sm">{count} activities ({percentage}%)</p>
      </div>
    )
  }

  if (variant === 'bar') {
    return (
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.id} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Cards variant
  return (
    <div className="grid grid-cols-2 gap-3">
      {Object.entries(DOMAIN_CONFIG).map(([id, config]) => {
        const count = data[id] || 0
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0
        const Icon = config.icon

        return (
          <div
            key={id}
            className={cn(
              'p-4 rounded-xl bg-slate-800/50 border transition-all hover:bg-slate-800/70',
              config.borderColor,
              'border-opacity-30'
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('p-1.5 rounded-lg', config.bgColor)}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-300 truncate">{config.name}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn('text-2xl font-bold', config.textColor)}>{count}</span>
              <span className="text-sm text-slate-500">activities</span>
            </div>
            {total > 0 && (
              <div className="mt-2">
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', config.bgColor)}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{percentage}% of total</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default DomainBreakdown
