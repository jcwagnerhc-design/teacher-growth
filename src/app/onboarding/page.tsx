'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  ChevronLeft,
  BookOpen,
  MessageSquare,
  Target,
  FolderOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import CharacterCreator, { DEFAULT_CHARACTER } from '@/components/CharacterCreator'
import PixelCharacter, { CharacterCustomization } from '@/components/PixelCharacter'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [character, setCharacter] = useState<CharacterCustomization>(DEFAULT_CHARACTER)
  const [teachingContext, setTeachingContext] = useState('')

  const totalSteps = 4 // welcome, character, context, tour

  const canProceed = () => {
    switch (step) {
      case 0: return name.length >= 2
      case 1: return true // Character is always valid
      case 2: return true // Context is optional
      default: return true
    }
  }

  const handleComplete = () => {
    localStorage.setItem('teacher-profile', JSON.stringify({
      name,
      character,
      teachingContext,
      createdAt: new Date().toISOString(),
    }))
    router.push('/play')
  }

  const advance = useCallback(() => {
    if (canProceed()) {
      if (step < 3) {
        setStep(s => s + 1)
      } else {
        handleComplete()
      }
    }
  }, [step, canProceed, handleComplete])

  // Handle Enter key to advance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [advance])

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800 z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
          initial={{ width: '0%' }}
          animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {/* Step 0: Welcome & Name */}
            {step === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <motion.div
                  className="text-6xl mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  👋
                </motion.div>
                <h1 className="text-4xl font-bold mb-4">Hey there!</h1>
                <p className="text-slate-400 text-lg mb-8">
                  Welcome to your teaching reflection space.
                  <br />What&apos;s your name?
                </p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your first name"
                  className="w-full max-w-xs mx-auto block text-center text-2xl bg-transparent border-b-2 border-slate-700 focus:border-emerald-500 outline-none py-3 placeholder:text-slate-600 transition-colors"
                  autoFocus
                />
              </motion.div>
            )}

            {/* Step 1: Character Creator */}
            {step === 1 && (
              <motion.div
                key="character"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-bold mb-2">Nice to meet you, {name}!</h1>
                  <p className="text-slate-400">
                    Let&apos;s create your classroom avatar.
                  </p>
                </div>
                <CharacterCreator value={character} onChange={setCharacter} level={1} />
              </motion.div>
            )}

            {/* Step 2: Teaching Context (optional) */}
            {step === 2 && (
              <motion.div
                key="context"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <motion.div
                  className="mb-6 flex justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring' }}
                >
                  <PixelCharacter customization={character} size="lg" />
                </motion.div>
                <h1 className="text-3xl font-bold mb-2">Looking good!</h1>
                <p className="text-slate-400 mb-6">
                  Tell us a bit about your teaching context.
                  <br />
                  <span className="text-slate-500 text-sm">(This helps personalize your coaching - skip if you want)</span>
                </p>
                <input
                  type="text"
                  value={teachingContext}
                  onChange={(e) => setTeachingContext(e.target.value)}
                  placeholder="e.g., 9th grade English, 3rd grade math..."
                  className="w-full max-w-md mx-auto block text-center text-lg bg-slate-900/50 border-2 border-slate-800 focus:border-emerald-500 rounded-xl outline-none py-3 px-4 placeholder:text-slate-600 transition-colors"
                  autoFocus
                />
              </motion.div>
            )}

            {/* Step 3: Tour / What's here */}
            {step === 3 && (
              <motion.div
                key="tour"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2">Your Classroom</h1>
                  <p className="text-slate-400">
                    Here&apos;s what you&apos;ll find when you walk around.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-900/50 border border-slate-800 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-[#6B5B95] flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold">Journal</span>
                    </div>
                    <p className="text-slate-400 text-sm">
                      Capture daily reflections about your teaching practice.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-900/50 border border-slate-800 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-[#4A7C59] flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold">DOTL&apos;s Red Couch</span>
                    </div>
                    <p className="text-slate-400 text-sm">
                      Chat with your AI coach about teaching challenges.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-slate-900/50 border border-slate-800 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-[#DAA520] flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold">Lab</span>
                    </div>
                    <p className="text-slate-400 text-sm">
                      Try experiments to bridge reflection to action.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-slate-900/50 border border-slate-800 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-[#708090] flex items-center justify-center">
                        <FolderOpen className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold">Records</span>
                    </div>
                    <p className="text-slate-400 text-sm">
                      See patterns in your reflections over time.
                    </p>
                  </motion.div>
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-center text-slate-500 text-sm mt-8"
                >
                  Use arrow keys or WASD to walk around. Step through doors to enter rooms.
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-6 flex justify-between items-center max-w-2xl mx-auto w-full">
        <button
          onClick={() => setStep(s => s - 1)}
          className={cn(
            'flex items-center gap-2 text-slate-400 hover:text-white transition-colors',
            step === 0 && 'invisible'
          )}
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        <button
          onClick={advance}
          disabled={!canProceed()}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all',
            canProceed()
              ? 'bg-white text-slate-900 hover:bg-slate-100'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          )}
        >
          {step === 3 ? "Let's go!" : 'Continue'}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
