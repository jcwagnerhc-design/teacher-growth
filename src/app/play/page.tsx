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
  Award,
  Sparkles,
  ClipboardList,
  Presentation,
  BarChart3,
  Heart,
  Settings,
  Scroll,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Plus,
  ChevronRight,
  ChevronLeft,
  Camera,
  Trash2,
  Rocket,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import PixelCharacter, { DEFAULT_CHARACTER, CharacterCustomization } from '@/components/PixelCharacter'

// Floating stars component for space theme - uses seeded positions to avoid hydration mismatch
const STAR_POSITIONS = [
  { left: 14.3, top: 60.8, size: 3 }, { left: 51.4, top: 74.9, size: 2 }, { left: 95.7, top: 6.8, size: 2 },
  { left: 33.6, top: 7.9, size: 1 }, { left: 68.8, top: 24.2, size: 2 }, { left: 68.3, top: 62.7, size: 1 },
  { left: 91.6, top: 26.7, size: 2 }, { left: 61.6, top: 70.5, size: 1 }, { left: 11.8, top: 53.6, size: 3 },
  { left: 33.6, top: 45.6, size: 1 }, { left: 97.4, top: 20.2, size: 2 }, { left: 39.2, top: 91.5, size: 2 },
  { left: 26.8, top: 90.4, size: 2 }, { left: 15.8, top: 58.5, size: 1 }, { left: 59.9, top: 62.6, size: 2 },
  { left: 36.5, top: 65.1, size: 2 }, { left: 84.2, top: 14.7, size: 1 }, { left: 63.8, top: 40.4, size: 1 },
  { left: 29.6, top: 91.2, size: 3 }, { left: 31.8, top: 83.8, size: 2 }, { left: 10.2, top: 2.6, size: 1 },
  { left: 87.7, top: 11.3, size: 2 }, { left: 65.3, top: 59.3, size: 2 }, { left: 42.8, top: 39.1, size: 2 },
  { left: 61.9, top: 94.8, size: 3 }, { left: 76.7, top: 98.7, size: 3 }, { left: 6.5, top: 31.9, size: 2 },
  { left: 76.8, top: 13.6, size: 2 }, { left: 73.1, top: 47.5, size: 1 }, { left: 26.0, top: 73.0, size: 1 },
  { left: 83.2, top: 16.7, size: 2 }, { left: 73.5, top: 6.0, size: 2 }, { left: 32.4, top: 1.6, size: 2 },
  { left: 79.6, top: 54.7, size: 1 }, { left: 43.0, top: 45.6, size: 2 }, { left: 95.2, top: 95.4, size: 1 },
  { left: 26.0, top: 85.7, size: 3 }, { left: 31.5, top: 5.2, size: 1 }, { left: 81.5, top: 49.0, size: 1 },
  { left: 16.4, top: 22.0, size: 1 }, { left: 55.4, top: 19.0, size: 2 }, { left: 31.8, top: 40.8, size: 2 },
  { left: 97.6, top: 43.9, size: 1 }, { left: 23.0, top: 73.8, size: 1 }, { left: 28.9, top: 14.6, size: 3 },
  { left: 3.3, top: 77.2, size: 1 }, { left: 99.4, top: 32.4, size: 1 }, { left: 80.3, top: 40.6, size: 1 },
  { left: 6.8, top: 96.2, size: 1 }, { left: 9.8, top: 8.9, size: 2 },
]

const FloatingStars = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    {STAR_POSITIONS.map((star, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-white"
        style={{
          left: `${star.left}%`,
          top: `${star.top}%`,
          width: `${star.size}px`,
          height: `${star.size}px`,
        }}
        animate={{
          opacity: [0.2, 0.8, 0.2],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 2 + (i % 5),
          repeat: Infinity,
          delay: (i % 10) * 0.2,
        }}
      />
    ))}
  </div>
)

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

// Interaction zones for each area (x, y in percentages, with radius)
const INTERACTION_ZONES = {
  planning: { x: 85, y: 78, radius: 12, label: 'Teacher Desk' },
  environment: { x: 50, y: 58, radius: 15, label: 'Class Community' },
  instruction: { x: 50, y: 32, radius: 12, label: 'Teaching Space' },
  assessment: { x: 15, y: 45, radius: 12, label: 'Student Work' },
}

// Classroom areas based on Danielson Framework - with teacher-friendly names
const CLASSROOM_AREAS = [
  {
    id: 'planning',
    name: 'Teacher Desk',
    subtitle: 'Planning & Preparation',
    icon: ClipboardList,
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-500',
    borderColor: 'border-emerald-400',
    glowColor: 'shadow-emerald-500/50',
    textColor: 'text-emerald-400',
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
    name: 'Class Community',
    subtitle: 'Classroom Environment',
    icon: Heart,
    color: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-500',
    borderColor: 'border-rose-400',
    glowColor: 'shadow-rose-500/50',
    textColor: 'text-rose-400',
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
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-500',
    borderColor: 'border-violet-400',
    glowColor: 'shadow-violet-500/50',
    textColor: 'text-violet-400',
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
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-500',
    borderColor: 'border-amber-400',
    glowColor: 'shadow-amber-500/50',
    textColor: 'text-amber-400',
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

// Movement boundaries (percentages)
const BOUNDS = {
  minX: 8,
  maxX: 92,
  minY: 28,
  maxY: 88,
}

const MOVE_SPEED = 2

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
  const [profile, setProfile] = useState({ character: DEFAULT_CHARACTER, level: 4, name: 'Teacher' })
  const [characterPosition, setCharacterPosition] = useState({ x: 50, y: 65 })
  const [nearbyArea, setNearbyArea] = useState<string | null>(null)
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set())
  const [recentGrowth, setRecentGrowth] = useState<Record<string, number>>({})
  const [showGrowthIndicators, setShowGrowthIndicators] = useState(false)

  // Skill logging state
  const [skillLog, setSkillLog] = useState<SkillLogState | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [earnedXp, setEarnedXp] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load profile and check for recent growth
  useEffect(() => {
    const saved = localStorage.getItem('teacher-profile')
    if (saved) {
      const parsed = JSON.parse(saved)
      setProfile({
        character: parsed.character || DEFAULT_CHARACTER,
        level: 4,
        name: parsed.name || 'Teacher',
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
  }, [])

  // Check if character is near any interaction zone
  const checkNearbyArea = useCallback((pos: { x: number; y: number }) => {
    for (const [areaId, zone] of Object.entries(INTERACTION_ZONES)) {
      const distance = Math.sqrt(
        Math.pow(pos.x - zone.x, 2) + Math.pow(pos.y - zone.y, 2)
      )
      if (distance < zone.radius) {
        return areaId
      }
    }
    return null
  }, [])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if modal is open or typing in input
      if (selectedArea || skillLog || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const key = e.key.toLowerCase()

      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault()
        setKeysPressed(prev => new Set(prev).add(key))
      }

      if ((key === ' ' || key === 'enter') && nearbyArea) {
        e.preventDefault()
        setSelectedArea(nearbyArea)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      setKeysPressed(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [selectedArea, nearbyArea, skillLog])

  // Game loop for smooth movement
  useEffect(() => {
    if (keysPressed.size === 0 || selectedArea || skillLog) return

    const moveInterval = setInterval(() => {
      setCharacterPosition(prev => {
        let { x, y } = prev

        if (keysPressed.has('w') || keysPressed.has('arrowup')) y -= MOVE_SPEED
        if (keysPressed.has('s') || keysPressed.has('arrowdown')) y += MOVE_SPEED
        if (keysPressed.has('a') || keysPressed.has('arrowleft')) x -= MOVE_SPEED
        if (keysPressed.has('d') || keysPressed.has('arrowright')) x += MOVE_SPEED

        x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, x))
        y = Math.max(BOUNDS.minY, Math.min(BOUNDS.maxY, y))

        const newPos = { x, y }
        const nearby = checkNearbyArea(newPos)
        setNearbyArea(nearby)

        return newPos
      })
    }, 16)

    return () => clearInterval(moveInterval)
  }, [keysPressed, selectedArea, skillLog, checkNearbyArea])

  useEffect(() => {
    setNearbyArea(checkNearbyArea(characterPosition))
  }, [characterPosition, checkNearbyArea])

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
  const nearbyAreaData = nearbyArea ? CLASSROOM_AREAS.find(a => a.id === nearbyArea) : null
  const skillPrompts = skillLog ? SKILL_PROMPTS[skillLog.skillId] : null
  const skillLogArea = skillLog ? CLASSROOM_AREAS.find(a => a.id === skillLog.areaId) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white overflow-hidden">
      <FloatingStars />

      {/* Header - Arcade Style */}
      <header className="absolute top-0 left-0 right-0 z-30 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20">
            <PixelCharacter
              customization={profile.character as CharacterCustomization}
              level={profile.level}
              size="sm"
            />
            <div>
              <p className="font-black text-sm uppercase tracking-wide">{profile.name}</p>
              <p className="text-xs text-yellow-400 flex items-center gap-1 font-bold">
                <Zap className="w-3 h-3 fill-yellow-400" />
                {totalXp} XP
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/play/quests')}
              className="p-3 bg-slate-900/90 backdrop-blur-sm rounded-xl border-2 border-violet-500/50 text-violet-400 hover:text-white hover:border-violet-400 transition-all shadow-lg shadow-violet-500/20"
            >
              <Scroll className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/play/settings')}
              className="p-3 bg-slate-900/90 backdrop-blur-sm rounded-xl border-2 border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 transition-all"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Space Station Classroom View */}
      <div className="relative w-full h-screen">
        {/* Space station floor */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950" />

        {/* Grid floor pattern - space station style */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(34, 211, 238, 0.15) 50px, rgba(34, 211, 238, 0.15) 51px),
              repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(34, 211, 238, 0.15) 50px, rgba(34, 211, 238, 0.15) 51px)
            `,
          }}
        />

        {/* Back Wall - Space Station Viewport */}
        <div className="absolute top-0 left-0 right-0 h-[25%] bg-gradient-to-b from-indigo-900/50 to-slate-900 border-b-4 border-cyan-500/30" />

        {/* Main Screen / Viewport */}
        <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[50%] h-[15%]">
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border-4 border-cyan-500/50 shadow-2xl shadow-cyan-500/20 flex items-center justify-center">
            <span className="text-cyan-400 font-black uppercase tracking-widest text-sm" style={{ textShadow: '0 0 10px rgba(34, 211, 238, 0.5)' }}>Mission: Level Up</span>
          </div>
          <div className="absolute -bottom-2 left-[10%] right-[10%] h-3 bg-slate-700 rounded-b-lg border-x-2 border-b-2 border-cyan-500/30" />
        </div>

        {/* Space Station Panels / Posters */}
        <div className="absolute top-[6%] left-[5%] w-16 h-20 bg-slate-800 rounded-lg shadow-lg border-2 border-cyan-500/50 flex flex-col items-center justify-center p-2 shadow-cyan-500/20">
          <Rocket className="w-5 h-5 text-cyan-400 mb-1" />
          <span className="text-[7px] text-cyan-400 font-bold text-center uppercase tracking-wide">Level Up!</span>
        </div>
        <div className="absolute top-[8%] right-[8%] w-20 h-16 bg-slate-800 rounded-lg shadow-lg border-2 border-violet-500/50 flex flex-col items-center justify-center p-2 shadow-violet-500/20">
          <Star className="w-5 h-5 text-violet-400 mb-1" />
          <span className="text-[7px] text-violet-400 font-bold text-center uppercase tracking-wide">Learn More</span>
        </div>

        {/* Clock */}
        <div className="absolute top-[4%] right-[20%] w-10 h-10 bg-slate-100 rounded-full border-4 border-amber-700 shadow-lg flex items-center justify-center">
          <div className="w-0.5 h-3 bg-slate-800 absolute origin-bottom rotate-45" style={{ bottom: '50%' }} />
          <div className="w-0.5 h-2 bg-slate-800 absolute origin-bottom -rotate-12" style={{ bottom: '50%' }} />
        </div>

        {/* Student Work Wall - LEFT SIDE (was assessment/data wall) */}
        <div className={cn(
          'absolute top-[30%] left-[3%] transition-all duration-300',
          nearbyArea === 'assessment' && 'scale-105',
          showGrowthIndicators && recentGrowth['assessment'] && 'animate-pulse'
        )}>
          {showGrowthIndicators && recentGrowth['assessment'] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-16 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 rounded-full text-sm font-bold whitespace-nowrap z-10 shadow-lg shadow-amber-500/50"
            >
              +{recentGrowth['assessment']} XP
            </motion.div>
          )}
          {/* Bulletin board with student work */}
          <div className={cn(
            'w-28 h-36 bg-amber-100 rounded-lg border-8 shadow-xl relative transition-all',
            nearbyArea === 'assessment' ? 'border-amber-500 shadow-2xl shadow-amber-500/40' : 'border-amber-700'
          )}>
            {/* Student papers pinned to board */}
            <div className="absolute top-2 left-2 w-10 h-12 bg-white rounded-sm shadow transform -rotate-3 border border-slate-200">
              <div className="p-1">
                <div className="w-6 h-1 bg-slate-300 rounded mb-1" />
                <div className="w-8 h-1 bg-slate-200 rounded mb-1" />
                <div className="w-5 h-1 bg-slate-200 rounded" />
              </div>
              <div className="absolute -top-1 left-1/2 w-2 h-2 bg-red-500 rounded-full" />
            </div>
            <div className="absolute top-3 right-2 w-10 h-10 bg-yellow-100 rounded-sm shadow transform rotate-2 border border-yellow-200">
              <div className="w-4 h-4 bg-blue-300/50 rounded m-1" />
              <div className="absolute -top-1 left-1/2 w-2 h-2 bg-blue-500 rounded-full" />
            </div>
            <div className="absolute bottom-3 left-3 w-12 h-10 bg-white rounded-sm shadow transform rotate-1 border border-slate-200">
              <div className="p-1">
                <div className="w-8 h-1 bg-emerald-300 rounded mb-1" />
                <div className="w-6 h-1 bg-emerald-200 rounded" />
              </div>
              <div className="absolute -top-1 right-2 w-2 h-2 bg-emerald-500 rounded-full" />
            </div>
            <div className="absolute bottom-2 right-2 w-8 h-8 bg-pink-100 rounded-sm shadow transform -rotate-2 border border-pink-200">
              <div className="absolute -top-1 left-1/2 w-2 h-2 bg-pink-500 rounded-full" />
            </div>
            {/* Gold star sticker */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
            </div>
          </div>
          <div className={cn(
            'absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-2 rounded-xl transition-all whitespace-nowrap',
            'bg-slate-900/90 backdrop-blur-sm border-2',
            nearbyArea === 'assessment' ? 'scale-110 shadow-lg shadow-amber-500/50 border-amber-400' : 'opacity-90 border-amber-500/50'
          )}>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-sm text-amber-400">Student Work</span>
            </div>
            <div className="text-xs text-amber-400/70">Level {CLASSROOM_AREAS[3].level}</div>
          </div>
        </div>

        {/* Student Desks - Class Community (center) */}
        <div className={cn(
          'absolute top-[45%] left-1/2 -translate-x-1/2 transition-all duration-300',
          nearbyArea === 'environment' && 'scale-105',
          showGrowthIndicators && recentGrowth['environment'] && 'animate-pulse'
        )}>
          {showGrowthIndicators && recentGrowth['environment'] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-16 left-1/2 -translate-x-1/2 px-3 py-1 bg-rose-500 rounded-full text-sm font-bold whitespace-nowrap z-10 shadow-lg shadow-rose-500/50"
            >
              +{recentGrowth['environment']} XP
            </motion.div>
          )}
          {/* Classroom rug underneath desks */}
          <div className="absolute -inset-4 bg-gradient-to-br from-rose-200/30 to-rose-300/30 rounded-2xl -z-10" />
          <div className={cn('relative transition-all', nearbyArea === 'environment' && 'drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]')}>
            <div className="flex gap-4 mb-4">
              {[0,1,2].map(i => (
                <div key={i} className={cn('w-14 h-10 bg-amber-600 rounded border-2 shadow-lg transition-all', nearbyArea === 'environment' ? 'border-rose-400' : 'border-amber-800')}>
                  <div className="w-full h-1 bg-amber-500 rounded-t" />
                </div>
              ))}
            </div>
            <div className="flex gap-4 mb-4">
              {[0,1,2].map(i => (
                <div key={i} className={cn('w-14 h-10 bg-amber-600 rounded border-2 shadow-lg transition-all', nearbyArea === 'environment' ? 'border-rose-400' : 'border-amber-800')}>
                  <div className="w-full h-1 bg-amber-500 rounded-t" />
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              {[0,1,2].map(i => (
                <div key={i} className={cn('w-14 h-10 bg-amber-600 rounded border-2 shadow-lg transition-all', nearbyArea === 'environment' ? 'border-rose-400' : 'border-amber-800')}>
                  <div className="w-full h-1 bg-amber-500 rounded-t" />
                </div>
              ))}
            </div>
          </div>
          <div className={cn(
            'absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-2 rounded-xl transition-all whitespace-nowrap',
            'bg-slate-900/90 backdrop-blur-sm border-2',
            nearbyArea === 'environment' ? 'scale-110 shadow-lg shadow-rose-500/50 border-rose-400' : 'opacity-90 border-rose-500/50'
          )}>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <span className="font-bold text-sm text-rose-400">Community</span>
            </div>
            <div className="text-xs text-rose-400/70">Level {CLASSROOM_AREAS[1].level}</div>
          </div>
        </div>

        {/* Teaching Space - Whiteboard/Front of room */}
        <div className={cn(
          'absolute top-[22%] left-1/2 -translate-x-1/2 transition-all duration-300',
          nearbyArea === 'instruction' && 'scale-105',
          showGrowthIndicators && recentGrowth['instruction'] && 'animate-pulse'
        )}>
          {showGrowthIndicators && recentGrowth['instruction'] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-16 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-500 rounded-full text-sm font-bold whitespace-nowrap z-10 shadow-lg shadow-violet-500/50"
            >
              +{recentGrowth['instruction']} XP
            </motion.div>
          )}
          {/* Whiteboard */}
          <div className={cn(
            'w-48 h-24 bg-slate-100 rounded-lg border-8 shadow-xl relative transition-all',
            nearbyArea === 'instruction' ? 'border-violet-500 shadow-2xl shadow-violet-500/30' : 'border-slate-400'
          )}>
            {/* Whiteboard content */}
            <div className="p-2">
              <div className="w-20 h-2 bg-blue-400/40 rounded mb-2" />
              <div className="w-32 h-1 bg-slate-300 rounded mb-1" />
              <div className="w-28 h-1 bg-slate-300 rounded mb-1" />
              <div className="w-24 h-1 bg-slate-300 rounded" />
            </div>
            {/* Marker tray */}
            <div className="absolute -bottom-2 left-1/4 right-1/4 h-3 bg-slate-300 rounded-b flex items-center justify-center gap-1 px-2">
              <div className="w-6 h-2 bg-blue-600 rounded-full" />
              <div className="w-6 h-2 bg-red-600 rounded-full" />
              <div className="w-6 h-2 bg-emerald-600 rounded-full" />
            </div>
          </div>
          <div className={cn(
            'absolute -bottom-14 left-1/2 -translate-x-1/2 px-3 py-2 rounded-xl transition-all whitespace-nowrap',
            'bg-slate-900/90 backdrop-blur-sm border-2',
            nearbyArea === 'instruction' ? 'scale-110 shadow-lg shadow-violet-500/50 border-violet-400' : 'opacity-90 border-violet-500/50'
          )}>
            <div className="flex items-center gap-2">
              <Presentation className="w-4 h-4 text-violet-400" />
              <span className="font-bold text-sm text-violet-400">Teaching Space</span>
            </div>
            <div className="text-xs text-violet-400/70">Level {CLASSROOM_AREAS[2].level}</div>
          </div>
        </div>

        {/* Teacher's Desk - RIGHT SIDE (was planning) */}
        <div className={cn(
          'absolute bottom-[18%] right-[8%] transition-all duration-300',
          nearbyArea === 'planning' && 'scale-105',
          showGrowthIndicators && recentGrowth['planning'] && 'animate-pulse'
        )}>
          {showGrowthIndicators && recentGrowth['planning'] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-20 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 rounded-full text-sm font-bold whitespace-nowrap z-10 shadow-lg shadow-emerald-500/50"
            >
              +{recentGrowth['planning']} XP
            </motion.div>
          )}
          {/* Cozy teacher desk */}
          <div className={cn(
            'w-36 h-24 bg-amber-700 rounded-lg border-4 shadow-xl relative transition-all',
            nearbyArea === 'planning' ? 'border-emerald-400 shadow-2xl shadow-emerald-500/40' : 'border-amber-900'
          )}>
            {/* Laptop */}
            <div className="absolute top-2 left-2 w-14 h-10 bg-slate-700 rounded-t-lg border-2 border-slate-600">
              <div className="w-full h-7 bg-slate-800 rounded-t flex items-center justify-center">
                <div className="w-8 h-4 bg-blue-400/30 rounded" />
              </div>
            </div>
            {/* Coffee mug */}
            <div className="absolute top-3 right-3 w-5 h-6 bg-rose-400 rounded-b-lg border-2 border-rose-500">
              <div className="absolute -right-2 top-1 w-2 h-3 border-2 border-rose-500 rounded-r-full bg-transparent" />
            </div>
            {/* Papers */}
            <div className="absolute bottom-2 left-4 w-10 h-8 bg-white rounded-sm shadow transform -rotate-3 border border-slate-200" />
            <div className="absolute bottom-3 left-6 w-10 h-8 bg-yellow-100 rounded-sm shadow transform rotate-2" />
            {/* Pencil cup */}
            <div className="absolute bottom-2 right-6 w-4 h-6 bg-slate-500 rounded-t-sm">
              <div className="absolute -top-3 left-0 w-1 h-4 bg-yellow-400 transform -rotate-12" />
              <div className="absolute -top-2 left-1 w-1 h-3 bg-blue-400 transform rotate-6" />
            </div>
          </div>
          {/* Teacher chair */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-12 h-8 bg-slate-600 rounded-t-lg border-2 border-slate-700" />
          <div className={cn(
            'absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-2 rounded-xl transition-all whitespace-nowrap',
            'bg-slate-900/90 backdrop-blur-sm border-2',
            nearbyArea === 'planning' ? 'scale-110 shadow-lg shadow-emerald-500/50 border-emerald-400' : 'opacity-90 border-emerald-500/50'
          )}>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-sm text-emerald-400">Teacher Desk</span>
            </div>
            <div className="text-xs text-emerald-400/70">Level {CLASSROOM_AREAS[0].level}</div>
          </div>
        </div>

        {/* Bookshelf - cozy corner */}
        <div className="absolute top-[30%] right-[3%] w-10 h-28 bg-amber-800 rounded border-4 border-amber-900 shadow-lg">
          <div className="h-1/4 border-b border-amber-900 flex items-center justify-center px-1">
            <div className="w-3 h-5 bg-blue-800 rounded-sm" />
            <div className="w-2 h-4 bg-red-800 rounded-sm" />
          </div>
          <div className="h-1/4 border-b border-amber-900 flex items-center justify-center px-1">
            <div className="w-4 h-4 bg-emerald-800 rounded-sm" />
            <div className="w-3 h-5 bg-purple-800 rounded-sm" />
          </div>
          <div className="h-1/4 border-b border-amber-900 flex items-center justify-center">
            <div className="w-6 h-4 bg-amber-600 rounded-sm" />
          </div>
          <div className="h-1/4 flex items-center justify-center">
            <div className="w-5 h-3 bg-slate-600 rounded-sm" />
          </div>
        </div>

        {/* Plant - homey touch */}
        <div className="absolute bottom-[35%] right-[3%]">
          <div className="w-8 h-6 bg-amber-600 rounded-t-lg border-2 border-amber-700" />
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <div className="w-3 h-5 bg-emerald-500 rounded-full transform -rotate-12" />
            <div className="w-3 h-5 bg-emerald-600 rounded-full transform rotate-12 -mt-3 ml-2" />
            <div className="w-3 h-6 bg-emerald-500 rounded-full -mt-4" />
          </div>
        </div>

        {/* Reading Corner Rug */}
        <div className="absolute bottom-[25%] left-[3%] w-16 h-16 bg-gradient-to-br from-blue-300/40 to-purple-300/40 rounded-full" />

        {/* Bean bag in reading corner */}
        <div className="absolute bottom-[28%] left-[5%] w-10 h-8 bg-purple-400 rounded-full border-2 border-purple-500 shadow-lg" />

        {/* Classroom Door */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-10 bg-amber-700 rounded-t-lg border-t-4 border-x-4 border-amber-800 flex items-center justify-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-4" />
        </div>

        {/* Windows with sunlight */}
        <div className="absolute top-[6%] left-[15%] w-12 h-20 bg-sky-200 rounded border-4 border-slate-500 shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-100/30 to-transparent" />
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-400" />
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-400" />
        </div>

        {/* Player Character */}
        <motion.div
          animate={{ left: `${characterPosition.x}%`, top: `${characterPosition.y}%` }}
          transition={{ type: 'tween', duration: 0.05 }}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
        >
          <PixelCharacter customization={profile.character as CharacterCustomization} level={profile.level} size="lg" />
        </motion.div>

        {/* Interaction prompt */}
        <AnimatePresence>
          {nearbyArea && nearbyAreaData && !selectedArea && !skillLog && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-sm rounded-xl px-4 py-3 border border-slate-700 z-25"
            >
              <p className="text-center text-sm">
                Press <kbd className="px-2 py-1 bg-slate-700 rounded text-xs mx-1">SPACE</kbd> to explore
              </p>
              <p className={cn('text-center text-xs mt-1', nearbyAreaData.textColor)}>{nearbyAreaData.name}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls hint */}
        <div className="absolute bottom-20 left-4 bg-slate-900/95 backdrop-blur-sm rounded-xl p-3 border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/10">
          <p className="text-xs text-cyan-400 mb-2 font-bold uppercase tracking-wide">Controls</p>
          <div className="flex flex-col items-center gap-1 text-xs">
            <kbd className="w-6 h-6 bg-slate-800 rounded border border-cyan-500/30 flex items-center justify-center text-cyan-400"><ArrowUp className="w-3 h-3" /></kbd>
            <div className="flex items-center gap-1">
              <kbd className="w-6 h-6 bg-slate-800 rounded border border-cyan-500/30 flex items-center justify-center text-cyan-400"><ArrowLeft className="w-3 h-3" /></kbd>
              <kbd className="w-6 h-6 bg-slate-800 rounded border border-cyan-500/30 flex items-center justify-center text-cyan-400"><ArrowDown className="w-3 h-3" /></kbd>
              <kbd className="w-6 h-6 bg-slate-800 rounded border border-cyan-500/30 flex items-center justify-center text-cyan-400"><ArrowRight className="w-3 h-3" /></kbd>
            </div>
            <p className="text-cyan-400/50 mt-1 text-[10px]">or WASD</p>
          </div>
        </div>
      </div>

      {/* Bottom Nav - Arcade Style */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-lg border-t-2 border-cyan-500/30 z-30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <button className="flex flex-col items-center gap-1 text-cyan-400">
              <Rocket className="w-6 h-6" />
              <span className="text-xs font-bold">Base</span>
            </button>
            <button onClick={() => router.push('/play/reflect')} className="flex flex-col items-center gap-1 text-slate-500 hover:text-violet-400 transition-colors">
              <BookOpen className="w-6 h-6" />
              <span className="text-xs">Log</span>
            </button>
            <button onClick={() => router.push('/play/quests')} className="flex flex-col items-center gap-1 text-slate-500 hover:text-amber-400 transition-colors">
              <Scroll className="w-6 h-6" />
              <span className="text-xs">Missions</span>
            </button>
            <button onClick={() => router.push('/play/profile')} className="flex flex-col items-center gap-1 text-slate-500 hover:text-emerald-400 transition-colors">
              <Award className="w-6 h-6" />
              <span className="text-xs">Rank</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Area Detail Modal - Space Station Terminal */}
      <AnimatePresence>
        {area && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={() => setSelectedArea(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-slate-900 rounded-t-3xl max-h-[80vh] overflow-auto border-t-2 border-x-2 border-cyan-500/30"
            >
              <div className="sticky top-0 bg-slate-900 pt-3 pb-2 flex justify-center">
                <div className="w-10 h-1 bg-cyan-500/50 rounded-full" />
              </div>

              <div className="px-6 pb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-14 h-14 rounded-xl bg-slate-800 border-2 flex items-center justify-center', area.borderColor)}>
                      <area.icon className={cn('w-7 h-7', area.textColor)} />
                    </div>
                    <div>
                      <h2 className={cn('text-xl font-black uppercase tracking-wide', area.textColor)} style={{ textShadow: `0 0 20px currentColor` }}>{area.name}</h2>
                      <p className="text-sm text-slate-400">{area.subtitle}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedArea(null)} className="p-2 text-slate-400 hover:text-white border border-slate-700 rounded-lg hover:border-slate-500 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-slate-400 mb-4">{area.description}</p>

                <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400 font-medium">Level {area.level} Progress</span>
                    <span className="text-yellow-400 flex items-center gap-1 font-bold">
                      <Zap className="w-4 h-4 fill-yellow-400" />
                      {area.xp}/{area.xpToNext}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(area.xp / area.xpToNext) * 100}%` }}
                      className={cn('h-full rounded-full', area.bgColor)}
                      style={{ boxShadow: `0 0 10px currentColor` }}
                    />
                  </div>
                </div>

                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-3">
                  Available Subsystems
                </h3>
                <div className="space-y-2">
                  {area.skills.map((skill, i) => (
                    <motion.div
                      key={skill.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        'p-4 rounded-xl border-2 flex items-center gap-3',
                        skill.unlocked ? `bg-slate-800/50 ${area.borderColor}/30 hover:${area.borderColor}/50` : 'bg-slate-900/50 border-slate-800 opacity-60'
                      )}
                    >
                      {skill.unlocked ? (
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center border-2', area.borderColor, 'bg-slate-900')}>
                          <span className={cn('text-sm font-bold', area.textColor)}>{skill.level}</span>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                          <Lock className="w-4 h-4 text-slate-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{skill.name}</p>
                        {skill.unlocked && (
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={cn('w-3 h-3', i < skill.level ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600')} />
                            ))}
                          </div>
                        )}
                      </div>
                      {skill.unlocked ? (
                        <button
                          onClick={() => startSkillLog(skill.id, skill.name, area.id)}
                          className={cn(
                            'px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition-all border-2',
                            area.borderColor, 'hover:bg-slate-700 text-white'
                          )}
                        >
                          <Plus className="w-4 h-4" />
                          Log
                        </button>
                      ) : (
                        <Lock className="w-5 h-5 text-slate-600" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skill Logging Modal - Mission Log Terminal */}
      <AnimatePresence>
        {skillLog && skillPrompts && skillLogArea && !showCompletion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-slate-900 rounded-2xl overflow-hidden border-2 border-cyan-500/30"
            >
              {/* Header */}
              <div className={cn('p-4 bg-slate-800 border-b-2', skillLogArea.borderColor)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-lg border-2 flex items-center justify-center bg-slate-900', skillLogArea.borderColor)}>
                      <skillLogArea.icon className={cn('w-5 h-5', skillLogArea.textColor)} />
                    </div>
                    <div>
                      <p className="text-xs text-cyan-400 uppercase tracking-widest font-bold">Mission Log</p>
                      <h2 className="font-bold text-white">{skillLog.skillName}</h2>
                    </div>
                  </div>
                  <button onClick={() => setSkillLog(null)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  {[0, 1, 2].map(i => (
                    <div key={i} className={cn('w-3 h-3 rounded-full transition-colors border-2', skillLog.step >= i ? `${skillLogArea.bgColor} ${skillLogArea.borderColor}` : 'border-slate-600 bg-slate-800')} />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {/* Step 0: Primary Question */}
                  {skillLog.step === 0 && (
                    <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h3 className="text-lg font-bold mb-2 text-white">{skillPrompts.primary}</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {skillPrompts.examples.map((ex, i) => (
                          <span key={i} className="text-xs bg-slate-800 text-cyan-400/70 px-2 py-1 rounded-full border border-cyan-500/30">{ex}</span>
                        ))}
                      </div>
                      <textarea
                        value={skillLog.primaryResponse}
                        onChange={(e) => setSkillLog({ ...skillLog, primaryResponse: e.target.value })}
                        placeholder="Describe what happened..."
                        className={cn('w-full h-32 bg-slate-800 border-2 focus:border-opacity-100 rounded-xl p-4 outline-none resize-none transition-colors', skillLogArea.borderColor, 'border-opacity-30')}
                        autoFocus
                      />
                    </motion.div>
                  )}

                  {/* Step 1: Follow-up Question */}
                  {skillLog.step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h3 className="text-lg font-bold mb-4 text-white">{skillPrompts.followUp}</h3>
                      <textarea
                        value={skillLog.followUpResponse}
                        onChange={(e) => setSkillLog({ ...skillLog, followUpResponse: e.target.value })}
                        placeholder="Reflect on the outcome..."
                        className={cn('w-full h-32 bg-slate-800 border-2 focus:border-opacity-100 rounded-xl p-4 outline-none resize-none transition-colors', skillLogArea.borderColor, 'border-opacity-30')}
                        autoFocus
                      />
                      <p className="text-xs text-yellow-400/70 mt-2 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> +10 bonus XP for thoughtful reflection
                      </p>
                    </motion.div>
                  )}

                  {/* Step 2: Image Upload */}
                  {skillLog.step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h3 className="text-lg font-bold mb-2 text-white">Upload Evidence (Optional)</h3>
                      <p className="text-slate-400 text-sm mb-4">Capture a photo of student work, your materials, or anything that documents this moment.</p>

                      {skillLog.imagePreview ? (
                        <div className="relative">
                          <img src={skillLog.imagePreview} alt="Upload preview" className="w-full h-48 object-cover rounded-xl border-2 border-cyan-500/30" />
                          <button
                            onClick={removeImage}
                            className="absolute top-2 right-2 p-2 bg-red-500/90 rounded-lg hover:bg-red-500 transition-colors border border-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-48 bg-slate-800 border-2 border-dashed border-cyan-500/30 rounded-xl cursor-pointer hover:border-cyan-500/50 transition-colors">
                          <Camera className="w-10 h-10 text-cyan-400/50 mb-2" />
                          <span className="text-slate-400">Click to upload image</span>
                          <span className="text-xs text-yellow-400/70 mt-1 flex items-center gap-1">
                            <Zap className="w-3 h-3" /> +5 bonus XP
                          </span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}

                      {/* XP Preview */}
                      <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-medium">Mission Reward</span>
                          <div className="flex items-center gap-2 text-xl text-yellow-400">
                            <Zap className="w-5 h-5 fill-yellow-400" />
                            <span className="font-black">
                              {15 + (skillLog.followUpResponse.length > 10 ? 10 : 0) + (skillLog.imagePreview ? 5 : 0)} XP
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 mt-2 space-y-1">
                          <p className="text-emerald-400/70">+ 15 XP for logging practice</p>
                          {skillLog.followUpResponse.length > 10 && <p className="text-cyan-400/70">+ 10 XP for reflection</p>}
                          {skillLog.imagePreview && <p className="text-violet-400/70">+ 5 XP for evidence</p>}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <div className="p-6 pt-0 flex justify-between">
                <button
                  onClick={() => setSkillLog({ ...skillLog, step: skillLog.step - 1 })}
                  className={cn('flex items-center gap-2 text-slate-400 hover:text-white transition-colors', skillLog.step === 0 && 'invisible')}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>

                {skillLog.step < 2 ? (
                  <button
                    onClick={() => setSkillLog({ ...skillLog, step: skillLog.step + 1 })}
                    disabled={skillLog.step === 0 && skillLog.primaryResponse.length < 10}
                    className={cn(
                      'flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all border-2',
                      (skillLog.step === 0 && skillLog.primaryResponse.length >= 10) || skillLog.step === 1
                        ? 'bg-cyan-500 border-cyan-400 text-slate-900 hover:bg-cyan-400'
                        : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                    )}
                  >
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitSkillLog}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-yellow-500 border-2 border-yellow-400 text-slate-900 hover:bg-yellow-400 transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                          <Rocket className="w-5 h-5" />
                        </motion.div>
                        Transmitting...
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Modal - Mission Complete */}
      <AnimatePresence>
        {showCompletion && skillLog && skillLogArea && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className={cn('w-24 h-24 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-slate-800 border-4', skillLogArea.borderColor)}
                style={{ boxShadow: `0 0 40px ${skillLogArea.textColor === 'text-emerald-400' ? 'rgba(52,211,153,0.4)' : skillLogArea.textColor === 'text-rose-400' ? 'rgba(251,113,133,0.4)' : skillLogArea.textColor === 'text-violet-400' ? 'rgba(167,139,250,0.4)' : 'rgba(34,211,238,0.4)'}` }}
              >
                <Rocket className={cn('w-12 h-12', skillLogArea.textColor)} />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-black mb-2 text-cyan-400 uppercase tracking-wider"
                style={{ textShadow: '0 0 30px rgba(34, 211, 238, 0.5)' }}
              >
                Mission Complete!
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-slate-400 mb-4"
              >
                {skillLog.skillName}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-2 text-4xl text-yellow-400 mb-8"
              >
                <Zap className="w-10 h-10 fill-yellow-400" />
                <span className="font-black">+{earnedXp} XP</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-8 border-2 bg-slate-800', skillLogArea.borderColor)}
              >
                <skillLogArea.icon className={cn('w-4 h-4', skillLogArea.textColor)} />
                <span className={cn('font-bold', skillLogArea.textColor)}>{skillLogArea.name}</span>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={handleCompletionClose}
                className="block w-full max-w-xs mx-auto px-6 py-4 rounded-xl bg-cyan-500 border-2 border-cyan-400 text-slate-900 font-bold hover:bg-cyan-400 transition-colors uppercase tracking-wide"
              >
                Return to Base
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
