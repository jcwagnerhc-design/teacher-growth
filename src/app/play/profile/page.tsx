'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Zap,
  Flame,
  Calendar,
  Award,
  Settings,
  Edit3,
  MessageCircle,
  Heart,
  BarChart3,
  Lightbulb,
  Trophy,
  Target,
  Sparkles,
  Star,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import PixelCharacter, { DEFAULT_CHARACTER } from '@/components/PixelCharacter'

const ARCHETYPE_CONFIG = {
  questioner: { icon: MessageCircle, color: 'from-violet-500 to-purple-600', name: 'Questioner' },
  'culture-builder': { icon: Heart, color: 'from-rose-500 to-pink-600', name: 'Culture Builder' },
  'data-detective': { icon: BarChart3, color: 'from-cyan-500 to-blue-600', name: 'Data Detective' },
  innovator: { icon: Lightbulb, color: 'from-amber-500 to-orange-600', name: 'Innovator' },
}

const LEVEL_TITLES = [
  { level: 1, title: 'Apprentice' },
  { level: 5, title: 'Journeyman' },
  { level: 10, title: 'Adept' },
  { level: 15, title: 'Expert' },
  { level: 20, title: 'Master' },
]

const BADGES = [
  { id: 'first-reflection', name: 'First Steps', description: 'Complete your first reflection', icon: Sparkles, earned: true },
  { id: 'week-streak', name: 'Week Warrior', description: '7-day reflection streak', icon: Flame, earned: true },
  { id: 'skill-3', name: 'Deep Diver', description: 'Reach level 3 in any skill', icon: Target, earned: true },
  { id: 'all-domains', name: 'Explorer', description: 'Reflect in all 6 domains', icon: Trophy, earned: false },
  { id: 'month-streak', name: 'Habit Formed', description: '30-day reflection streak', icon: Star, earned: false },
  { id: 'mentor', name: 'Mentor Ready', description: 'Reach level 5 in any skill', icon: Award, earned: false },
]

const mockStats = {
  totalReflections: 23,
  daysActive: 14,
  currentStreak: 7,
  longestStreak: 12,
  totalXp: 890,
  joinedDate: '2024-12-01',
}

const defaultProfile = {
  name: 'Teacher',
  archetype: 'questioner',
  character: DEFAULT_CHARACTER,
  mantra: 'listens more than lectures',
  focusAreas: ['questioning', 'engagement'],
  backstory: '',
  superpower: '',
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState(defaultProfile)

  useEffect(() => {
    const saved = localStorage.getItem('teacher-profile')
    if (saved) {
      const parsed = JSON.parse(saved)
      setProfile({
        ...defaultProfile,
        ...parsed,
        character: { ...DEFAULT_CHARACTER, ...parsed.character },
        backstory: parsed.backstory || '',
        superpower: parsed.superpower || '',
      })
    }
  }, [])

  const archetype = ARCHETYPE_CONFIG[profile.archetype as keyof typeof ARCHETYPE_CONFIG] || ARCHETYPE_CONFIG.questioner
  const level = Math.floor(mockStats.totalXp / 200) + 1
  const title = LEVEL_TITLES.findLast(t => level >= t.level)?.title || 'Apprentice'
  const xpProgress = (mockStats.totalXp % 200) / 200 * 100

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
          <h1 className="text-xl font-bold">Profile</h1>
          <button
            onClick={() => router.push('/play/settings')}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-6"
        >
          {/* Background decoration */}
          <div className={cn(
            'absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl bg-gradient-to-br',
            archetype.color
          )} />

          <div className="relative flex items-start gap-4">
            {/* Avatar */}
            <div className="relative">
              <PixelCharacter
                customization={profile.character}
                level={level}
                size="lg"
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <button
                  onClick={() => router.push('/play/settings')}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-amber-400 font-medium mb-1">
                {title} {archetype.name}
              </p>
              <p className="text-sm text-slate-400">Level {level}</p>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Progress to Level {level + 1}</span>
              <span className="text-amber-400 flex items-center gap-1">
                <Zap className="w-4 h-4" />
                {mockStats.totalXp % 200}/{200}
              </span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
              />
            </div>
          </div>

          {/* Mantra */}
          <div className="mt-6 p-4 bg-slate-800/50 rounded-xl">
            <p className="text-sm text-slate-400 mb-1">Growth Mantra</p>
            <p className="text-lg italic">
              &ldquo;I&apos;m becoming a teacher who {profile.mantra}&rdquo;
            </p>
          </div>

          {/* Superpower */}
          {profile.superpower && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-yellow-400" />
                <p className="text-sm text-yellow-400">Teaching Superpower</p>
              </div>
              <p className="text-white">{profile.superpower}</p>
            </div>
          )}

          {/* Backstory */}
          {profile.backstory && (
            <div className="mt-4 p-4 bg-slate-700/50 border border-slate-600 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <p className="text-sm text-slate-400">Your Story</p>
              </div>
              <p className="text-slate-300 italic text-sm">{profile.backstory}</p>
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
            <Zap className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{mockStats.totalXp}</p>
            <p className="text-xs text-slate-400">Total XP</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
            <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{mockStats.currentStreak}</p>
            <p className="text-xs text-slate-400">Day Streak</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
            <BookOpen className="w-6 h-6 text-violet-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{mockStats.totalReflections}</p>
            <p className="text-xs text-slate-400">Reflections</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
            <Calendar className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{mockStats.daysActive}</p>
            <p className="text-xs text-slate-400">Days Active</p>
          </div>
        </motion.div>

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Badges
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {BADGES.map((badge, i) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className={cn(
                  'p-4 rounded-xl border text-center',
                  badge.earned
                    ? 'bg-slate-900/50 border-slate-700'
                    : 'bg-slate-900/30 border-slate-800 opacity-50'
                )}
              >
                <badge.icon className={cn(
                  'w-8 h-8 mx-auto mb-2',
                  badge.earned ? 'text-amber-400' : 'text-slate-600'
                )} />
                <p className="text-sm font-medium">{badge.name}</p>
                <p className="text-xs text-slate-500 mt-1">{badge.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Journey Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-4"
        >
          <h3 className="font-semibold mb-4">Your Journey</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Joined</span>
              <span>December 1, 2024</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Longest streak</span>
              <span className="text-orange-400">{mockStats.longestStreak} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Path</span>
              <span className="text-violet-400">{archetype.name}</span>
            </div>
          </div>
        </motion.div>
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
            <button onClick={() => router.push('/play/quests')} className="flex flex-col items-center gap-1 text-slate-400">
              <Target className="w-6 h-6" />
              <span className="text-xs">Quests</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-white">
              <Trophy className="w-6 h-6" />
              <span className="text-xs">Profile</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}
