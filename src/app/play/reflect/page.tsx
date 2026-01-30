'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  ChevronLeft,
  X,
  Rocket,
  ClipboardList,
  Presentation,
  BarChart3,
  Heart,
  Star,
  Sparkles,
  Target,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CoachChat } from '@/components/coaching'

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

type ReflectionMode = 'win' | 'growth' | null

interface CoachSuggestion {
  suggestedFocus: {
    domain: string
    domainName: string
    skill?: string
    skillName?: string
    reason: string
  } | null
  prompt: string
  context: string
}

interface TeacherProfile {
  backstory?: string
  superpower?: string
}

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
  const [error, setError] = useState<string | null>(null)
  const [updatedGoals, setUpdatedGoals] = useState<Array<{
    id: string
    title: string
    currentValue: number
    targetValue: number
    completed: boolean
  }>>([])
  const [coaching, setCoaching] = useState<{
    insight: string
    strategy: string
  } | null>(null)
  const [isLoadingCoaching, setIsLoadingCoaching] = useState(false)
  const [profile, setProfile] = useState<TeacherProfile>({})

  // Coach suggestion state
  const [coachSuggestion, setCoachSuggestion] = useState<CoachSuggestion | null>(null)
  const [isLoadingCoachSuggestion, setIsLoadingCoachSuggestion] = useState(false)
  const [showCoachStep, setShowCoachStep] = useState(false)
  const [dynamicPrompt, setDynamicPrompt] = useState<string | null>(null)

  // Load profile on mount
  useEffect(() => {
    const saved = localStorage.getItem('teacher-profile')
    if (saved) {
      const parsed = JSON.parse(saved)
      setProfile({
        backstory: parsed.backstory || '',
        superpower: parsed.superpower || '',
      })
    }
  }, [])


  const domain = DOMAINS.find(d => d.id === selectedDomain)
  const skill = domain?.skills.find(s => s.id === selectedSkill)
  const skillPrompts = selectedSkill ? SKILL_PROMPTS[selectedSkill] : null

  // Fetch dynamic prompt for a specific domain/skill
  const fetchDynamicPrompt = async (domainId: string, skillId: string) => {
    try {
      const response = await fetch(`/api/coaching/prompt?userId=${DEMO_USER_ID}&domain=${domainId}&skill=${skillId}`)
      const data = await response.json()

      if (data.available && data.prompt) {
        setDynamicPrompt(data.prompt)
      }
    } catch (err) {
      console.log('Dynamic prompt not available:', err)
    }
  }

  // Handle mode selection
  const handleModeSelect = async (mode: ReflectionMode) => {
    setReflectionMode(mode)
    setIsLoadingCoachSuggestion(true)
    setStep(1) // Show loading state while fetching suggestion

    try {
      // Check if there's a stored suggestion from the dashboard
      const storedSuggestion = localStorage.getItem('coachSuggestion')
      if (storedSuggestion) {
        localStorage.removeItem('coachSuggestion')
        const parsed = JSON.parse(storedSuggestion)
        setCoachSuggestion({
          suggestedFocus: {
            domain: parsed.domain,
            domainName: DOMAINS.find(d => d.id === parsed.domain)?.name || parsed.domain,
            skill: parsed.skill,
            skillName: parsed.skill ? DOMAINS.flatMap(d => d.skills).find(s => s.id === parsed.skill)?.name : undefined,
            reason: parsed.reason,
          },
          prompt: '',
          context: parsed.reason,
        })
        setShowCoachStep(true)
        setIsLoadingCoachSuggestion(false)
        return
      }

      const response = await fetch(`/api/coaching/prompt?userId=${DEMO_USER_ID}`)
      const data = await response.json()

      if (data.available && data.suggestedFocus) {
        setCoachSuggestion({
          suggestedFocus: data.suggestedFocus,
          prompt: data.prompt,
          context: data.context,
        })
        setShowCoachStep(true)
      } else {
        // No coach suggestion available, skip to domain selection
        setShowCoachStep(false)
        setStep(2)
      }
    } catch (err) {
      console.log('Coach suggestion not available:', err)
      // Error fetching, skip to domain selection
      setShowCoachStep(false)
      setStep(2)
    } finally {
      setIsLoadingCoachSuggestion(false)
    }
  }

  // Handle accepting coach suggestion
  const handleAcceptSuggestion = () => {
    if (coachSuggestion?.suggestedFocus) {
      const { domain: suggestedDomain, skill: suggestedSkill } = coachSuggestion.suggestedFocus
      setSelectedDomain(suggestedDomain)
      if (suggestedSkill) {
        setSelectedSkill(suggestedSkill)
        // Fetch dynamic prompt for this skill
        fetchDynamicPrompt(suggestedDomain, suggestedSkill)
        setStep(3) // Skip to reflect step
      } else {
        setStep(2) // Go to skill selection
      }
    }
  }

  // Handle skipping coach suggestion
  const handleSkipSuggestion = () => {
    setStep(2) // Go to domain selection
  }

  // Adjusted step for display (accounts for coach step)
  const displayStep = showCoachStep ? step : (step === 1 ? 1 : step > 1 ? step : step)

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

      // Track goal updates
      if (data.goalsUpdated && data.goalsUpdated.length > 0) {
        setUpdatedGoals(data.goalsUpdated)
      }

      setIsComplete(true)

      // Fetch AI coaching in background
      setIsLoadingCoaching(true)
      try {
        const coachingRes = await fetch('/api/coaching', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: selectedDomain,
            domainName: domain?.name || 'Teaching',
            primaryResponse,
            followUpResponse: followUpResponse || undefined,
            skillName: skill?.name,
            profile: profile.backstory || profile.superpower ? profile : undefined,
          }),
        })
        const coachingData = await coachingRes.json()
        if (coachingData.available) {
          setCoaching({
            insight: coachingData.insight,
            strategy: coachingData.strategy,
          })
        }
      } catch (coachingErr) {
        console.log('Coaching not available:', coachingErr)
      } finally {
        setIsLoadingCoaching(false)
      }
    } catch (err) {
      console.error('Failed to save reflection:', err)
      setError(err instanceof Error ? err.message : 'Failed to save reflection')
      // Still show completion
      setIsComplete(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f2744] to-[#0a1628] text-white flex items-center justify-center p-6 relative overflow-hidden">
        <PixelStars />

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
            className="text-3xl font-black mb-2 tracking-[0.15em] text-white uppercase"
          >
            Log Complete!
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
            className="flex items-center justify-center gap-3 text-xl text-slate-400 mb-6"
          >
            <CheckCircle className="w-6 h-6 text-green-400" />
            <span className="font-medium">Reflection saved</span>
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

          {/* AI Coaching */}
          {(isLoadingCoaching || coaching) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: updatedGoals.length > 0 ? 0.55 : 0.5 }}
              className="bg-gradient-to-br from-[#1e3a5f]/80 to-[#0f2744]/80 backdrop-blur rounded-2xl p-5 mb-6 border-2 border-[#4a7ba8]/50"
            >
              <p className="text-sm text-[#7db4e0] font-bold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Coach&apos;s Corner
              </p>
              {isLoadingCoaching ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Star className="w-4 h-4" />
                  </motion.div>
                  <span className="text-sm">Getting coaching feedback...</span>
                </div>
              ) : coaching ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-white text-sm leading-relaxed">{coaching.insight}</p>
                  </div>
                  <div className="bg-[#2d5a87]/30 rounded-lg p-3 border border-[#4a7ba8]/30">
                    <p className="text-xs text-[#7db4e0] font-bold mb-1 uppercase tracking-wide">Something to Consider</p>
                    <p className="text-white text-sm leading-relaxed">{coaching.strategy}</p>
                  </div>

                  {/* Conversational Coaching Chat */}
                  <CoachChat
                    context={{
                      domain: selectedDomain || 'instruction',
                      domainName: domain?.name || 'Teaching',
                      skillName: skill?.name,
                      primaryResponse,
                      followUpResponse: followUpResponse || undefined,
                      initialInsight: coaching.insight,
                      initialStrategy: coaching.strategy,
                      profile: profile.backstory || profile.superpower ? profile : undefined,
                    }}
                    className="mt-4"
                  />
                </div>
              ) : null}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: updatedGoals.length > 0 ? 0.65 : 0.6 }}
            className="bg-[#0f2744] p-5 mb-6 border-4 border-slate-700"
            style={{ boxShadow: '4px 4px 0 #0a1628' }}
          >
            <p className="text-sm text-slate-400 mb-2 font-black uppercase tracking-wide">You reflected on:</p>
            <p className="text-white font-medium">{primaryResponse.slice(0, 100)}{primaryResponse.length > 100 ? '...' : ''}</p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={() => router.push('/play')}
            className="px-8 py-4 bg-[#2d5a87] text-white font-black text-lg uppercase tracking-[0.15em] hover:translate-x-1 hover:-translate-y-1 transition-transform border-4 border-[#4a7ba8]"
            style={{ boxShadow: '6px 6px 0 #0a1628' }}
          >
            Return to Base
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f2744] to-[#0a1628] text-white flex flex-col relative overflow-hidden">
      <PixelStars />

      {/* Header - 8-bit style */}
      <header className="p-4 flex items-center justify-between relative z-10">
        <button
          onClick={() => router.back()}
          className="p-2 text-slate-400 hover:text-white transition-colors border-2 border-transparent hover:border-slate-600"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 text-[#c0c0c0] font-black px-4 py-2 border-2 border-[#4a7ba8] bg-[#0f2744]">
          <Rocket className="w-5 h-5" />
          <span className="text-sm uppercase tracking-[0.2em]">Daily Log</span>
        </div>
        <div className="w-10" />
      </header>

      {/* Progress bar - 8-bit pixel style */}
      <div className="px-6 relative z-10">
        <div className="h-4 bg-[#0f2744] border-4 border-[#2d4a6f] overflow-hidden" style={{ imageRendering: 'pixelated' }}>
          <motion.div
            className="h-full bg-[#4a7ba8]"
            animate={{ width: `${((step + 1) / 6) * 100}%` }}
            style={{ boxShadow: 'inset -4px 0 0 #6ba3d6' }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-black tracking-[0.15em]">
          <span className={step >= 0 ? 'text-[#6ba3d6]' : 'text-slate-700'}>START</span>
          <span className={step >= 1 ? 'text-[#6ba3d6]' : 'text-slate-700'}>COACH</span>
          <span className={step >= 2 ? 'text-[#6ba3d6]' : 'text-slate-700'}>AREA</span>
          <span className={step >= 3 ? 'text-[#6ba3d6]' : 'text-slate-700'}>SKILL</span>
          <span className={step >= 4 ? 'text-[#6ba3d6]' : 'text-slate-700'}>REFLECT</span>
          <span className={step >= 5 ? 'text-[#c0c0c0]' : 'text-slate-700'}>DEEPEN</span>
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
                    onClick={() => handleModeSelect('win')}
                    className="w-full p-5 border-4 transition-all text-left hover:translate-x-1 hover:-translate-y-1 bg-[#0f2744] border-[#4a7ba8] hover:border-[#6ba3d6] hover:bg-[#1e3a5f]"
                    style={{ boxShadow: '4px 4px 0 #1e3a5f' }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#2d5a87] border-2 border-[#4a7ba8] flex items-center justify-center">
                        <Sparkles className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="font-black text-xl text-[#a0c4e8] uppercase tracking-wide">A win!</p>
                        <p className="text-sm text-slate-400 mt-1 font-medium">Celebrate what worked</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleModeSelect('growth')}
                    className="w-full p-5 border-4 transition-all text-left hover:translate-x-1 hover:-translate-y-1 bg-[#0f2744] border-[#6b7280] hover:border-[#9ca3af] hover:bg-[#1e3a5f]"
                    style={{ boxShadow: '4px 4px 0 #1e3a5f' }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#6b7280] border-2 border-[#9ca3af] flex items-center justify-center">
                        <Target className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="font-black text-xl text-[#c0c0c0] uppercase tracking-wide">Growth area</p>
                        <p className="text-sm text-slate-400 mt-1 font-medium">Plan your next steps</p>
                      </div>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 1: Coach's Suggestion (if available) */}
            {step === 1 && showCoachStep && (
              <motion.div
                key="coach-suggestion"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                {isLoadingCoachSuggestion ? (
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="inline-block"
                    >
                      <Star className="w-8 h-8 text-[#7db4e0]" />
                    </motion.div>
                    <p className="text-slate-400 mt-4">Your coach is thinking...</p>
                  </div>
                ) : coachSuggestion?.suggestedFocus ? (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-[#7db4e0]" />
                      <span className="text-sm font-bold text-[#7db4e0] uppercase tracking-wide">Coach&apos;s Suggestion</span>
                    </div>

                    <h1 className="text-2xl font-black mb-2 text-center text-white">
                      Your coach suggests...
                    </h1>

                    <div className="bg-gradient-to-br from-[#1e3a5f]/80 to-[#0f2744]/80 rounded-2xl p-5 mb-6 border-2 border-[#4a7ba8]/50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-[#2d5a87] flex items-center justify-center">
                          {(() => {
                            const suggestedDomain = DOMAINS.find(d => d.id === coachSuggestion.suggestedFocus?.domain)
                            if (suggestedDomain) {
                              const Icon = suggestedDomain.icon
                              return <Icon className="w-6 h-6 text-white" />
                            }
                            return <Target className="w-6 h-6 text-white" />
                          })()}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-white">
                            {coachSuggestion.suggestedFocus.domainName}
                          </p>
                          {coachSuggestion.suggestedFocus.skillName && (
                            <p className="text-sm text-[#7db4e0]">
                              {coachSuggestion.suggestedFocus.skillName}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {coachSuggestion.suggestedFocus.reason}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={handleAcceptSuggestion}
                        className="w-full p-4 rounded-xl bg-gradient-to-r from-[#1e5f8f] to-[#2d6fa0] text-white font-bold text-lg hover:scale-[1.02] transition-transform border-2 border-[#4a90c2] shadow-lg shadow-[#1e5f8f]/30"
                      >
                        Sounds good!
                      </button>
                      <button
                        onClick={handleSkipSuggestion}
                        className="w-full p-3 rounded-xl bg-slate-900/50 text-slate-400 font-medium hover:text-white hover:bg-slate-800/50 transition-colors border border-slate-700"
                      >
                        I have something else in mind
                      </button>
                    </div>
                  </>
                ) : null}
              </motion.div>
            )}

            {/* Step 2: Select Domain (was Step 1) */}
            {step === 2 && (
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
                        setStep(3)
                      }}
                      className={cn(
                        'p-4 border-4 transition-all text-left hover:translate-x-1 hover:-translate-y-1',
                        selectedDomain === d.id
                          ? cn(d.borderColor, 'bg-[#1e3a5f]')
                          : 'bg-[#0f2744] border-slate-700 hover:border-slate-500'
                      )}
                      style={{ boxShadow: '3px 3px 0 #0a1628' }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn('w-10 h-10 flex items-center justify-center border-2', d.color, d.borderColor)}>
                          <d.icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <p className="font-black text-sm uppercase tracking-wide">{d.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{d.skills.length} skills</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Select Skill */}
            {step === 3 && domain && (
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
                          fetchDynamicPrompt(selectedDomain!, s.id)
                          setStep(4)
                        }}
                        className={cn(
                          'w-full p-4 border-4 transition-all text-left hover:translate-x-1 hover:-translate-y-1',
                          selectedSkill === s.id
                            ? cn(domain.borderColor, 'bg-[#1e3a5f]')
                            : 'bg-[#0f2744] border-slate-700 hover:border-slate-500'
                        )}
                        style={{ boxShadow: '3px 3px 0 #0a1628' }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-black uppercase tracking-wide">{s.name}</p>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1 font-medium">{prompt?.primary}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-500" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 4: Primary Response */}
            {step === 4 && skillPrompts && domain && (
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
                  {dynamicPrompt || (reflectionMode === 'win' ? skillPrompts.primary : `How would you like to improve at this?`)}
                </h1>

                {!dynamicPrompt && (
                  <div className="flex flex-wrap gap-2 mb-4 justify-center">
                    {skillPrompts.examples.map((ex, i) => (
                      <span key={i} className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700">
                        {ex}
                      </span>
                    ))}
                  </div>
                )}

                <textarea
                  value={primaryResponse}
                  onChange={(e) => setPrimaryResponse(e.target.value)}
                  placeholder={reflectionMode === 'win' ? "Describe what happened..." : "What did you notice? What would you like to try?"}
                  className={cn(
                    'w-full h-40 bg-[#0f2744] border-4 p-4 text-lg placeholder:text-slate-600 outline-none resize-none transition-colors font-medium',
                    domain.borderColor, 'focus:border-[#6ba3d6]'
                  )}
                  style={{ boxShadow: 'inset 4px 4px 0 rgba(0,0,0,0.3)' }}
                  autoFocus
                />

                <p className="text-sm text-slate-500 mt-3 text-center">
                  {reflectionMode === 'win' ? 'Be specific - the details matter!' : 'Be honest - growth starts with awareness'}
                </p>
              </motion.div>
            )}

            {/* Step 5: Follow-up */}
            {step === 5 && skillPrompts && domain && (
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
                  Dig deeper to strengthen your growth
                </p>

                <textarea
                  value={followUpResponse}
                  onChange={(e) => setFollowUpResponse(e.target.value)}
                  placeholder="Optional - capture your insights..."
                  className="w-full h-32 bg-[#0f2744] border-4 border-[#4a7ba8] p-4 text-lg placeholder:text-slate-600 outline-none resize-none transition-colors font-medium focus:border-[#6ba3d6]"
                  style={{ boxShadow: 'inset 4px 4px 0 rgba(0,0,0,0.3)' }}
                  autoFocus
                />

                {/* Encouragement message */}
                <div className="mt-6 p-4 bg-[#0f2744]/50 border-2 border-[#4a7ba8]/50 rounded-lg">
                  <p className="text-sm text-slate-400 text-center">
                    {followUpResponse.length > 20
                      ? "Great reflection! Your insights help you grow."
                      : "Taking time to reflect deepens your learning."}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation - 8-bit style */}
      <div className="p-6 flex justify-between items-center relative z-10">
        <button
          onClick={() => setStep(s => s - 1)}
          className={cn(
            'flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-black uppercase tracking-[0.15em] px-4 py-2 border-2 border-transparent hover:border-slate-600',
            step === 0 && 'invisible'
          )}
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        {step < 5 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={(step === 4 && primaryResponse.length < 10) || (step === 1 && showCoachStep)}
            className={cn(
              'flex items-center gap-2 px-6 py-3 font-black uppercase tracking-[0.15em] transition-all border-4',
              (step === 0 || step === 2 || step === 3 || (step === 4 && primaryResponse.length >= 10))
                ? 'bg-[#2d5a87] border-[#4a7ba8] text-white hover:translate-x-1 hover:-translate-y-1'
                : 'bg-[#1e3a5f] border-[#2d4a6f] text-slate-500 cursor-not-allowed',
              (step === 1 && showCoachStep) && 'invisible'
            )}
            style={{ boxShadow: '4px 4px 0 #0a1628' }}
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 font-black uppercase tracking-[0.15em] bg-[#c0c0c0] border-4 border-[#e0e0e0] text-[#0a1628] hover:translate-x-1 hover:-translate-y-1 transition-transform"
            style={{ boxShadow: '4px 4px 0 #6b7280' }}
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
