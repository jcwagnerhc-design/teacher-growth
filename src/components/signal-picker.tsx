'use client'

import { useState } from 'react'
import { Check, Plus, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { XpDisplay } from '@/components/xp-display'
import type { CategoryWithSubskills, SelectedSignal } from '@/types'

interface SignalPickerProps {
  categories: CategoryWithSubskills[]
  selectedSignals: SelectedSignal[]
  onToggleSignal: (signal: SelectedSignal) => void
  onUpdateNote: (templateId: string, note: string) => void
  focusAreas?: string[]
}

export function SignalPicker({
  categories,
  selectedSignals,
  onToggleSignal,
  onUpdateNote,
  focusAreas = [],
}: SignalPickerProps) {
  const [showAll, setShowAll] = useState(false)
  const selectedIds = new Set(selectedSignals.map((s) => s.templateId))

  // Get quick picks based on focus areas
  const quickPicks = categories
    .filter((c) => focusAreas.length === 0 || focusAreas.includes(c.slug))
    .flatMap((c) =>
      c.subskills.flatMap((s) =>
        s.signalTemplates.slice(0, 2).map((t) => ({
          ...t,
          subskillId: s.id,
          subskillName: s.name,
          categoryName: c.name,
        }))
      )
    )
    .slice(0, 8)

  return (
    <div className="space-y-6">
      {/* Quick Picks */}
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-3">Quick picks</h3>
        <div className="space-y-2">
          {quickPicks.map((template) => {
            const isSelected = selectedIds.has(template.id)
            const signal: SelectedSignal = {
              templateId: template.id,
              subskillId: template.subskillId,
              prompt: template.prompt,
              xpValue: template.xpValue,
            }

            return (
              <button
                key={template.id}
                onClick={() => onToggleSignal(signal)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                )}
              >
                <div
                  className={cn(
                    'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-slate-300'
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800">{template.prompt}</p>
                  <p className="text-xs text-slate-400">{template.subskillName}</p>
                </div>
                <XpDisplay xp={template.xpValue} size="sm" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Browse All */}
      <button
        onClick={() => setShowAll(!showAll)}
        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
      >
        <Plus className="w-4 h-4" />
        Browse all skills
        <ChevronDown
          className={cn('w-4 h-4 transition-transform', showAll && 'rotate-180')}
        />
      </button>

      {showAll && (
        <div className="space-y-4 pt-2">
          {categories.map((category) => (
            <div key={category.id} className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {category.name}
              </h4>
              {category.subskills.map((subskill) => (
                <div key={subskill.id} className="space-y-1">
                  <p className="text-sm font-medium text-slate-700 pl-2">
                    {subskill.name}
                  </p>
                  {subskill.signalTemplates.map((template) => {
                    const isSelected = selectedIds.has(template.id)
                    const signal: SelectedSignal = {
                      templateId: template.id,
                      subskillId: subskill.id,
                      prompt: template.prompt,
                      xpValue: template.xpValue,
                    }

                    return (
                      <button
                        key={template.id}
                        onClick={() => onToggleSignal(signal)}
                        className={cn(
                          'w-full flex items-center gap-3 p-2 pl-4 rounded-lg border transition-all text-left',
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-transparent hover:bg-slate-50'
                        )}
                      >
                        <div
                          className={cn(
                            'flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center',
                            isSelected
                              ? 'border-indigo-500 bg-indigo-500'
                              : 'border-slate-300'
                          )}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="flex-1 text-sm text-slate-700">
                          {template.prompt}
                        </span>
                        <XpDisplay xp={template.xpValue} size="sm" />
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Selected Signals with Notes */}
      {selectedSignals.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h3 className="text-sm font-medium text-slate-700">
            Selected ({selectedSignals.length})
          </h3>
          {selectedSignals.map((signal) => (
            <div
              key={signal.templateId}
              className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 space-y-2"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-800">{signal.prompt}</p>
                <XpDisplay xp={signal.xpValue} size="sm" />
              </div>
              <input
                type="text"
                placeholder="Add a note (optional)..."
                value={signal.note ?? ''}
                onChange={(e) => onUpdateNote(signal.templateId, e.target.value)}
                className="w-full text-sm p-2 rounded border border-indigo-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
