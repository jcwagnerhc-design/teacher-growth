import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getGuidedPrompt } from '@/lib/ai'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')
  const domain = searchParams.get('domain')
  const skill = searchParams.get('skill')

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  try {
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

    // Get AI-guided prompt
    const guidedPrompt = await getGuidedPrompt({
      goals,
      recentReflections: reflections,
      selectedDomain: domain || undefined,
      selectedSkill: skill || undefined,
    })

    if (!guidedPrompt) {
      return NextResponse.json({
        available: false,
        message: 'Guided prompts not available',
      })
    }

    return NextResponse.json({
      available: true,
      suggestedFocus: guidedPrompt.suggestedFocus,
      prompt: guidedPrompt.prompt,
      context: guidedPrompt.context,
    })
  } catch (error) {
    console.error('Coaching prompt API error:', error)
    return NextResponse.json(
      { error: 'Failed to get guided prompt' },
      { status: 500 }
    )
  }
}
