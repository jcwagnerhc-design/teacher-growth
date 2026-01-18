import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// XP calculation utilities
export const XP_CONFIG = {
  DAILY_CAP: 100,
  BASE_SIGNAL: 10,
  VARIETY_BONUS: 10,
  ARTIFACT_BONUS: 10,
  REFLECTION_BONUS: 5,
  STREAK_BONUS_PER_DAY: 5,
  STREAK_BONUS_CAP: 25,
  DIMINISHING_RETURNS: [1, 0.5, 0.25, 0], // 100%, 50%, 25%, 0% for same subskill in a day
}

export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, name: 'Novice' },
  { level: 2, xp: 100, name: 'Developing' },
  { level: 3, xp: 300, name: 'Proficient' },
  { level: 4, xp: 600, name: 'Advanced' },
  { level: 5, xp: 1000, name: 'Master' },
]

export function calculateLevel(xp: number): { level: number; name: string; progress: number; nextThreshold: number } {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].xp) {
      const current = LEVEL_THRESHOLDS[i]
      const next = LEVEL_THRESHOLDS[i + 1]
      const progress = next
        ? (xp - current.xp) / (next.xp - current.xp)
        : 1
      return {
        level: current.level,
        name: current.name,
        progress,
        nextThreshold: next?.xp ?? current.xp,
      }
    }
  }
  return { level: 1, name: 'Novice', progress: 0, nextThreshold: 100 }
}

export function getOverallTitle(totalXp: number): string {
  const level = Math.floor(totalXp / 1000) + 1
  if (level <= 5) return 'Growing Educator'
  if (level <= 15) return 'Developing Professional'
  if (level <= 30) return 'Skilled Practitioner'
  if (level <= 50) return 'Expert Teacher'
  return 'Master Educator'
}

export function calculateStreakBonus(streakDays: number): number {
  return Math.min(streakDays * XP_CONFIG.STREAK_BONUS_PER_DAY, XP_CONFIG.STREAK_BONUS_CAP)
}

// Date utilities
export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

export function isYesterday(date: Date): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  )
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(date)
}
