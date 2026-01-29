import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface OpenChatRequest {
  userId: string
  messages: ChatMessage[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as OpenChatRequest
    const { messages } = body

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Rate limit: max 10 exchanges per session
    if (messages.length > 20) {
      return NextResponse.json({
        available: true,
        response: "We've had a great conversation! Start a new chat to continue exploring.",
        followUps: [],
        limitReached: true,
      })
    }

    if (!genAI) {
      return NextResponse.json({
        available: false,
        message: 'AI coaching not available',
      })
    }

    // Build conversation history
    const conversationHistory = messages
      .map(m => `${m.role === 'user' ? 'Teacher' : 'Coach'}: ${m.content}`)
      .join('\n\n')

    const prompt = `You are a cognitive coach having an open conversation with a teacher about their practice.

Your role: Help them think, don't think for them. Use pausing, paraphrasing, and probing.

CONVERSATION SO FAR:
${conversationHistory}

Respond to the teacher's latest message using cognitive coaching principles:

If they're sharing something that happened or exploring an idea:
- Briefly paraphrase what you heard to show understanding
- Ask a probing question to help them go deeper
- Do NOT give advice unless they explicitly ask "what should I do?" or "do you have any suggestions?"

If they explicitly ask for strategies or advice:
- Offer ONE concrete, actionable idea
- Then ask: "What feels doable about that?" or "How might you adapt that for your context?"

If they're just getting started or seem uncertain:
- Ask an open question to help them focus: "What aspect of that would you like to explore?" or "What's the part that's most on your mind?"

Respond with JSON:
{
  "response": "Your coaching response (2-3 sentences max)",
  "followUps": ["A question they might want to explore next?", "Another direction?", "A third option?"]
}

Guidelines:
- Foster their sense of efficacy (they have the answers)
- Foster consciousness (help them notice patterns)
- Foster craftsmanship (attention to their craft)
- Keep responses concise and conversational
- The followUps should be natural next directions for the conversation

Return ONLY the JSON.`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({
        available: false,
        message: 'Failed to parse AI response',
      })
    }

    const parsed = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      available: true,
      response: parsed.response || '',
      followUps: parsed.followUps || [],
    })
  } catch (error) {
    console.error('Open coaching chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to continue coaching conversation' },
      { status: 500 }
    )
  }
}
