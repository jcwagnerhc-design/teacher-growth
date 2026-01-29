import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

interface TeacherProfile {
  backstory?: string
  superpower?: string
}

interface CoachingInput {
  domain: string
  domainName: string
  primaryResponse: string
  followUpResponse?: string
  skillName?: string
  profile?: TeacherProfile
}

interface CoachingResponse {
  paraphrase: string
  probe: string
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

  // Build teacher identity context
  const teacherIdentity = input.profile?.backstory || input.profile?.superpower
    ? `
TEACHER IDENTITY:
${input.profile.backstory ? `Why they teach: "${input.profile.backstory}"` : ''}
${input.profile.superpower ? `Their superpower: "${input.profile.superpower}"` : ''}
`
    : ''

  const prompt = `You are a cognitive coach helping a teacher deepen their thinking about their practice.

Your role is to help teachers discover their own insights - not to give advice.
${teacherIdentity}
They just logged this reflection:

Domain: ${input.domainName} (${domainContext})
${input.skillName ? `Skill focus: ${input.skillName}` : ''}

What happened: "${input.primaryResponse}"
${input.followUpResponse ? `Their reflection: "${input.followUpResponse}"` : ''}

Respond with JSON:
{
  "paraphrase": "A 1-sentence paraphrase that captures the essence of what they shared. Start with 'So...' or 'It sounds like...' to show you heard them.",
  "probe": "One thoughtful question that helps them think deeper. Focus on: What did they notice? What assumptions are they making? What might they try differently? What does this tell them about their students or themselves?"
}

Guidelines:
- Do NOT give advice or strategies
- Your question should help them discover their own insight
- Reference their specific words
- Foster their sense of efficacy ("you figured this out") and consciousness ("what did you notice about yourself?")
- Keep the total response under 60 words

Return ONLY the JSON, no other text.`

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
      paraphrase: parsed.paraphrase || '',
      probe: parsed.probe || '',
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
  profile?: TeacherProfile
}

interface ChatResponse {
  response: string
  followUps: string[]
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

  // Build teacher identity context
  const teacherIdentity = context.profile?.backstory || context.profile?.superpower
    ? `
TEACHER IDENTITY:
${context.profile.backstory ? `Why they teach: "${context.profile.backstory}"` : ''}
${context.profile.superpower ? `Their superpower: "${context.profile.superpower}"` : ''}
`
    : ''

  const prompt = `You are a cognitive coach in an ongoing conversation with a teacher.

Your role: Help them think, don't think for them. Use pausing, paraphrasing, and probing.
${teacherIdentity}
ORIGINAL REFLECTION:
Domain: ${context.domainName} (${domainContext})
${context.skillName ? `Skill focus: ${context.skillName}` : ''}
What happened: "${context.primaryResponse}"
${context.followUpResponse ? `Their reflection: "${context.followUpResponse}"` : ''}

INITIAL COACHING:
Paraphrase: "${context.initialInsight}"
Probe: "${context.initialStrategy}"

CONVERSATION SO FAR:
${conversationHistory}

Respond to their latest message:

If they're sharing or exploring:
- Paraphrase what you heard
- Ask a probing question to go deeper
- Do NOT give advice unless they explicitly ask "what should I do?" or "do you have suggestions?"

If they explicitly ask for a strategy or advice:
- Offer ONE concrete, actionable idea
- Then ask: "What feels doable about that?" or "How might you adapt that for your context?"

Respond with JSON:
{
  "response": "Your coaching response",
  "followUps": ["Question they might ask 1?", "Question 2?", "Question 3?"]
}

Keep responses concise (2-3 sentences). Foster their sense of craftsmanship (attention to their craft) and flexibility (multiple perspectives).

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
      response: parsed.response || '',
      followUps: parsed.followUps || parsed.suggestions || [],
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

  const prompt = `You are a cognitive coach reviewing a teacher's reflection patterns.

RECENT REFLECTIONS (last 10):
${reflectionSummary || 'No reflections yet'}

ACTIVE GOALS:
${goalSummary || 'No active goals'}

CURRENT STREAK: ${context.streak} day(s)

NEGLECTED AREAS (7+ days):
${domainGaps.length > 0 ? domainGaps.join(', ') : 'None - great coverage!'}

Instead of telling them what you notice, invite them to notice:

Respond with JSON:
{
  "patternInsight": "A question that helps them see a pattern. E.g., 'I see you've reflected on questioning 4 times this month. What draws you to that area?' or 'Your reflections mention student engagement often. What are you learning about what works?'",
  "goalNudge": "A brief acknowledgment of goal progress with a curious question, or null if no goals. E.g., 'You're at 3/5 on your questioning goal. What's been most challenging so far?'",
  "suggestedFocus": {
    "domain": "one of: planning, environment, instruction, assessment",
    "skill": "optional specific skill like 'questioning' or 'feedback'",
    "reason": "An invitation, not a directive. E.g., 'You haven't reflected on assessment in a while. Curious what's happening there?' NOT 'You should focus on assessment.'"
  },
  "streakMessage": "Brief acknowledgment of streak if applicable. Focus on their consistency, not generic praise. Null if streak is 0."
}

Guidelines:
- Ask questions rather than make statements
- Foster their sense of consciousness (help them notice their own patterns)
- Reference specific things from their reflections
- Keep everything concise

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

  const prompt = `You are a cognitive coach helping a teacher choose a reflection focus.

TEACHER'S RECENT REFLECTIONS:
${reflectionContext || 'No recent reflections'}

ACTIVE GOALS:
${goalContext || 'No active goals'}

LAST REFLECTION BY DOMAIN:
${gapInfo}

${specificPrompt}

Your job is to INVITE, not prescribe. Teachers know what they need to think about.

Respond with JSON:
{
  "suggestedFocus": ${context.selectedDomain && context.selectedSkill ? 'null' : `{
    "domain": "planning|environment|instruction|assessment",
    "skill": "specific skill id like 'questioning' (optional)",
    "reason": "Brief, curious framing. E.g., 'It's been a while since you reflected on classroom environment. Anything happening there worth exploring?'"
  }`},
  "prompt": "An open invitation with light suggestion. E.g., 'What's alive for you today? I notice you've been thinking about questioning lately - want to continue there, or is something else calling for attention?'",
  "context": "Brief context (1 sentence). Frame as curiosity, not prescription."
}

Guidelines:
- Offer invitations, not directives
- If they have a goal, mention it as one option among many
- Reference past reflections to show you're listening
- The prompt should invite their choice, not direct it
- Foster their sense of efficacy (they know what they need)

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
