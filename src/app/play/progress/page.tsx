'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  Flame,
  BookOpen,
  BarChart3,
  Star,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ActivityHeatmap, DomainBreakdown } from '@/components/progress'

// 8-bit pixel stars component
const PixelStars = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute bg-white"
        style={{
          left: `${(i * 17 + 23) % 100}%`,
          top: `${(i * 31 + 11) % 100}%`,
          width: i % 5 === 0 ? '4px' : '2px',
          height: i % 5 === 0 ? '4px' : '2px',
          imageRendering: 'pixelated',
        }}
        animate={{
          opacity: [0.3, 1, 0.3],
        }}
        transition={{
          duration: 1.5 + (i % 3),
          repeat: Infinity,
          delay: (i % 5) * 0.3,
        }}
      />
    ))}
  </div>
)

// Demo user ID for development
const DEMO_USER_ID = 'demo-user-001'

type Period = 'week' | 'month' | 'quarter'

interface TimelineEntry {
  date: string
  total: number
  signal: number
  reflection: number
  quest: number
  streak: number
  variety: number
}

interface ActivityEntry {
  date: string
  signalCount: number
  reflectionCount: number
  totalCount: number
  level: number
}

interface TimelineData {
  timeline: TimelineEntry[]
  summary: {
    totalXp: number
    averageXp: number
    bestDay: { date: string; total: number } | null
    daysActive: number
    totalDays: number
  }
  bySource: {
    signal: number
    reflection: number
    quest: number
    streak: number
    variety: number
  }
}

interface ActivityData {
  activity: ActivityEntry[]
  streak: {
    current: number
    longest: number
    lastLogDate: string | null
  }
  domainBreakdown: Record<string, number>
  summary: {
    totalActivities: number
    totalSignals: number
    totalReflections: number
    activeDays: number
    totalDays: number
  }
}

export default function ProgressPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<Period>('week')
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null)
  const [activityData, setActivityData] = useState<ActivityData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (selectedPeriod: Period) => {
    setIsLoading(true)
    setError(null)

    try {
      const [timelineRes, activityRes] = await Promise.all([
        fetch(`/api/progress/timeline?userId=${DEMO_USER_ID}&period=${selectedPeriod}`),
        fetch(`/api/progress/activity?userId=${DEMO_USER_ID}&period=${selectedPeriod}`),
      ])

      if (!timelineRes.ok || !activityRes.ok) {
        throw new Error('Failed to fetch progress data')
      }

      const [timeline, activity] = await Promise.all([
        timelineRes.json(),
        activityRes.json(),
      ])

      setTimelineData(timeline)
      setActivityData(activity)
    } catch (err) {
      console.error('Failed to fetch progress data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load progress data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(period)
  }, [period, fetchData])

  const periodLabels: Record<Period, string> = {
    week: 'This Week',
    month: 'This Month',
    quarter: 'This Quarter',
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f2744] to-[#0a1628] text-white pb-6 relative overflow-hidden">
      <PixelStars />

      {/* Header - 8-bit style */}
      <header className="sticky top-0 z-10 bg-[#0a1628] border-b-4 border-[#2d4a6f] p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-400 hover:text-white transition-colors border-2 border-transparent hover:border-slate-600"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-black flex items-center gap-2 uppercase tracking-[0.15em] px-4 py-2 border-4 border-[#4a7ba8] bg-[#0f2744]" style={{ boxShadow: '4px 4px 0 #0a1628' }}>
            <TrendingUp className="w-5 h-5 text-[#7db4e0]" />
            Growth Archive
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6 relative z-10">
        {/* Period Selector - 8-bit style */}
        <div className="flex gap-2 justify-center">
          {(['week', 'month', 'quarter'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-4 py-2 font-black text-sm transition-all uppercase tracking-wide border-4',
                period === p
                  ? 'bg-[#2d5a87] text-white border-[#4a7ba8]'
                  : 'bg-[#0f2744] text-slate-400 border-slate-600 hover:text-white hover:border-slate-500'
              )}
              style={{ boxShadow: '3px 3px 0 #0a1628' }}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Star className="w-8 h-8 text-[#7db4e0]" />
            </motion.div>
            <p className="text-slate-400 mt-4 text-sm font-bold uppercase tracking-wide">Loading...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-[#0f2744] border-4 border-[#2d4a6f]" style={{ boxShadow: '4px 4px 0 #0a1628' }}>
            <p className="text-red-400 font-bold">{error}</p>
            <button
              onClick={() => fetchData(period)}
              className="mt-4 px-6 py-3 bg-[#2d5a87] text-white font-black uppercase tracking-[0.1em] border-4 border-[#4a7ba8] hover:translate-x-1 hover:-translate-y-1 transition-transform"
              style={{ boxShadow: '4px 4px 0 #0a1628' }}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Summary Stats - simplified */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-3 gap-3"
            >
              <div
                className="bg-[#0f2744] border-4 border-[#4a7ba8] p-4 text-center"
                style={{ boxShadow: '4px 4px 0 #0a1628' }}
              >
                <div className="w-10 h-10 mx-auto mb-2 bg-[#4a7ba8] border-2 border-[#6ba3d6] flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-black text-[#a0c4e8]">
                  {activityData?.streak.current || 0}
                </p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Day Streak</p>
              </div>
              <div
                className="bg-[#0f2744] border-4 border-[#6ba3d6] p-4 text-center"
                style={{ boxShadow: '4px 4px 0 #0a1628' }}
              >
                <div className="w-10 h-10 mx-auto mb-2 bg-[#2d5a87] border-2 border-[#4a7ba8] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-black text-[#6ba3d6]">
                  {activityData?.summary.activeDays || 0}
                </p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Days Active</p>
              </div>
              <div
                className="bg-[#0f2744] border-4 border-[#4a7ba8] p-4 text-center"
                style={{ boxShadow: '4px 4px 0 #0a1628' }}
              >
                <div className="w-10 h-10 mx-auto mb-2 bg-[#2d5a87] border-2 border-[#4a7ba8] flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-black text-[#7db4e0]">
                  {activityData?.summary.totalReflections || 0}
                </p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Reflections</p>
              </div>
            </motion.div>

            {/* Activity Heatmap - 8-bit style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#0f2744] border-4 border-[#6ba3d6] p-4"
              style={{ boxShadow: '4px 4px 0 #0a1628' }}
            >
              <h2 className="font-black flex items-center gap-2 mb-4 uppercase tracking-[0.1em]">
                <div className="w-8 h-8 bg-[#2d5a87] border-2 border-[#4a7ba8] flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                Activity Calendar
              </h2>
              {activityData && (
                <ActivityHeatmap
                  data={activityData.activity}
                  period={period}
                />
              )}
            </motion.div>

            {/* Domain Breakdown - 8-bit style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#0f2744] border-4 border-[#4a7ba8] p-4"
              style={{ boxShadow: '4px 4px 0 #0a1628' }}
            >
              <h2 className="font-black flex items-center gap-2 mb-4 uppercase tracking-[0.1em]">
                <div className="w-8 h-8 bg-[#4a7ba8] border-2 border-[#6ba3d6] flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                Growth by Domain
              </h2>
              {activityData && (
                <DomainBreakdown
                  data={activityData.domainBreakdown}
                  variant="cards"
                />
              )}
            </motion.div>

            {/* Growth Insights - 8-bit style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#1e3a5f]/40 border-4 border-[#4a7ba8] p-4"
              style={{ boxShadow: '4px 4px 0 #0a1628' }}
            >
              <h2 className="font-black flex items-center gap-2 mb-3 uppercase tracking-[0.1em]">
                <div className="w-8 h-8 bg-[#2d5a87] border-2 border-[#4a7ba8] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                Growth Patterns
              </h2>
              <div className="space-y-2 text-sm text-slate-300">
                {activityData && activityData.streak.current > 0 && (
                  <p>
                    You&apos;ve been reflecting for <span className="text-[#a0c4e8] font-black">{activityData.streak.current} days</span> in a row. Consistency builds insight.
                  </p>
                )}
                {activityData && activityData.streak.longest > activityData.streak.current && (
                  <p>
                    Your longest streak was <span className="text-[#6ba3d6] font-black">{activityData.streak.longest} days</span>.
                  </p>
                )}
                {activityData && activityData.summary.totalReflections > 0 && (
                  <p>
                    You&apos;ve captured <span className="text-[#7db4e0] font-black">{activityData.summary.totalReflections} reflections</span> - each one adding to your growth story.
                  </p>
                )}
                {activityData && activityData.summary.totalActivities === 0 && (
                  <p>
                    Start your growth journey by logging your first reflection!
                  </p>
                )}
              </div>
            </motion.div>

            {/* View Full Journal Link */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <button
                onClick={() => router.push('/play/journal')}
                className="w-full flex items-center justify-between p-4 bg-[#0f2744] border-4 border-[#2d4a6f] hover:border-[#4a7ba8] transition-colors"
                style={{ boxShadow: '4px 4px 0 #0a1628' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#2d5a87] border-2 border-[#4a7ba8] flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-black uppercase tracking-[0.1em]">View Full Journal</span>
                </div>
                <span className="text-slate-500 text-sm">See all reflections</span>
              </button>
            </motion.div>
          </>
        )}
      </main>
    </div>
  )
}
