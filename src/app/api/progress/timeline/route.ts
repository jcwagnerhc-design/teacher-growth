import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfDay, subDays, format, eachDayOfInterval } from 'date-fns'

// Timeline endpoint - returns daily XP totals with source breakdown
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')
  const period = searchParams.get('period') || 'week' // week, month, quarter

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  try {
    // Calculate date range based on period
    const endDate = startOfDay(new Date())
    let startDate: Date
    switch (period) {
      case 'month':
        startDate = subDays(endDate, 30)
        break
      case 'quarter':
        startDate = subDays(endDate, 90)
        break
      default: // week
        startDate = subDays(endDate, 7)
    }

    // Fetch XP ledger entries for the period
    const xpEntries = await prisma.xpLedger.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: new Date(), // Include today
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Group by date and source type
    const dailyData: Record<string, {
      date: string
      total: number
      signal: number
      reflection: number
      quest: number
      streak: number
      variety: number
    }> = {}

    // Initialize all days in the range
    const allDays = eachDayOfInterval({ start: startDate, end: endDate })
    allDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      dailyData[dateStr] = {
        date: dateStr,
        total: 0,
        signal: 0,
        reflection: 0,
        quest: 0,
        streak: 0,
        variety: 0,
      }
    })

    // Aggregate XP by date and source
    xpEntries.forEach(entry => {
      const dateStr = format(entry.createdAt, 'yyyy-MM-dd')
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = {
          date: dateStr,
          total: 0,
          signal: 0,
          reflection: 0,
          quest: 0,
          streak: 0,
          variety: 0,
        }
      }

      dailyData[dateStr].total += entry.xpAmount

      switch (entry.sourceType) {
        case 'SIGNAL':
          dailyData[dateStr].signal += entry.xpAmount
          break
        case 'REFLECTION':
          dailyData[dateStr].reflection += entry.xpAmount
          break
        case 'QUEST':
          dailyData[dateStr].quest += entry.xpAmount
          break
        case 'STREAK':
          dailyData[dateStr].streak += entry.xpAmount
          break
        case 'VARIETY_BONUS':
        case 'ARTIFACT_BONUS':
          dailyData[dateStr].variety += entry.xpAmount
          break
      }
    })

    // Convert to array sorted by date
    const timeline = Object.values(dailyData).sort((a, b) =>
      a.date.localeCompare(b.date)
    )

    // Calculate summary stats
    const totalXp = timeline.reduce((sum, day) => sum + day.total, 0)
    const activeDays = timeline.filter(day => day.total > 0).length
    const averageXp = activeDays > 0 ? Math.round(totalXp / activeDays) : 0
    const bestDay = timeline.reduce(
      (best, day) => (day.total > best.total ? day : best),
      { date: '', total: 0 }
    )

    // XP by source
    const bySource = {
      signal: xpEntries.filter(e => e.sourceType === 'SIGNAL').reduce((sum, e) => sum + e.xpAmount, 0),
      reflection: xpEntries.filter(e => e.sourceType === 'REFLECTION').reduce((sum, e) => sum + e.xpAmount, 0),
      quest: xpEntries.filter(e => e.sourceType === 'QUEST').reduce((sum, e) => sum + e.xpAmount, 0),
      streak: xpEntries.filter(e => e.sourceType === 'STREAK').reduce((sum, e) => sum + e.xpAmount, 0),
      variety: xpEntries.filter(e => ['VARIETY_BONUS', 'ARTIFACT_BONUS'].includes(e.sourceType)).reduce((sum, e) => sum + e.xpAmount, 0),
    }

    return NextResponse.json({
      timeline,
      summary: {
        totalXp,
        averageXp,
        bestDay: bestDay.total > 0 ? bestDay : null,
        daysActive: activeDays,
        totalDays: timeline.length,
      },
      bySource,
      period,
    })
  } catch (error) {
    console.error('Failed to fetch timeline:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    )
  }
}
