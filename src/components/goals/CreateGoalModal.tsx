'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  BookOpen,
  Target,
  ClipboardList,
  Heart,
  Presentation,
  Star,
  Calendar,
  ChevronRight,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreateGoalModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateGoal: (goal: GoalInput) => Promise<void>
}

interface GoalInput {
  title: string
  description?: string
  goalType: 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
  targetType: 'REFLECTION_COUNT' | 'SKILL_FOCUS' | 'DOMAIN_FOCUS'
  targetValue: number
  targetSkillId?: string
  targetDomain?: string
}

const DOMAINS = [
  { id: 'planning', name: 'Planning & Prep', icon: ClipboardList, color: 'navyLight' },
  { id: 'environment', name: 'Classroom Culture', icon: Heart, color: 'navy' },
  { id: 'instruction', name: 'Instruction', icon: Presentation, color: 'navyBright' },
  { id: 'assessment', name: 'Assessment', icon: Star, color: 'silver' },
]

const SKILLS = [
  { id: 'objectives', name: 'Clear Objectives', domain: 'planning' },
  { id: 'materials', name: 'Prepared Materials', domain: 'planning' },
  { id: 'differentiation', name: 'Differentiation', domain: 'planning' },
  { id: 'engagement', name: 'Student Engagement', domain: 'environment' },
  { id: 'relationships', name: 'Student Relationships', domain: 'environment' },
  { id: 'routines', name: 'Routines & Procedures', domain: 'environment' },
  { id: 'questioning', name: 'Questioning Techniques', domain: 'instruction' },
  { id: 'explanation', name: 'Clear Explanations', domain: 'instruction' },
  { id: 'pacing', name: 'Lesson Pacing', domain: 'instruction' },
  { id: 'feedback', name: 'Feedback to Students', domain: 'assessment' },
  { id: 'checks', name: 'Checks for Understanding', domain: 'assessment' },
  { id: 'data', name: 'Using Data', domain: 'assessment' },
]

const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    navyLight: { bg: 'bg-[#2d5a87]', text: 'text-[#7db4e0]', border: 'border-[#4a7ba8]' },
    navy: { bg: 'bg-[#1e3a5f]', text: 'text-[#6ba3d6]', border: 'border-[#3d5a7f]' },
    navyBright: { bg: 'bg-[#4a7ba8]', text: 'text-[#a0c4e8]', border: 'border-[#6ba3d6]' },
    silver: { bg: 'bg-[#6b7280]', text: 'text-[#c0c0c0]', border: 'border-[#9ca3af]' },
  }
  return colors[color] || colors.navy
}

export function CreateGoalModal({ isOpen, onClose, onCreateGoal }: CreateGoalModalProps) {
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [goalType, setGoalType] = useState<'WEEKLY' | 'MONTHLY' | 'CUSTOM'>('WEEKLY')
  const [targetType, setTargetType] = useState<'REFLECTION_COUNT' | 'SKILL_FOCUS' | 'DOMAIN_FOCUS'>('REFLECTION_COUNT')
  const [targetDomain, setTargetDomain] = useState<string | null>(null)
  const [targetSkillId, setTargetSkillId] = useState<string | null>(null)
  const [targetValue, setTargetValue] = useState(5)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const resetForm = () => {
    setStep(0)
    setGoalType('WEEKLY')
    setTargetType('REFLECTION_COUNT')
    setTargetDomain(null)
    setTargetSkillId(null)
    setTargetValue(5)
    setTitle('')
    setDescription('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const generateTitle = () => {
    if (targetType === 'REFLECTION_COUNT') {
      return `Log ${targetValue} reflections this ${goalType.toLowerCase()}`
    }
    if (targetType === 'DOMAIN_FOCUS' && targetDomain) {
      const domain = DOMAINS.find(d => d.id === targetDomain)
      return `Focus on ${domain?.name} ${targetValue} times`
    }
    if (targetType === 'SKILL_FOCUS' && targetSkillId) {
      const skill = SKILLS.find(s => s.id === targetSkillId)
      return `Practice ${skill?.name} ${targetValue} times`
    }
    return ''
  }

  const handleNext = () => {
    if (step === 0) {
      // Goal type selected, move to target type
      setStep(1)
    } else if (step === 1) {
      // Target type selected
      if (targetType === 'REFLECTION_COUNT') {
        setStep(3) // Skip to value
      } else if (targetType === 'DOMAIN_FOCUS') {
        setStep(2) // Select domain
      } else if (targetType === 'SKILL_FOCUS') {
        setStep(2) // Select skill
      }
    } else if (step === 2) {
      // Domain/skill selected, move to value
      setStep(3)
    } else if (step === 3) {
      // Value selected, move to title
      const generatedTitle = generateTitle()
      if (!title) setTitle(generatedTitle)
      setStep(4)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onCreateGoal({
        title: title || generateTitle(),
        description: description || undefined,
        goalType,
        targetType,
        targetValue,
        targetSkillId: targetSkillId || undefined,
        targetDomain: targetDomain || undefined,
      })
      handleClose()
    } catch (error) {
      console.error('Failed to create goal:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    if (step === 0) return true
    if (step === 1) return true
    if (step === 2) {
      if (targetType === 'DOMAIN_FOCUS') return !!targetDomain
      if (targetType === 'SKILL_FOCUS') return !!targetSkillId
      return true
    }
    if (step === 3) return targetValue >= 1
    if (step === 4) return !!title.trim()
    return false
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[10%] bottom-auto max-w-lg mx-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#7db4e0]" />
                <h2 className="font-semibold text-white">New Goal</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <AnimatePresence mode="wait">
                {/* Step 0: Goal Type */}
                {step === 0 && (
                  <motion.div
                    key="step-0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <p className="text-slate-400 text-sm">How long do you want to work on this goal?</p>
                    <div className="space-y-2">
                      {[
                        { value: 'WEEKLY', label: 'This Week', desc: 'Resets every Sunday' },
                        { value: 'MONTHLY', label: 'This Month', desc: 'Resets at month end' },
                        { value: 'CUSTOM', label: 'Custom', desc: 'Set your own deadline' },
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => setGoalType(option.value as typeof goalType)}
                          className={cn(
                            'w-full p-4 rounded-xl border text-left transition-all',
                            goalType === option.value
                              ? 'bg-[#2d5a87]/30 border-[#4a7ba8] text-white'
                              : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                          )}
                        >
                          <p className="font-medium">{option.label}</p>
                          <p className="text-sm text-slate-500">{option.desc}</p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 1: Target Type */}
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <p className="text-slate-400 text-sm">What do you want to track?</p>
                    <div className="space-y-2">
                      {[
                        { value: 'REFLECTION_COUNT', label: 'Total Reflections', desc: 'Log any reflection', icon: BookOpen },
                        { value: 'DOMAIN_FOCUS', label: 'Focus on a Domain', desc: 'E.g., Instruction, Assessment', icon: ClipboardList },
                        { value: 'SKILL_FOCUS', label: 'Practice a Skill', desc: 'E.g., Questioning, Feedback', icon: Target },
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => setTargetType(option.value as typeof targetType)}
                          className={cn(
                            'w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3',
                            targetType === option.value
                              ? 'bg-[#2d5a87]/30 border-[#4a7ba8] text-white'
                              : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                          )}
                        >
                          <div className={cn(
                            'p-2 rounded-lg',
                            targetType === option.value ? 'bg-[#2d5a87]' : 'bg-slate-700'
                          )}>
                            <option.icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{option.label}</p>
                            <p className="text-sm text-slate-500">{option.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Select Domain or Skill */}
                {step === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {targetType === 'DOMAIN_FOCUS' ? (
                      <>
                        <p className="text-slate-400 text-sm">Which domain do you want to focus on?</p>
                        <div className="grid grid-cols-2 gap-2">
                          {DOMAINS.map(domain => {
                            const colors = getColorClasses(domain.color)
                            return (
                              <button
                                key={domain.id}
                                onClick={() => setTargetDomain(domain.id)}
                                className={cn(
                                  'p-4 rounded-xl border text-left transition-all',
                                  targetDomain === domain.id
                                    ? `${colors.bg}/30 ${colors.border} text-white`
                                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                                )}
                              >
                                <domain.icon className={cn('w-6 h-6 mb-2', colors.text)} />
                                <p className="font-medium text-sm">{domain.name}</p>
                              </button>
                            )
                          })}
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-slate-400 text-sm">Which skill do you want to practice?</p>
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                          {SKILLS.map(skill => {
                            const domain = DOMAINS.find(d => d.id === skill.domain)
                            const colors = domain ? getColorClasses(domain.color) : getColorClasses('navy')
                            return (
                              <button
                                key={skill.id}
                                onClick={() => setTargetSkillId(skill.id)}
                                className={cn(
                                  'w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3',
                                  targetSkillId === skill.id
                                    ? 'bg-[#2d5a87]/30 border-[#4a7ba8] text-white'
                                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                                )}
                              >
                                <div className={cn('p-1.5 rounded-lg', colors.bg)}>
                                  <Target className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{skill.name}</p>
                                  <p className="text-xs text-slate-500">{domain?.name}</p>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {/* Step 3: Target Value */}
                {step === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <p className="text-slate-400 text-sm">How many times?</p>
                    <div className="flex items-center justify-center gap-4 py-8">
                      <button
                        onClick={() => setTargetValue(Math.max(1, targetValue - 1))}
                        className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 text-white text-xl font-bold hover:bg-slate-700 transition-colors"
                      >
                        -
                      </button>
                      <div className="w-24 text-center">
                        <span className="text-5xl font-bold text-[#7db4e0]">{targetValue}</span>
                        <p className="text-sm text-slate-500 mt-1">
                          {targetType === 'REFLECTION_COUNT' ? 'reflections' : 'times'}
                        </p>
                      </div>
                      <button
                        onClick={() => setTargetValue(Math.min(50, targetValue + 1))}
                        className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 text-white text-xl font-bold hover:bg-slate-700 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex justify-center gap-2">
                      {[3, 5, 7, 10].map(v => (
                        <button
                          key={v}
                          onClick={() => setTargetValue(v)}
                          className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                            targetValue === v
                              ? 'bg-[#2d5a87] text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          )}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Title & Description */}
                {step === 4 && (
                  <motion.div
                    key="step-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-slate-400 text-sm block mb-2">Goal Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={generateTitle()}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#4a7ba8]"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-sm block mb-2">Description (optional)</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Why is this goal important to you?"
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#4a7ba8] resize-none"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 flex gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep(step === 3 && targetType === 'REFLECTION_COUNT' ? 1 : step - 1)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Back
                </button>
              )}
              <div className="flex-1" />
              {step < 4 ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="px-6 py-2 bg-[#2d5a87] text-white rounded-lg font-medium hover:bg-[#4a7ba8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  className="px-6 py-2 bg-[#2d5a87] text-white rounded-lg font-medium hover:bg-[#4a7ba8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Create Goal
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CreateGoalModal
