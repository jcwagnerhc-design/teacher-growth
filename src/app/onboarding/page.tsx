'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  MessageCircle,
  BarChart3,
  Heart,
  Lightbulb,
  Flame,
  ChevronRight,
  ChevronLeft,
  Star,
  User,
  Target,
  BookOpen,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import CharacterCreator, { DEFAULT_CHARACTER } from '@/components/CharacterCreator'
import PixelCharacter, { CharacterCustomization } from '@/components/PixelCharacter'

const ARCHETYPES = [
  {
    id: 'questioner',
    name: 'The Questioner',
    icon: MessageCircle,
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    description: 'You believe the right question unlocks everything.',
    strengths: ['Socratic dialogue', 'Student thinking', 'Wait time'],
    mantraHint: 'asks questions that make students think deeply',
  },
  {
    id: 'culture-builder',
    name: 'The Culture Builder',
    icon: Heart,
    color: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    description: 'You know learning starts with belonging.',
    strengths: ['Relationships', 'Community', 'Emotional safety'],
    mantraHint: 'makes every student feel like they belong',
  },
  {
    id: 'data-detective',
    name: 'The Data Detective',
    icon: BarChart3,
    color: 'from-cyan-500 to-blue-600',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    description: 'You see the story in every assessment.',
    strengths: ['Formative assessment', 'Responsive teaching', 'Patterns'],
    mantraHint: 'uses data to meet every student where they are',
  },
  {
    id: 'innovator',
    name: 'The Innovator',
    icon: Lightbulb,
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    description: 'You experiment, iterate, and evolve.',
    strengths: ['Trying new things', 'Reflection', 'Growth mindset'],
    mantraHint: 'treats every lesson as a chance to learn and grow',
  },
]

const FOCUS_AREAS = [
  { id: 'engagement', name: 'Student Engagement', description: 'Getting every student actively thinking' },
  { id: 'questioning', name: 'Questioning & Discussion', description: 'Facilitating deeper conversations' },
  { id: 'assessment', name: 'Formative Assessment', description: 'Knowing what students know in real-time' },
  { id: 'differentiation', name: 'Differentiation', description: 'Meeting students where they are' },
  { id: 'culture', name: 'Classroom Culture', description: 'Building belonging and safety' },
  { id: 'planning', name: 'Lesson Design', description: 'Crafting intentional learning experiences' },
]

const SKILL_DOMAINS = [
  { id: 'questioning', name: 'Questioning', icon: MessageCircle, color: 'from-violet-500 to-purple-600' },
  { id: 'engagement', name: 'Engagement', icon: Sparkles, color: 'from-amber-500 to-orange-600' },
  { id: 'culture', name: 'Culture', icon: Heart, color: 'from-rose-500 to-pink-600' },
  { id: 'assessment', name: 'Assessment', icon: BarChart3, color: 'from-cyan-500 to-blue-600' },
  { id: 'differentiation', name: 'Differentiation', icon: Target, color: 'from-emerald-500 to-teal-600' },
  { id: 'clarity', name: 'Clarity', icon: Lightbulb, color: 'from-indigo-500 to-violet-600' },
]

const SKILL_LEVELS = [
  { value: 1, label: 'Just Starting', description: 'New to this skill' },
  { value: 2, label: 'Developing', description: 'Building my practice' },
  { value: 3, label: 'Comfortable', description: 'Feel solid here' },
  { value: 4, label: 'Strong', description: 'One of my strengths' },
]

const SUPERPOWER_OPTIONS = [
  "I can explain anything with a metaphor",
  "I bring energy to even the driest topic",
  "My patience knows no bounds",
  "I can connect with any student",
  "I thrive in organized chaos",
  "I ignite curiosity in others",
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [character, setCharacter] = useState<CharacterCustomization>(DEFAULT_CHARACTER)
  const [archetype, setArchetype] = useState<string | null>(null)
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [skillAssessment, setSkillAssessment] = useState<Record<string, number>>({})
  const [backstory, setBackstory] = useState('')
  const [superpower, setSuperpower] = useState('')
  const [customSuperpower, setCustomSuperpower] = useState('')
  const [mantra, setMantra] = useState('')

  const selectedArchetype = ARCHETYPES.find(a => a.id === archetype)
  const totalSteps = 9 // name, character, archetype, focus, skills, backstory, superpower, mantra, summary

  const toggleFocus = (id: string) => {
    setFocusAreas(prev =>
      prev.includes(id)
        ? prev.filter(f => f !== id)
        : prev.length < 3 ? [...prev, id] : prev
    )
  }

  const setSkillLevel = (skillId: string, level: number) => {
    setSkillAssessment(prev => ({ ...prev, [skillId]: level }))
  }

  const canProceed = () => {
    switch (step) {
      case 0: return name.length >= 2
      case 1: return true // Character is always valid
      case 2: return archetype !== null
      case 3: return focusAreas.length >= 1
      case 4: return Object.keys(skillAssessment).length >= 3 // At least 3 skills assessed
      case 5: return backstory.length >= 20 // Min 20 characters for backstory
      case 6: return superpower !== '' || customSuperpower.length >= 10 // Must select or write superpower
      case 7: return mantra.length >= 10
      default: return true
    }
  }

  const getEffectiveSuperpower = () => {
    return superpower === 'custom' ? customSuperpower : superpower
  }

  const handleComplete = () => {
    localStorage.setItem('teacher-profile', JSON.stringify({
      name,
      character,
      archetype,
      focusAreas,
      skillAssessment,
      backstory,
      superpower: getEffectiveSuperpower(),
      mantra,
      createdAt: new Date().toISOString(),
    }))
    router.push('/play')
  }

  const advance = useCallback(() => {
    if (canProceed()) {
      if (step < 8) {
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
        // Don't trigger on textarea (backstory, mantra steps) unless Cmd/Ctrl+Enter
        if ((step === 5 || step === 7) && !(e.metaKey || e.ctrlKey)) {
          return
        }
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [advance, step])

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800 z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-500 to-amber-500"
          initial={{ width: '0%' }}
          animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {/* Step 0: Name */}
            {step === 0 && (
              <motion.div
                key="name"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-6" />
                <h1 className="text-4xl font-bold mb-4">Welcome, Teacher</h1>
                <p className="text-slate-400 text-lg mb-8">
                  You&apos;re about to begin a journey of intentional growth.
                  <br />First, what should we call you?
                </p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your first name"
                  className="w-full max-w-xs mx-auto block text-center text-2xl bg-transparent border-b-2 border-slate-700 focus:border-amber-500 outline-none py-3 placeholder:text-slate-600 transition-colors"
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
                  <User className="w-12 h-12 text-violet-400 mx-auto mb-4" />
                  <h1 className="text-3xl font-bold mb-2">Create Your Character</h1>
                  <p className="text-slate-400">
                    Design your avatar. It will grow with you as you level up!
                  </p>
                </div>
                <CharacterCreator value={character} onChange={setCharacter} level={1} />
              </motion.div>
            )}

            {/* Step 2: Archetype */}
            {step === 2 && (
              <motion.div
                key="archetype"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h1 className="text-3xl font-bold mb-2 text-center">Choose Your Path</h1>
                <p className="text-slate-400 text-center mb-8">
                  Every great teacher has a core strength. What&apos;s yours?
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ARCHETYPES.map((arch) => (
                    <button
                      key={arch.id}
                      onClick={() => setArchetype(arch.id)}
                      className={cn(
                        'p-5 rounded-xl border-2 text-left transition-all',
                        archetype === arch.id
                          ? `${arch.bgColor} ${arch.borderColor} border-opacity-100`
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      )}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br',
                          arch.color
                        )}>
                          <arch.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-lg">{arch.name}</span>
                      </div>
                      <p className="text-slate-400 text-sm mb-3">{arch.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {arch.strengths.map(s => (
                          <span key={s} className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-300">
                            {s}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Focus Areas */}
            {step === 3 && (
              <motion.div
                key="focus"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h1 className="text-3xl font-bold mb-2 text-center">Set Your Focus</h1>
                <p className="text-slate-400 text-center mb-8">
                  Choose 1-3 areas you want to grow in right now.
                  <br />
                  <span className="text-slate-500">You can change these anytime.</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {FOCUS_AREAS.map((area) => (
                    <button
                      key={area.id}
                      onClick={() => toggleFocus(area.id)}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        focusAreas.includes(area.id)
                          ? 'bg-amber-500/10 border-amber-500/50'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{area.name}</span>
                        {focusAreas.includes(area.id) && (
                          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                        )}
                      </div>
                      <p className="text-slate-400 text-sm mt-1">{area.description}</p>
                    </button>
                  ))}
                </div>
                <p className="text-center text-slate-500 text-sm mt-4">
                  {focusAreas.length}/3 selected
                </p>
              </motion.div>
            )}

            {/* Step 4: Skill Self-Assessment */}
            {step === 4 && (
              <motion.div
                key="skills"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-6">
                  <Target className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                  <h1 className="text-3xl font-bold mb-2">Self-Assessment</h1>
                  <p className="text-slate-400">
                    Where are you now? Rate yourself honestly - this is just your starting point.
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    Rate at least 3 skills to continue
                  </p>
                </div>

                <div className="space-y-4">
                  {SKILL_DOMAINS.map((skill) => {
                    const currentLevel = skillAssessment[skill.id]
                    return (
                      <div
                        key={skill.id}
                        className="bg-slate-900/50 border border-slate-800 rounded-xl p-4"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br',
                            skill.color
                          )}>
                            <skill.icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-medium">{skill.name}</span>
                          {currentLevel && (
                            <span className="ml-auto text-sm text-amber-400">
                              {SKILL_LEVELS.find(l => l.value === currentLevel)?.label}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {SKILL_LEVELS.map((level) => (
                            <button
                              key={level.value}
                              onClick={() => setSkillLevel(skill.id, level.value)}
                              className={cn(
                                'py-2 px-1 rounded-lg text-xs transition-all text-center',
                                currentLevel === level.value
                                  ? 'bg-amber-500 text-slate-950 font-medium'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                              )}
                            >
                              {level.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <p className="text-center text-slate-500 text-sm mt-4">
                  {Object.keys(skillAssessment).length}/6 assessed
                </p>
              </motion.div>
            )}

            {/* Step 5: Backstory */}
            {step === 5 && (
              <motion.div
                key="backstory"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-6" />
                <h1 className="text-3xl font-bold mb-2">Your Teaching Story</h1>
                <p className="text-slate-400 mb-6">
                  What brought you to teaching?
                </p>

                <textarea
                  value={backstory}
                  onChange={(e) => setBackstory(e.target.value.slice(0, 500))}
                  placeholder="Share your journey into education..."
                  className="w-full max-w-md mx-auto block text-lg bg-slate-900/50 border-2 border-slate-800 focus:border-amber-500 rounded-xl outline-none p-4 placeholder:text-slate-600 transition-colors resize-none"
                  rows={5}
                  autoFocus
                />
                <p className="text-slate-500 text-sm mt-3">
                  {backstory.length}/500 characters (min 20)
                </p>
                <p className="text-slate-600 text-xs mt-2">
                  Press Cmd+Enter to continue
                </p>
              </motion.div>
            )}

            {/* Step 6: Superpower */}
            {step === 6 && (
              <motion.div
                key="superpower"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-6">
                  <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h1 className="text-3xl font-bold mb-2">Your Teaching Superpower</h1>
                  <p className="text-slate-400">
                    What makes you uniquely powerful as a teacher?
                  </p>
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  {SUPERPOWER_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSuperpower(option)
                        setCustomSuperpower('')
                      }}
                      className={cn(
                        'w-full p-4 rounded-xl border-2 text-left transition-all',
                        superpower === option
                          ? 'bg-yellow-500/10 border-yellow-500/50'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      )}
                    >
                      <span className="font-medium">{option}</span>
                    </button>
                  ))}

                  {/* Custom option */}
                  <button
                    onClick={() => setSuperpower('custom')}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 text-left transition-all',
                      superpower === 'custom'
                        ? 'bg-yellow-500/10 border-yellow-500/50'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    )}
                  >
                    <span className="font-medium">Write your own...</span>
                  </button>

                  {superpower === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <input
                        type="text"
                        value={customSuperpower}
                        onChange={(e) => setCustomSuperpower(e.target.value)}
                        placeholder="My superpower is..."
                        className="w-full mt-2 bg-slate-800 border-2 border-slate-700 focus:border-yellow-500 rounded-xl px-4 py-3 outline-none transition-colors"
                        autoFocus
                      />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 7: Mantra */}
            {step === 7 && (
              <motion.div
                key="mantra"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <Flame className="w-12 h-12 text-orange-400 mx-auto mb-6" />
                <h1 className="text-3xl font-bold mb-2">Your Growth Mantra</h1>
                <p className="text-slate-400 mb-2">
                  Complete this sentence:
                </p>
                <p className="text-xl text-slate-300 mb-6">
                  &ldquo;I&apos;m becoming a teacher who...&rdquo;
                </p>

                {selectedArchetype && (
                  <p className="text-sm text-slate-500 mb-4">
                    Example for {selectedArchetype.name}s: <span className="text-slate-400 italic">&ldquo;...{selectedArchetype.mantraHint}&rdquo;</span>
                  </p>
                )}

                <textarea
                  value={mantra}
                  onChange={(e) => setMantra(e.target.value)}
                  placeholder="...listens more than lectures"
                  className="w-full max-w-md mx-auto block text-lg bg-slate-900/50 border-2 border-slate-800 focus:border-amber-500 rounded-xl outline-none p-4 placeholder:text-slate-600 transition-colors resize-none"
                  rows={3}
                  autoFocus
                />
                <p className="text-slate-500 text-sm mt-3">
                  This is your north star. Make it meaningful to you.
                </p>
                <p className="text-slate-600 text-xs mt-2">
                  Press Cmd+Enter to continue
                </p>
              </motion.div>
            )}

            {/* Step 8: Summary */}
            {step === 8 && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="mb-6 flex justify-center"
                >
                  <PixelCharacter customization={character} level={1} size="xl" />
                </motion.div>

                <h1 className="text-3xl font-bold mb-2">{name} the {selectedArchetype?.name?.replace('The ', '')}</h1>
                <p className="text-amber-400 text-lg mb-6">Level 1 Apprentice</p>

                <div className="bg-slate-900/50 rounded-xl p-6 max-w-md mx-auto mb-4 text-left">
                  <p className="text-slate-400 text-sm mb-1">Growth Mantra</p>
                  <p className="text-lg italic">&ldquo;I&apos;m becoming a teacher who {mantra}&rdquo;</p>
                </div>

                {/* Superpower */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 max-w-md mx-auto mb-4 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <p className="text-yellow-400 text-sm">Teaching Superpower</p>
                  </div>
                  <p className="text-white">{getEffectiveSuperpower()}</p>
                </div>

                {/* Backstory */}
                {backstory && (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 max-w-md mx-auto mb-4 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      <p className="text-slate-400 text-sm">Your Story</p>
                    </div>
                    <p className="text-slate-300 italic text-sm">{backstory}</p>
                  </div>
                )}

                {/* Skill Assessment Summary */}
                <div className="bg-slate-900/50 rounded-xl p-4 max-w-md mx-auto mb-4">
                  <p className="text-slate-400 text-sm mb-3 text-left">Starting Skills</p>
                  <div className="grid grid-cols-2 gap-2 text-left">
                    {Object.entries(skillAssessment).map(([skillId, level]) => {
                      const skill = SKILL_DOMAINS.find(s => s.id === skillId)
                      const levelInfo = SKILL_LEVELS.find(l => l.value === level)
                      if (!skill) return null
                      return (
                        <div key={skillId} className="flex items-center gap-2 text-sm">
                          <skill.icon className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-300">{skill.name}:</span>
                          <span className="text-amber-400">{levelInfo?.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {focusAreas.map(id => {
                    const area = FOCUS_AREAS.find(f => f.id === id)
                    return (
                      <span key={id} className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm">
                        {area?.name}
                      </span>
                    )
                  })}
                </div>

                <p className="text-slate-400 mb-8">
                  Your journey begins now. Every day, you&apos;ll reflect on your practice,
                  <br />earn XP, and grow into the teacher you want to be.
                </p>

                <button
                  onClick={handleComplete}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-500 to-amber-500 font-semibold text-lg hover:opacity-90 transition-opacity"
                >
                  Begin Your Journey
                </button>
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

        {step < 8 && (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all',
              canProceed()
                ? 'bg-white text-slate-900 hover:bg-slate-100'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            )}
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}
