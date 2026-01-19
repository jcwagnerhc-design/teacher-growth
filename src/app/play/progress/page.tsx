'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  TrendingUp,
  Zap,
  Calendar,
  Flame,
  Trophy,
  Target,
  BookOpen,
  Award,
  Rocket,
  Sparkles,
  Loader2,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { XpChart, ActivityHeatmap, DomainBreakdown } from '@/components/progress'

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
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f2744] to-[#0a1628] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#7db4e0]" />
            Growth Progress
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Period Selector */}
        <div className="flex gap-2 justify-center">
          {(['week', 'month', 'quarter'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                period === p
                  ? 'bg-[#2d5a87] text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              )}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#7db4e0] animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => fetchData(period)}
              className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
                <Zap className="w-6 h-6 text-[#c0c0c0] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#c0c0c0]">
                  {timelineData?.summary.totalXp || 0}
                </p>
                <p className="text-xs text-slate-400">Total XP</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
                <Flame className="w-6 h-6 text-[#a0c4e8] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#a0c4e8]">
                  {activityData?.streak.current || 0}
                </p>
                <p className="text-xs text-slate-400">Day Streak</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
                <Calendar className="w-6 h-6 text-[#6ba3d6] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#6ba3d6]">
                  {activityData?.summary.activeDays || 0}
                </p>
                <p className="text-xs text-slate-400">Days Active</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
                <Target className="w-6 h-6 text-[#7db4e0] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#7db4e0]">
                  {timelineData?.summary.averageXp || 0}
                </p>
                <p className="text-xs text-slate-400">Avg XP/Day</p>
              </div>
            </motion.div>

            {/* XP Timeline Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#7db4e0]" />
                  XP Over Time
                </h2>
                {timelineData?.summary.bestDay && (
                  <div className="text-xs text-slate-400">
                    Best: <span className="text-[#7db4e0] font-medium">{timelineData.summary.bestDay.total} XP</span>
                  </div>
                )}
              </div>
              {timelineData && (
                <XpChart
                  data={timelineData.timeline}
                  period={period}
                  showBreakdown={false}
                />
              )}
            </motion.div>

            {/* Activity Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-4"
            >
              <h2 className="font-semibold flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-[#6ba3d6]" />
                Activity Calendar
              </h2>
              {activityData && (
                <ActivityHeatmap
                  data={activityData.activity}
                  period={period}
                />
              )}
            </motion.div>

            {/* Domain Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-4"
            >
              <h2 className="font-semibold flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-[#a0c4e8]" />
                Growth by Domain
              </h2>
              {activityData && (
                <DomainBreakdown
                  data={activityData.domainBreakdown}
                  variant="cards"
                />
              )}
            </motion.div>

            {/* XP Sources */}
            {timelineData && (timelineData.bySource.signal > 0 || timelineData.bySource.reflection > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-4"
              >
                <h2 className="font-semibold flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-[#c0c0c0]" />
                  XP Sources
                </h2>
                <div className="space-y-3">
                  {timelineData.bySource.signal > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Daily Check-ins</span>
                      <span className="text-[#7db4e0] font-medium">+{timelineData.bySource.signal} XP</span>
                    </div>
                  )}
                  {timelineData.bySource.reflection > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Reflections</span>
                      <span className="text-[#a0c4e8] font-medium">+{timelineData.bySource.reflection} XP</span>
                    </div>
                  )}
                  {timelineData.bySource.quest > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Quests</span>
                      <span className="text-[#c0c0c0] font-medium">+{timelineData.bySource.quest} XP</span>
                    </div>
                  )}
                  {timelineData.bySource.streak > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Streak Bonus</span>
                      <span className="text-[#6ba3d6] font-medium">+{timelineData.bySource.streak} XP</span>
                    </div>
                  )}
                  {timelineData.bySource.variety > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Variety & Bonuses</span>
                      <span className="text-[#9ca3af] font-medium">+{timelineData.bySource.variety} XP</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Growth Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-[#1e3a5f]/40 to-[#2d5a87]/40 border border-[#4a7ba8]/30 rounded-xl p-4"
            >
              <h2 className="font-semibold flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-[#7db4e0]" />
                Growth Insights
              </h2>
              <div className="space-y-2 text-sm text-slate-300">
                {activityData && activityData.streak.current > 0 && (
                  <p>
                    You&apos;re on a <span className="text-[#a0c4e8] font-medium">{activityData.streak.current}-day streak</span>! Keep it going.
                  </p>
                )}
                {activityData && activityData.streak.longest > activityData.streak.current && (
                  <p>
                    Your record is <span className="text-[#6ba3d6] font-medium">{activityData.streak.longest} days</span>. You&apos;re {activityData.streak.longest - activityData.streak.current} days away from beating it!
                  </p>
                )}
                {timelineData && timelineData.summary.averageXp > 0 && (
                  <p>
                    You&apos;re averaging <span className="text-[#7db4e0] font-medium">{timelineData.summary.averageXp} XP per active day</span>.
                  </p>
                )}
                {activityData && activityData.summary.totalActivities === 0 && (
                  <p>
                    Start your growth journey by logging your first reflection!
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800 z-30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <button onClick={() => router.push('/play')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-[#7db4e0] transition-colors">
              <Rocket className="w-6 h-6" />
              <span className="text-xs">Base</span>
            </button>
            <button onClick={() => router.push('/play/reflect')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-[#a0c4e8] transition-colors">
              <BookOpen className="w-6 h-6" />
              <span className="text-xs">Log</span>
            </button>
            <button onClick={() => router.push('/play/journal')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-[#c0c0c0] transition-colors">
              <Sparkles className="w-6 h-6" />
              <span className="text-xs">Journal</span>
            </button>
            <button onClick={() => router.push('/play/goals')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-[#7db4e0] transition-colors">
              <Target className="w-6 h-6" />
              <span className="text-xs">Goals</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-white">
              <TrendingUp className="w-6 h-6" />
              <span className="text-xs font-bold">Progress</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}
