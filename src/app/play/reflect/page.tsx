'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
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
  Sparkles,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Demo user ID for development - in production this would come from auth
const DEMO_USER_ID = 'demo-user-001'

// Skill-specific prompts for guided logging
const SKILL_PROMPTS: Record<string, { primary: string; followUp: string; examples: string[] }> = {
  // Planning
  objectives: {
    primary: "How did you communicate or reinforce learning objectives today?",
    followUp: "How did students respond to knowing the goal?",
    examples: ["Posted objective on board", "Had students restate the goal", "Connected activity to objective"]
  },
  sequencing: {
    primary: "How did you structure your lesson flow today?",
    followUp: "What would you adjust about the sequence next time?",
    examples: ["Hook → instruction → practice", "Chunked content into steps", "Built from simple to complex"]
  },
  materials: {
    primary: "What resources or materials did you prepare that made a difference?",
    followUp: "How did having these ready impact the lesson?",
    examples: ["Pre-made anchor chart", "Organized manipulatives", "Prepared differentiated handouts"]
  },
  differentiation: {
    primary: "How did you plan for different learner needs today?",
    followUp: "Which students benefited most from these adjustments?",
    examples: ["Tiered assignments", "Choice boards", "Flexible grouping"]
  },
  // Environment
  relationships: {
    primary: "Describe a moment where you connected with a student today.",
    followUp: "What did this interaction teach you about them?",
    examples: ["Greeted at door", "Asked about their weekend", "Noticed something new about them"]
  },
  culture: {
    primary: "How did you nurture your classroom culture today?",
    followUp: "What evidence showed students felt safe or valued?",
    examples: ["Celebrated mistakes as learning", "Used inclusive language", "Highlighted diverse voices"]
  },
  norms: {
    primary: "How did routines or procedures support learning today?",
    followUp: "What routine might need revisiting?",
    examples: ["Smooth transition", "Students followed procedure independently", "Reinforced expectation positively"]
  },
  'student-voice': {
    primary: "How did students have voice or choice in their learning today?",
    followUp: "How did this affect their engagement?",
    examples: ["Student-led discussion", "Choice in how to show learning", "Asked for input on classroom decision"]
  },
  // Instruction
  questioning: {
    primary: "Describe a question you asked that sparked thinking.",
    followUp: "How long did you wait for responses? What happened?",
    examples: ["Open-ended question", "Follow-up probe", "Student-to-student questioning"]
  },
  engagement: {
    primary: "What strategy did you use to engage students today?",
    followUp: "Which students were most/least engaged? Why?",
    examples: ["Think-pair-share", "Movement activity", "Real-world connection"]
  },
  clarity: {
    primary: "How did you make a concept clear or accessible today?",
    followUp: "How did you know students understood?",
    examples: ["Used analogy", "Modeled thinking aloud", "Broke into smaller steps"]
  },
  discussion: {
    primary: "Describe a moment of meaningful student discussion.",
    followUp: "What moves did you make to facilitate (or stay out of the way)?",
    examples: ["Socratic seminar", "Turn and talk", "Debate structure"]
  },
  pacing: {
    primary: "How did you adjust your pacing based on student needs?",
    followUp: "What signals told you to speed up or slow down?",
    examples: ["Extended practice time", "Cut planned activity", "Added brain break"]
  },
  // Assessment
  formative: {
    primary: "What formative assessment did you use today?",
    followUp: "What did the data tell you about student understanding?",
    examples: ["Exit ticket", "Thumbs up/down", "Whiteboard responses"]
  },
  feedback: {
    primary: "Describe feedback you gave that helped a student grow.",
    followUp: "How did the student respond to this feedback?",
    examples: ["Specific praise", "Next-step suggestion", "Conference conversation"]
  },
  'data-use': {
    primary: "How did you use data to adjust your teaching today?",
    followUp: "What will you do differently tomorrow based on this?",
    examples: ["Regrouped students", "Re-taught concept", "Added scaffolding"]
  },
  'self-assessment': {
    primary: "How did students assess their own learning today?",
    followUp: "How accurate were their self-assessments?",
    examples: ["Rubric self-check", "Goal reflection", "Learning log"]
  },
}

// Blair Academy color palette - navy, silver, white
const BLAIR = {
  navy: '#1e3a5f',
  navyLight: '#2d5a87',
  navyDark: '#0f2744',
  silver: '#9ca3af',
  silverLight: '#c0c0c0',
  white: '#f8fafc',
}

// Domain configuration with skills - using Blair Academy colors
const DOMAINS = [
  {
    id: 'planning',
    name: 'Planning & Prep',
    icon: ClipboardList,
    color: 'bg-[#2d5a87]',
    borderColor: 'border-[#4a7ba8]',
    textColor: 'text-[#7db4e0]',
    glowColor: 'shadow-[#2d5a87]/30',
    skills: [
      { id: 'objectives', name: 'Learning Objectives' },
      { id: 'sequencing', name: 'Lesson Sequencing' },
      { id: 'materials', name: 'Resource Preparation' },
      { id: 'differentiation', name: 'Differentiation' },
    ],
  },
  {
    id: 'environment',
    name: 'Classroom Culture',
    icon: Heart,
    color: 'bg-[#1e3a5f]',
    borderColor: 'border-[#3d5a7f]',
    textColor: 'text-[#6ba3d6]',
    glowColor: 'shadow-[#1e3a5f]/30',
    skills: [
      { id: 'relationships', name: 'Building Relationships' },
      { id: 'culture', name: 'Classroom Culture' },
      { id: 'norms', name: 'Routines & Procedures' },
      { id: 'student-voice', name: 'Student Voice & Agency' },
    ],
  },
  {
    id: 'instruction',
    name: 'Instruction',
    icon: Presentation,
    color: 'bg-[#4a7ba8]',
    borderColor: 'border-[#6ba3d6]',
    textColor: 'text-[#a0c4e8]',
    glowColor: 'shadow-[#4a7ba8]/30',
    skills: [
      { id: 'questioning', name: 'Questioning Strategies' },
      { id: 'engagement', name: 'Student Engagement' },
      { id: 'clarity', name: 'Clear Explanations' },
      { id: 'discussion', name: 'Facilitating Discussion' },
      { id: 'pacing', name: 'Pacing & Flexibility' },
    ],
  },
  {
    id: 'assessment',
    name: 'Assessment',
    icon: BarChart3,
    color: 'bg-[#6b7280]',
    borderColor: 'border-[#9ca3af]',
    textColor: 'text-[#c0c0c0]',
    glowColor: 'shadow-[#6b7280]/30',
    skills: [
      { id: 'formative', name: 'Formative Assessment' },
      { id: 'feedback', name: 'Quality Feedback' },
      { id: 'data-use', name: 'Using Data to Adjust' },
      { id: 'self-assessment', name: 'Student Self-Assessment' },
    ],
  },
]

// Floating stars component for space theme
const FloatingStars = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    {[...Array(40)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-white"
        style={{
          left: `${(i * 17 + 23) % 100}%`,
          top: `${(i * 31 + 11) % 100}%`,
          width: i % 5 === 0 ? '3px' : i % 3 === 0 ? '2px' : '1px',
          height: i % 5 === 0 ? '3px' : i % 3 === 0 ? '2px' : '1px',
        }}
        animate={{
          opacity: [0.2, 1, 0.2],
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: 2 + (i % 3),
          repeat: Infinity,
          delay: (i % 5) * 0.4,
        }}
      />
    ))}
  </div>
)

type ReflectionMode = 'win' | 'growth' | null

export default function ReflectPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [reflectionMode, setReflectionMode] = useState<ReflectionMode>(null)
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [primaryResponse, setPrimaryResponse] = useState('')
  const [followUpResponse, setFollowUpResponse] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [earnedXp, setEarnedXp] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [updatedGoals, setUpdatedGoals] = useState<Array<{
    id: string
    title: string
    currentValue: number
    targetValue: number
    completed: boolean
  }>>([])


  const domain = DOMAINS.find(d => d.id === selectedDomain)
  const skill = domain?.skills.find(s => s.id === selectedSkill)
  const skillPrompts = selectedSkill ? SKILL_PROMPTS[selectedSkill] : null

  // Get mode-specific prompts
  const getPromptForMode = () => {
    if (!skillPrompts) return { primary: '', followUp: '', examples: [] as string[] }

    if (reflectionMode === 'win') {
      return {
        primary: skillPrompts.primary,
        followUp: "What made this work? How might you build on this success?",
        examples: skillPrompts.examples,
      }
    } else {
      return {
        primary: skillPrompts.primary.replace(/did you/gi, 'would you like to improve').replace(/today/gi, ''),
        followUp: "What's one small thing you could try tomorrow?",
        examples: skillPrompts.examples,
      }
    }
  }

  const modePrompts = getPromptForMode()

  const calculateXp = () => {
    let xp = 25 // Base XP for completing a reflection
    if (followUpResponse.length > 20) xp += 15 // Bonus for thoughtful follow-up
    return xp
  }

  const handleSubmit = async () => {
    if (!selectedDomain || !selectedSkill || !primaryResponse) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: DEMO_USER_ID,
          primaryResponse,
          followUpResponse: followUpResponse || undefined,
          domains: [selectedDomain],
          skillId: selectedSkill,
          skillName: skill?.name,
          prompt: skillPrompts?.primary,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save reflection')
      }

      const data = await response.json()
      setEarnedXp(data.xpEarned)

      // Store for UI feedback
      localStorage.setItem('recent-growth', JSON.stringify({ [selectedDomain]: data.xpEarned }))

      // Track goal updates
      if (data.goalsUpdated && data.goalsUpdated.length > 0) {
        setUpdatedGoals(data.goalsUpdated)
      }

      setIsComplete(true)
    } catch (err) {
      console.error('Failed to save reflection:', err)
      setError(err instanceof Error ? err.message : 'Failed to save reflection')
      // Still show completion with calculated XP
      setEarnedXp(calculateXp())
      setIsComplete(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f2744] to-[#0a1628] text-white flex items-center justify-center p-6 relative overflow-hidden">
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
            className={cn('w-28 h-28 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg', domain?.color, domain?.glowColor)}
          >
            {domain && <domain.icon className="w-14 h-14 text-white" />}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-black mb-2 tracking-tight text-white"
          >
            REFLECTION LOGGED
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className={cn('text-lg mb-4', domain?.textColor)}
          >
            {skill?.name}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-3 text-3xl text-[#c0c0c0] mb-6"
          >
            <Zap className="w-8 h-8 fill-[#c0c0c0]" />
            <span className="font-black">+{earnedXp} XP</span>
            <Zap className="w-8 h-8 fill-[#c0c0c0]" />
          </motion.div>

          {/* Goal Progress */}
          {updatedGoals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-[#1e3a5f]/50 backdrop-blur rounded-2xl p-4 mb-6 border-2 border-[#4a7ba8]/50"
            >
              <p className="text-sm text-[#7db4e0] font-bold mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Goal Progress
              </p>
              <div className="space-y-3">
                {updatedGoals.map((goal) => (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-white font-medium">{goal.title}</span>
                      <span className={goal.completed ? 'text-[#7db4e0] font-bold' : 'text-slate-400'}>
                        {goal.currentValue}/{goal.targetValue}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: `${((goal.currentValue - 1) / goal.targetValue) * 100}%` }}
                        animate={{ width: `${(goal.currentValue / goal.targetValue) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className={cn(
                          'h-full rounded-full',
                          goal.completed
                            ? 'bg-gradient-to-r from-[#2d5a87] to-[#7db4e0]'
                            : 'bg-[#4a7ba8]'
                        )}
                      />
                    </div>
                    {goal.completed && (
                      <p className="text-xs text-[#7db4e0] mt-1 font-bold">
                        Goal completed!
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: updatedGoals.length > 0 ? 0.55 : 0.5 }}
            className="bg-slate-900/80 backdrop-blur rounded-2xl p-5 mb-6 border-2 border-slate-700"
          >
            <p className="text-sm text-slate-400 mb-2">You reflected on:</p>
            <p className="text-white">{primaryResponse.slice(0, 100)}{primaryResponse.length > 100 ? '...' : ''}</p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onClick={() => router.push('/play')}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#1e5f8f] to-[#2d6fa0] text-white font-black text-lg uppercase tracking-wide hover:scale-105 transition-transform shadow-lg shadow-[#1e5f8f]/40 border-2 border-[#4a90c2]"
          >
            Return to Base
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f2744] to-[#0a1628] text-white flex flex-col relative overflow-hidden">
      <FloatingStars />

      {/* Header */}
      <header className="p-4 flex items-center justify-between relative z-10">
        <button
          onClick={() => router.back()}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 text-[#c0c0c0] font-black">
          <Rocket className="w-5 h-5" />
          <span className="text-sm uppercase tracking-widest">Daily Reflection</span>
        </div>
        <div className="w-10" />
      </header>

      {/* Progress bar */}
      <div className="px-6 relative z-10">
        <div className="h-3 bg-[#1e3a5f] rounded-full overflow-hidden border-2 border-[#2d4a6f]">
          <motion.div
            className="h-full bg-gradient-to-r from-[#1e5f8f] via-[#2d6fa0] to-[#c0c0c0]"
            animate={{ width: `${((step + 1) / 5) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs font-black tracking-wide">
          <span className={step >= 0 ? 'text-[#6ba3d6]' : 'text-slate-600'}>START</span>
          <span className={step >= 1 ? 'text-[#6ba3d6]' : 'text-slate-600'}>AREA</span>
          <span className={step >= 2 ? 'text-[#6ba3d6]' : 'text-slate-600'}>SKILL</span>
          <span className={step >= 3 ? 'text-[#6ba3d6]' : 'text-slate-600'}>REFLECT</span>
          <span className={step >= 4 ? 'text-[#c0c0c0]' : 'text-slate-600'}>DEEPEN</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {/* Step 0: Win or Growth */}
            {step === 0 && (
              <motion.div
                key="mode"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <h1
                  className="text-3xl font-black mb-2 text-center uppercase tracking-tight"
                                  >
                  How was your day?
                </h1>
                <p className="text-slate-400 text-center mb-8">
                  Choose what you want to reflect on
                </p>

                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setReflectionMode('win')
                      setStep(1)
                    }}
                    className="w-full p-6 rounded-xl border-2 transition-all text-left hover:scale-[1.02] bg-[#0f2744]/50 border-[#4a7ba8]/50 hover:border-[#6ba3d6] hover:bg-[#1e3a5f]/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2d5a87] to-[#4a7ba8] flex items-center justify-center">
                        <Sparkles className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-xl text-[#a0c4e8]">Something went well!</p>
                        <p className="text-sm text-slate-400 mt-1">Celebrate a win and capture what worked</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setReflectionMode('growth')
                      setStep(1)
                    }}
                    className="w-full p-6 rounded-xl border-2 transition-all text-left hover:scale-[1.02] bg-[#0f2744]/50 border-[#6b7280]/50 hover:border-[#9ca3af] hover:bg-[#1e3a5f]/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#6b7280] to-[#9ca3af] flex items-center justify-center">
                        <Target className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-xl text-[#c0c0c0]">Something to work on</p>
                        <p className="text-sm text-slate-400 mt-1">Identify a growth area and plan next steps</p>
                      </div>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 1: Select Domain */}
            {step === 1 && (
              <motion.div
                key="domain"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  {reflectionMode === 'win' ? (
                    <span className="text-sm font-bold text-[#7db4e0] flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Celebrating a win
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-[#c0c0c0] flex items-center gap-2">
                      <Target className="w-4 h-4" /> Finding growth
                    </span>
                  )}
                </div>

                <h1
                  className="text-3xl font-black mb-2 text-center uppercase tracking-tight"
                                  >
                  {reflectionMode === 'win' ? 'Where did it happen?' : 'What area?'}
                </h1>
                <p className="text-slate-400 text-center mb-6">
                  {reflectionMode === 'win'
                    ? 'Which part of your teaching shined today?'
                    : 'Where do you want to grow?'}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {DOMAINS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setSelectedDomain(d.id)
                        setSelectedSkill(null)
                        setStep(2)
                      }}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all text-left hover:scale-[1.02]',
                        selectedDomain === d.id
                          ? cn(d.borderColor, d.glowColor, 'shadow-lg bg-slate-800/80')
                          : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'
                      )}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center border-2', d.color, d.borderColor)}>
                          <d.icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <p className="font-bold text-sm">{d.name}</p>
                      <p className="text-xs text-slate-500">{d.skills.length} skills</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Select Skill */}
            {step === 2 && domain && (
              <motion.div
                key="skill"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <div className="flex items-center gap-3 mb-4 justify-center">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center border-2', domain.color, domain.borderColor)}>
                    <domain.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={cn('font-bold', domain.textColor)}>{domain.name}</span>
                </div>

                <h1 className="text-3xl font-black mb-2 text-center uppercase tracking-tight text-white">
                  {reflectionMode === 'win' ? 'What worked?' : 'What skill?'}
                </h1>
                <p className="text-slate-400 text-center mb-6">
                  {reflectionMode === 'win'
                    ? 'Which specific skill did you nail?'
                    : 'Which skill do you want to develop?'}
                </p>

                <div className="space-y-2">
                  {domain.skills.map((s) => {
                    const prompt = SKILL_PROMPTS[s.id]
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedSkill(s.id)
                          setStep(3)
                        }}
                        className={cn(
                          'w-full p-4 rounded-xl border-2 transition-all text-left hover:scale-[1.01]',
                          selectedSkill === s.id
                            ? cn(domain.borderColor, domain.glowColor, 'shadow-lg bg-slate-800/80')
                            : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold">{s.name}</p>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{prompt?.primary}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-500" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 3: Primary Response */}
            {step === 3 && skillPrompts && domain && (
              <motion.div
                key="primary"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <div className="flex items-center gap-2 mb-4 justify-center">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', domain.color)}>
                    <domain.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className={cn('text-sm font-medium', domain.textColor)}>{skill?.name}</span>
                </div>

                <h1 className="text-2xl font-black mb-4 text-center text-white">
                  {reflectionMode === 'win' ? skillPrompts.primary : `How would you like to improve at this?`}
                </h1>

                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                  {skillPrompts.examples.map((ex, i) => (
                    <span key={i} className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700">
                      {ex}
                    </span>
                  ))}
                </div>

                <textarea
                  value={primaryResponse}
                  onChange={(e) => setPrimaryResponse(e.target.value)}
                  placeholder={reflectionMode === 'win' ? "Describe what happened..." : "What did you notice? What would you like to try?"}
                  className={cn(
                    'w-full h-40 bg-slate-900/80 border-2 rounded-xl p-4 text-lg placeholder:text-slate-600 outline-none resize-none transition-colors',
                    domain.borderColor, 'border-opacity-50 focus:border-opacity-100'
                  )}
                  autoFocus
                />

                <p className="text-sm text-slate-500 mt-3 text-center">
                  {reflectionMode === 'win' ? 'Be specific - the details matter!' : 'Be honest - growth starts with awareness'}
                </p>
              </motion.div>
            )}

            {/* Step 4: Follow-up */}
            {step === 4 && skillPrompts && domain && (
              <motion.div
                key="followup"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <h1 className="text-2xl font-black mb-2 text-center text-white">
                  {reflectionMode === 'win'
                    ? "What made this work? How can you build on it?"
                    : "What's one small step you could try tomorrow?"}
                </h1>
                <p className="text-slate-400 text-center mb-6">
                  Dig deeper to unlock bonus XP
                </p>

                <textarea
                  value={followUpResponse}
                  onChange={(e) => setFollowUpResponse(e.target.value)}
                  placeholder="Optional, but earns +15 XP..."
                  className={cn(
                    'w-full h-32 bg-slate-900/80 border-2 rounded-xl p-4 text-lg placeholder:text-slate-600 outline-none resize-none transition-colors',
                    'border-[#4a7ba8]/50 focus:border-[#6ba3d6]'
                  )}
                  autoFocus
                />

                {/* XP Preview */}
                <div className="mt-6 p-4 bg-slate-900/80 rounded-xl border-2 border-[#4a7ba8]/30">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-[#c0c0c0] font-black uppercase tracking-wide">Reflection XP</p>
                    <div className="flex items-center gap-2 text-2xl text-[#c0c0c0]">
                      <Zap className="w-6 h-6 fill-[#c0c0c0]" />
                      <span className="font-black">{calculateXp()} XP</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mt-2 space-y-1">
                    <p className="text-[#7db4e0]/70">+ 25 XP for reflection</p>
                    {followUpResponse.length > 20 && (
                      <p className="text-[#a0c4e8]/70">+ 15 XP for deeper thinking</p>
                    )}
                  </div>
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

        {step < 4 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={(step === 3 && primaryResponse.length < 10)}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-wide transition-all border-2',
              (step === 0 || step === 1 || step === 2 || (step === 3 && primaryResponse.length >= 10))
                ? 'bg-gradient-to-r from-[#1e5f8f] to-[#2d6fa0] border-[#4a90c2] text-white hover:scale-105 shadow-lg shadow-[#1e5f8f]/30'
                : 'bg-[#1e3a5f] border-[#2d4a6f] text-slate-500 cursor-not-allowed'
            )}
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-wide bg-gradient-to-r from-[#c0c0c0] to-[#a0a0a0] border-2 border-[#d0d0d0] text-[#0a1628] hover:scale-105 transition-transform shadow-lg shadow-[#c0c0c0]/30"
          >
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Star className="w-5 h-5" />
                </motion.div>
                Saving...
              </>
            ) : (
              <>
                Complete
                <Rocket className="w-5 h-5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
