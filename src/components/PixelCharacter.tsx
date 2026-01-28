'use client'

import { cn } from '@/lib/utils'

export interface CharacterCustomization {
  skinTone: number // 0-5
  hairStyle: number // 0-7
  hairColor: number // 0-7
  outfit: number // 0-5
  accessory: number // 0-4 (0 = none)
  bodyType: number // 0=androgynous, 1=masculine, 2=feminine
  facialHair: number // 0-4 (none, stubble, beard, goatee, mustache)
  makeup: number // 0-3 (none, lipstick, eyeshadow, full glam)
}

interface PixelCharacterProps {
  customization: CharacterCustomization
  level?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showGlow?: boolean
}

// Color palettes
const SKIN_TONES = [
  '#FFDFC4', // Light
  '#F0C8A0', // Fair
  '#D4A574', // Medium
  '#A67B5B', // Tan
  '#8B6544', // Brown
  '#5C4033', // Dark
]

const HAIR_COLORS = [
  '#2C1810', // Black
  '#4A3728', // Dark brown
  '#8B4513', // Brown
  '#CD853F', // Light brown
  '#FFD700', // Blonde
  '#FF6B35', // Ginger
  '#9B59B6', // Purple
  '#3498DB', // Blue
]

const OUTFIT_COLORS = [
  { primary: '#3B82F6', secondary: '#1D4ED8' }, // Blue
  { primary: '#10B981', secondary: '#059669' }, // Green
  { primary: '#8B5CF6', secondary: '#7C3AED' }, // Purple
  { primary: '#F59E0B', secondary: '#D97706' }, // Amber
  { primary: '#EC4899', secondary: '#DB2777' }, // Pink
  { primary: '#EF4444', secondary: '#DC2626' }, // Red
]

// Level-based effects
const LEVEL_EFFECTS = {
  1: { aura: false, sparkles: false, crown: false },
  5: { aura: true, sparkles: false, crown: false },
  10: { aura: true, sparkles: true, crown: false },
  15: { aura: true, sparkles: true, crown: true },
}

function getLevelEffects(level: number) {
  if (level >= 15) return LEVEL_EFFECTS[15]
  if (level >= 10) return LEVEL_EFFECTS[10]
  if (level >= 5) return LEVEL_EFFECTS[5]
  return LEVEL_EFFECTS[1]
}

const SIZE_CONFIG = {
  sm: { scale: 2, width: 32, height: 40 },
  md: { scale: 3, width: 48, height: 60 },
  lg: { scale: 4, width: 64, height: 80 },
  xl: { scale: 6, width: 96, height: 120 },
}

export default function PixelCharacter({
  customization,
  level = 1,
  size = 'md',
  className,
  showGlow = true,
}: PixelCharacterProps) {
  const sizeConfig = SIZE_CONFIG[size]
  const effects = getLevelEffects(level)
  const skinColor = SKIN_TONES[customization.skinTone] || SKIN_TONES[0]
  const hairColor = HAIR_COLORS[customization.hairColor] || HAIR_COLORS[0]
  const outfit = OUTFIT_COLORS[customization.outfit] || OUTFIT_COLORS[0]

  // Calculate aura color based on level
  const auraColor = level >= 15 ? '#FFD700' : level >= 10 ? '#A855F7' : '#3B82F6'

  return (
    <div
      className={cn('relative inline-block', className)}
      style={{ width: sizeConfig.width, height: sizeConfig.height }}
    >
      {/* Aura effect for higher levels */}
      {effects.aura && showGlow && (
        <div
          className="absolute inset-0 rounded-full blur-lg animate-pulse"
          style={{
            background: `radial-gradient(circle, ${auraColor}40 0%, transparent 70%)`,
            transform: 'scale(1.5)',
          }}
        />
      )}

      <svg
        width={sizeConfig.width}
        height={sizeConfig.height}
        viewBox="0 0 16 20"
        className="relative"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Head/Face */}
        <rect x="5" y="2" width="6" height="6" fill={skinColor} />
        <rect x="4" y="3" width="1" height="4" fill={skinColor} />
        <rect x="11" y="3" width="1" height="4" fill={skinColor} />

        {/* Eyes */}
        <rect x="6" y="4" width="1" height="2" fill="#2C1810" />
        <rect x="9" y="4" width="1" height="2" fill="#2C1810" />
        <rect x="6" y="4" width="1" height="1" fill="#FFFFFF" />
        <rect x="9" y="4" width="1" height="1" fill="#FFFFFF" />

        {/* Smile */}
        <rect x="7" y="6" width="2" height="1" fill="#D4A574" />

        {/* Makeup */}
        <Makeup type={customization.makeup ?? 0} skinColor={skinColor} />

        {/* Hair styles */}
        <HairStyle style={customization.hairStyle} color={hairColor} />

        {/* Facial Hair - only for androgynous (0) or masculine (1) */}
        {(customization.bodyType === 0 || customization.bodyType === 1) && (
          <FacialHair type={customization.facialHair ?? 0} hairColor={hairColor} />
        )}

        {/* Body/Outfit with body type variations */}
        <BodyShape bodyType={customization.bodyType ?? 0} outfitPrimary={outfit.primary} outfitSecondary={outfit.secondary} skinColor={skinColor} />

        {/* Legs */}
        <rect x="5" y="15" width="2" height="4" fill="#1E3A5F" />
        <rect x="9" y="15" width="2" height="4" fill="#1E3A5F" />

        {/* Shoes */}
        <rect x="4" y="18" width="3" height="2" fill="#2C1810" />
        <rect x="9" y="18" width="3" height="2" fill="#2C1810" />

        {/* Accessories */}
        <Accessory type={customization.accessory} />

        {/* Crown for high level */}
        {effects.crown && (
          <>
            <rect x="5" y="0" width="1" height="2" fill="#FFD700" />
            <rect x="7" y="0" width="2" height="1" fill="#FFD700" />
            <rect x="10" y="0" width="1" height="2" fill="#FFD700" />
            <rect x="6" y="1" width="4" height="1" fill="#FFD700" />
          </>
        )}
      </svg>

      {/* Sparkle effects */}
      {effects.sparkles && showGlow && (
        <>
          <div
            className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-ping"
            style={{ top: '10%', right: '0%' }}
          />
          <div
            className="absolute w-1 h-1 bg-purple-300 rounded-full animate-ping"
            style={{ top: '30%', left: '0%', animationDelay: '0.5s' }}
          />
          <div
            className="absolute w-1 h-1 bg-blue-300 rounded-full animate-ping"
            style={{ bottom: '30%', right: '10%', animationDelay: '1s' }}
          />
        </>
      )}
    </div>
  )
}

function HairStyle({ style, color }: { style: number; color: string }) {
  const darkColor = adjustColor(color, -30)

  switch (style) {
    case 0: // Short
      return (
        <>
          <rect x="5" y="1" width="6" height="2" fill={color} />
          <rect x="4" y="2" width="1" height="2" fill={color} />
          <rect x="11" y="2" width="1" height="2" fill={color} />
        </>
      )
    case 1: // Long
      return (
        <>
          <rect x="5" y="1" width="6" height="2" fill={color} />
          <rect x="4" y="2" width="1" height="6" fill={color} />
          <rect x="11" y="2" width="1" height="6" fill={color} />
          <rect x="3" y="4" width="1" height="4" fill={color} />
          <rect x="12" y="4" width="1" height="4" fill={color} />
        </>
      )
    case 2: // Spiky
      return (
        <>
          <rect x="5" y="1" width="6" height="2" fill={color} />
          <rect x="5" y="0" width="2" height="1" fill={color} />
          <rect x="8" y="0" width="2" height="1" fill={color} />
          <rect x="6" y="-1" width="1" height="1" fill={color} />
          <rect x="9" y="-1" width="1" height="1" fill={color} />
        </>
      )
    case 3: // Curly
      return (
        <>
          <rect x="4" y="1" width="8" height="3" fill={color} />
          <rect x="3" y="2" width="1" height="4" fill={color} />
          <rect x="12" y="2" width="1" height="4" fill={color} />
          <rect x="4" y="0" width="2" height="1" fill={color} />
          <rect x="10" y="0" width="2" height="1" fill={color} />
        </>
      )
    case 4: // Ponytail
      return (
        <>
          <rect x="5" y="1" width="6" height="2" fill={color} />
          <rect x="11" y="2" width="2" height="2" fill={color} />
          <rect x="12" y="4" width="2" height="3" fill={color} />
          <rect x="13" y="5" width="1" height="2" fill={darkColor} />
        </>
      )
    case 5: // Bun
      return (
        <>
          <rect x="5" y="1" width="6" height="2" fill={color} />
          <rect x="6" y="0" width="4" height="1" fill={color} />
          <rect x="7" y="-1" width="2" height="1" fill={color} />
        </>
      )
    case 6: // Mohawk
      return (
        <>
          <rect x="7" y="-1" width="2" height="3" fill={color} />
          <rect x="6" y="1" width="4" height="2" fill={color} />
          <rect x="5" y="2" width="1" height="1" fill={color} />
          <rect x="10" y="2" width="1" height="1" fill={color} />
        </>
      )
    case 7: // Bald/Buzz
      return (
        <>
          <rect x="5" y="2" width="6" height="1" fill={color} opacity="0.5" />
        </>
      )
    default:
      return null
  }
}

function BodyShape({
  bodyType,
  outfitPrimary,
  outfitSecondary,
  skinColor,
}: {
  bodyType: number
  outfitPrimary: string
  outfitSecondary: string
  skinColor: string
}) {
  switch (bodyType) {
    case 1: // Masculine - wider shoulders, straight torso
      return (
        <>
          {/* Wider shoulders */}
          <rect x="3" y="8" width="10" height="1" fill={outfitPrimary} />
          <rect x="4" y="9" width="8" height="6" fill={outfitPrimary} />
          {/* Outfit details */}
          <rect x="7" y="8" width="2" height="1" fill={outfitSecondary} />
          <rect x="7" y="9" width="2" height="4" fill={outfitSecondary} />
          {/* Arms */}
          <rect x="2" y="9" width="1" height="4" fill={skinColor} />
          <rect x="13" y="9" width="1" height="4" fill={skinColor} />
        </>
      )
    case 2: // Feminine - narrower shoulders, tapered waist, wider hips
      return (
        <>
          {/* Narrower shoulders */}
          <rect x="5" y="8" width="6" height="1" fill={outfitPrimary} />
          {/* Tapered waist */}
          <rect x="5" y="9" width="6" height="2" fill={outfitPrimary} />
          <rect x="6" y="11" width="4" height="1" fill={outfitPrimary} />
          {/* Wider hips */}
          <rect x="4" y="12" width="8" height="3" fill={outfitPrimary} />
          {/* Outfit details */}
          <rect x="7" y="8" width="2" height="1" fill={outfitSecondary} />
          <rect x="7" y="9" width="2" height="3" fill={outfitSecondary} />
          {/* Arms */}
          <rect x="4" y="9" width="1" height="4" fill={skinColor} />
          <rect x="11" y="9" width="1" height="4" fill={skinColor} />
        </>
      )
    default: // Androgynous - balanced proportions (original)
      return (
        <>
          {/* Body/Outfit */}
          <rect x="5" y="8" width="6" height="7" fill={outfitPrimary} />
          <rect x="4" y="9" width="1" height="5" fill={outfitPrimary} />
          <rect x="11" y="9" width="1" height="5" fill={outfitPrimary} />
          {/* Outfit details */}
          <rect x="7" y="8" width="2" height="1" fill={outfitSecondary} />
          <rect x="7" y="9" width="2" height="4" fill={outfitSecondary} />
          {/* Arms */}
          <rect x="3" y="9" width="1" height="4" fill={skinColor} />
          <rect x="12" y="9" width="1" height="4" fill={skinColor} />
        </>
      )
  }
}

function FacialHair({ type, hairColor }: { type: number; hairColor: string }) {
  const darkColor = adjustColor(hairColor, -40)

  switch (type) {
    case 1: // Stubble
      return (
        <>
          <rect x="6" y="6" width="1" height="1" fill={darkColor} opacity="0.4" />
          <rect x="9" y="6" width="1" height="1" fill={darkColor} opacity="0.4" />
          <rect x="7" y="7" width="2" height="1" fill={darkColor} opacity="0.3" />
        </>
      )
    case 2: // Beard
      return (
        <>
          <rect x="5" y="6" width="1" height="2" fill={darkColor} />
          <rect x="10" y="6" width="1" height="2" fill={darkColor} />
          <rect x="6" y="7" width="4" height="2" fill={darkColor} />
          <rect x="7" y="9" width="2" height="1" fill={darkColor} />
        </>
      )
    case 3: // Goatee
      return (
        <>
          <rect x="7" y="7" width="2" height="2" fill={darkColor} />
          <rect x="7" y="9" width="2" height="1" fill={darkColor} opacity="0.7" />
        </>
      )
    case 4: // Mustache
      return (
        <>
          <rect x="6" y="6" width="1" height="1" fill={darkColor} />
          <rect x="9" y="6" width="1" height="1" fill={darkColor} />
          <rect x="7" y="6" width="2" height="1" fill={darkColor} opacity="0.8" />
        </>
      )
    default:
      return null
  }
}

function Makeup({ type, skinColor }: { type: number; skinColor: string }) {
  switch (type) {
    case 1: // Lipstick
      return (
        <>
          <rect x="7" y="6" width="2" height="1" fill="#DC2626" />
        </>
      )
    case 2: // Eyeshadow
      return (
        <>
          <rect x="6" y="3" width="1" height="1" fill="#8B5CF6" opacity="0.6" />
          <rect x="9" y="3" width="1" height="1" fill="#8B5CF6" opacity="0.6" />
        </>
      )
    case 3: // Full Glam (lips + eyes + blush)
      return (
        <>
          {/* Lipstick */}
          <rect x="7" y="6" width="2" height="1" fill="#DC2626" />
          {/* Eyeshadow */}
          <rect x="6" y="3" width="1" height="1" fill="#EC4899" opacity="0.5" />
          <rect x="9" y="3" width="1" height="1" fill="#EC4899" opacity="0.5" />
          {/* Blush */}
          <rect x="5" y="5" width="1" height="1" fill="#F472B6" opacity="0.4" />
          <rect x="10" y="5" width="1" height="1" fill="#F472B6" opacity="0.4" />
        </>
      )
    default:
      return null
  }
}

function Accessory({ type }: { type: number }) {
  switch (type) {
    case 1: // Glasses
      return (
        <>
          <rect x="5" y="4" width="3" height="2" fill="none" stroke="#1E3A5F" strokeWidth="0.5" />
          <rect x="8" y="4" width="3" height="2" fill="none" stroke="#1E3A5F" strokeWidth="0.5" />
          <rect x="7" y="4.5" width="2" height="0.5" fill="#1E3A5F" />
        </>
      )
    case 2: // Headphones
      return (
        <>
          <rect x="3" y="3" width="2" height="3" fill="#374151" />
          <rect x="11" y="3" width="2" height="3" fill="#374151" />
          <rect x="4" y="1" width="1" height="2" fill="#374151" />
          <rect x="11" y="1" width="1" height="2" fill="#374151" />
          <rect x="5" y="0" width="6" height="1" fill="#374151" />
        </>
      )
    case 3: // Bowtie
      return (
        <>
          <rect x="6" y="8" width="1" height="2" fill="#DC2626" />
          <rect x="9" y="8" width="1" height="2" fill="#DC2626" />
          <rect x="7" y="8.5" width="2" height="1" fill="#DC2626" />
        </>
      )
    case 4: // Scarf
      return (
        <>
          <rect x="4" y="7" width="8" height="2" fill="#10B981" />
          <rect x="3" y="8" width="2" height="4" fill="#10B981" />
          <rect x="3" y="11" width="2" height="1" fill="#059669" />
        </>
      )
    default:
      return null
  }
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

// Export customization options for the editor
export const CHARACTER_OPTIONS = {
  skinTones: SKIN_TONES,
  hairColors: HAIR_COLORS,
  hairStyles: [
    'Short',
    'Long',
    'Spiky',
    'Curly',
    'Ponytail',
    'Bun',
    'Mohawk',
    'Buzz',
  ],
  outfitColors: OUTFIT_COLORS.map((o, i) => ({
    id: i,
    name: ['Blue', 'Green', 'Purple', 'Amber', 'Pink', 'Red'][i],
    ...o,
  })),
  accessories: [
    { id: 0, name: 'None' },
    { id: 1, name: 'Glasses' },
    { id: 2, name: 'Headphones' },
    { id: 3, name: 'Bowtie' },
    { id: 4, name: 'Scarf' },
  ],
  bodyTypes: [
    { id: 0, name: 'Androgynous' },
    { id: 1, name: 'Masculine' },
    { id: 2, name: 'Feminine' },
  ],
  facialHairStyles: [
    { id: 0, name: 'None' },
    { id: 1, name: 'Stubble' },
    { id: 2, name: 'Beard' },
    { id: 3, name: 'Goatee' },
    { id: 4, name: 'Mustache' },
  ],
  makeupStyles: [
    { id: 0, name: 'None' },
    { id: 1, name: 'Lipstick' },
    { id: 2, name: 'Eyeshadow' },
    { id: 3, name: 'Full Glam' },
  ],
}

export const DEFAULT_CHARACTER: CharacterCustomization = {
  skinTone: 1,
  hairStyle: 0,
  hairColor: 2,
  outfit: 0,
  accessory: 0,
  bodyType: 0,
  facialHair: 0,
  makeup: 0,
}
