import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { XpDisplay } from '@/components/xp-display'
import { StreakBadge } from '@/components/streak-badge'
import { ArrowRight, CheckCircle2, Target } from 'lucide-react'
import { formatDate } from '@/lib/utils'

// Mock data for MVP - will be replaced with real data
const mockUserStats = {
  name: 'Teacher',
  totalXp: 450,
  currentStreak: 3,
  longestStreak: 7,
  overallLevel: 4,
  title: 'Growing Educator',
  todayCheckedIn: false,
  signalsThisWeek: 12,
  activeQuests: [
    {
      id: '1',
      title: 'Try a new engagement technique',
      progress: 0,
      target: 1,
      xpReward: 25,
    },
    {
      id: '2',
      title: 'Breadth Explorer',
      description: 'Log in 4+ categories this week',
      progress: 2,
      target: 4,
      xpReward: 50,
    },
  ],
  recentGrowth: [
    { name: 'Questioning', level: 3, xp: 72 },
    { name: 'Formative Checking', level: 2, xp: 45 },
    { name: 'Active Engagement', level: 2, xp: 38 },
  ],
}

export default function DashboardPage() {
  const today = new Date()

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back
          </h1>
          <p className="text-slate-500">{formatDate(today)}</p>
        </div>
        <div className="flex items-center gap-4">
          <StreakBadge
            streak={mockUserStats.currentStreak}
            longestStreak={mockUserStats.longestStreak}
            showLongest
          />
          <XpDisplay xp={mockUserStats.totalXp} size="lg" />
        </div>
      </div>

      {/* Daily Check-in CTA */}
      {!mockUserStats.todayCheckedIn && (
        <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-1">Daily Check-in</h2>
                <p className="text-indigo-100">
                  What did you notice in your practice today?
                </p>
              </div>
              <Link href="/dashboard/check-in">
                <Button
                  variant="secondary"
                  className="bg-white text-indigo-600 hover:bg-indigo-50"
                >
                  Start Check-in
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {mockUserStats.todayCheckedIn && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <div>
                <h2 className="font-semibold text-emerald-900">
                  Check-in complete
                </h2>
                <p className="text-sm text-emerald-700">
                  You logged signals today. Keep the streak going!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Quests */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Active Quests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockUserStats.activeQuests.map((quest) => (
              <div key={quest.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    {quest.title}
                  </span>
                  <XpDisplay xp={quest.xpReward} size="sm" />
                </div>
                {quest.target > 1 && (
                  <>
                    <Progress
                      value={quest.progress}
                      max={quest.target}
                      size="sm"
                      color="indigo"
                    />
                    <p className="text-xs text-slate-500">
                      {quest.progress}/{quest.target}
                    </p>
                  </>
                )}
              </div>
            ))}
            <Link
              href="/dashboard/quests"
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-2"
            >
              View all quests
              <ArrowRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>

        {/* Recent Growth */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Growth</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockUserStats.recentGrowth.map((skill) => (
              <div key={skill.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    {skill.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    Level {skill.level}
                  </span>
                </div>
                <Progress
                  value={skill.xp}
                  max={100}
                  size="sm"
                  color="indigo"
                />
              </div>
            ))}
            <Link
              href="/dashboard/skills"
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-2"
            >
              View skill tree
              <ArrowRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {mockUserStats.overallLevel}
            </p>
            <p className="text-sm text-slate-500">Overall Level</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {mockUserStats.signalsThisWeek}
            </p>
            <p className="text-sm text-slate-500">Signals This Week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {mockUserStats.currentStreak}
            </p>
            <p className="text-sm text-slate-500">Day Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {mockUserStats.totalXp}
            </p>
            <p className="text-sm text-slate-500">Total XP</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
