'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Palette, Shirt, Sparkles } from 'lucide-react'
import PixelCharacter, {
  CharacterCustomization,
  CHARACTER_OPTIONS,
  DEFAULT_CHARACTER,
} from './PixelCharacter'
import { cn } from '@/lib/utils'

interface CharacterCreatorProps {
  value: CharacterCustomization
  onChange: (customization: CharacterCustomization) => void
  level?: number
}

type Category = 'skin' | 'hair' | 'outfit' | 'accessory'

export default function CharacterCreator({
  value,
  onChange,
  level = 1,
}: CharacterCreatorProps) {
  const [category, setCategory] = useState<Category>('skin')

  const updateValue = (key: keyof CharacterCustomization, val: number) => {
    onChange({ ...value, [key]: val })
  }

  const categories: { id: Category; label: string; icon: typeof Palette }[] = [
    { id: 'skin', label: 'Skin', icon: Palette },
    { id: 'hair', label: 'Hair', icon: Sparkles },
    { id: 'outfit', label: 'Outfit', icon: Shirt },
    { id: 'accessory', label: 'Extras', icon: Sparkles },
  ]

  return (
    <div className="space-y-6">
      {/* Character Preview */}
      <div className="flex justify-center">
        <motion.div
          key={JSON.stringify(value)}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="relative"
        >
          {/* Platform */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-700 rounded-full blur-sm" />
          <PixelCharacter
            customization={value}
            level={level}
            size="xl"
            showGlow={false}
          />
        </motion.div>
      </div>

      {/* Category Tabs */}
      <div className="flex justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
              category === cat.id
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            )}
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Options */}
      <div className="min-h-[120px]">
        {category === 'skin' && (
          <OptionSection title="Skin Tone">
            <div className="flex justify-center gap-3">
              {CHARACTER_OPTIONS.skinTones.map((color, i) => (
                <button
                  key={i}
                  onClick={() => updateValue('skinTone', i)}
                  className={cn(
                    'w-10 h-10 rounded-full transition-all',
                    value.skinTone === i
                      ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 scale-110'
                      : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </OptionSection>
        )}

        {category === 'hair' && (
          <div className="space-y-4">
            <OptionSection title="Hair Style">
              <div className="flex justify-center gap-2 flex-wrap">
                {CHARACTER_OPTIONS.hairStyles.map((style, i) => (
                  <button
                    key={i}
                    onClick={() => updateValue('hairStyle', i)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm transition-all',
                      value.hairStyle === i
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    )}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </OptionSection>

            <OptionSection title="Hair Color">
              <div className="flex justify-center gap-3">
                {CHARACTER_OPTIONS.hairColors.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => updateValue('hairColor', i)}
                    className={cn(
                      'w-8 h-8 rounded-full transition-all',
                      value.hairColor === i
                        ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 scale-110'
                        : 'hover:scale-105'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </OptionSection>
          </div>
        )}

        {category === 'outfit' && (
          <OptionSection title="Outfit Color">
            <div className="flex justify-center gap-3">
              {CHARACTER_OPTIONS.outfitColors.map((outfit) => (
                <button
                  key={outfit.id}
                  onClick={() => updateValue('outfit', outfit.id)}
                  className={cn(
                    'w-10 h-10 rounded-lg transition-all relative overflow-hidden',
                    value.outfit === outfit.id
                      ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 scale-110'
                      : 'hover:scale-105'
                  )}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, ${outfit.primary} 50%, ${outfit.secondary} 50%)`,
                    }}
                  />
                </button>
              ))}
            </div>
          </OptionSection>
        )}

        {category === 'accessory' && (
          <OptionSection title="Accessories">
            <div className="flex justify-center gap-2 flex-wrap">
              {CHARACTER_OPTIONS.accessories.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => updateValue('accessory', acc.id)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm transition-all',
                    value.accessory === acc.id
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  )}
                >
                  {acc.name}
                </button>
              ))}
            </div>
          </OptionSection>
        )}
      </div>
    </div>
  )
}

function OptionSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-sm text-slate-400 text-center mb-3">{title}</p>
      {children}
    </div>
  )
}

export { DEFAULT_CHARACTER }
