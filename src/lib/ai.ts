import Anthropic from '@anthropic-ai/sdk'

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
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
  if (!anthropic) {
    console.log('No ANTHROPIC_API_KEY - skipping AI coaching')
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

Keep the total response under 80 words. Be encouraging but substantive. No generic praise like "Great job!" - be specific to what they shared.`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') return null

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
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
  if (!anthropic || reflections.length < 3) {
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
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') return null

    return content.text.trim()
  } catch (error) {
    console.error('Pattern insights error:', error)
    return null
  }
}
