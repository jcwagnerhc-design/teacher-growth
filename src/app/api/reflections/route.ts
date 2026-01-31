import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isToday, isYesterday } from '@/lib/utils'
import { GoogleGenerativeAI } from '@google/generative-ai'

type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

interface ReflectionInput {
  userId: string
  primaryResponse: string
  followUpResponse?: string
  domains?: string[]
  skillId?: string
  skillName?: string
  prompt?: string
}

// Danielson Framework domains and skills for auto-tagging
const DANIELSON_FRAMEWORK = {
  planning: {
    name: 'Planning & Preparation',
    skills: [
      { id: 'objectives', name: 'Learning Objectives' },
      { id: 'sequencing', name: 'Lesson Sequencing' },
      { id: 'materials', name: 'Resource Preparation' },
      { id: 'differentiation', name: 'Differentiation' },
    ]
  },
  environment: {
    name: 'Classroom Environment',
    skills: [
      { id: 'relationships', name: 'Building Relationships' },
      { id: 'culture', name: 'Classroom Culture' },
      { id: 'norms', name: 'Routines & Procedures' },
      { id: 'student-voice', name: 'Student Voice & Agency' },
    ]
  },
  instruction: {
    name: 'Instruction',
    skills: [
      { id: 'questioning', name: 'Questioning Strategies' },
      { id: 'engagement', name: 'Student Engagement' },
      { id: 'clarity', name: 'Clear Explanations' },
      { id: 'discussion', name: 'Facilitating Discussion' },
      { id: 'pacing', name: 'Pacing & Flexibility' },
    ]
  },
  assessment: {
    name: 'Assessment',
    skills: [
      { id: 'formative', name: 'Formative Assessment' },
      { id: 'feedback', name: 'Quality Feedback' },
      { id: 'data-use', name: 'Using Data to Adjust' },
      { id: 'self-assessment', name: 'Student Self-Assessment' },
    ]
  },
}

// Auto-tag reflection using AI
async function autoTagReflection(text: string): Promise<{ domain: string; skillId: string; skillName: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `Analyze this teacher reflection and categorize it using the Danielson Framework.

Reflection: "${text}"

Categories:
1. planning - Planning & Preparation (objectives, sequencing, materials, differentiation)
2. environment - Classroom Environment (relationships, culture, norms, student-voice)
3. instruction - Instruction (questioning, engagement, clarity, discussion, pacing)
4. assessment - Assessment (formative, feedback, data-use, self-assessment)

Respond with ONLY a JSON object like this (no markdown, no explanation):
{"domain": "instruction", "skill": "questioning"}

Choose the single best-fitting domain and skill based on what the teacher is reflecting about.`

    const result = await model.generateContent(prompt)
    const response = result.response.text().trim()

    // Parse JSON response
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    const domain = parsed.domain as keyof typeof DANIELSON_FRAMEWORK
    const skillId = parsed.skill

    if (DANIELSON_FRAMEWORK[domain]) {
      const skill = DANIELSON_FRAMEWORK[domain].skills.find(s => s.id === skillId)
      if (skill) {
        return { domain, skillId: skill.id, skillName: skill.name }
      }
      // If skill not found, return just the domain with first skill
      return { domain, skillId: DANIELSON_FRAMEWORK[domain].skills[0].id, skillName: DANIELSON_FRAMEWORK[domain].skills[0].name }
    }
  } catch (error) {
    console.error('Auto-tag error:', error)
  }

  return null
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

    let { userId, primaryResponse, followUpResponse, domains, skillId, skillName, prompt } = body

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

    // Auto-tag if domains not provided
    if (!domains || domains.length === 0) {
      const autoTag = await autoTagReflection(primaryResponse)
      if (autoTag) {
        domains = [autoTag.domain]
        skillId = autoTag.skillId
        skillName = autoTag.skillName
      } else {
        // Default to instruction if auto-tag fails
        domains = ['instruction']
      }
    }

    // XP is no longer used but keep structure for compatibility
    const xpEarned = 0
    const xpByDomain: Record<string, number> = {}

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
          skillId: skillId || null,
          skillName: skillName || null,
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

      // Update relevant goals
      // Find active goals that match this reflection
      const activeGoals = await tx.goal.findMany({
        where: {
          userId,
          status: 'ACTIVE',
        },
      })

      // Track goals that need updating
      const goalsToUpdate: { id: string; newValue: number }[] = []

      for (const goal of activeGoals) {
        let shouldIncrement = false

        switch (goal.targetType) {
          case 'REFLECTION_COUNT':
            // Any reflection counts toward this goal
            shouldIncrement = true
            break

          case 'SKILL_FOCUS':
            // Only reflections with matching skillId
            if (goal.targetSkillId && skillId === goal.targetSkillId) {
              shouldIncrement = true
            }
            break

          case 'DOMAIN_FOCUS':
            // Only reflections with matching domain
            if (goal.targetDomain && domains?.includes(goal.targetDomain)) {
              shouldIncrement = true
            }
            break
        }

        if (shouldIncrement) {
          goalsToUpdate.push({
            id: goal.id,
            newValue: goal.currentValue + 1,
          })
        }
      }

      // Update goals and auto-complete if target reached
      const updatedGoals: Array<{
        id: string
        title: string
        currentValue: number
        targetValue: number
        completed: boolean
      }> = []

      for (const goalUpdate of goalsToUpdate) {
        const goal = activeGoals.find(g => g.id === goalUpdate.id)!
        const isComplete = goalUpdate.newValue >= goal.targetValue

        await tx.goal.update({
          where: { id: goalUpdate.id },
          data: {
            currentValue: goalUpdate.newValue,
            ...(isComplete ? {
              status: 'COMPLETED',
              completedAt: new Date(),
            } : {}),
          },
        })

        updatedGoals.push({
          id: goal.id,
          title: goal.title,
          currentValue: goalUpdate.newValue,
          targetValue: goal.targetValue,
          completed: isComplete,
        })
      }

      return { reflection, updatedGoals }
    })

    return NextResponse.json({
      reflection: result.reflection,
      xpEarned,
      xpByDomain,
      goalsUpdated: result.updatedGoals,
    })
  } catch (error) {
    console.error('Failed to create reflection:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create reflection', details: message },
      { status: 500 }
    )
  }
}

// DELETE - Delete a reflection
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const reflectionId = searchParams.get('id')
  const userId = searchParams.get('userId')

  if (!reflectionId || !userId) {
    return NextResponse.json(
      { error: 'id and userId are required' },
      { status: 400 }
    )
  }

  try {
    // Verify the reflection belongs to the user
    const reflection = await prisma.reflection.findFirst({
      where: { id: reflectionId, userId },
    })

    if (!reflection) {
      return NextResponse.json(
        { error: 'Reflection not found' },
        { status: 404 }
      )
    }

    // Delete in transaction: remove XP, delete ledger entry, delete reflection
    await prisma.$transaction(async (tx: TransactionClient) => {
      // Remove XP from user
      await tx.user.update({
        where: { id: userId },
        data: {
          totalXp: { decrement: reflection.xpEarned },
        },
      })

      // Delete XP ledger entry
      await tx.xpLedger.deleteMany({
        where: {
          sourceType: 'REFLECTION',
          sourceId: reflectionId,
        },
      })

      // Delete the reflection
      await tx.reflection.delete({
        where: { id: reflectionId },
      })
    })

    return NextResponse.json({ success: true, xpRemoved: reflection.xpEarned })
  } catch (error) {
    console.error('Failed to delete reflection:', error)
    return NextResponse.json(
      { error: 'Failed to delete reflection' },
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
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  try {
    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId }

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

    // Search filter - search in primaryResponse, followUpResponse, and skillName
    if (search && search.trim()) {
      where.OR = [
        { primaryResponse: { contains: search, mode: 'insensitive' } },
        { followUpResponse: { contains: search, mode: 'insensitive' } },
        { skillName: { contains: search, mode: 'insensitive' } },
      ]
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
