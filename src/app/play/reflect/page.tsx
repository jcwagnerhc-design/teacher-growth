'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Zap,
  X,
  Check,
  Rocket,
  ClipboardList,
  Presentation,
  BarChart3,
  Heart,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MOMENT_PROMPTS = [
  "A student said something that surprised you",
  "You tried something new (even if it flopped)",
  "A question sparked real thinking",
  "You connected with a student",
  "You noticed who was struggling",
  "Students talked to each other",
  "You held back and let students wrestle",
  "Something didn't go as planned",
]

// Domain-based tags that match the classroom exactly
const DOMAIN_TAGS = [
  {
    id: 'planning',
    name: 'Planning & Prep',
    description: 'Lesson design, objectives, materials',
    icon: ClipboardList,
    color: 'bg-emerald-500',
    borderColor: 'border-emerald-400',
    textColor: 'text-emerald-400',
    glowColor: 'shadow-emerald-500/50',
  },
  {
    id: 'environment',
    name: 'Classroom Culture',
    description: 'Relationships, community, belonging',
    icon: Heart,
    color: 'bg-rose-500',
    borderColor: 'border-rose-400',
    textColor: 'text-rose-400',
    glowColor: 'shadow-rose-500/50',
  },
  {
    id: 'instruction',
    name: 'Instruction',
    description: 'Teaching, questioning, engagement',
    icon: Presentation,
    color: 'bg-violet-500',
    borderColor: 'border-violet-400',
    textColor: 'text-violet-400',
    glowColor: 'shadow-violet-500/50',
  },
  {
    id: 'assessment',
    name: 'Assessment',
    description: 'Feedback, data, checking understanding',
    icon: BarChart3,
    color: 'bg-cyan-500',
    borderColor: 'border-cyan-400',
    textColor: 'text-cyan-400',
    glowColor: 'shadow-cyan-500/50',
  },
]

const FOLLOW_UP_QUESTIONS = [
  "What made this moment stand out?",
  "What will you try differently next time?",
  "What does this tell you about your students?",
  "How did this connect to your growth goals?",
]

// Floating stars component for space theme
const FloatingStars = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    {[...Array(40)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-white"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: Math.random() > 0.8 ? '3px' : Math.random() > 0.5 ? '2px' : '1px',
          height: Math.random() > 0.8 ? '3px' : Math.random() > 0.5 ? '2px' : '1px',
        }}
        animate={{
          opacity: [0.2, 1, 0.2],
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: 2 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ))}
  </div>
)

export default function ReflectPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [moment, setMoment] = useState('')
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [followUp, setFollowUp] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [growthByDomain, setGrowthByDomain] = useState<Record<string, number>>({})
  const [randomPrompt] = useState(() => MOMENT_PROMPTS[Math.floor(Math.random() * MOMENT_PROMPTS.length)])
  const [randomFollowUp] = useState(() => FOLLOW_UP_QUESTIONS[Math.floor(Math.random() * FOLLOW_UP_QUESTIONS.length)])

  const toggleDomain = (id: string) => {
    setSelectedDomains(prev =>
      prev.includes(id)
        ? prev.filter(t => t !== id)
        : [...prev, id]
    )
  }

  const calculateGrowth = () => {
    const growth: Record<string, number> = {}
    const baseXp = 20

    selectedDomains.forEach(domainId => {
      growth[domainId] = (growth[domainId] || 0) + 15
    })

    if (selectedDomains.length > 0) {
      growth[selectedDomains[0]] = (growth[selectedDomains[0]] || 0) + baseXp
    } else {
      growth['instruction'] = baseXp
    }

    if (followUp.length > 20) {
      const primaryDomain = selectedDomains[0] || 'instruction'
      growth[primaryDomain] = (growth[primaryDomain] || 0) + 10
    }

    return growth
  }

  const calculateTotalXP = () => {
    return Object.values(growthByDomain).reduce((sum, xp) => sum + xp, 0)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const growth = calculateGrowth()
    setGrowthByDomain(growth)
    localStorage.setItem('recent-growth', JSON.stringify(growth))
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsComplete(true)
  }

  if (isComplete) {
    const totalXp = calculateTotalXP()
    const domains = Object.entries(growthByDomain).sort((a, b) => b[1] - a[1])

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
        <FloatingStars />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md w-full relative z-10"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-28 h-28 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 mx-auto mb-6 flex items-center justify-center shadow-lg shadow-orange-500/50"
          >
            <Rocket className="w-14 h-14 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-black mb-2 tracking-tight"
            style={{ textShadow: '0 0 30px rgba(251, 191, 36, 0.5)' }}
          >
            MISSION COMPLETE
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-3 text-3xl text-yellow-400 mb-6"
          >
            <Zap className="w-8 h-8 fill-yellow-400" />
            <span className="font-black">+{totalXp} XP</span>
            <Zap className="w-8 h-8 fill-yellow-400" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-900/80 backdrop-blur rounded-2xl p-5 mb-6 border-2 border-cyan-500/50"
          >
            <p className="text-sm text-cyan-400 mb-3 font-black uppercase tracking-widest">Power-Ups Earned</p>
            <div className="space-y-3">
              {domains.map(([domainId, xp], index) => {
                const domain = DOMAIN_TAGS.find(d => d.id === domainId)
                if (!domain) return null
                const DomainIcon = domain.icon

                return (
                  <motion.div
                    key={domainId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center border-2', domain.color, domain.borderColor)}>
                      <DomainIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-sm">{domain.name}</p>
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden mt-1 border border-slate-600">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                          className={cn('h-full rounded-full', domain.color)}
                        />
                      </div>
                    </div>
                    <motion.span
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1 + index * 0.1, type: 'spring' }}
                      className={cn('font-black text-xl', domain.textColor)}
                      style={{ textShadow: `0 0 10px currentColor` }}
                    >
                      +{xp}
                    </motion.span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            onClick={() => router.push('/play')}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-lg uppercase tracking-wide hover:scale-105 transition-transform shadow-lg shadow-cyan-500/40 border-2 border-cyan-400"
          >
            Return to Base
          </motion.button>
        </motion.div>
      </div>
    )
  }

  const previewGrowth = calculateGrowth()
  const previewTotal = Object.values(previewGrowth).reduce((sum, xp) => sum + xp, 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white flex flex-col relative overflow-hidden">
      <FloatingStars />

      {/* Header */}
      <header className="p-4 flex items-center justify-between relative z-10">
        <button
          onClick={() => router.back()}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 text-cyan-400 font-black">
          <Rocket className="w-5 h-5" />
          <span className="text-sm uppercase tracking-widest">Daily Mission</span>
        </div>
        <div className="w-10" />
      </header>

      {/* Progress bar */}
      <div className="px-6 relative z-10">
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden border-2 border-slate-700">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500"
            animate={{ width: `${((step + 1) / 3) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs font-black tracking-wide">
          <span className={step >= 0 ? 'text-cyan-400' : 'text-slate-600'}>MOMENT</span>
          <span className={step >= 1 ? 'text-violet-400' : 'text-slate-600'}>ZONES</span>
          <span className={step >= 2 ? 'text-fuchsia-400' : 'text-slate-600'}>BOOST</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {/* Step 0: The Moment */}
            {step === 0 && (
              <motion.div
                key="moment"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <h1
                  className="text-3xl font-black mb-2 text-center uppercase tracking-tight"
                  style={{ textShadow: '0 0 30px rgba(34, 211, 238, 0.4)' }}
                >
                  What Happened Today?
                </h1>
                <p className="text-slate-400 text-center mb-6">
                  Maybe: <span className="text-cyan-400 italic">{randomPrompt}</span>
                </p>

                <textarea
                  value={moment}
                  onChange={(e) => setMoment(e.target.value)}
                  placeholder="Today in class..."
                  className="w-full h-40 bg-slate-900/80 border-2 border-slate-600 focus:border-cyan-500 rounded-xl p-4 text-lg placeholder:text-slate-600 outline-none resize-none transition-colors"
                  autoFocus
                />

                <p className="text-sm text-slate-500 mt-3 text-center">
                  Just one moment. Don&apos;t overthink it.
                </p>
              </motion.div>
            )}

            {/* Step 1: Select Domains */}
            {step === 1 && (
              <motion.div
                key="domains"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <h1
                  className="text-3xl font-black mb-2 text-center uppercase tracking-tight"
                  style={{ textShadow: '0 0 30px rgba(139, 92, 246, 0.4)' }}
                >
                  Which Zones Were Active?
                </h1>
                <p className="text-slate-400 text-center mb-6">
                  Select the classroom areas this moment touched
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {DOMAIN_TAGS.map((domain) => (
                    <button
                      key={domain.id}
                      onClick={() => toggleDomain(domain.id)}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all text-left',
                        selectedDomains.includes(domain.id)
                          ? cn(domain.borderColor, domain.glowColor, 'shadow-lg bg-slate-800/80')
                          : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'
                      )}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center border-2', domain.color, domain.borderColor)}>
                          <domain.icon className="w-5 h-5 text-white" />
                        </div>
                        {selectedDomains.includes(domain.id) && (
                          <Check className={cn('w-6 h-6 ml-auto', domain.textColor)} />
                        )}
                      </div>
                      <p className="font-bold text-sm">{domain.name}</p>
                      <p className="text-xs text-slate-500">{domain.description}</p>
                    </button>
                  ))}
                </div>

                <p className="text-sm text-violet-400 mt-4 text-center font-bold">
                  +15 XP per zone selected
                </p>
              </motion.div>
            )}

            {/* Step 2: Go Deeper */}
            {step === 2 && (
              <motion.div
                key="deeper"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <h1
                  className="text-3xl font-black mb-2 text-center uppercase tracking-tight"
                  style={{ textShadow: '0 0 30px rgba(232, 121, 249, 0.4)' }}
                >
                  Power Up Your XP
                </h1>
                <p className="text-slate-400 text-center mb-6">
                  {randomFollowUp}
                </p>

                <textarea
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  placeholder="Optional, but earns +10 XP..."
                  className="w-full h-32 bg-slate-900/80 border-2 border-slate-600 focus:border-fuchsia-500 rounded-xl p-4 text-lg placeholder:text-slate-600 outline-none resize-none transition-colors"
                />

                {/* XP Preview */}
                <div className="mt-6 p-4 bg-slate-900/80 rounded-xl border-2 border-fuchsia-500/50">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm text-fuchsia-400 font-black uppercase tracking-wide">Mission Rewards</p>
                    <div className="flex items-center gap-2 text-2xl text-yellow-400">
                      <Zap className="w-6 h-6 fill-yellow-400" />
                      <span className="font-black">{previewTotal} XP</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(previewGrowth).map(([domainId, xp]) => {
                      const domain = DOMAIN_TAGS.find(d => d.id === domainId)
                      if (!domain) return null
                      return (
                        <div key={domainId} className="flex items-center gap-2 text-sm">
                          <div className={cn('w-4 h-4 rounded border', domain.color, domain.borderColor)} />
                          <span className="text-slate-400 flex-1">{domain.name}</span>
                          <span className={cn('font-bold', domain.textColor)}>+{xp}</span>
                        </div>
                      )
                    })}
                  </div>

                  {followUp.length <= 20 && (
                    <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-700">
                      Write more for +10 bonus XP
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-6 flex justify-between items-center relative z-10">
        <button
          onClick={() => setStep(s => s - 1)}
          className={cn(
            'flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold uppercase tracking-wide',
            step === 0 && 'invisible'
          )}
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        {step < 2 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={step === 0 && moment.length < 10}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-wide transition-all border-2',
              (step === 0 && moment.length >= 10) || step === 1
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-400 text-white hover:scale-105 shadow-lg shadow-cyan-500/30'
                : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
            )}
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-wide bg-gradient-to-r from-yellow-500 to-orange-500 border-2 border-yellow-400 text-white hover:scale-105 transition-transform shadow-lg shadow-orange-500/30"
          >
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Star className="w-5 h-5" />
                </motion.div>
                Launching...
              </>
            ) : (
              <>
                Complete Mission
                <Rocket className="w-5 h-5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
