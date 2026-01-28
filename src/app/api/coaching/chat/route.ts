import { NextRequest, NextResponse } from 'next/server'
import { continueCoachingChat } from '@/lib/ai'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  userId: string
  reflectionId?: string
  context: {
    domain: string
    domainName: string
    skillName?: string
    primaryResponse: string
    followUpResponse?: string
    initialInsight: string
    initialStrategy: string
    profile?: {
      backstory?: string
      superpower?: string
    }
  }
  messages: ChatMessage[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ChatRequest

    const { context, messages } = body

    // Validate required fields
    if (!context || !context.primaryResponse || !context.initialInsight) {
      return NextResponse.json(
        { error: 'context with primaryResponse and initialInsight is required' },
        { status: 400 }
      )
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Rate limit: max 5 exchanges per session (10 messages including assistant responses)
    if (messages.length > 10) {
      return NextResponse.json({
        available: true,
        response: "We've had a great conversation! To keep things focused, let's wrap up here. Feel free to start a new reflection when you're ready to explore more.",
        suggestions: [],
        limitReached: true,
      })
    }

    const chatResponse = await continueCoachingChat(context, messages)

    if (!chatResponse) {
      return NextResponse.json({
        available: false,
        message: 'AI coaching chat not available',
      })
    }

    return NextResponse.json({
      available: true,
      response: chatResponse.response,
      suggestions: chatResponse.suggestions,
    })
  } catch (error) {
    console.error('Coaching chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to continue coaching conversation' },
      { status: 500 }
    )
  }
}
