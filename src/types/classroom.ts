export interface ClassroomCustomization {
  wallColor: number // 0-5 (themes: Space, Forest, Sunset, Ocean, Lavender, Slate)
  decorations: number[] // Selected decoration IDs (max 6)
  deskStyle: number // 0-3 (Classic Wood, Modern White, Industrial, Cozy Oak)
}

export const WALL_THEMES = [
  { id: 0, name: 'Space', primary: '#0a1628', secondary: '#1e3a5f', accent: '#4a7ba8' },
  { id: 1, name: 'Forest', primary: '#0f2922', secondary: '#1a4032', accent: '#2d6b4f' },
  { id: 2, name: 'Sunset', primary: '#2d1f1a', secondary: '#4a2f24', accent: '#8b4f3f' },
  { id: 3, name: 'Ocean', primary: '#0a1a2e', secondary: '#1a3a5c', accent: '#3d6a8f' },
  { id: 4, name: 'Lavender', primary: '#1a1528', secondary: '#2d2545', accent: '#5c4a7a' },
  { id: 5, name: 'Slate', primary: '#1a1a1f', secondary: '#2a2a32', accent: '#4a4a55' },
]

export const DECORATIONS = [
  { id: 0, name: 'Globe', icon: 'globe' },
  { id: 1, name: 'Plant', icon: 'plant' },
  { id: 2, name: 'Books', icon: 'book-stack' },
  { id: 3, name: 'Clock', icon: 'clock' },
  { id: 4, name: 'Poster', icon: 'image' },
  { id: 5, name: 'Trophy', icon: 'trophy' },
  { id: 6, name: 'Calendar', icon: 'calendar' },
  { id: 7, name: 'Map', icon: 'map' },
  { id: 8, name: 'Lamp', icon: 'lamp' },
  { id: 9, name: 'Stars', icon: 'stars' },
]

export const DESK_STYLES = [
  { id: 0, name: 'Classic Wood', color: '#8B4513' },
  { id: 1, name: 'Modern White', color: '#E5E5E5' },
  { id: 2, name: 'Industrial', color: '#4A4A4A' },
  { id: 3, name: 'Cozy Oak', color: '#D4A574' },
]

export const DEFAULT_CLASSROOM: ClassroomCustomization = {
  wallColor: 0,
  decorations: [1, 3], // Plant and Clock by default
  deskStyle: 0,
}
