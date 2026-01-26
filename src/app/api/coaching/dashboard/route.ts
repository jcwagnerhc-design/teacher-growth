import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getDashboardInsights } from '@/lib/ai'

// Simple in-memory cache with TTL
const insightsCache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour in milliseconds

function getCachedInsights(userId: string) {
  const cached = insightsCache.get(userId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  return null
}

function setCachedInsights(userId: string, data: unknown) {
  insightsCache.set(userId, { data, timestamp: Date.now() })
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')
  const skipCache = searchParams.get('skipCache') === 'true'

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  try {
    // Check cache first (unless skipping)
    if (!skipCache) {
      const cached = getCachedInsights(userId)
      if (cached) {
        return NextResponse.json({
          available: true,
          cached: true,
          ...cached,
        })
      }
    }

    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentStreak: true,
        lastLogDate: true,
      },
    })

    if (!user) {
      return NextResponse.json({
        available: false,
        message: 'User not found',
      })
    }

    // Fetch recent reflections
    const reflections = await prisma.reflection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        primaryResponse: true,
        followUpResponse: true,
        domains: true,
        skillId: true,
        skillName: true,
        createdAt: true,
      },
    })

    // Fetch active goals
    const goals = await prisma.goal.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        title: true,
        targetType: true,
        targetValue: true,
        currentValue: true,
        targetSkillId: true,
        targetDomain: true,
      },
    })

    // Get AI insights
    const insights = await getDashboardInsights({
      reflections,
      goals,
      streak: user.currentStreak,
      lastReflectionDate: user.lastLogDate,
    })

    if (!insights) {
      return NextResponse.json({
        available: false,
        message: 'AI insights not available',
      })
    }

    // Cache the result
    const result = {
      patternInsight: insights.patternInsight,
      goalNudge: insights.goalNudge,
      suggestedFocus: insights.suggestedFocus,
      streakMessage: insights.streakMessage,
      goals: goals.map(g => ({
        id: g.id,
        title: g.title,
        currentValue: g.currentValue,
        targetValue: g.targetValue,
        progress: Math.round((g.currentValue / g.targetValue) * 100),
      })),
      streak: user.currentStreak,
    }

    setCachedInsights(userId, result)

    return NextResponse.json({
      available: true,
      cached: false,
      ...result,
    })
  } catch (error) {
    console.error('Dashboard coaching API error:', error)
    return NextResponse.json(
      { error: 'Failed to get dashboard insights' },
      { status: 500 }
    )
  }
}
