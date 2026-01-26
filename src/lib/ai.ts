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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const response = result.response
    return response.text().trim()
  } catch (error) {
    console.error('Pattern insights error:', error)
    return null
  }
}

// ============================================
// CONVERSATIONAL COACHING CHAT
// ============================================

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatContext {
  domain: string
  domainName: string
  skillName?: string
  primaryResponse: string
  followUpResponse?: string
  initialInsight: string
  initialStrategy: string
}

interface ChatResponse {
  response: string
  suggestions: string[]
}

export async function continueCoachingChat(
  context: ChatContext,
  messages: ChatMessage[]
): Promise<ChatResponse | null> {
  if (!genAI) {
    console.log('No GEMINI_API_KEY - skipping coaching chat')
    return null
  }

  const domainContext = DOMAIN_CONTEXT[context.domain] || context.domainName

  // Build conversation history
  const conversationHistory = messages
    .map(m => `${m.role === 'user' ? 'Teacher' : 'Coach'}: ${m.content}`)
    .join('\n\n')

  const prompt = `You are a warm, experienced instructional coach continuing a conversation with a teacher. Here's the context:

ORIGINAL REFLECTION:
Domain: ${context.domainName} (${domainContext})
${context.skillName ? `Skill focus: ${context.skillName}` : ''}
What happened: "${context.primaryResponse}"
${context.followUpResponse ? `Their reflection: "${context.followUpResponse}"` : ''}

INITIAL COACHING:
Insight: "${context.initialInsight}"
Strategy: "${context.initialStrategy}"

CONVERSATION SO FAR:
${conversationHistory}

Now respond to the teacher's latest message. Keep these guidelines:
- Be warm, supportive, and specific to their situation
- Offer practical, actionable advice they can use tomorrow
- If they ask "how" questions, give concrete steps
- If they share concerns, validate and offer alternatives
- Keep responses concise (2-4 sentences max)

Respond with JSON:
{
  "response": "Your coaching response here",
  "suggestions": ["Follow-up question 1?", "Follow-up question 2?", "Follow-up question 3?"]
}

The suggestions should be natural follow-up questions the teacher might want to ask based on your response. Make them specific to the conversation context. Return ONLY the JSON.`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])
    return {
      response: parsed.response || '',
      suggestions: parsed.suggestions || [],
    }
  } catch (error) {
    console.error('Coaching chat error:', error)
    return null
  }
}

// ============================================
// DASHBOARD INSIGHTS
// ============================================

interface Goal {
  id: string
  title: string
  targetType: string
  targetValue: number
  currentValue: number
  targetSkillId?: string | null
  targetDomain?: string | null
}

interface DashboardContext {
  reflections: Array<{
    primaryResponse: string
    followUpResponse?: string | null
    domains: string[]
    skillId?: string | null
    skillName?: string | null
    createdAt: Date
  }>
  goals: Goal[]
  streak: number
  lastReflectionDate?: Date | null
}

interface DashboardInsights {
  patternInsight: string
  goalNudge: string | null
  suggestedFocus: {
    domain: string
    skill?: string
    reason: string
  } | null
  streakMessage: string | null
}

export async function getDashboardInsights(
  context: DashboardContext
): Promise<DashboardInsights | null> {
  if (!genAI) {
    console.log('No GEMINI_API_KEY - skipping dashboard insights')
    return null
  }

  // Build context summaries
  const reflectionSummary = context.reflections
    .slice(0, 10)
    .map((r, i) => {
      const daysSince = Math.floor((Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      return `${i + 1}. [${r.domains.join(', ')}${r.skillName ? ` - ${r.skillName}` : ''}] (${daysSince}d ago) ${r.primaryResponse.slice(0, 100)}`
    })
    .join('\n')

  const goalSummary = context.goals
    .map(g => `- ${g.title}: ${g.currentValue}/${g.targetValue} (${Math.round((g.currentValue / g.targetValue) * 100)}%)`)
    .join('\n')

  // Calculate domain gaps (domains not reflected on in 7+ days)
  const domainLastReflection: Record<string, number> = {}
  const allDomains = ['planning', 'environment', 'instruction', 'assessment']

  context.reflections.forEach(r => {
    r.domains.forEach(d => {
      const daysSince = Math.floor((Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      if (!domainLastReflection[d] || daysSince < domainLastReflection[d]) {
        domainLastReflection[d] = daysSince
      }
    })
  })

  const domainGaps = allDomains
    .filter(d => !domainLastReflection[d] || domainLastReflection[d] >= 7)
    .map(d => `${d} (${domainLastReflection[d] ? `${domainLastReflection[d]} days` : 'never'})`)

  const prompt = `You are an instructional coach providing personalized dashboard insights for a teacher.

RECENT REFLECTIONS (last 10):
${reflectionSummary || 'No reflections yet'}

ACTIVE GOALS:
${goalSummary || 'No active goals'}

CURRENT STREAK: ${context.streak} day(s)

NEGLECTED AREAS (7+ days):
${domainGaps.length > 0 ? domainGaps.join(', ') : 'None - great coverage!'}

Analyze this data and respond with JSON:
{
  "patternInsight": "A warm, specific observation about their teaching patterns (1-2 sentences). Reference their actual reflections. Start with 'Looking at your reflections...' or 'I notice...'",
  "goalNudge": "A brief, encouraging message about their goal progress, or null if no goals. Be specific about numbers.",
  "suggestedFocus": {
    "domain": "one of: planning, environment, instruction, assessment",
    "skill": "optional specific skill like 'questioning' or 'feedback'",
    "reason": "Brief explanation of why this area (1 sentence)"
  },
  "streakMessage": "A brief streak encouragement, or null if streak is 0"
}

Guidelines:
- Be warm and encouraging, not generic
- Reference specific things from their reflections
- If suggesting a focus area, explain WHY based on their data
- Keep everything concise
- For streakMessage, celebrate milestones (5, 10, 20, etc.)

Return ONLY the JSON.`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])
    return {
      patternInsight: parsed.patternInsight || "Keep reflecting! Your insights are building a picture of your teaching strengths.",
      goalNudge: parsed.goalNudge || null,
      suggestedFocus: parsed.suggestedFocus || null,
      streakMessage: parsed.streakMessage || null,
    }
  } catch (error) {
    console.error('Dashboard insights error:', error)
    return null
  }
}

// ============================================
// GUIDED REFLECTION PROMPTS
// ============================================

interface GuidedPromptContext {
  goals: Goal[]
  recentReflections: Array<{
    primaryResponse: string
    followUpResponse?: string | null
    domains: string[]
    skillId?: string | null
    skillName?: string | null
    createdAt: Date
  }>
  selectedDomain?: string
  selectedSkill?: string
}

interface GuidedPrompt {
  suggestedFocus: {
    domain: string
    domainName: string
    skill?: string
    skillName?: string
    reason: string
  } | null
  prompt: string
  context: string
}

const DOMAIN_NAMES: Record<string, string> = {
  planning: 'Planning & Prep',
  environment: 'Classroom Culture',
  instruction: 'Instruction',
  assessment: 'Assessment',
}

const SKILL_NAMES: Record<string, string> = {
  objectives: 'Learning Objectives',
  sequencing: 'Lesson Sequencing',
  materials: 'Resource Preparation',
  differentiation: 'Differentiation',
  relationships: 'Building Relationships',
  culture: 'Classroom Culture',
  norms: 'Routines & Procedures',
  'student-voice': 'Student Voice & Agency',
  questioning: 'Questioning Strategies',
  engagement: 'Student Engagement',
  clarity: 'Clear Explanations',
  discussion: 'Facilitating Discussion',
  pacing: 'Pacing & Flexibility',
  formative: 'Formative Assessment',
  feedback: 'Quality Feedback',
  'data-use': 'Using Data to Adjust',
  'self-assessment': 'Student Self-Assessment',
}

export async function getGuidedPrompt(
  context: GuidedPromptContext
): Promise<GuidedPrompt | null> {
  if (!genAI) {
    console.log('No GEMINI_API_KEY - skipping guided prompt')
    return null
  }

  // Calculate domain gaps
  const domainLastReflection: Record<string, number> = {}
  const allDomains = ['planning', 'environment', 'instruction', 'assessment']

  context.recentReflections.forEach(r => {
    r.domains.forEach(d => {
      const daysSince = Math.floor((Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      if (!domainLastReflection[d] || daysSince < domainLastReflection[d]) {
        domainLastReflection[d] = daysSince
      }
    })
  })

  // Build context
  const reflectionContext = context.recentReflections.slice(0, 5).map((r, i) => {
    const daysSince = Math.floor((Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    return `${i + 1}. [${r.domains.join(', ')}${r.skillName ? ` - ${r.skillName}` : ''}] (${daysSince}d ago): ${r.primaryResponse.slice(0, 150)}`
  }).join('\n')

  const goalContext = context.goals.map(g => {
    const skillInfo = g.targetSkillId ? `skill: ${SKILL_NAMES[g.targetSkillId] || g.targetSkillId}` : ''
    const domainInfo = g.targetDomain ? `domain: ${DOMAIN_NAMES[g.targetDomain] || g.targetDomain}` : ''
    return `- ${g.title} (${g.currentValue}/${g.targetValue}) ${skillInfo}${domainInfo}`
  }).join('\n')

  const gapInfo = allDomains
    .map(d => `${d}: ${domainLastReflection[d] !== undefined ? `${domainLastReflection[d]}d ago` : 'never'}`)
    .join(', ')

  // Different prompt based on whether domain/skill is pre-selected
  let specificPrompt = ''
  if (context.selectedDomain && context.selectedSkill) {
    specificPrompt = `
The teacher has already selected:
- Domain: ${DOMAIN_NAMES[context.selectedDomain]}
- Skill: ${SKILL_NAMES[context.selectedSkill] || context.selectedSkill}

Generate a personalized prompt for THIS specific skill that references their past reflections on similar topics.`
  } else {
    specificPrompt = `
The teacher hasn't selected a focus yet. Suggest the best domain/skill based on:
1. Active goals (highest priority)
2. Neglected domains (7+ days since last reflection)
3. Recent reflection themes (build on momentum)`
  }

  const prompt = `You are an instructional coach helping a teacher decide what to reflect on today.

TEACHER'S RECENT REFLECTIONS:
${reflectionContext || 'No recent reflections'}

ACTIVE GOALS:
${goalContext || 'No active goals'}

LAST REFLECTION BY DOMAIN:
${gapInfo}

${specificPrompt}

Respond with JSON:
{
  "suggestedFocus": ${context.selectedDomain && context.selectedSkill ? 'null' : `{
    "domain": "planning|environment|instruction|assessment",
    "skill": "specific skill id like 'questioning' (optional)",
    "reason": "Brief, personalized explanation (1 sentence)"
  }`},
  "prompt": "A personalized reflection prompt that references their specific context. Should feel like it's written just for them, not generic. If they've reflected on this area before, reference what they said.",
  "context": "Brief context about why you're suggesting this (1 sentence). Could reference a goal, a gap, or building on recent momentum."
}

Guidelines:
- Make the prompt specific to THEIR situation
- If they have a goal related to a skill, prioritize that
- Reference specific things from past reflections
- Keep the prompt conversational and warm
- Prompt should be a question that invites thoughtful reflection

Return ONLY the JSON.`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])

    // Enrich suggested focus with human-readable names
    let suggestedFocus = null
    if (parsed.suggestedFocus) {
      suggestedFocus = {
        domain: parsed.suggestedFocus.domain,
        domainName: DOMAIN_NAMES[parsed.suggestedFocus.domain] || parsed.suggestedFocus.domain,
        skill: parsed.suggestedFocus.skill,
        skillName: parsed.suggestedFocus.skill ? (SKILL_NAMES[parsed.suggestedFocus.skill] || parsed.suggestedFocus.skill) : undefined,
        reason: parsed.suggestedFocus.reason,
      }
    }

    return {
      suggestedFocus,
      prompt: parsed.prompt || "What moment from today's teaching would you like to reflect on?",
      context: parsed.context || "Daily reflection helps you notice patterns in your practice.",
    }
  } catch (error) {
    console.error('Guided prompt error:', error)
    return null
  }
}
