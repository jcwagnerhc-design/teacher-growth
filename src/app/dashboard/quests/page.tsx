'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuestCard } from '@/components/quest-card'
import { Target, Calendar, Swords } from 'lucide-react'
import type { QuestProgress } from '@/types'

// Mock data - will be replaced with real data from API
const mockDailyQuests: QuestProgress[] = [
  {
    quest: {
      id: '1',
      slug: 'try-engagement-technique',
      title: 'Try a new engagement technique',
      description: 'Log any Active Engagement signal today',
      questType: 'DAILY',
      xpReward: 25,
    },
    progress: 0,
    target: 1,
    isCompleted: false,
  },
  {
    quest: {
      id: '2',
      slug: 'specific-feedback',
      title: 'Give specific feedback',
      description: 'Log a Feedback Quality signal',
      questType: 'DAILY',
      xpReward: 25,
    },
    progress: 1,
    target: 1,
    isCompleted: true,
  },
  {
    quest: {
      id: '3',
      slug: 'learn-about-student',
      title: 'Learn something about a student',
      description: 'Log a Belonging & Identity signal',
      questType: 'DAILY',
      xpReward: 25,
    },
    progress: 0,
    target: 1,
    isCompleted: false,
  },
]

const mockWeeklyQuests: QuestProgress[] = [
  {
    quest: {
      id: '4',
      slug: 'breadth-explorer',
      title: 'Breadth Explorer',
      description: 'Log signals in 4+ different categories this week',
      questType: 'WEEKLY',
      xpReward: 50,
    },
    progress: 2,
    target: 4,
    isCompleted: false,
  },
  {
    quest: {
      id: '5',
      slug: 'streak-builder',
      title: 'Streak Builder',
      description: 'Reach a 5-day logging streak',
      questType: 'WEEKLY',
      xpReward: 50,
    },
    progress: 3,
    target: 5,
    isCompleted: false,
  },
  {
    quest: {
      id: '6',
      slug: 'weekly-reflection',
      title: 'Weekly Reflection',
      description: 'Complete your weekly reflection',
      questType: 'WEEKLY',
      xpReward: 50,
    },
    progress: 0,
    target: 1,
    isCompleted: false,
  },
]

const mockBossQuests: QuestProgress[] = [
  {
    quest: {
      id: '7',
      slug: 'questioning-level-4',
      title: 'Level up Questioning to Level 4',
      description: 'Complete a reflection to unlock your next level in Questioning',
      questType: 'BOSS',
      xpReward: 100,
    },
    progress: 285,
    target: 300,
    isCompleted: false,
  },
]

export default function QuestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Quests</h1>
        <p className="text-slate-500">Challenges to guide your growth</p>
      </div>

      {/* Daily Quests */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Today&apos;s Quests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockDailyQuests.map((quest) => (
            <QuestCard key={quest.quest.id} quest={quest} />
          ))}
        </CardContent>
      </Card>

      {/* Weekly Quests */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockWeeklyQuests.map((quest) => (
            <QuestCard key={quest.quest.id} quest={quest} />
          ))}
        </CardContent>
      </Card>

      {/* Boss Fights */}
      {mockBossQuests.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Swords className="w-5 h-5 text-amber-600" />
              Boss Fights Available
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600 mb-3">
              You&apos;re close to leveling up! Complete a reflection to unlock.
            </p>
            {mockBossQuests.map((quest) => (
              <QuestCard key={quest.quest.id} quest={quest} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
