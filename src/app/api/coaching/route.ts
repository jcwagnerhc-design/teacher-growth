import { NextRequest, NextResponse } from 'next/server'
import { getCoachingResponse } from '@/lib/ai'

interface CoachingRequest {
  domain: string
  domainName: string
  primaryResponse: string
  followUpResponse?: string
  skillName?: string
  profile?: {
    backstory?: string
    superpower?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CoachingRequest

    const { domain, domainName, primaryResponse, followUpResponse, skillName, profile } = body

    if (!primaryResponse) {
      return NextResponse.json(
        { error: 'primaryResponse is required' },
        { status: 400 }
      )
    }

    const coaching = await getCoachingResponse({
      domain: domain || 'instruction',
      domainName: domainName || 'Teaching',
      primaryResponse,
      followUpResponse,
      skillName,
      profile,
    })

    if (!coaching) {
      return NextResponse.json({
        available: false,
        message: 'AI coaching not available',
      })
    }

    return NextResponse.json({
      available: true,
      // New cognitive coaching format
      paraphrase: coaching.paraphrase,
      probe: coaching.probe,
      // Legacy support (map to old field names for backwards compatibility)
      insight: coaching.paraphrase,
      strategy: coaching.probe,
    })
  } catch (error) {
    console.error('Coaching API error:', error)
    return NextResponse.json(
      { error: 'Failed to get coaching response' },
      { status: 500 }
    )
  }
}
