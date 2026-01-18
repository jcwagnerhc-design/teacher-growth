import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { XP_CONFIG, isToday, isYesterday } from '@/lib/utils'

interface SignalInput {
  templateId: string
  subskillId: string
  note?: string
  xpValue: number
}

type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')
  const date = searchParams.get('date')

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  try {
    const where: { userId: string; loggedForDate?: Date } = { userId }

    if (date) {
      where.loggedForDate = new Date(date)
    }

    const signals = await prisma.signal.findMany({
      where,
      include: {
        subskill: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        signalTemplate: {
          select: {
            id: true,
            prompt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(signals)
  } catch (error) {
    console.error('Failed to fetch signals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch signals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, signals, date } = body as {
      userId: string
      signals: SignalInput[]
      date?: string
    }

    if (!userId || !signals || signals.length === 0) {
      return NextResponse.json(
        { error: 'userId and signals are required' },
        { status: 400 }
      )
    }

    // Validate date (can only log for today or yesterday)
    const logDate = date ? new Date(date) : new Date()
    logDate.setHours(0, 0, 0, 0)

    if (!isToday(logDate) && !isYesterday(logDate)) {
      return NextResponse.json(
        { error: 'Can only log signals for today or yesterday' },
        { status: 400 }
      )
    }

    // Check daily XP cap
    const existingSignals = await prisma.signal.findMany({
      where: {
        userId,
        loggedForDate: logDate,
      },
    })

    const existingXp = existingSignals.reduce((sum, s) => sum + s.xpEarned, 0)

    // Calculate XP with diminishing returns for same subskill
    const subskillCounts: Record<string, number> = {}
    existingSignals.forEach((s) => {
      subskillCounts[s.subskillId] = (subskillCounts[s.subskillId] || 0) + 1
    })

    let totalNewXp = 0
    const signalsToCreate = signals.map((signal) => {
      const count = subskillCounts[signal.subskillId] || 0
      subskillCounts[signal.subskillId] = count + 1

      const multiplier = XP_CONFIG.DIMINISHING_RETURNS[Math.min(count, 3)]
      const adjustedXp = Math.floor(signal.xpValue * multiplier)
      totalNewXp += adjustedXp

      return {
        userId,
        subskillId: signal.subskillId,
        signalTemplateId: signal.templateId,
        loggedForDate: logDate,
        note: signal.note || null,
        xpEarned: adjustedXp,
      }
    })

    // Apply daily cap
    const remainingCap = XP_CONFIG.DAILY_CAP - existingXp
    if (totalNewXp > remainingCap) {
      const ratio = remainingCap / totalNewXp
      signalsToCreate.forEach((s) => {
        s.xpEarned = Math.floor(s.xpEarned * ratio)
      })
      totalNewXp = remainingCap
    }

    // Calculate variety bonus
    const newSubskillsCount = signals.filter(
      (s) => !existingSignals.some((es) => es.subskillId === s.subskillId)
    ).length
    const varietyBonus = newSubskillsCount * XP_CONFIG.VARIETY_BONUS

    // Create signals in transaction
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // Create signals
      const createdSignals = await Promise.all(
        signalsToCreate.map((signal) =>
          tx.signal.create({ data: signal })
        )
      )

      // Create XP ledger entries
      for (const signal of createdSignals) {
        await tx.xpLedger.create({
          data: {
            userId,
            xpAmount: signal.xpEarned,
            sourceType: 'SIGNAL',
            sourceId: signal.id,
            description: `Signal logged`,
          },
        })
      }

      // Add variety bonus if applicable
      if (varietyBonus > 0) {
        await tx.xpLedger.create({
          data: {
            userId,
            xpAmount: varietyBonus,
            sourceType: 'VARIETY_BONUS',
            description: `Variety bonus for ${newSubskillsCount} new subskill(s)`,
          },
        })
      }

      // Update user progress for each subskill
      for (const signal of signalsToCreate) {
        await tx.userSubskillProgress.upsert({
          where: {
            userId_subskillId: {
              userId,
              subskillId: signal.subskillId,
            },
          },
          create: {
            userId,
            subskillId: signal.subskillId,
            xpEarned: signal.xpEarned,
            signalCount: 1,
            lastSignalDate: logDate,
          },
          update: {
            xpEarned: { increment: signal.xpEarned },
            signalCount: { increment: 1 },
            lastSignalDate: logDate,
          },
        })
      }

      // Update user total XP and streak
      const user = await tx.user.findUnique({ where: { id: userId } })

      if (user) {
        let newStreak = user.currentStreak
        const lastLog = user.lastLogDate

        // Calculate streak
        if (!lastLog || (!isToday(lastLog) && !isYesterday(lastLog))) {
          newStreak = 1
        } else if (isYesterday(lastLog) && isToday(logDate)) {
          newStreak += 1
        }

        await tx.user.update({
          where: { id: userId },
          data: {
            totalXp: { increment: totalNewXp + varietyBonus },
            currentStreak: newStreak,
            longestStreak: Math.max(user.longestStreak, newStreak),
            lastLogDate: logDate,
          },
        })
      }

      return createdSignals
    })

    return NextResponse.json({
      signals: result,
      xpEarned: totalNewXp,
      varietyBonus,
      totalXp: totalNewXp + varietyBonus,
    })
  } catch (error) {
    console.error('Failed to create signals:', error)
    return NextResponse.json(
      { error: 'Failed to create signals' },
      { status: 500 }
    )
  }
}
