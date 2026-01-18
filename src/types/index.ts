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
