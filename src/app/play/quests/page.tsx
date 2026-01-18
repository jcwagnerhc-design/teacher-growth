'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Scroll,
  Zap,
  CheckCircle2,
  Clock,
  Star,
  Sparkles,
  Target,
  BookOpen,
  Trophy,
  Lock,
  Flame,
  Calendar,
  MessageCircle,
  Heart,
  BarChart3,
  Lightbulb,
  Map,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type QuestStatus = 'active' | 'completed' | 'locked'
type QuestType = 'daily' | 'weekly' | 'journey'

interface Quest {
  id: string
  title: string
  description: string
  type: QuestType
  status: QuestStatus
  xpReward: number
  progress: number
  total: number
  icon: typeof Scroll
  color: string
  archetype?: string // Which archetype this quest belongs to
}

// Base quests everyone gets
const UNIVERSAL_QUESTS: Quest[] = [
  {
    id: 'daily-reflect',
    title: 'Daily Reflection',
    description: 'Complete today\'s reflection ritual',
    type: 'daily',
    status: 'active',
    xpReward: 25,
    progress: 0,
    total: 1,
    icon: BookOpen,
    color: 'from-violet-500 to-purple-600',
  },
]

// Archetype-specific starter quests
const ARCHETYPE_QUESTS: Record<string, Quest[]> = {
  questioner: [
    {
      id: 'questioner-1',
      title: 'First Question',
      description: 'Reflect on a moment when you asked a thought-provoking question',
      type: 'journey',
      status: 'active',
      xpReward: 30,
      progress: 0,
      total: 1,
      icon: MessageCircle,
      color: 'from-violet-500 to-purple-600',
      archetype: 'questioner',
    },
    {
      id: 'questioner-2',
      title: 'Wait Time Warrior',
      description: 'Practice waiting 3+ seconds after asking a question (3 times)',
      type: 'weekly',
      status: 'active',
      xpReward: 50,
      progress: 0,
      total: 3,
      icon: Clock,
      color: 'from-violet-500 to-purple-600',
      archetype: 'questioner',
    },
    {
      id: 'questioner-3',
      title: 'Open-Ended Explorer',
      description: 'Ask questions that can\'t be answered with yes/no (5 reflections)',
      type: 'journey',
      status: 'locked',
      xpReward: 75,
      progress: 0,
      total: 5,
      icon: Sparkles,
      color: 'from-violet-500 to-purple-600',
      archetype: 'questioner',
    },
  ],
  'culture-builder': [
    {
      id: 'culture-1',
      title: 'Connection Moment',
      description: 'Reflect on a moment when you built a relationship with a student',
      type: 'journey',
      status: 'active',
      xpReward: 30,
      progress: 0,
      total: 1,
      icon: Heart,
      color: 'from-rose-500 to-pink-600',
      archetype: 'culture-builder',
    },
    {
      id: 'culture-2',
      title: 'Safe Space',
      description: 'Notice and celebrate a student taking a risk (3 times)',
      type: 'weekly',
      status: 'active',
      xpReward: 50,
      progress: 0,
      total: 3,
      icon: Star,
      color: 'from-rose-500 to-pink-600',
      archetype: 'culture-builder',
    },
    {
      id: 'culture-3',
      title: 'Belonging Builder',
      description: 'Create moments of belonging for different students (5 reflections)',
      type: 'journey',
      status: 'locked',
      xpReward: 75,
      progress: 0,
      total: 5,
      icon: Sparkles,
      color: 'from-rose-500 to-pink-600',
      archetype: 'culture-builder',
    },
  ],
  'data-detective': [
    {
      id: 'data-1',
      title: 'Check for Understanding',
      description: 'Reflect on using a formative assessment strategy',
      type: 'journey',
      status: 'active',
      xpReward: 30,
      progress: 0,
      total: 1,
      icon: BarChart3,
      color: 'from-cyan-500 to-blue-600',
      archetype: 'data-detective',
    },
    {
      id: 'data-2',
      title: 'Responsive Teaching',
      description: 'Adjust your teaching based on student data (3 times)',
      type: 'weekly',
      status: 'active',
      xpReward: 50,
      progress: 0,
      total: 3,
      icon: Target,
      color: 'from-cyan-500 to-blue-600',
      archetype: 'data-detective',
    },
    {
      id: 'data-3',
      title: 'Pattern Finder',
      description: 'Identify and act on patterns in student understanding (5 reflections)',
      type: 'journey',
      status: 'locked',
      xpReward: 75,
      progress: 0,
      total: 5,
      icon: Sparkles,
      color: 'from-cyan-500 to-blue-600',
      archetype: 'data-detective',
    },
  ],
  innovator: [
    {
      id: 'innovator-1',
      title: 'Try Something New',
      description: 'Reflect on experimenting with a new teaching strategy',
      type: 'journey',
      status: 'active',
      xpReward: 30,
      progress: 0,
      total: 1,
      icon: Lightbulb,
      color: 'from-amber-500 to-orange-600',
      archetype: 'innovator',
    },
    {
      id: 'innovator-2',
      title: 'Iteration Station',
      description: 'Improve on something you tried based on how it went (3 times)',
      type: 'weekly',
      status: 'active',
      xpReward: 50,
      progress: 0,
      total: 3,
      icon: Flame,
      color: 'from-amber-500 to-orange-600',
      archetype: 'innovator',
    },
    {
      id: 'innovator-3',
      title: 'Growth Mindset Master',
      description: 'Learn from lessons that didn\'t go as planned (5 reflections)',
      type: 'journey',
      status: 'locked',
      xpReward: 75,
      progress: 0,
      total: 5,
      icon: Sparkles,
      color: 'from-amber-500 to-orange-600',
      archetype: 'innovator',
    },
  ],
}

// Milestone quests (unlocked after completing archetype quests)
const MILESTONE_QUESTS: Quest[] = [
  {
    id: 'milestone-streak-3',
    title: 'Getting Started',
    description: 'Complete reflections 3 days in a row',
    type: 'journey',
    status: 'locked',
    xpReward: 50,
    progress: 0,
    total: 3,
    icon: Flame,
    color: 'from-orange-500 to-red-600',
  },
  {
    id: 'milestone-expand',
    title: 'Expanding Horizons',
    description: 'Unlock after completing your first journey quest',
    type: 'journey',
    status: 'locked',
    xpReward: 100,
    progress: 0,
    total: 1,
    icon: Map,
    color: 'from-emerald-500 to-teal-600',
  },
]

const QUEST_TYPE_CONFIG = {
  daily: { label: 'Daily', icon: Clock, color: 'text-amber-400' },
  weekly: { label: 'Weekly', icon: Calendar, color: 'text-cyan-400' },
  journey: { label: 'Journey', icon: Star, color: 'text-violet-400' },
}

const ARCHETYPE_NAMES: Record<string, string> = {
  questioner: 'Questioner',
  'culture-builder': 'Culture Builder',
  'data-detective': 'Data Detective',
  innovator: 'Innovator',
}

export default function QuestsPage() {
  const router = useRouter()
  const [archetype, setArchetype] = useState<string>('questioner')
  const [filter, setFilter] = useState<'all' | 'active' | 'journey'>('all')

  useEffect(() => {
    const saved = localStorage.getItem('teacher-profile')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.archetype) {
        setArchetype(parsed.archetype)
      }
    }
  }, [])

  // Get quests based on user's archetype
  const archetypeQuests = ARCHETYPE_QUESTS[archetype] || ARCHETYPE_QUESTS.questioner
  const allQuests = [...UNIVERSAL_QUESTS, ...archetypeQuests, ...MILESTONE_QUESTS]

  const filteredQuests = filter === 'all'
    ? allQuests
    : filter === 'active'
    ? allQuests.filter(q => q.status === 'active')
    : allQuests.filter(q => q.type === 'journey')

  const activeQuests = filteredQuests.filter(q => q.status === 'active')
  const lockedQuests = filteredQuests.filter(q => q.status === 'locked')

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
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
            <Scroll className="w-6 h-6 text-amber-400" />
            Quests
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Path indicator */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-400 mb-1">Your Path</p>
          <p className="font-semibold text-lg">{ARCHETYPE_NAMES[archetype]} Journey</p>
          <p className="text-sm text-slate-500 mt-1">
            Complete your path quests to unlock new skill areas
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'active', 'journey'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                filter === type
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              )}
            >
              {type === 'all' ? 'All Quests' : type === 'active' ? 'Active' : 'Journey'}
            </button>
          ))}
        </div>

        {/* Active Quests */}
        {activeQuests.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Active Quests
            </h2>
            <div className="space-y-3">
              {activeQuests.map((quest, i) => (
                <QuestCard key={quest.id} quest={quest} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* Locked Quests */}
        {lockedQuests.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-slate-500">
              <Lock className="w-5 h-5" />
              Coming Up
            </h2>
            <div className="space-y-3">
              {lockedQuests.map((quest, i) => (
                <QuestCard key={quest.id} quest={quest} index={i} />
              ))}
            </div>
          </section>
        )}

        {filteredQuests.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Scroll className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No quests found</p>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-lg border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <button onClick={() => router.push('/play')} className="flex flex-col items-center gap-1 text-slate-400">
              <Sparkles className="w-6 h-6" />
              <span className="text-xs">Classroom</span>
            </button>
            <button onClick={() => router.push('/play/reflect')} className="flex flex-col items-center gap-1 text-slate-400">
              <BookOpen className="w-6 h-6" />
              <span className="text-xs">Reflect</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-white">
              <Scroll className="w-6 h-6" />
              <span className="text-xs">Quests</span>
            </button>
            <button onClick={() => router.push('/play/profile')} className="flex flex-col items-center gap-1 text-slate-400">
              <Trophy className="w-6 h-6" />
              <span className="text-xs">Profile</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}

function QuestCard({ quest, index }: { quest: Quest; index: number }) {
  const typeConfig = QUEST_TYPE_CONFIG[quest.type]
  const TypeIcon = typeConfig.icon
  const QuestIcon = quest.icon
  const progressPercent = (quest.progress / quest.total) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'relative overflow-hidden rounded-xl border p-4',
        quest.status === 'completed'
          ? 'bg-emerald-950/30 border-emerald-800/50'
          : quest.status === 'locked'
          ? 'bg-slate-900/30 border-slate-800/50 opacity-60'
          : 'bg-slate-900/50 border-slate-800'
      )}
    >
      {/* Background glow for active quests */}
      {quest.status === 'active' && (
        <div className={cn(
          'absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl bg-gradient-to-br',
          quest.color
        )} />
      )}

      <div className="relative flex gap-4">
        {/* Quest Icon */}
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
          quest.status === 'completed'
            ? 'bg-emerald-500/20'
            : quest.status === 'locked'
            ? 'bg-slate-700/50'
            : `bg-gradient-to-br ${quest.color}`
        )}>
          {quest.status === 'locked' ? (
            <Lock className="w-6 h-6 text-slate-500" />
          ) : quest.status === 'completed' ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          ) : (
            <QuestIcon className="w-6 h-6 text-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Quest Type Badge */}
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('flex items-center gap-1 text-xs', typeConfig.color)}>
              <TypeIcon className="w-3 h-3" />
              {typeConfig.label}
            </span>
          </div>

          {/* Title & Description */}
          <h3 className="font-semibold">{quest.title}</h3>
          <p className="text-sm text-slate-400 mt-0.5">{quest.description}</p>

          {/* Progress Bar */}
          {quest.status !== 'locked' && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">
                  {quest.progress}/{quest.total}
                </span>
                <span className="text-amber-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  +{quest.xpReward} XP
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className={cn(
                    'h-full rounded-full',
                    quest.status === 'completed'
                      ? 'bg-emerald-500'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  )}
                />
              </div>
            </div>
          )}

          {/* Locked message */}
          {quest.status === 'locked' && (
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Complete earlier quests to unlock
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
