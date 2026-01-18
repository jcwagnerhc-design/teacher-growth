import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isToday, isYesterday } from '@/lib/utils'

type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

interface ReflectionInput {
  userId: string
  primaryResponse: string
  followUpResponse?: string
  domains: string[]
  prompt?: string
}

// XP calculation for reflections:
// - Base: 20 XP
// - Per domain selected: +15 XP each
// - Follow-up response > 20 chars: +10 XP
function calculateReflectionXp(domains: string[], followUpResponse?: string): { total: number; byDomain: Record<string, number> } {
  const baseXp = 20
  const perDomainXp = 15
  const followUpBonus = 10

  const xpByDomain: Record<string, number> = {}

  // Distribute base XP to first domain (or 'instruction' as default)
  const primaryDomain = domains[0] || 'instruction'
  xpByDomain[primaryDomain] = baseXp

  // Add per-domain XP
  domains.forEach(domainId => {
    xpByDomain[domainId] = (xpByDomain[domainId] || 0) + perDomainXp
  })

  // Add follow-up bonus to primary domain
  if (followUpResponse && followUpResponse.length > 20) {
    xpByDomain[primaryDomain] = (xpByDomain[primaryDomain] || 0) + followUpBonus
  }

  const total = Object.values(xpByDomain).reduce((sum, xp) => sum + xp, 0)

  return { total, byDomain: xpByDomain }
}

// Helper to ensure demo user exists
async function ensureUserExists(tx: TransactionClient, userId: string) {
  let user = await tx.user.findUnique({ where: { id: userId } })

  if (!user) {
    // Create demo user if it doesn't exist
    user = await tx.user.create({
      data: {
        id: userId,
        email: `${userId}@demo.teachergrowth.app`,
        name: 'Demo Teacher',
        role: 'TEACHER',
        totalXp: 0,
        currentStreak: 0,
        longestStreak: 0,
        onboardingCompleted: true,
      },
    })
  }

  return user
}

// POST - Create a new reflection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ReflectionInput

    const { userId, primaryResponse, followUpResponse, domains, prompt } = body

    if (!userId || !primaryResponse) {
      return NextResponse.json(
        { error: 'userId and primaryResponse are required' },
        { status: 400 }
      )
    }

    if (!primaryResponse || primaryResponse.length < 10) {
      return NextResponse.json(
        { error: 'primaryResponse must be at least 10 characters' },
        { status: 400 }
      )
    }

    // Calculate XP
    const { total: xpEarned, byDomain: xpByDomain } = calculateReflectionXp(
      domains || [],
      followUpResponse
    )

    // Create reflection and update user in transaction
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // Ensure user exists (creates demo user if needed)
      const user = await ensureUserExists(tx, userId)

      // Create the reflection
      const reflection = await tx.reflection.create({
        data: {
          userId,
          reflectionType: 'DAILY_MOMENT',
          primaryResponse,
          followUpResponse: followUpResponse || null,
          domains: domains || [],
          xpByDomain,
          xpEarned,
          prompt: prompt || null,
        },
      })

      // Create XP ledger entry
      await tx.xpLedger.create({
        data: {
          userId,
          xpAmount: xpEarned,
          sourceType: 'REFLECTION',
          sourceId: reflection.id,
          description: `Daily reflection: ${domains.length} domain(s)`,
        },
      })

      // Update user total XP and streak
      let newStreak = user.currentStreak
      const lastLog = user.lastLogDate
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Calculate streak
      if (!lastLog || (!isToday(lastLog) && !isYesterday(lastLog))) {
        newStreak = 1
      } else if (isYesterday(lastLog)) {
        newStreak += 1
      }
      // If isToday(lastLog), streak stays the same

      await tx.user.update({
        where: { id: userId },
        data: {
          totalXp: { increment: xpEarned },
          currentStreak: newStreak,
          longestStreak: Math.max(user.longestStreak, newStreak),
          lastLogDate: today,
        },
      })

      return reflection
    })

    return NextResponse.json({
      reflection: result,
      xpEarned,
      xpByDomain,
    })
  } catch (error) {
    console.error('Failed to create reflection:', error)
    return NextResponse.json(
      { error: 'Failed to create reflection' },
      { status: 500 }
    )
  }
}

// GET - Fetch reflection history with filtering and pagination
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const domain = searchParams.get('domain')
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  try {
    // Build where clause
    const where: {
      userId: string
      createdAt?: { gte?: Date; lte?: Date }
      domains?: { has: string }
    } = { userId }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    // Domain filter - check if the domain is in the domains array
    if (domain) {
      where.domains = { has: domain }
    }

    // Get total count for pagination
    const totalCount = await prisma.reflection.count({ where })

    // Fetch reflections
    const reflections = await prisma.reflection.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
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
      },
    })

    return NextResponse.json({
      reflections,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + reflections.length < totalCount,
      },
    })
  } catch (error) {
    console.error('Failed to fetch reflections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reflections' },
      { status: 500 }
    )
  }
}
