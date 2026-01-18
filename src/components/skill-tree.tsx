'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { calculateLevel, LEVEL_THRESHOLDS } from '@/lib/utils'
import type { CategoryWithSubskills, UserProgress } from '@/types'

interface SkillTreeProps {
  categories: CategoryWithSubskills[]
  progress: Record<string, UserProgress>
  onSubskillClick?: (subskillSlug: string) => void
}

export function SkillTree({ categories, progress, onSubskillClick }: SkillTreeProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.slice(0, 2).map((c) => c.id))
  )

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const getCategoryProgress = (category: CategoryWithSubskills) => {
    let totalXp = 0
    let subskillCount = 0
    for (const subskill of category.subskills) {
      const p = progress[subskill.id]
      if (p) {
        totalXp += p.xpEarned
        subskillCount++
      }
    }
    const avgXp = subskillCount > 0 ? totalXp / category.subskills.length : 0
    return calculateLevel(avgXp)
  }

  return (
    <div className="space-y-3">
      {categories.map((category) => {
        const isExpanded = expandedCategories.has(category.id)
        const categoryLevel = getCategoryProgress(category)
        const totalCategoryXp = category.subskills.reduce(
          (sum, s) => sum + (progress[s.id]?.xpEarned ?? 0),
          0
        )

        return (
          <div
            key={category.id}
            className="rounded-xl border border-slate-200 bg-white overflow-hidden"
          >
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                )}
                <div className="text-left">
                  <h3 className="font-medium text-slate-900">{category.name}</h3>
                  <p className="text-sm text-slate-500">{category.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-700">
                  Level {categoryLevel.level}
                </div>
                <div className="text-xs text-slate-400">
                  {totalCategoryXp.toLocaleString()} XP
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3">
                {category.subskills.map((subskill) => {
                  const p = progress[subskill.id]
                  const xp = p?.xpEarned ?? 0
                  const level = calculateLevel(xp)
                  const currentThreshold = LEVEL_THRESHOLDS[level.level - 1]?.xp ?? 0
                  const nextThreshold = level.nextThreshold

                  return (
                    <button
                      key={subskill.id}
                      onClick={() => onSubskillClick?.(subskill.slug)}
                      className="w-full text-left p-3 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-800">
                          {subskill.name}
                        </span>
                        <span className="text-sm text-slate-500">
                          Lvl {level.level} · {xp}/{nextThreshold}
                        </span>
                      </div>
                      <Progress
                        value={xp - currentThreshold}
                        max={nextThreshold - currentThreshold}
                        size="sm"
                        color="indigo"
                      />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
