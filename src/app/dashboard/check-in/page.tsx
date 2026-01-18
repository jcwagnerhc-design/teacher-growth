'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SignalPicker } from '@/components/signal-picker'
import { XpDisplay } from '@/components/xp-display'
import { formatDate, XP_CONFIG } from '@/lib/utils'
import { CheckCircle2, Sparkles } from 'lucide-react'
import type { SelectedSignal, CategoryWithSubskills } from '@/types'

// Mock skill data - will be replaced with real data from API
const mockCategories: CategoryWithSubskills[] = [
  {
    id: '1',
    slug: 'instructional-delivery',
    name: 'Instructional Delivery',
    description: 'Facilitating learning experiences in the moment',
    displayOrder: 3,
    icon: 'presentation',
    subskills: [
      {
        id: '1a',
        categoryId: '1',
        slug: 'questioning',
        name: 'Questioning',
        definition: 'Using questions to deepen student thinking',
        behaviors: [],
        antiPatterns: [],
        displayOrder: 2,
        signalTemplates: [
          { id: 't1', prompt: 'Asked a higher-order question', xpValue: 10 },
          { id: 't2', prompt: 'Extended wait time (3+ seconds)', xpValue: 10 },
          { id: 't3', prompt: 'Probed a student response deeper', xpValue: 15 },
        ],
      },
      {
        id: '1b',
        categoryId: '1',
        slug: 'active-engagement',
        name: 'Active Engagement',
        definition: 'Ensuring all students are cognitively active',
        behaviors: [],
        antiPatterns: [],
        displayOrder: 6,
        signalTemplates: [
          { id: 't4', prompt: 'Used a total participation technique', xpValue: 10 },
          { id: 't5', prompt: 'Had a 100% engagement moment', xpValue: 15 },
          { id: 't6', prompt: 'Cold-called equitably', xpValue: 10 },
        ],
      },
    ],
  },
  {
    id: '2',
    slug: 'assessment-feedback',
    name: 'Assessment & Feedback',
    description: 'Using evidence of learning to guide instruction',
    displayOrder: 4,
    icon: 'clipboard-check',
    subskills: [
      {
        id: '2a',
        categoryId: '2',
        slug: 'formative-checking',
        name: 'Formative Checking',
        definition: 'Gathering real-time data on student understanding',
        behaviors: [],
        antiPatterns: [],
        displayOrder: 1,
        signalTemplates: [
          { id: 't7', prompt: 'Did a formative check mid-lesson', xpValue: 10 },
          { id: 't8', prompt: 'Knew who was confused before lesson ended', xpValue: 15 },
          { id: 't9', prompt: 'Used student responses to adjust', xpValue: 15 },
        ],
      },
      {
        id: '2b',
        categoryId: '2',
        slug: 'feedback-quality',
        name: 'Feedback Quality',
        definition: 'Providing actionable, timely feedback',
        behaviors: [],
        antiPatterns: [],
        displayOrder: 2,
        signalTemplates: [
          { id: 't10', prompt: 'Gave specific, actionable feedback', xpValue: 10 },
          { id: 't11', prompt: 'Returned work within target time', xpValue: 10 },
          { id: 't12', prompt: 'Provided growth-oriented correction', xpValue: 15 },
        ],
      },
    ],
  },
  {
    id: '3',
    slug: 'classroom-culture',
    name: 'Classroom Culture',
    description: 'Building an environment where all students can thrive',
    displayOrder: 2,
    icon: 'users',
    subskills: [
      {
        id: '3a',
        categoryId: '3',
        slug: 'belonging-identity',
        name: 'Belonging & Identity',
        definition: 'Creating space where all students feel valued',
        behaviors: [],
        antiPatterns: [],
        displayOrder: 2,
        signalTemplates: [
          { id: 't13', prompt: 'Learned something new about a student', xpValue: 10 },
          { id: 't14', prompt: 'Incorporated student voice or interest', xpValue: 15 },
          { id: 't15', prompt: 'Made a connection with a student', xpValue: 10 },
        ],
      },
      {
        id: '3b',
        categoryId: '3',
        slug: 'emotional-safety',
        name: 'Emotional Safety',
        definition: 'Fostering risk-taking and a mistake-friendly climate',
        behaviors: [],
        antiPatterns: [],
        displayOrder: 3,
        signalTemplates: [
          { id: 't16', prompt: 'Celebrated a productive mistake', xpValue: 15 },
          { id: 't17', prompt: 'Addressed a status or safety issue', xpValue: 15 },
          { id: 't18', prompt: 'Created space for risk-taking', xpValue: 10 },
        ],
      },
    ],
  },
]

export default function CheckInPage() {
  const router = useRouter()
  const [selectedSignals, setSelectedSignals] = useState<SelectedSignal[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const today = new Date()

  // Calculate total XP with bonuses
  const baseXp = selectedSignals.reduce((sum, s) => sum + s.xpValue, 0)
  const uniqueSubskills = new Set(selectedSignals.map((s) => s.subskillId))
  const varietyBonus = Math.max(0, (uniqueSubskills.size - 1)) * XP_CONFIG.VARIETY_BONUS
  const totalXp = Math.min(baseXp + varietyBonus, XP_CONFIG.DAILY_CAP)

  const handleToggleSignal = (signal: SelectedSignal) => {
    setSelectedSignals((prev) => {
      const exists = prev.find((s) => s.templateId === signal.templateId)
      if (exists) {
        return prev.filter((s) => s.templateId !== signal.templateId)
      }
      return [...prev, signal]
    })
  }

  const handleUpdateNote = (templateId: string, note: string) => {
    setSelectedSignals((prev) =>
      prev.map((s) =>
        s.templateId === templateId ? { ...s, note } : s
      )
    )
  }

  const handleSubmit = async () => {
    if (selectedSignals.length === 0) return

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsComplete(true)
    setIsSubmitting(false)
  }

  if (isComplete) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Check-in complete!
        </h1>
        <p className="text-slate-600 mb-6">
          You logged {selectedSignals.length} signal{selectedSignals.length !== 1 ? 's' : ''} today.
        </p>
        <div className="flex items-center justify-center gap-2 mb-8">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span className="text-xl font-semibold text-amber-600">+{totalXp} XP</span>
        </div>
        <Button onClick={() => router.push('/dashboard')} variant="primary">
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Daily Check-in
        </h1>
        <p className="text-slate-500">{formatDate(today)}</p>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            What did you notice in your practice today?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SignalPicker
            categories={mockCategories}
            selectedSignals={selectedSignals}
            onToggleSignal={handleToggleSignal}
            onUpdateNote={handleUpdateNote}
            focusAreas={['instructional-delivery', 'assessment-feedback']}
          />
        </CardContent>
      </Card>

      {/* XP Summary */}
      {selectedSignals.length > 0 && (
        <Card className="mb-6 bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-800 font-medium">
                  {selectedSignals.length} signal{selectedSignals.length !== 1 ? 's' : ''} selected
                </p>
                {varietyBonus > 0 && (
                  <p className="text-xs text-amber-600">
                    +{varietyBonus} XP variety bonus
                  </p>
                )}
              </div>
              <XpDisplay xp={totalXp} size="lg" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard')}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={selectedSignals.length === 0 || isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Check-in'}
        </Button>
      </div>
    </div>
  )
}
