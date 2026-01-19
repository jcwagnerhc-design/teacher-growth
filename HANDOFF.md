# Teacher Growth App - Handoff Document

## What This Is
A gamified professional growth journal for teachers. Teachers walk around a virtual classroom, interact with different zones (whiteboard, discussion table, bulletin board, teacher desk), and log quick reflections about their teaching practice. They earn XP, set goals, and track progress.

## Tech Stack
- Next.js 16 with Turbopack
- Prisma ORM + PostgreSQL (Supabase)
- Tailwind CSS + Framer Motion
- TypeScript

## Current State (Working Features)
- **Base page** (`/play`) - Virtual classroom with movable character, 4 interactive zones
- **Reflection logging** (`/play/reflect`) - Quick 2-step reflection flow with domain tagging
- **Journal** (`/play/journal`) - Searchable history of past reflections
- **Goals** (`/play/goals`) - Set growth goals, auto-progress when logging reflections
- **Progress** (`/play/progress`) - XP charts, activity heatmap, domain breakdown

## Database Models (key ones)
- `User` - teacher profile, XP, streaks
- `Reflection` - logged reflections with domains, XP earned
- `Goal` - growth goals with progress tracking
- `XpLedger` - XP transaction history

## Design Theme
Blair Academy inspired: navy blues (#1e3a5f, #2d5a87, #4a7ba8), silver (#c0c0c0), clean/professional

---

## NEXT UP: AI Coaching Features

### The Goal
Differentiate from tools like Folio Collaborative by making this feel like a personal coach, not a compliance tool.

### Features to Build

#### 1. AI Coaching Response (after each reflection)
- After teacher submits a reflection, send it to Claude API
- Get back a short, encouraging coaching insight
- Display on the completion screen before "Done" button
- Example: "Great attention to wait time today. Research shows 5+ seconds gives deeper responses - try counting silently tomorrow."

#### 2. AI-Generated Strategies (just-in-time)
- Based on what they wrote, suggest 1-2 concrete strategies to try
- Show alongside the coaching response
- Example: "Try: Cold-call with think time - ask the question, pause, then call a name."

#### 3. Pattern Insights (can do after 1 & 2)
- Analyze reflection history for themes
- Surface on Progress page: "Your strongest days mention questioning techniques"
- Could be weekly digest or on-demand

### Technical Plan

1. **Add Claude API integration**
   - Get API key from console.anthropic.com
   - Add to `.env` as `ANTHROPIC_API_KEY`
   - Create `/src/lib/ai.ts` for API helper

2. **Create coaching API endpoint**
   - `POST /api/coaching`
   - Accepts: current reflection + optional recent history
   - Returns: coaching insight + strategies

3. **Update reflection completion flow**
   - After reflection saves, call coaching API
   - Show response in completion modal (before "Done")
   - Maybe add loading state: "Getting coaching feedback..."

4. **Prompt engineering**
   - Keep responses short (2-3 sentences max)
   - Warm but not sycophantic
   - Actionable - give something to try tomorrow
   - Reference their specific words/situation

### Sample Prompt Structure
```
You are a supportive instructional coach. A teacher just logged this reflection:

Domain: {domain}
What happened: {primaryResponse}
Follow-up thought: {followUpResponse}

Give a brief (2-3 sentence) coaching response that:
1. Validates something specific they did
2. Offers one concrete strategy to try tomorrow

Keep it warm but professional. No generic praise.
```

---

## File Locations
- Main play page: `src/app/play/page.tsx`
- Reflection flow: `src/app/play/reflect/page.tsx`
- Reflection API: `src/app/api/reflections/route.ts`
- Goals API: `src/app/api/goals/route.ts`
- Components: `src/components/`
- Prisma schema: `prisma/schema.prisma`

---

## To Resume
Prompt Claude Code with something like:

> "Read HANDOFF.md and let's implement the AI coaching feature. Start with the Claude API integration and the coaching endpoint."

Make sure you have:
- `ANTHROPIC_API_KEY` in your `.env` file
- Run `npm run dev` to start the server
