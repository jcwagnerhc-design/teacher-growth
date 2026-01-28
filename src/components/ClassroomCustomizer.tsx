'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Paintbrush, Sofa, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ClassroomCustomization,
  WALL_THEMES,
  DECORATIONS,
  DESK_STYLES,
  DEFAULT_CLASSROOM,
} from '@/types/classroom'

interface ClassroomCustomizerProps {
  value: ClassroomCustomization
  onChange: (customization: ClassroomCustomization) => void
}

type Tab = 'walls' | 'furniture' | 'decorations'

export default function ClassroomCustomizer({
  value,
  onChange,
}: ClassroomCustomizerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('walls')

  const updateWall = (wallColor: number) => {
    onChange({ ...value, wallColor })
  }

  const updateDeskStyle = (deskStyle: number) => {
    onChange({ ...value, deskStyle })
  }

  const toggleDecoration = (decorationId: number) => {
    const current = value.decorations || []
    if (current.includes(decorationId)) {
      onChange({ ...value, decorations: current.filter(d => d !== decorationId) })
    } else if (current.length < 6) {
      onChange({ ...value, decorations: [...current, decorationId] })
    }
  }

  const currentTheme = WALL_THEMES[value.wallColor] || WALL_THEMES[0]
  const currentDesk = DESK_STYLES[value.deskStyle] || DESK_STYLES[0]

  const tabs: { id: Tab; label: string; icon: typeof Paintbrush }[] = [
    { id: 'walls', label: 'Walls', icon: Paintbrush },
    { id: 'furniture', label: 'Furniture', icon: Sofa },
    { id: 'decorations', label: 'Decor', icon: Sparkles },
  ]

  return (
    <div className="space-y-4">
      {/* Mini Preview */}
      <div className="relative h-32 rounded-xl overflow-hidden border border-slate-700">
        {/* Background gradient based on theme */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, ${currentTheme.primary}, ${currentTheme.secondary})`,
          }}
        />

        {/* Floor */}
        <div
          className="absolute bottom-0 left-0 right-0 h-12"
          style={{
            background: `linear-gradient(to bottom, ${currentTheme.secondary}, ${currentTheme.primary})`,
          }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 20px, ${currentTheme.accent}30 20px, ${currentTheme.accent}30 21px),
              repeating-linear-gradient(90deg, transparent, transparent 20px, ${currentTheme.accent}30 20px, ${currentTheme.accent}30 21px)
            `,
          }}
        />

        {/* Desk preview */}
        <div
          className="absolute bottom-4 right-8 w-16 h-8 rounded-lg border-2"
          style={{
            backgroundColor: currentDesk.color,
            borderColor: adjustColor(currentDesk.color, -30),
          }}
        />

        {/* Decoration indicators */}
        <div className="absolute top-4 left-4 flex gap-1">
          {(value.decorations || []).slice(0, 3).map((d, i) => (
            <div
              key={d}
              className="w-3 h-3 rounded-full bg-white/30"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>

        {/* Theme name */}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs">
          {currentTheme.name}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5',
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[100px]">
        {activeTab === 'walls' && (
          <div>
            <p className="text-sm text-slate-400 text-center mb-3">Wall Theme</p>
            <div className="grid grid-cols-3 gap-2">
              {WALL_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => updateWall(theme.id)}
                  className={cn(
                    'p-3 rounded-lg transition-all text-center',
                    value.wallColor === theme.id
                      ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900'
                      : 'hover:scale-105'
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                  }}
                >
                  <span className="text-xs font-medium text-white/90">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'furniture' && (
          <div>
            <p className="text-sm text-slate-400 text-center mb-3">Desk Style</p>
            <div className="grid grid-cols-2 gap-2">
              {DESK_STYLES.map((desk) => (
                <button
                  key={desk.id}
                  onClick={() => updateDeskStyle(desk.id)}
                  className={cn(
                    'p-3 rounded-lg transition-all flex items-center gap-3',
                    value.deskStyle === desk.id
                      ? 'bg-slate-700 ring-2 ring-amber-400'
                      : 'bg-slate-800 hover:bg-slate-700'
                  )}
                >
                  <div
                    className="w-8 h-4 rounded"
                    style={{ backgroundColor: desk.color }}
                  />
                  <span className="text-sm">{desk.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'decorations' && (
          <div>
            <p className="text-sm text-slate-400 text-center mb-2">
              Choose up to 6 decorations
            </p>
            <p className="text-xs text-slate-500 text-center mb-3">
              {(value.decorations || []).length}/6 selected
            </p>
            <div className="grid grid-cols-5 gap-2">
              {DECORATIONS.map((decor) => {
                const isSelected = (value.decorations || []).includes(decor.id)
                const isDisabled = !isSelected && (value.decorations || []).length >= 6
                return (
                  <button
                    key={decor.id}
                    onClick={() => toggleDecoration(decor.id)}
                    disabled={isDisabled}
                    className={cn(
                      'p-2 rounded-lg transition-all text-center',
                      isSelected
                        ? 'bg-amber-500 text-slate-950'
                        : isDisabled
                        ? 'bg-slate-900 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    )}
                  >
                    <span className="text-xs">{decor.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper to darken/lighten colors
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '')
  const num = parseInt(hex, 16)
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount))
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

export { DEFAULT_CLASSROOM }
