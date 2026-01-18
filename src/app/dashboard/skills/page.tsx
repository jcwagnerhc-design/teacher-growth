'use client'

import { useRouter } from 'next/navigation'
import { SkillTree } from '@/components/skill-tree'
import { XpDisplay } from '@/components/xp-display'
import { getOverallTitle } from '@/lib/utils'
import type { CategoryWithSubskills, UserProgress } from '@/types'

// Mock data - will be replaced with real data from API
const mockCategories: CategoryWithSubskills[] = [
  {
    id: '1',
    slug: 'planning-design',
    name: 'Planning & Design',
    description: 'Preparing effective learning experiences before instruction',
    displayOrder: 1,
    icon: 'clipboard-list',
    subskills: [
      {
        id: '1a', categoryId: '1', slug: 'learning-objectives', name: 'Learning Objectives',
        definition: 'Crafting clear, measurable goals aligned to standards',
        behaviors: [], antiPatterns: [], displayOrder: 1, signalTemplates: []
      },
      {
        id: '1b', categoryId: '1', slug: 'differentiation-design', name: 'Differentiation Design',
        definition: 'Planning multiple pathways for varied learners',
        behaviors: [], antiPatterns: [], displayOrder: 2, signalTemplates: []
      },
      {
        id: '1c', categoryId: '1', slug: 'resource-curation', name: 'Resource Curation',
        definition: 'Selecting and adapting high-quality materials',
        behaviors: [], antiPatterns: [], displayOrder: 3, signalTemplates: []
      },
      {
        id: '1d', categoryId: '1', slug: 'assessment-design', name: 'Assessment Design',
        definition: 'Creating checks that reveal true understanding',
        behaviors: [], antiPatterns: [], displayOrder: 4, signalTemplates: []
      },
      {
        id: '1e', categoryId: '1', slug: 'pacing-sequencing', name: 'Pacing & Sequencing',
        definition: 'Structuring time and learning progressions thoughtfully',
        behaviors: [], antiPatterns: [], displayOrder: 5, signalTemplates: []
      },
    ],
  },
  {
    id: '2',
    slug: 'classroom-culture',
    name: 'Classroom Culture',
    description: 'Building an environment where all students can thrive',
    displayOrder: 2,
    icon: 'users',
    subskills: [
      {
        id: '2a', categoryId: '2', slug: 'norms-routines', name: 'Norms & Routines',
        definition: 'Establishing predictable, student-owned systems',
        behaviors: [], antiPatterns: [], displayOrder: 1, signalTemplates: []
      },
      {
        id: '2b', categoryId: '2', slug: 'belonging-identity', name: 'Belonging & Identity',
        definition: 'Creating space where all students feel valued',
        behaviors: [], antiPatterns: [], displayOrder: 2, signalTemplates: []
      },
      {
        id: '2c', categoryId: '2', slug: 'emotional-safety', name: 'Emotional Safety',
        definition: 'Fostering risk-taking and a mistake-friendly climate',
        behaviors: [], antiPatterns: [], displayOrder: 3, signalTemplates: []
      },
      {
        id: '2d', categoryId: '2', slug: 'physical-environment', name: 'Physical Environment',
        definition: 'Designing space intentionally for learning',
        behaviors: [], antiPatterns: [], displayOrder: 4, signalTemplates: []
      },
      {
        id: '2e', categoryId: '2', slug: 'student-agency', name: 'Student Agency',
        definition: 'Giving students meaningful ownership of their learning',
        behaviors: [], antiPatterns: [], displayOrder: 5, signalTemplates: []
      },
    ],
  },
  {
    id: '3',
    slug: 'instructional-delivery',
    name: 'Instructional Delivery',
    description: 'Facilitating learning experiences in the moment',
    displayOrder: 3,
    icon: 'presentation',
    subskills: [
      {
        id: '3a', categoryId: '3', slug: 'clarity-explanation', name: 'Clarity & Explanation',
        definition: 'Communicating content accessibly and precisely',
        behaviors: [], antiPatterns: [], displayOrder: 1, signalTemplates: []
      },
      {
        id: '3b', categoryId: '3', slug: 'questioning', name: 'Questioning',
        definition: 'Using questions to deepen student thinking',
        behaviors: [], antiPatterns: [], displayOrder: 2, signalTemplates: []
      },
      {
        id: '3c', categoryId: '3', slug: 'discussion-facilitation', name: 'Discussion Facilitation',
        definition: 'Orchestrating productive student-to-student discourse',
        behaviors: [], antiPatterns: [], displayOrder: 3, signalTemplates: []
      },
      {
        id: '3d', categoryId: '3', slug: 'modeling-demonstration', name: 'Modeling & Demonstration',
        definition: 'Making expert thinking and processes visible',
        behaviors: [], antiPatterns: [], displayOrder: 4, signalTemplates: []
      },
      {
        id: '3e', categoryId: '3', slug: 'pacing-transitions', name: 'Pacing & Transitions',
        definition: 'Managing time and momentum during instruction',
        behaviors: [], antiPatterns: [], displayOrder: 5, signalTemplates: []
      },
      {
        id: '3f', categoryId: '3', slug: 'active-engagement', name: 'Active Engagement',
        definition: 'Ensuring all students are cognitively active',
        behaviors: [], antiPatterns: [], displayOrder: 6, signalTemplates: []
      },
    ],
  },
  {
    id: '4',
    slug: 'assessment-feedback',
    name: 'Assessment & Feedback',
    description: 'Using evidence of learning to guide instruction and growth',
    displayOrder: 4,
    icon: 'clipboard-check',
    subskills: [
      {
        id: '4a', categoryId: '4', slug: 'formative-checking', name: 'Formative Checking',
        definition: 'Gathering real-time data on student understanding',
        behaviors: [], antiPatterns: [], displayOrder: 1, signalTemplates: []
      },
      {
        id: '4b', categoryId: '4', slug: 'feedback-quality', name: 'Feedback Quality',
        definition: 'Providing actionable, timely, growth-oriented feedback',
        behaviors: [], antiPatterns: [], displayOrder: 2, signalTemplates: []
      },
      {
        id: '4c', categoryId: '4', slug: 'data-analysis', name: 'Data Analysis',
        definition: 'Making sense of assessment results systematically',
        behaviors: [], antiPatterns: [], displayOrder: 3, signalTemplates: []
      },
      {
        id: '4d', categoryId: '4', slug: 'responsive-adjustment', name: 'Responsive Adjustment',
        definition: 'Acting on assessment information to improve learning',
        behaviors: [], antiPatterns: [], displayOrder: 4, signalTemplates: []
      },
      {
        id: '4e', categoryId: '4', slug: 'student-self-assessment', name: 'Student Self-Assessment',
        definition: 'Building student capacity to monitor their own learning',
        behaviors: [], antiPatterns: [], displayOrder: 5, signalTemplates: []
      },
    ],
  },
]

// Mock progress data
const mockProgress: Record<string, UserProgress> = {
  '1a': { subskillId: '1a', xpEarned: 68, level: 2, signalCount: 8, lastSignalDate: new Date() },
  '1b': { subskillId: '1b', xpEarned: 42, level: 1, signalCount: 5, lastSignalDate: new Date() },
  '1c': { subskillId: '1c', xpEarned: 22, level: 1, signalCount: 3, lastSignalDate: null },
  '1d': { subskillId: '1d', xpEarned: 48, level: 1, signalCount: 6, lastSignalDate: new Date() },
  '2b': { subskillId: '2b', xpEarned: 35, level: 1, signalCount: 4, lastSignalDate: new Date() },
  '2c': { subskillId: '2c', xpEarned: 15, level: 1, signalCount: 2, lastSignalDate: null },
  '3b': { subskillId: '3b', xpEarned: 285, level: 3, signalCount: 23, lastSignalDate: new Date() },
  '3f': { subskillId: '3f', xpEarned: 145, level: 2, signalCount: 15, lastSignalDate: new Date() },
  '4a': { subskillId: '4a', xpEarned: 120, level: 2, signalCount: 12, lastSignalDate: new Date() },
  '4b': { subskillId: '4b', xpEarned: 55, level: 1, signalCount: 7, lastSignalDate: new Date() },
}

export default function SkillsPage() {
  const router = useRouter()

  // Calculate total XP
  const totalXp = Object.values(mockProgress).reduce((sum, p) => sum + p.xpEarned, 0)
  const overallLevel = Math.floor(totalXp / 1000) + 1
  const title = getOverallTitle(totalXp)

  const handleSubskillClick = (slug: string) => {
    router.push(`/dashboard/skills/${slug}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Skill Tree</h1>
          <p className="text-slate-500">Track your growth across teaching skills</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Overall Level</p>
          <p className="text-xl font-bold text-slate-900">Level {overallLevel}</p>
          <p className="text-sm text-slate-500">{title}</p>
        </div>
      </div>

      {/* XP Summary */}
      <div className="flex items-center justify-center py-4">
        <XpDisplay xp={totalXp} size="lg" />
      </div>

      {/* Skill Tree */}
      <SkillTree
        categories={mockCategories}
        progress={mockProgress}
        onSubskillClick={handleSubskillClick}
      />
    </div>
  )
}
