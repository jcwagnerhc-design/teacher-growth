// Extended types with relations for the frontend

export interface CategoryWithSubskills {
  id: string
  slug: string
  name: string
  description: string | null
  displayOrder: number
  icon: string | null
  subskills: SubskillWithTemplates[]
}

export interface SubskillWithTemplates {
  id: string
  categoryId: string
  slug: string
  name: string
  definition: string | null
  behaviors: string[]
  antiPatterns: string[]
  displayOrder: number
  signalTemplates: SignalTemplateBasic[]
}

export interface SignalTemplateBasic {
  id: string
  prompt: string
  xpValue: number
}

export interface UserProgress {
  subskillId: string
  xpEarned: number
  level: number
  signalCount: number
  lastSignalDate: Date | null
}

export interface DailyCheckInState {
  date: Date
  signals: SelectedSignal[]
  totalXp: number
  hasCheckedIn: boolean
}

export interface SelectedSignal {
  templateId: string
  subskillId: string
  prompt: string
  xpValue: number
  note?: string
}

export interface QuestProgress {
  quest: {
    id: string
    slug: string
    title: string
    description: string | null
    questType: 'DAILY' | 'WEEKLY' | 'BOSS'
    xpReward: number
  }
  progress: number
  target: number
  isCompleted: boolean
}

export interface UserStats {
  totalXp: number
  currentStreak: number
  longestStreak: number
  overallLevel: number
  title: string
  signalsThisWeek: number
  categoriesThisWeek: number
}

// Reflection types
export interface Reflection {
  id: string
  userId: string
  reflectionType: 'WEEKLY' | 'MILESTONE' | 'BOSS' | 'DAILY_MOMENT'
  subskillId: string | null
  prompt: string | null
  primaryResponse: string
  followUpResponse: string | null
  domains: string[]
  xpByDomain: Record<string, number> | null
  xpEarned: number
  createdAt: string
}

export interface ReflectionInput {
  userId: string
  primaryResponse: string
  followUpResponse?: string
  domains: string[]
  prompt?: string
}

export interface ReflectionResponse {
  reflection: Reflection
  xpEarned: number
  xpByDomain: Record<string, number>
}

export interface ReflectionListResponse {
  reflections: Reflection[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

// Progress types
export interface TimelineEntry {
  date: string
  total: number
  signal: number
  reflection: number
  quest: number
  streak: number
  variety: number
}

export interface TimelineResponse {
  timeline: TimelineEntry[]
  summary: {
    totalXp: number
    averageXp: number
    bestDay: { date: string; total: number } | null
    daysActive: number
    totalDays: number
  }
  bySource: {
    signal: number
    reflection: number
    quest: number
    streak: number
    variety: number
  }
  period: 'week' | 'month' | 'quarter'
}

export interface ActivityEntry {
  date: string
  signalCount: number
  reflectionCount: number
  totalCount: number
  level: number
}

export interface ActivityResponse {
  activity: ActivityEntry[]
  streak: {
    current: number
    longest: number
    lastLogDate: string | null
  }
  domainBreakdown: Record<string, number>
  summary: {
    totalActivities: number
    totalSignals: number
    totalReflections: number
    activeDays: number
    totalDays: number
  }
  period: 'week' | 'month' | 'quarter'
}
