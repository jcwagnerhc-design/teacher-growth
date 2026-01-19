import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { addDays, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

interface GoalInput {
  userId: string
  title: string
  description?: string
  goalType: 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
  targetType: 'REFLECTION_COUNT' | 'SKILL_FOCUS' | 'DOMAIN_FOCUS'
  targetValue: number
  targetSkillId?: string
  targetDomain?: string
  dueDate?: string
}

// Helper to ensure demo user exists
async function ensureUserExists(tx: TransactionClient, userId: string) {
  let user = await tx.user.findUnique({ where: { id: userId } })

  if (!user) {
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

// Calculate due date based on goal type
function calculateDueDate(goalType: 'WEEKLY' | 'MONTHLY' | 'CUSTOM', customDueDate?: string): Date | null {
  const now = new Date()

  switch (goalType) {
    case 'WEEKLY':
      return endOfWeek(now, { weekStartsOn: 1 }) // End of week (Sunday)
    case 'MONTHLY':
      return endOfMonth(now)
    case 'CUSTOM':
      return customDueDate ? new Date(customDueDate) : null
    default:
      return null
  }
}

// GET - Fetch user's goals
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')
  const status = searchParams.get('status') // 'ACTIVE', 'COMPLETED', 'ABANDONED', or null for all

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  try {
    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId }

    if (status && ['ACTIVE', 'COMPLETED', 'ABANDONED'].includes(status)) {
      where.status = status
    }

    const goals = await prisma.goal.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // ACTIVE first, then ABANDONED, then COMPLETED
        { dueDate: 'asc' }, // Earliest due date first
        { createdAt: 'desc' }, // Most recent first within same due date
      ],
    })

    // Calculate progress percentage for each goal
    const goalsWithProgress = goals.map(goal => ({
      ...goal,
      progress: goal.targetValue > 0
        ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
        : 0,
      daysRemaining: goal.dueDate
        ? Math.max(0, Math.ceil((new Date(goal.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null,
    }))

    return NextResponse.json({
      goals: goalsWithProgress,
      summary: {
        active: goals.filter(g => g.status === 'ACTIVE').length,
        completed: goals.filter(g => g.status === 'COMPLETED').length,
        abandoned: goals.filter(g => g.status === 'ABANDONED').length,
      },
    })
  } catch (error) {
    console.error('Failed to fetch goals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    )
  }
}

// POST - Create a new goal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GoalInput

    const {
      userId,
      title,
      description,
      goalType,
      targetType,
      targetValue,
      targetSkillId,
      targetDomain,
      dueDate
    } = body

    // Validation
    if (!userId || !title || !goalType || !targetType || !targetValue) {
      return NextResponse.json(
        { error: 'userId, title, goalType, targetType, and targetValue are required' },
        { status: 400 }
      )
    }

    if (targetValue < 1) {
      return NextResponse.json(
        { error: 'targetValue must be at least 1' },
        { status: 400 }
      )
    }

    // Validate target type requirements
    if (targetType === 'SKILL_FOCUS' && !targetSkillId) {
      return NextResponse.json(
        { error: 'targetSkillId is required for SKILL_FOCUS goals' },
        { status: 400 }
      )
    }

    if (targetType === 'DOMAIN_FOCUS' && !targetDomain) {
      return NextResponse.json(
        { error: 'targetDomain is required for DOMAIN_FOCUS goals' },
        { status: 400 }
      )
    }

    const calculatedDueDate = calculateDueDate(goalType, dueDate)

    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // Ensure user exists
      await ensureUserExists(tx, userId)

      // Create the goal
      const goal = await tx.goal.create({
        data: {
          userId,
          title,
          description: description || null,
          goalType,
          targetType,
          targetValue,
          targetSkillId: targetSkillId || null,
          targetDomain: targetDomain || null,
          dueDate: calculatedDueDate,
          status: 'ACTIVE',
        },
      })

      return goal
    })

    return NextResponse.json({
      goal: {
        ...result,
        progress: 0,
        daysRemaining: result.dueDate
          ? Math.max(0, Math.ceil((new Date(result.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : null,
      },
    })
  } catch (error) {
    console.error('Failed to create goal:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create goal', details: message },
      { status: 500 }
    )
  }
}

// PATCH - Update a goal (status, currentValue)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { goalId, status, currentValue } = body

    if (!goalId) {
      return NextResponse.json(
        { error: 'goalId is required' },
        { status: 400 }
      )
    }

    // Find the goal first
    const existingGoal = await prisma.goal.findUnique({
      where: { id: goalId },
    })

    if (!existingGoal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      )
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}

    if (status !== undefined) {
      if (!['ACTIVE', 'COMPLETED', 'ABANDONED'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be ACTIVE, COMPLETED, or ABANDONED' },
          { status: 400 }
        )
      }
      updateData.status = status

      // Set completedAt if completing
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date()
      } else {
        updateData.completedAt = null
      }
    }

    if (currentValue !== undefined) {
      updateData.currentValue = Math.max(0, currentValue)

      // Auto-complete if target reached and status isn't being explicitly set
      if (status === undefined && currentValue >= existingGoal.targetValue && existingGoal.status === 'ACTIVE') {
        updateData.status = 'COMPLETED'
        updateData.completedAt = new Date()
      }
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: updateData,
    })

    return NextResponse.json({
      goal: {
        ...updatedGoal,
        progress: updatedGoal.targetValue > 0
          ? Math.min(100, Math.round((updatedGoal.currentValue / updatedGoal.targetValue) * 100))
          : 0,
        daysRemaining: updatedGoal.dueDate
          ? Math.max(0, Math.ceil((new Date(updatedGoal.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : null,
      },
    })
  } catch (error) {
    console.error('Failed to update goal:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to update goal', details: message },
      { status: 500 }
    )
  }
}
