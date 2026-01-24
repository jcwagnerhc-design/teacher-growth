import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

interface CoachingInput {
  domain: string
  domainName: string
  primaryResponse: string
  followUpResponse?: string
  skillName?: string
}

interface CoachingResponse {
  insight: string
  strategy: string
}

const DOMAIN_CONTEXT: Record<string, string> = {
  planning: 'lesson planning and preparation',
  environment: 'classroom environment and culture',
  instruction: 'instructional techniques and delivery',
  assessment: 'assessment and feedback',
}

export async function getCoachingResponse(input: CoachingInput): Promise<CoachingResponse | null> {
  if (!genAI) {
    console.log('No GEMINI_API_KEY - skipping AI coaching')
    return null
  }

  const domainContext = DOMAIN_CONTEXT[input.domain] || input.domainName

  const prompt = `You are a warm, experienced instructional coach helping a teacher reflect on their practice. They just logged this reflection:

Domain: ${input.domainName} (${domainContext})
${input.skillName ? `Skill focus: ${input.skillName}` : ''}

What happened: "${input.primaryResponse}"
${input.followUpResponse ? `Their reflection: "${input.followUpResponse}"` : ''}

Respond with exactly two parts in this JSON format:
{
  "insight": "A brief (1-2 sentence) observation that validates something specific they did or noticed. Be warm but not generic - reference their actual words.",
  "strategy": "One concrete, actionable strategy they could try tomorrow. Be specific and practical, not abstract."
}

Keep the total response under 80 words. Be encouraging but substantive. No generic praise like "Great job!" - be specific to what they shared. Return ONLY the JSON, no other text.`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])
    return {
      insight: parsed.insight || '',
      strategy: parsed.strategy || '',
    }
  } catch (error) {
    console.error('AI coaching error:', error)
    return null
  }
}

export async function getPatternInsights(
  reflections: Array<{ primaryResponse: string; followUpResponse?: string; domains: string[]; createdAt: Date }>
): Promise<string | null> {
  if (!genAI || reflections.length < 3) {
    return null
  }

  const reflectionSummary = reflections
    .slice(0, 10)
    .map((r, i) => `${i + 1}. [${r.domains.join(', ')}] ${r.primaryResponse.slice(0, 150)}`)
    .join('\n')

  const prompt = `You are an instructional coach analyzing a teacher's recent reflections to find patterns.

Recent reflections:
${reflectionSummary}

In 2-3 sentences, share ONE meaningful pattern you notice. Focus on:
- What themes keep appearing?
- What seems to energize them vs. challenge them?
- What strength could they lean into more?

Be specific and reference their actual reflections. Start with "I notice..." or "Looking at your reflections..."`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const response = result.response
    return response.text().trim()
  } catch (error) {
    console.error('Pattern insights error:', error)
    return null
  }
}
