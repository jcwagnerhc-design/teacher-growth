'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Target,
  Plus,
  Trophy,
  ChevronDown,
  Loader2,
  BookOpen,
  Sparkles,
  Award,
  Rocket,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { GoalCard, Goal, CreateGoalModal } from '@/components/goals'

// Demo user ID for development
const DEMO_USER_ID = 'demo-user-001'

export default function GoalsPage() {
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const [summary, setSummary] = useState({ active: 0, completed: 0, abandoned: 0 })

  const fetchGoals = useCallback(async () => {
    try {
      const response = await fetch(`/api/goals?userId=${DEMO_USER_ID}`)
      if (!response.ok) {
        throw new Error('Failed to fetch goals')
      }
      const data = await response.json()
      setGoals(data.goals)
      setSummary(data.summary)
    } catch (err) {
      console.error('Failed to fetch goals:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch goals')
    }
  }, [])

  useEffect(() => {
    setIsLoading(true)
    fetchGoals().finally(() => setIsLoading(false))
  }, [fetchGoals])

  const handleCreateGoal = async (goalInput: {
    title: string
    description?: string
    goalType: 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
    targetType: 'REFLECTION_COUNT' | 'SKILL_FOCUS' | 'DOMAIN_FOCUS'
    targetValue: number
    targetSkillId?: string
    targetDomain?: string
  }) => {
    const response = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: DEMO_USER_ID,
        ...goalInput,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create goal')
    }

    // Refresh goals list
    await fetchGoals()
  }

  const handleUpdateGoal = async (goalId: string, status: 'COMPLETED' | 'ABANDONED') => {
    try {
      const response = await fetch('/api/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId, status }),
      })

      if (!response.ok) {
        throw new Error('Failed to update goal')
      }

      // Refresh goals list
      await fetchGoals()
    } catch (err) {
      console.error('Failed to update goal:', err)
    }
  }

  const activeGoals = goals.filter(g => g.status === 'ACTIVE')
  const completedGoals = goals.filter(g => g.status === 'COMPLETED')
  const abandonedGoals = goals.filter(g => g.status === 'ABANDONED')

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
            <Target className="w-5 h-5 text-[#7db4e0]" />
            Growth Goals
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 text-[#7db4e0] hover:text-white transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
            <Target className="w-6 h-6 text-[#7db4e0] mx-auto mb-2" />
            <p className="text-2xl font-bold">{summary.active}</p>
            <p className="text-xs text-slate-400">Active</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
            <Trophy className="w-6 h-6 text-[#c0c0c0] mx-auto mb-2" />
            <p className="text-2xl font-bold">{summary.completed}</p>
            <p className="text-xs text-slate-400">Completed</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
            <TrendingUp className="w-6 h-6 text-[#6ba3d6] mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {summary.completed + summary.active > 0
                ? Math.round((summary.completed / (summary.completed + summary.active + summary.abandoned)) * 100)
                : 0}%
            </p>
            <p className="text-xs text-slate-400">Success Rate</p>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#7db4e0] animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => {
                setIsLoading(true)
                fetchGoals().finally(() => setIsLoading(false))
              }}
              className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Active Goals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#7db4e0]" />
                Active Goals
              </h2>

              {activeGoals.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-8 text-center">
                  <Target className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 mb-4">No active goals yet.</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-[#2d5a87] text-white rounded-lg font-medium hover:bg-[#4a7ba8] transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First Goal
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeGoals.map((goal, i) => (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <GoalCard
                        goal={goal}
                        onComplete={(id) => handleUpdateGoal(id, 'COMPLETED')}
                        onAbandon={(id) => handleUpdateGoal(id, 'ABANDONED')}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Completed Goals */}
            {(completedGoals.length > 0 || abandonedGoals.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="w-full flex items-center justify-between p-4 bg-slate-900/30 border border-slate-800 rounded-xl hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#c0c0c0]" />
                    <span className="font-semibold">Past Goals</span>
                    <span className="text-sm text-slate-500">
                      ({completedGoals.length + abandonedGoals.length})
                    </span>
                  </div>
                  <ChevronDown className={cn(
                    'w-5 h-5 text-slate-500 transition-transform',
                    showCompleted && 'rotate-180'
                  )} />
                </button>

                <AnimatePresence>
                  {showCompleted && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 pt-4">
                        {completedGoals.map((goal, i) => (
                          <motion.div
                            key={goal.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <GoalCard goal={goal} />
                          </motion.div>
                        ))}
                        {abandonedGoals.map((goal, i) => (
                          <motion.div
                            key={goal.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (completedGoals.length + i) * 0.05 }}
                          >
                            <GoalCard goal={goal} />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* Create Goal Modal */}
      <CreateGoalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateGoal={handleCreateGoal}
      />

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
            <button className="flex flex-col items-center gap-1 text-white">
              <Target className="w-6 h-6" />
              <span className="text-xs font-bold">Goals</span>
            </button>
            <button onClick={() => router.push('/play/progress')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-[#6ba3d6] transition-colors">
              <TrendingUp className="w-6 h-6" />
              <span className="text-xs">Progress</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}
