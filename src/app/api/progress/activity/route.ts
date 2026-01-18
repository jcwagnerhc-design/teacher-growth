import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfDay, subDays, format, eachDayOfInterval, differenceInDays } from 'date-fns'

// Activity endpoint - returns daily activity counts for heatmap and streak info
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')
  const period = searchParams.get('period') || 'quarter' // week, month, quarter

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  try {
    // Calculate date range based on period
    const endDate = startOfDay(new Date())
    let startDate: Date
    switch (period) {
      case 'week':
        startDate = subDays(endDate, 7)
        break
      case 'month':
        startDate = subDays(endDate, 30)
        break
      default: // quarter
        startDate = subDays(endDate, 90)
    }

    // Fetch signals for the period
    const signals = await prisma.signal.findMany({
      where: {
        userId,
        loggedForDate: {
          gte: startDate,
          lte: new Date(),
        },
      },
      select: {
        loggedForDate: true,
        subskillId: true,
      },
    })

    // Fetch reflections for the period
    const reflections = await prisma.reflection.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: new Date(),
        },
      },
      select: {
        createdAt: true,
        domains: true,
      },
    })

    // Initialize all days in the range
    const allDays = eachDayOfInterval({ start: startDate, end: endDate })
    const activityData: Record<string, {
      date: string
      signalCount: number
      reflectionCount: number
      totalCount: number
      level: number // 0-4 for heatmap intensity
    }> = {}

    allDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      activityData[dateStr] = {
        date: dateStr,
        signalCount: 0,
        reflectionCount: 0,
        totalCount: 0,
        level: 0,
      }
    })

    // Count signals by date
    signals.forEach(signal => {
      const dateStr = format(signal.loggedForDate, 'yyyy-MM-dd')
      if (activityData[dateStr]) {
        activityData[dateStr].signalCount++
        activityData[dateStr].totalCount++
      }
    })

    // Count reflections by date
    reflections.forEach(reflection => {
      const dateStr = format(reflection.createdAt, 'yyyy-MM-dd')
      if (activityData[dateStr]) {
        activityData[dateStr].reflectionCount++
        activityData[dateStr].totalCount++
      }
    })

    // Calculate activity levels (0-4) based on total count
    // 0 = no activity, 1 = 1 activity, 2 = 2-3 activities, 3 = 4-5 activities, 4 = 6+ activities
    Object.values(activityData).forEach(day => {
      if (day.totalCount === 0) day.level = 0
      else if (day.totalCount === 1) day.level = 1
      else if (day.totalCount <= 3) day.level = 2
      else if (day.totalCount <= 5) day.level = 3
      else day.level = 4
    })

    // Convert to array sorted by date
    const activity = Object.values(activityData).sort((a, b) =>
      a.date.localeCompare(b.date)
    )

    // Get user streak info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastLogDate: true,
      },
    })

    // Calculate domain distribution from reflections
    const domainCounts: Record<string, number> = {}
    reflections.forEach(r => {
      r.domains.forEach(domain => {
        domainCounts[domain] = (domainCounts[domain] || 0) + 1
      })
    })

    // Also count domains from signals via subskills
    const subskillToCategory: Record<string, string> = {}
    const subskills = await prisma.subskill.findMany({
      select: {
        id: true,
        category: {
          select: {
            slug: true,
          },
        },
      },
    })
    subskills.forEach(s => {
      subskillToCategory[s.id] = s.category.slug
    })

    signals.forEach(signal => {
      const categorySlug = subskillToCategory[signal.subskillId]
      if (categorySlug) {
        domainCounts[categorySlug] = (domainCounts[categorySlug] || 0) + 1
      }
    })

    // Summary stats
    const totalActivities = signals.length + reflections.length
    const activeDays = activity.filter(d => d.totalCount > 0).length

    return NextResponse.json({
      activity,
      streak: {
        current: user?.currentStreak ?? 0,
        longest: user?.longestStreak ?? 0,
        lastLogDate: user?.lastLogDate,
      },
      domainBreakdown: domainCounts,
      summary: {
        totalActivities,
        totalSignals: signals.length,
        totalReflections: reflections.length,
        activeDays,
        totalDays: activity.length,
      },
      period,
    })
  } catch (error) {
    console.error('Failed to fetch activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}
