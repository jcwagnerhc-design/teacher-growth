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
  BookOpen,
  MessageCircle,
  Rocket,
  TrendingUp,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { GoalCard, Goal, CreateGoalModal } from '@/components/goals'

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
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f2744] to-[#0a1628] text-white pb-24 relative overflow-hidden">
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
            <Target className="w-5 h-5 text-[#7db4e0]" />
            Goals
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 text-[#7db4e0] hover:text-white transition-colors border-2 border-[#4a7ba8] hover:bg-[#2d5a87]"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6 relative z-10">
        {/* Stats Summary - 8-bit style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          <div
            className="bg-[#0f2744] border-4 border-[#4a7ba8] p-4 text-center"
            style={{ boxShadow: '4px 4px 0 #0a1628' }}
          >
            <div className="w-10 h-10 mx-auto mb-2 bg-[#2d5a87] border-2 border-[#4a7ba8] flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-black">{summary.active}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Active</p>
          </div>
          <div
            className="bg-[#0f2744] border-4 border-[#6b7280] p-4 text-center"
            style={{ boxShadow: '4px 4px 0 #0a1628' }}
          >
            <div className="w-10 h-10 mx-auto mb-2 bg-[#6b7280] border-2 border-[#9ca3af] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-black text-[#c0c0c0]">{summary.completed}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Completed</p>
          </div>
          <div
            className="bg-[#0f2744] border-4 border-[#6ba3d6] p-4 text-center"
            style={{ boxShadow: '4px 4px 0 #0a1628' }}
          >
            <div className="w-10 h-10 mx-auto mb-2 bg-[#4a7ba8] border-2 border-[#6ba3d6] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-black">
              {summary.completed + summary.active > 0
                ? Math.round((summary.completed / (summary.completed + summary.active + summary.abandoned)) * 100)
                : 0}%
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Success Rate</p>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
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
              onClick={() => {
                setIsLoading(true)
                fetchGoals().finally(() => setIsLoading(false))
              }}
              className="mt-4 px-6 py-3 bg-[#2d5a87] text-white font-black uppercase tracking-[0.1em] border-4 border-[#4a7ba8] hover:translate-x-1 hover:-translate-y-1 transition-transform"
              style={{ boxShadow: '4px 4px 0 #0a1628' }}
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
              <h2 className="font-black mb-4 flex items-center gap-2 uppercase tracking-[0.1em]">
                <div className="w-8 h-8 bg-[#2d5a87] border-2 border-[#4a7ba8] flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                Active Goals
              </h2>

              {activeGoals.length === 0 ? (
                <div className="bg-[#0f2744] border-4 border-dashed border-[#2d4a6f] p-8 text-center" style={{ boxShadow: '4px 4px 0 #0a1628' }}>
                  <div className="w-16 h-16 mx-auto mb-4 bg-[#1e3a5f] border-4 border-[#2d4a6f] flex items-center justify-center">
                    <Target className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-slate-500 mb-4 font-bold uppercase tracking-wide">No active goals yet.</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-[#2d5a87] text-white font-black uppercase tracking-[0.1em] border-4 border-[#4a7ba8] hover:translate-x-1 hover:-translate-y-1 transition-transform inline-flex items-center gap-2"
                    style={{ boxShadow: '4px 4px 0 #0a1628' }}
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

            {/* Completed Goals - 8-bit style */}
            {(completedGoals.length > 0 || abandonedGoals.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="w-full flex items-center justify-between p-4 bg-[#0f2744] border-4 border-[#6b7280] hover:translate-x-1 hover:-translate-y-1 transition-transform"
                  style={{ boxShadow: '4px 4px 0 #1e3a5f' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#6b7280] border-2 border-[#9ca3af] flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-black uppercase tracking-[0.1em]">Past Goals</span>
                    <span className="text-sm text-slate-500 font-bold">
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

      {/* Bottom Nav - 8-bit style */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a1628] border-t-4 border-[#2d4a6f] z-30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            <button onClick={() => router.push('/play')} className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-[#7db4e0] transition-colors p-2">
              <Rocket className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-wide">Base</span>
            </button>
            <button onClick={() => router.push('/play/reflect')} className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-[#a0c4e8] transition-colors p-2">
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-wide">Log</span>
            </button>
            <button onClick={() => router.push('/play/coach')} className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-[#c0c0c0] transition-colors p-2">
              <MessageCircle className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-wide">Coach</span>
            </button>
            <button className="flex flex-col items-center gap-0.5 text-[#7db4e0] p-2 border-2 border-[#4a7ba8] bg-[#1e3a5f]">
              <Target className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-wide">Goals</span>
            </button>
            <button onClick={() => router.push('/play/progress')} className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-[#6ba3d6] transition-colors p-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-wide">Progress</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}
