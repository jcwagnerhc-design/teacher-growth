import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateLevel, getWeekStart } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get subskill progress
    const subskillProgress = await prisma.userSubskillProgress.findMany({
      where: { userId },
      include: {
        subskill: {
          select: {
            id: true,
            name: true,
            slug: true,
            categoryId: true,
          },
        },
      },
    })

    // Calculate levels for each subskill
    const progressWithLevels = subskillProgress.map((p) => ({
      ...p,
      levelInfo: calculateLevel(p.xpEarned),
    }))

    // Get signals this week
    const weekStart = getWeekStart()
    const signalsThisWeek = await prisma.signal.count({
      where: {
        userId,
        loggedForDate: {
          gte: weekStart,
        },
      },
    })

    // Get unique categories this week
    const categoriesThisWeek = await prisma.signal.findMany({
      where: {
        userId,
        loggedForDate: {
          gte: weekStart,
        },
      },
      select: {
        subskill: {
          select: {
            categoryId: true,
          },
        },
      },
      distinct: ['subskillId'],
    })

    const uniqueCategoriesCount = new Set(
      categoriesThisWeek.map((s) => s.subskill.categoryId)
    ).size

    // Get badges
    const badges = await prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true,
      },
    })

    const overallLevel = Math.floor(user.totalXp / 1000) + 1

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        totalXp: user.totalXp,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastLogDate: user.lastLogDate,
        focusAreas: user.focusAreas,
      },
      overallLevel,
      subskillProgress: progressWithLevels,
      stats: {
        signalsThisWeek,
        categoriesThisWeek: uniqueCategoriesCount,
      },
      badges: badges.map((b) => b.badge),
    })
  } catch (error) {
    console.error('Failed to fetch user progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user progress' },
      { status: 500 }
    )
  }
}
