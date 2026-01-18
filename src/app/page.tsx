'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, Flame, Target, Map, ChevronRight } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  // Check if user has already onboarded
  useEffect(() => {
    const profile = localStorage.getItem('teacher-profile')
    if (profile) {
      router.push('/play')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <span className="font-semibold text-lg">Teacher Growth</span>
          </div>
          <Link
            href="/onboarding"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Forge your
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                teaching identity
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-slate-400 mb-10 leading-relaxed"
          >
            A reflective practice game for early-career teachers.
            <br />
            Build habits. Level up skills. Become who you want to be.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-500 to-amber-500 font-semibold text-lg hover:opacity-90 transition-opacity"
            >
              Begin Your Journey
              <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16"
          >
            <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 text-left">
              <Flame className="w-8 h-8 text-orange-400 mb-3" />
              <h3 className="font-semibold mb-2">Daily Rituals</h3>
              <p className="text-sm text-slate-400">
                One minute of reflection. Build a habit of noticing your practice.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 text-left">
              <Map className="w-8 h-8 text-violet-400 mb-3" />
              <h3 className="font-semibold mb-2">Skill Tree</h3>
              <p className="text-sm text-slate-400">
                Watch yourself grow. Unlock skills. Choose your own path.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 text-left">
              <Target className="w-8 h-8 text-cyan-400 mb-3" />
              <h3 className="font-semibold mb-2">Your Goals</h3>
              <p className="text-sm text-slate-400">
                Set your own focus. Complete quests that matter to you.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-sm text-slate-500">
        Built for teachers who want to get better.
        <br />
        No surveillance. No evaluations. Just growth.
      </footer>
    </div>
  )
}
