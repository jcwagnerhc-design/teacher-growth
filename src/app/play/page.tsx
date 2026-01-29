'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock,
  Zap,
  Star,
  X,
  BookOpen,
  MessageCircle,
  ClipboardList,
  Presentation,
  BarChart3,
  Heart,
  Settings,
  Scroll,
  Camera,
  Trash2,
  Rocket,
  Target,
  TrendingUp,
  ChevronRight,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import PixelCharacter, { DEFAULT_CHARACTER, CharacterCustomization } from '@/components/PixelCharacter'
import { GoalCard, Goal } from '@/components/goals'
import { CoachCorner } from '@/components/coaching'
import ClassroomPokemon from '@/components/ClassroomPokemon'
import CoachRoom from '@/components/CoachRoom'
import { DEFAULT_CLASSROOM } from '@/types/classroom'

// Demo user ID
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

// Area names for the raycaster
const AREA_NAMES: Record<string, string> = {
  planning: 'Teacher Desk',
  environment: 'Discussion Table',
  instruction: 'Teaching Space',
  assessment: 'Student Work',
}

// Classroom areas based on Danielson Framework - with teacher-friendly names (Blair Academy colors)
const CLASSROOM_AREAS = [
  {
    id: 'planning',
    name: 'Teacher Desk',
    subtitle: 'Planning & Preparation',
    icon: ClipboardList,
    color: 'from-[#2d5a87] to-[#1e3a5f]',
    bgColor: 'bg-[#2d5a87]',
    borderColor: 'border-[#4a7ba8]',
    glowColor: 'shadow-[#2d5a87]/50',
    textColor: 'text-[#7db4e0]',
    description: 'Your home base. Where lessons come together and ideas take shape.',
    skills: [
      { id: 'objectives', name: 'Clear Learning Objectives', level: 2, unlocked: true },
      { id: 'sequencing', name: 'Lesson Sequencing', level: 1, unlocked: true },
      { id: 'materials', name: 'Resource Preparation', level: 1, unlocked: true },
      { id: 'differentiation', name: 'Planning for Differentiation', level: 0, unlocked: false },
    ],
    xp: 120,
    xpToNext: 200,
    level: 2,
  },
  {
    id: 'environment',
    name: 'Discussion Table',
    subtitle: 'Classroom Environment',
    icon: Heart,
    color: 'from-[#1e3a5f] to-[#0f2744]',
    bgColor: 'bg-[#1e3a5f]',
    borderColor: 'border-[#3d5a7f]',
    glowColor: 'shadow-[#1e3a5f]/50',
    textColor: 'text-[#6ba3d6]',
    description: 'The heart of your classroom. Where belonging and safety live.',
    skills: [
      { id: 'relationships', name: 'Building Relationships', level: 3, unlocked: true },
      { id: 'culture', name: 'Classroom Culture', level: 2, unlocked: true },
      { id: 'norms', name: 'Routines & Procedures', level: 2, unlocked: true },
      { id: 'student-voice', name: 'Student Voice & Agency', level: 1, unlocked: false },
    ],
    xp: 180,
    xpToNext: 300,
    level: 2,
  },
  {
    id: 'instruction',
    name: 'Teaching Space',
    subtitle: 'Instruction',
    icon: Presentation,
    color: 'from-[#4a7ba8] to-[#2d5a87]',
    bgColor: 'bg-[#4a7ba8]',
    borderColor: 'border-[#6ba3d6]',
    glowColor: 'shadow-[#4a7ba8]/50',
    textColor: 'text-[#a0c4e8]',
    description: 'Where the learning happens. Your stage for engaging minds.',
    skills: [
      { id: 'questioning', name: 'Questioning Strategies', level: 3, unlocked: true },
      { id: 'engagement', name: 'Student Engagement', level: 2, unlocked: true },
      { id: 'clarity', name: 'Clear Explanations', level: 2, unlocked: true },
      { id: 'discussion', name: 'Facilitating Discussion', level: 1, unlocked: true },
      { id: 'pacing', name: 'Pacing & Flexibility', level: 1, unlocked: false },
    ],
    xp: 285,
    xpToNext: 300,
    level: 3,
  },
  {
    id: 'assessment',
    name: 'Student Work',
    subtitle: 'Assessment & Feedback',
    icon: BarChart3,
    color: 'from-[#6b7280] to-[#4b5563]',
    bgColor: 'bg-[#6b7280]',
    borderColor: 'border-[#9ca3af]',
    glowColor: 'shadow-[#6b7280]/50',
    textColor: 'text-[#c0c0c0]',
    description: 'Celebrate progress and learn what students need next.',
    skills: [
      { id: 'formative', name: 'Formative Assessment', level: 2, unlocked: true },
      { id: 'feedback', name: 'Quality Feedback', level: 2, unlocked: true },
      { id: 'data-use', name: 'Using Data to Adjust', level: 1, unlocked: true },
      { id: 'self-assessment', name: 'Student Self-Assessment', level: 0, unlocked: false },
    ],
    xp: 145,
    xpToNext: 200,
    level: 2,
  },
]

interface SkillLogState {
  skillId: string
  skillName: string
  areaId: string
  step: number
  primaryResponse: string
  followUpResponse: string
  imagePreview: string | null
}

export default function PlayPage() {
  const router = useRouter()
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [profile, setProfile] = useState({ character: DEFAULT_CHARACTER, level: 4, name: 'Teacher', classroom: DEFAULT_CLASSROOM })
  const [recentGrowth, setRecentGrowth] = useState<Record<string, number>>({})
  const [showGrowthIndicators, setShowGrowthIndicators] = useState(false)

  // Skill logging state
  const [skillLog, setSkillLog] = useState<SkillLogState | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [earnedXp, setEarnedXp] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Goals state
  const [activeGoals, setActiveGoals] = useState<Goal[]>([])
  const [goalsExpanded, setGoalsExpanded] = useState(false)

  // Room state (classroom or coach office)
  const [currentRoom, setCurrentRoom] = useState<'classroom' | 'coach'>('classroom')
  const [roomTransition, setRoomTransition] = useState(false)

  // Raycaster dimensions (responsive)
  const [raycasterWidth, setRaycasterWidth] = useState(640)

  // Load profile and check for recent growth
  useEffect(() => {
    const saved = localStorage.getItem('teacher-profile')
    if (saved) {
      const parsed = JSON.parse(saved)
      setProfile({
        character: { ...DEFAULT_CHARACTER, ...parsed.character },
        level: 4,
        name: parsed.name || 'Teacher',
        classroom: parsed.classroom || DEFAULT_CLASSROOM,
      })
    }

    // Check for recent reflection growth
    const growth = localStorage.getItem('recent-growth')
    if (growth) {
      const parsed = JSON.parse(growth)
      setRecentGrowth(parsed)
      setShowGrowthIndicators(true)
      localStorage.removeItem('recent-growth')
      setTimeout(() => setShowGrowthIndicators(false), 5000)
    }

    // Fetch active goals
    const fetchGoals = async () => {
      try {
        const response = await fetch(`/api/goals?userId=${DEMO_USER_ID}&status=ACTIVE`)
        if (response.ok) {
          const data = await response.json()
          setActiveGoals(data.goals.slice(0, 3)) // Show top 3 goals
        }
      } catch (error) {
        console.error('Failed to fetch goals:', error)
      }
    }
    fetchGoals()
  }, [])

  // Handle area selection from raycaster
  const handleAreaSelect = useCallback((areaId: string) => {
    if (areaId === 'coach') {
      // Transition to coach room
      setRoomTransition(true)
      setTimeout(() => {
        setCurrentRoom('coach')
        setRoomTransition(false)
      }, 400)
      return
    }
    if (!skillLog) {
      setSelectedArea(areaId)
    }
  }, [skillLog])

  // Handle exiting coach room
  const handleExitCoachRoom = useCallback(() => {
    setRoomTransition(true)
    setTimeout(() => {
      setCurrentRoom('classroom')
      setRoomTransition(false)
    }, 400)
  }, [])

  // Handle window resize for raycaster
  useEffect(() => {
    const handleResize = () => {
      setRaycasterWidth(Math.min(800, window.innerWidth - 32))
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Start logging a skill
  const startSkillLog = (skillId: string, skillName: string, areaId: string) => {
    setSkillLog({
      skillId,
      skillName,
      areaId,
      step: 0,
      primaryResponse: '',
      followUpResponse: '',
      imagePreview: null,
    })
    setSelectedArea(null)
  }

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && skillLog) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSkillLog({
          ...skillLog,
          imagePreview: reader.result as string,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove uploaded image
  const removeImage = () => {
    if (skillLog) {
      setSkillLog({
        ...skillLog,
        imagePreview: null,
      })
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Submit skill log
  const handleSubmitSkillLog = async () => {
    if (!skillLog) return

    setIsSubmitting(true)

    // Calculate XP: base 15 + 10 for follow-up + 5 for image
    let xp = 15
    if (skillLog.followUpResponse.length > 10) xp += 10
    if (skillLog.imagePreview) xp += 5

    // Save growth for this area
    const growth = { [skillLog.areaId]: xp }
    localStorage.setItem('recent-growth', JSON.stringify(growth))

    await new Promise(resolve => setTimeout(resolve, 1000))

    setEarnedXp(xp)
    setIsSubmitting(false)
    setShowCompletion(true)
  }

  // Close completion and return to classroom
  const handleCompletionClose = () => {
    setShowCompletion(false)
    setSkillLog(null)
    setEarnedXp(0)

    // Trigger growth indicators
    const growth = localStorage.getItem('recent-growth')
    if (growth) {
      setRecentGrowth(JSON.parse(growth))
      setShowGrowthIndicators(true)
      localStorage.removeItem('recent-growth')
      setTimeout(() => setShowGrowthIndicators(false), 5000)
    }
  }

  const area = CLASSROOM_AREAS.find(a => a.id === selectedArea)
  const totalXp = CLASSROOM_AREAS.reduce((sum, a) => sum + a.xp, 0)
  const skillPrompts = skillLog ? SKILL_PROMPTS[skillLog.skillId] : null
  const skillLogArea = skillLog ? CLASSROOM_AREAS.find(a => a.id === skillLog.areaId) : null

  return (
    <div className="min-h-screen text-white overflow-hidden bg-[#0a1628] flex flex-col">

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-30 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-700">
            <PixelCharacter
              customization={profile.character as CharacterCustomization}
              level={profile.level}
              size="sm"
            />
            <div>
              <p className="font-semibold text-sm">{profile.name}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#c0c0c0]" />
                {totalXp} XP
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/play/quests')}
              className="p-2 bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
            >
              <Scroll className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/play/settings')}
              className="p-2 bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Active Goals - Collapsible */}
      <div className="absolute top-20 left-4 z-20">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-700 overflow-hidden"
        >
          <button
            onClick={() => setGoalsExpanded(!goalsExpanded)}
            className="px-3 py-2 flex items-center gap-2 hover:bg-slate-800/50 transition-colors"
          >
            <Target className="w-4 h-4 text-[#7db4e0]" />
            <span className="text-sm font-medium">Goals</span>
            {activeGoals.length > 0 && (
              <span className="text-xs bg-[#2d5a87]/50 text-[#7db4e0] px-1.5 py-0.5 rounded">
                {activeGoals.length}
              </span>
            )}
            <ChevronRight className={cn(
              'w-3 h-3 text-slate-500 transition-transform ml-1',
              goalsExpanded && 'rotate-90'
            )} />
          </button>

          <AnimatePresence>
            {goalsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 space-y-2 max-w-xs">
                  {activeGoals.length === 0 ? (
                    <button
                      onClick={() => router.push('/play/goals')}
                      className="text-xs text-[#7db4e0] hover:text-white transition-colors"
                    >
                      + Set a growth goal
                    </button>
                  ) : (
                    <>
                      {activeGoals.map(goal => (
                        <GoalCard key={goal.id} goal={goal} variant="compact" />
                      ))}
                      <button
                        onClick={() => router.push('/play/goals')}
                        className="text-xs text-slate-500 hover:text-white transition-colors"
                      >
                        Manage goals
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Coach's Corner - Floating Panel (hidden when in coach room) */}
      {currentRoom === 'classroom' && (
        <div className="absolute top-20 right-4 z-20 max-w-xs w-72">
          <CoachCorner userId={DEMO_USER_ID} defaultExpanded={false} />
        </div>
      )}

      {/* Room View with Transition */}
      <div className="relative w-full flex-1 flex items-center justify-center pt-4 pb-20">
        {/* Transition overlay */}
        <AnimatePresence>
          {roomTransition && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black z-40"
            />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {currentRoom === 'classroom' ? (
            <motion.div
              key="classroom"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ClassroomPokemon
                onAreaSelect={handleAreaSelect}
                onEnterDoor={() => {
                  setRoomTransition(true)
                  setTimeout(() => {
                    setCurrentRoom('coach')
                    setRoomTransition(false)
                  }, 400)
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="coach"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CoachRoom onExit={handleExitCoachRoom} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* XP Growth Indicators */}
        {showGrowthIndicators && Object.entries(recentGrowth).map(([areaId, xp]) => (
          <motion.div
            key={areaId}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#2d5a87] rounded-lg text-lg font-bold z-10 border-2 border-[#4a7ba8]"
          >
            +{xp} XP - {AREA_NAMES[areaId] || areaId}
          </motion.div>
        ))}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t-2 border-slate-700 z-30">
        <div className="max-w-4xl mx-auto px-2">
          <div className="flex items-center justify-around py-3">
            <button className="flex flex-col items-center gap-1 text-white px-4 py-2 rounded-lg bg-slate-800">
              <Rocket className="w-7 h-7" />
              <span className="text-sm font-bold">Base</span>
            </button>
            <button onClick={() => router.push('/play/reflect')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-800">
              <BookOpen className="w-7 h-7" />
              <span className="text-sm font-medium">Log</span>
            </button>
            <button onClick={() => router.push('/play/coach')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-800">
              <MessageCircle className="w-7 h-7" />
              <span className="text-sm font-medium">Coach</span>
            </button>
            <button onClick={() => router.push('/play/goals')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-800">
              <Target className="w-7 h-7" />
              <span className="text-sm font-medium">Goals</span>
            </button>
            <button onClick={() => router.push('/play/progress')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-800">
              <TrendingUp className="w-7 h-7" />
              <span className="text-sm font-medium">Progress</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Area Detail Modal */}
      <AnimatePresence>
        {area && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={() => setSelectedArea(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-slate-900 rounded-t-2xl max-h-[75vh] overflow-auto"
            >
              <div className="sticky top-0 bg-slate-900 pt-3 pb-2 flex justify-center">
                <div className="w-10 h-1 bg-slate-700 rounded-full" />
              </div>

              <div className="px-5 pb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center', area.borderColor)}>
                      <area.icon className={cn('w-6 h-6', area.textColor)} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">{area.name}</h2>
                      <p className="text-sm text-slate-500">{area.subtitle}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedArea(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-slate-400 text-sm mb-4">{area.description}</p>

                <div className="bg-slate-800/50 rounded-lg p-3 mb-5">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">Level {area.level}</span>
                    <span className="text-slate-400">{area.xp}/{area.xpToNext} XP</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(area.xp / area.xpToNext) * 100}%` }}
                      className={cn('h-full rounded-full', area.bgColor)}
                    />
                  </div>
                </div>

                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                  Skills
                </h3>
                <div className="space-y-2">
                  {area.skills.map((skill, i) => (
                    <motion.div
                      key={skill.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        'p-3 rounded-lg border flex items-center gap-3',
                        skill.unlocked ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-900/50 border-slate-800 opacity-50'
                      )}
                    >
                      {skill.unlocked ? (
                        <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center">
                          <span className={cn('text-sm font-medium', area.textColor)}>{skill.level}</span>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center">
                          <Lock className="w-4 h-4 text-slate-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{skill.name}</p>
                        {skill.unlocked && (
                          <div className="flex items-center gap-0.5 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={cn('w-2.5 h-2.5', i < skill.level ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700')} />
                            ))}
                          </div>
                        )}
                      </div>
                      {skill.unlocked && (
                        <button
                          onClick={() => startSkillLog(skill.id, skill.name, area.id)}
                          className="px-3 py-1.5 rounded text-xs font-medium bg-slate-700 hover:bg-slate-600 transition-colors"
                        >
                          Log
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skill Logging Modal */}
      <AnimatePresence>
        {skillLog && skillPrompts && skillLogArea && !showCompletion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 rounded-xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Log reflection</p>
                    <h2 className="font-semibold">{skillLog.skillName}</h2>
                  </div>
                  <button onClick={() => setSkillLog(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {/* Progress */}
                <div className="flex items-center gap-1 mt-3">
                  {[0, 1, 2].map(i => (
                    <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors', skillLog.step >= i ? 'bg-[#4a7ba8]' : 'bg-slate-700')} />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <AnimatePresence mode="wait">
                  {skillLog.step === 0 && (
                    <motion.div key="step0" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                      <h3 className="font-medium mb-3">{skillPrompts.primary}</h3>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {skillPrompts.examples.map((ex, i) => (
                          <span key={i} className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">{ex}</span>
                        ))}
                      </div>
                      <textarea
                        value={skillLog.primaryResponse}
                        onChange={(e) => setSkillLog({ ...skillLog, primaryResponse: e.target.value })}
                        placeholder="Describe what happened..."
                        className="w-full h-28 bg-slate-800 border border-slate-700 focus:border-slate-500 rounded-lg p-3 text-sm outline-none resize-none transition-colors"
                        autoFocus
                      />
                    </motion.div>
                  )}

                  {skillLog.step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                      <h3 className="font-medium mb-3">{skillPrompts.followUp}</h3>
                      <textarea
                        value={skillLog.followUpResponse}
                        onChange={(e) => setSkillLog({ ...skillLog, followUpResponse: e.target.value })}
                        placeholder="Reflect on the outcome..."
                        className="w-full h-28 bg-slate-800 border border-slate-700 focus:border-slate-500 rounded-lg p-3 text-sm outline-none resize-none transition-colors"
                        autoFocus
                      />
                      <p className="text-xs text-slate-500 mt-2">+10 XP for thoughtful reflection</p>
                    </motion.div>
                  )}

                  {skillLog.step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                      <h3 className="font-medium mb-2">Add photo (optional)</h3>
                      <p className="text-slate-500 text-sm mb-3">Document student work or materials.</p>

                      {skillLog.imagePreview ? (
                        <div className="relative">
                          <img src={skillLog.imagePreview} alt="Upload preview" className="w-full h-40 object-cover rounded-lg" />
                          <button
                            onClick={removeImage}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 rounded text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 bg-slate-800 border border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-slate-500 transition-colors">
                          <Camera className="w-8 h-8 text-slate-500 mb-2" />
                          <span className="text-sm text-slate-500">Upload image (+5 XP)</span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}

                      <div className="mt-4 p-3 bg-slate-800 rounded-lg">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Total XP</span>
                          <span className="font-medium">
                            {15 + (skillLog.followUpResponse.length > 10 ? 10 : 0) + (skillLog.imagePreview ? 5 : 0)} XP
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <div className="p-4 pt-0 flex justify-between">
                <button
                  onClick={() => setSkillLog({ ...skillLog, step: skillLog.step - 1 })}
                  className={cn('text-sm text-slate-500 hover:text-white transition-colors', skillLog.step === 0 && 'invisible')}
                >
                  Back
                </button>

                {skillLog.step < 2 ? (
                  <button
                    onClick={() => setSkillLog({ ...skillLog, step: skillLog.step + 1 })}
                    disabled={skillLog.step === 0 && skillLog.primaryResponse.length < 10}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      (skillLog.step === 0 && skillLog.primaryResponse.length >= 10) || skillLog.step === 1
                        ? 'bg-[#2d5a87] text-white hover:bg-[#4a7ba8]'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    )}
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitSkillLog}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    {isSubmitting ? 'Saving...' : 'Complete'}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Modal */}
      <AnimatePresence>
        {showCompletion && skillLog && skillLogArea && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center bg-slate-800"
              >
                <skillLogArea.icon className={cn('w-8 h-8', skillLogArea.textColor)} />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold mb-1"
              >
                Reflection logged
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-slate-500 text-sm mb-4"
              >
                {skillLog.skillName}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-[#7db4e0] mb-6"
              >
                +{earnedXp} XP
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={handleCompletionClose}
                className="px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
              >
                Done
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
