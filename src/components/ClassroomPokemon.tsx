'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { CharacterCustomization } from './PixelCharacter'

// Tile size - BIGGER tiles for better visibility
const TILE = 56

// Color palettes (same as PixelCharacter)
const SKIN_TONES = [
  '#FFDFC4', '#F0C8A0', '#D4A574', '#A67B5B', '#8B6544', '#5C4033',
]
const HAIR_COLORS = [
  '#2C1810', '#4A3728', '#8B4513', '#CD853F', '#FFD700', '#FF6B35', '#9B59B6', '#3498DB',
]
const OUTFIT_COLORS = [
  { primary: '#3B82F6', secondary: '#1D4ED8' },
  { primary: '#10B981', secondary: '#059669' },
  { primary: '#8B5CF6', secondary: '#7C3AED' },
  { primary: '#F59E0B', secondary: '#D97706' },
  { primary: '#EC4899', secondary: '#DB2777' },
  { primary: '#EF4444', secondary: '#DC2626' },
]

// Map dimensions (in tiles)
const MAP_W = 14
const MAP_H = 10

// Tile types
const FLOOR = 0
const WALL = 1
const WHITEBOARD = 2
const TABLE = 3
const DESK = 4
const BULLETIN = 5
const BOOKSHELF = 6
const WINDOW = 7
const DOOR_COACH = 8
const RUG = 9
const PLANT = 11
const DOOR_JOURNAL = 12
const DOOR_GOALS = 13
const DOOR_ARCHIVE = 14

// Room types for doors
export type RoomType = 'coach' | 'journal' | 'goals' | 'archive'

// Door configurations with school-contextual names
const DOOR_CONFIG: Record<number, { room: RoomType; label: string; glowColor: string; labelColor: string }> = {
  [DOOR_COACH]: { room: 'coach', label: "DOTL's Red Couch", glowColor: 'rgba(74, 124, 89, ', labelColor: '#4A7C59' },
  [DOOR_JOURNAL]: { room: 'journal', label: 'Journal', glowColor: 'rgba(107, 91, 149, ', labelColor: '#6B5B95' },
  [DOOR_GOALS]: { room: 'goals', label: 'Lab', glowColor: 'rgba(218, 165, 32, ', labelColor: '#DAA520' },
  [DOOR_ARCHIVE]: { room: 'archive', label: 'Records', glowColor: 'rgba(112, 128, 144, ', labelColor: '#708090' },
}

// Map layout - 4 doors around the classroom
const MAP = [
  [WALL, WALL, WINDOW, WALL, DOOR_ARCHIVE, WHITEBOARD, WHITEBOARD, DOOR_ARCHIVE, WALL, WINDOW, WALL, WALL, WALL, WALL],
  [WALL, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, BOOKSHELF, FLOOR, WALL],
  [WALL, BULLETIN, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, BOOKSHELF, FLOOR, WALL],
  [DOOR_JOURNAL, FLOOR, FLOOR, FLOOR, RUG, RUG, RUG, RUG, RUG, FLOOR, FLOOR, FLOOR, FLOOR, DOOR_GOALS],
  [DOOR_JOURNAL, FLOOR, FLOOR, FLOOR, RUG, TABLE, TABLE, TABLE, RUG, FLOOR, FLOOR, DESK, DESK, DOOR_GOALS],
  [WALL, FLOOR, FLOOR, FLOOR, RUG, TABLE, TABLE, TABLE, RUG, FLOOR, FLOOR, DESK, PLANT, WALL],
  [WALL, FLOOR, FLOOR, FLOOR, RUG, RUG, RUG, RUG, RUG, FLOOR, FLOOR, FLOOR, FLOOR, WALL],
  [WALL, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, WALL],
  [WALL, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, WALL],
  [WALL, WALL, WALL, WALL, WALL, DOOR_COACH, DOOR_COACH, DOOR_COACH, WALL, WALL, WALL, WALL, WALL, WALL],
]

// What tiles block movement (doors are not solid - you walk through them)
const DOOR_TILES = [DOOR_COACH, DOOR_JOURNAL, DOOR_GOALS, DOOR_ARCHIVE]
const SOLID = [WALL, WHITEBOARD, TABLE, DESK, BULLETIN, BOOKSHELF, WINDOW, PLANT]

interface Props {
  onEnterDoor: (room: RoomType) => void
}

const DEFAULT_CHARACTER: CharacterCustomization = {
  skinTone: 1,
  hairStyle: 0,
  hairColor: 2,
  outfit: 0,
  accessory: 0,
  bodyType: 0,
  facialHair: 0,
  makeup: 0,
}

export default function ClassroomPokemon({ onEnterDoor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [character, setCharacter] = useState<CharacterCustomization>(DEFAULT_CHARACTER)

  // Load character from profile
  useEffect(() => {
    const profileStr = localStorage.getItem('teacher-profile')
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr)
        if (profile.character) {
          setCharacter(profile.character)
        }
      } catch (e) {
        // ignore
      }
    }
  }, [])

  // Player position in pixels
  const playerRef = useRef({ x: 7 * TILE, y: 7 * TILE })
  const keysRef = useRef<Set<string>>(new Set())
  const facingRef = useRef<'up' | 'down' | 'left' | 'right'>('up')
  const doorTriggeredRef = useRef(false)

  // Draw a single tile
  const drawTile = useCallback((ctx: CanvasRenderingContext2D, type: number, x: number, y: number, playerY: number) => {
    const px = x * TILE
    const py = y * TILE

    switch (type) {
      case FLOOR:
        // Wooden floor tiles
        ctx.fillStyle = '#DEB887'
        ctx.fillRect(px, py, TILE, TILE)
        ctx.strokeStyle = '#C4A060'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(px, py + TILE/3)
        ctx.lineTo(px + TILE, py + TILE/3)
        ctx.moveTo(px, py + TILE*2/3)
        ctx.lineTo(px + TILE, py + TILE*2/3)
        ctx.stroke()
        ctx.strokeStyle = '#D4B070'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(px + 8, py + 8)
        ctx.lineTo(px + TILE - 8, py + 12)
        ctx.moveTo(px + 10, py + TILE/2 + 5)
        ctx.lineTo(px + TILE - 10, py + TILE/2 + 8)
        ctx.stroke()
        break

      case WALL:
        ctx.fillStyle = '#F5E6D3'
        ctx.fillRect(px, py, TILE, TILE)
        ctx.fillStyle = '#EED9C4'
        ctx.fillRect(px, py, TILE, 6)
        ctx.fillRect(px, py + TILE - 8, TILE, 8)
        ctx.fillStyle = '#8B6914'
        ctx.fillRect(px, py + TILE - 10, TILE, 10)
        ctx.fillStyle = '#A67C00'
        ctx.fillRect(px, py + TILE - 10, TILE, 3)
        break

      case WINDOW:
        ctx.fillStyle = '#F5E6D3'
        ctx.fillRect(px, py, TILE, TILE)
        ctx.fillStyle = '#8B6914'
        ctx.fillRect(px + 6, py + 6, TILE - 12, TILE - 12)
        const skyGrad = ctx.createLinearGradient(px, py + 8, px, py + TILE - 8)
        skyGrad.addColorStop(0, '#87CEEB')
        skyGrad.addColorStop(1, '#B0E0E6')
        ctx.fillStyle = skyGrad
        ctx.fillRect(px + 10, py + 10, TILE - 20, TILE - 20)
        ctx.fillStyle = '#A67C00'
        ctx.fillRect(px + TILE/2 - 2, py + 6, 4, TILE - 12)
        ctx.fillRect(px + 6, py + TILE/2 - 2, TILE - 12, 4)
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.fillRect(px + 12, py + 12, 10, 14)
        break

      case WHITEBOARD:
        ctx.fillStyle = '#F5E6D3'
        ctx.fillRect(px, py, TILE, TILE)
        ctx.fillStyle = '#A0A0A0'
        ctx.fillRect(px + 4, py + 10, TILE - 8, TILE - 14)
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(px + 6, py + 12, TILE - 12, TILE - 18)
        ctx.fillStyle = '#2563EB'
        ctx.font = `bold ${TILE/4}px sans-serif`
        ctx.fillText('ABC', px + 10, py + 26)
        ctx.fillStyle = '#1E293B'
        ctx.fillRect(px + 10, py + 32, TILE - 24, 3)
        ctx.fillRect(px + 10, py + 38, TILE - 28, 3)
        ctx.fillStyle = '#808080'
        ctx.fillRect(px + 8, py + TILE - 8, TILE - 16, 6)
        break

      case TABLE:
        ctx.fillStyle = '#DEB887'
        ctx.fillRect(px, py, TILE, TILE)
        ctx.fillStyle = '#A0522D'
        ctx.fillRect(px + 2, py + 6, TILE - 4, TILE - 12)
        ctx.fillStyle = '#CD853F'
        ctx.fillRect(px + 4, py + 8, TILE - 8, 4)
        ctx.fillStyle = '#8B4513'
        ctx.fillRect(px + 2, py + TILE - 8, TILE - 4, 6)
        break

      case RUG:
        ctx.fillStyle = '#DEB887'
        ctx.fillRect(px, py, TILE, TILE)
        ctx.fillStyle = '#4A6FA5'
        ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2)
        ctx.fillStyle = '#6B8FC4'
        ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8)
        ctx.fillStyle = '#3D5A80'
        ctx.fillRect(px + 8, py + 8, TILE - 16, TILE - 16)
        break

      case DESK:
        ctx.fillStyle = '#DEB887'
        ctx.fillRect(px, py, TILE, TILE)
        ctx.fillStyle = '#5D4037'
        ctx.fillRect(px + 2, py + 8, TILE - 4, TILE - 12)
        ctx.fillStyle = '#6D4C41'
        ctx.fillRect(px + 6, py + 12, TILE - 12, 3)
        ctx.fillRect(px + 8, py + 20, TILE - 16, 3)
        if (playerY > y * TILE) {
          ctx.fillStyle = '#4E342E'
          ctx.fillRect(px + 2, py + TILE - 10, TILE - 4, 10)
          ctx.fillStyle = '#5D4037'
          ctx.fillRect(px + 8, py + TILE - 8, TILE - 16, 6)
          ctx.fillStyle = '#FFD700'
          ctx.fillRect(px + TILE/2 - 4, py + TILE - 6, 8, 3)
        }
        ctx.fillStyle = '#37474F'
        ctx.fillRect(px + 8, py + 12, 16, 12)
        ctx.fillStyle = '#64B5F6'
        ctx.fillRect(px + 10, py + 14, 12, 8)
        ctx.fillStyle = '#E53935'
        ctx.beginPath()
        ctx.arc(px + TILE - 12, py + 18, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#3E2723'
        ctx.beginPath()
        ctx.arc(px + TILE - 12, py + 18, 4, 0, Math.PI * 2)
        ctx.fill()
        break

      case BULLETIN:
        ctx.fillStyle = '#F5E6D3'
        ctx.fillRect(px, py, TILE, TILE)
        ctx.fillStyle = '#D2691E'
        ctx.fillRect(px + 4, py + 6, TILE - 8, TILE - 12)
        ctx.strokeStyle = '#8B4513'
        ctx.lineWidth = 4
        ctx.strokeRect(px + 4, py + 6, TILE - 8, TILE - 12)
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(px + 10, py + 12, 14, 16)
        ctx.fillStyle = '#FFFACD'
        ctx.fillRect(px + 26, py + 14, 12, 12)
        ctx.fillStyle = '#E6F3FF'
        ctx.fillRect(px + 12, py + 30, 16, 12)
        ctx.fillStyle = '#FF0000'
        ctx.beginPath()
        ctx.arc(px + 16, py + 14, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#4CAF50'
        ctx.beginPath()
        ctx.arc(px + 30, py + 16, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#2196F3'
        ctx.beginPath()
        ctx.arc(px + 18, py + 32, 3, 0, Math.PI * 2)
        ctx.fill()
        break

      case BOOKSHELF:
        ctx.fillStyle = '#F5E6D3'
        ctx.fillRect(px, py, TILE, TILE)
        ctx.fillStyle = '#5D4037'
        ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8)
        ctx.fillStyle = '#6D4C41'
        ctx.fillRect(px + 4, py + TILE/3, TILE - 8, 4)
        ctx.fillRect(px + 4, py + TILE*2/3, TILE - 8, 4)
        const colors1 = ['#1565C0', '#C62828', '#2E7D32', '#6A1B9A', '#EF6C00']
        let bx = px + 8
        for (let i = 0; i < 4; i++) {
          const h = 10 + (i % 2) * 4
          ctx.fillStyle = colors1[i]
          ctx.fillRect(bx, py + TILE/3 - h - 2, 7, h)
          bx += 9
        }
        bx = px + 8
        for (let i = 0; i < 4; i++) {
          const h = 12 + ((i + 1) % 2) * 3
          ctx.fillStyle = colors1[(i + 2) % 5]
          ctx.fillRect(bx, py + TILE*2/3 - h - 2, 7, h)
          bx += 9
        }
        break

      case DOOR_COACH:
      case DOOR_JOURNAL:
      case DOOR_GOALS:
      case DOOR_ARCHIVE:
        ctx.fillStyle = '#DEB887'
        ctx.fillRect(px, py, TILE, TILE)

        const doorConfig = DOOR_CONFIG[type]
        const doorPulse = 0.3 + Math.sin(Date.now() / 500) * 0.15

        // Glowing aura
        ctx.fillStyle = doorConfig ? doorConfig.glowColor + doorPulse + ')' : `rgba(74, 124, 89, ${doorPulse})`
        ctx.fillRect(px + 2, py - 4, TILE - 4, TILE + 8)

        // Door frame
        ctx.fillStyle = '#5D4037'
        ctx.fillRect(px + 4, py, TILE - 8, TILE)

        // Door
        ctx.fillStyle = '#3E2723'
        ctx.fillRect(px + 8, py + 4, TILE - 16, TILE - 4)

        // Window
        ctx.fillStyle = '#FFF8DC'
        ctx.fillRect(px + 12, py + 8, TILE - 24, 16)
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.fillRect(px + 14, py + 10, 6, 12)

        // Panel
        ctx.fillStyle = '#4E342E'
        ctx.fillRect(px + 12, py + 28, TILE - 24, 12)

        // Handle
        ctx.fillStyle = '#FFD700'
        ctx.beginPath()
        ctx.arc(px + TILE - 14, py + TILE/2 + 4, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#DAA520'
        ctx.beginPath()
        ctx.arc(px + TILE - 14, py + TILE/2 + 4, 2, 0, Math.PI * 2)
        ctx.fill()
        break

      case PLANT:
        ctx.fillStyle = '#DEB887'
        ctx.fillRect(px, py, TILE, TILE)
        ctx.strokeStyle = '#C4A060'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(px, py + TILE/3)
        ctx.lineTo(px + TILE, py + TILE/3)
        ctx.moveTo(px, py + TILE*2/3)
        ctx.lineTo(px + TILE, py + TILE*2/3)
        ctx.stroke()
        ctx.fillStyle = '#E07B4A'
        ctx.beginPath()
        ctx.moveTo(px + 12, py + 24)
        ctx.lineTo(px + TILE - 12, py + 24)
        ctx.lineTo(px + TILE - 16, py + TILE - 4)
        ctx.lineTo(px + 16, py + TILE - 4)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = '#C66A3D'
        ctx.fillRect(px + 10, py + 22, TILE - 20, 5)
        ctx.fillStyle = '#4CAF50'
        ctx.beginPath()
        ctx.ellipse(px + TILE/2, py + 14, 10, 14, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#66BB6A'
        ctx.beginPath()
        ctx.ellipse(px + TILE/2 - 8, py + 16, 6, 12, -0.4, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.ellipse(px + TILE/2 + 8, py + 16, 6, 12, 0.4, 0, Math.PI * 2)
        ctx.fill()
        break
    }
  }, [])

  // Draw player
  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, facing: string) => {
    const skinColor = SKIN_TONES[character.skinTone] || SKIN_TONES[1]
    const hairColor = HAIR_COLORS[character.hairColor] || HAIR_COLORS[2]
    const outfit = OUTFIT_COLORS[character.outfit] || OUTFIT_COLORS[0]

    const scale = 3
    const charW = 16 * scale
    const charH = 20 * scale
    const cx = x + TILE/2
    const baseY = y + TILE - 8
    const startX = cx - charW/2
    const startY = baseY - charH

    const px = (px: number, py: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color
      ctx.fillRect(startX + px * scale, startY + py * scale, w * scale, h * scale)
    }

    // Glowing ring
    const pulse = 0.6 + Math.sin(Date.now() / 300) * 0.2
    ctx.fillStyle = `rgba(59, 130, 246, ${pulse * 0.4})`
    ctx.beginPath()
    ctx.ellipse(cx, baseY + 2, 22, 10, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = `rgba(59, 130, 246, ${pulse})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(cx, baseY + 2, 22, 10, 0, 0, Math.PI * 2)
    ctx.stroke()

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.beginPath()
    ctx.ellipse(cx, baseY + 4, 16, 6, 0, 0, Math.PI * 2)
    ctx.fill()

    if (facing === 'up') {
      px(5, 1, 6, 6, hairColor)
      px(4, 2, 1, 4, hairColor)
      px(11, 2, 1, 4, hairColor)
      px(4, 3, 1, 3, skinColor)
      px(11, 3, 1, 3, skinColor)
      px(4, 8, 8, 7, outfit.primary)
      px(3, 9, 1, 4, skinColor)
      px(12, 9, 1, 4, skinColor)
      px(5, 15, 2, 4, '#1E3A5F')
      px(9, 15, 2, 4, '#1E3A5F')
      px(4, 18, 3, 2, '#2C1810')
      px(9, 18, 3, 2, '#2C1810')
    } else if (facing === 'down') {
      px(5, 2, 6, 6, skinColor)
      px(4, 3, 1, 4, skinColor)
      px(11, 3, 1, 4, skinColor)
      px(5, 1, 6, 2, hairColor)
      px(4, 2, 1, 2, hairColor)
      px(11, 2, 1, 2, hairColor)
      px(6, 4, 1, 2, '#2C1810')
      px(9, 4, 1, 2, '#2C1810')
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(startX + 6 * scale, startY + 4 * scale, scale * 0.6, scale * 0.6)
      ctx.fillRect(startX + 9 * scale, startY + 4 * scale, scale * 0.6, scale * 0.6)
      px(7, 6, 2, 1, '#D4A574')
      px(5, 8, 6, 7, outfit.primary)
      px(4, 9, 1, 5, outfit.primary)
      px(11, 9, 1, 5, outfit.primary)
      px(7, 8, 2, 1, outfit.secondary)
      px(7, 9, 2, 4, outfit.secondary)
      px(3, 9, 1, 4, skinColor)
      px(12, 9, 1, 4, skinColor)
      px(5, 15, 2, 4, '#1E3A5F')
      px(9, 15, 2, 4, '#1E3A5F')
      px(4, 18, 3, 2, '#2C1810')
      px(9, 18, 3, 2, '#2C1810')
    } else {
      const flip = facing === 'left'
      const fx = (px_x: number) => flip ? 15 - px_x : px_x
      px(fx(6), 2, 4, 6, skinColor)
      px(fx(5), 3, 1, 4, skinColor)
      px(fx(10), 3, 1, 4, skinColor)
      px(fx(6), 1, 4, 2, hairColor)
      px(flip ? 10 : 5, 2, 1, 5, hairColor)
      px(fx(flip ? 9 : 7), 4, 1, 2, '#2C1810')
      px(fx(5), 8, 6, 7, outfit.primary)
      px(fx(4), 9, 1, 5, outfit.primary)
      px(fx(11), 9, 1, 4, outfit.primary)
      px(fx(flip ? 11 : 3), 9, 1, 4, skinColor)
      px(fx(6), 15, 2, 4, '#1E3A5F')
      px(fx(8), 15, 2, 4, '#1E3A5F')
      px(fx(5), 18, 3, 2, '#2C1810')
      px(fx(8), 18, 3, 2, '#2C1810')
    }
  }, [character])

  // Draw door labels
  const drawDoorLabels = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'

    // Coach door (bottom) - spans tiles 5,6,7
    const coachConfig = DOOR_CONFIG[DOOR_COACH]
    ctx.fillStyle = coachConfig.labelColor
    ctx.fillRect(5 * TILE + 8, 9 * TILE - 18, 3 * TILE - 16, 16)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(coachConfig.label, 6.5 * TILE, 9 * TILE - 6)

    // Journal door (left) - spans tiles at row 3,4
    const journalConfig = DOOR_CONFIG[DOOR_JOURNAL]
    ctx.save()
    ctx.translate(0.5 * TILE, 4 * TILE)
    ctx.rotate(-Math.PI / 2)
    ctx.fillStyle = journalConfig.labelColor
    ctx.fillRect(-30, -12, 60, 16)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(journalConfig.label, 0, 0)
    ctx.restore()

    // Goals door (right) - spans tiles at row 3,4
    const goalsConfig = DOOR_CONFIG[DOOR_GOALS]
    ctx.save()
    ctx.translate(13.5 * TILE, 4 * TILE)
    ctx.rotate(Math.PI / 2)
    ctx.fillStyle = goalsConfig.labelColor
    ctx.fillRect(-30, -12, 60, 16)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(goalsConfig.label, 0, 0)
    ctx.restore()

    // Archive door (top) - spans tiles 4,7
    const archiveConfig = DOOR_CONFIG[DOOR_ARCHIVE]
    ctx.fillStyle = archiveConfig.labelColor
    ctx.fillRect(4 * TILE + 8, 0 * TILE + 4, 4 * TILE - 16, 16)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(archiveConfig.label, 6 * TILE, 0 * TILE + 15)
  }, [])

  // Check movement
  const canMove = useCallback((x: number, y: number) => {
    const hitbox = 10
    const points = [
      { x: x + hitbox, y: y + hitbox },
      { x: x + TILE - hitbox, y: y + hitbox },
      { x: x + hitbox, y: y + TILE - hitbox },
      { x: x + TILE - hitbox, y: y + TILE - hitbox },
    ]

    for (const p of points) {
      const tileX = Math.floor(p.x / TILE)
      const tileY = Math.floor(p.y / TILE)
      if (tileX < 0 || tileX >= MAP_W || tileY < 0 || tileY >= MAP_H) return false
      const tile = MAP[tileY]?.[tileX]
      if (SOLID.includes(tile)) return false
    }
    return true
  }, [])

  // Render loop
  const render = useCallback((ctx: CanvasRenderingContext2D) => {
    const player = playerRef.current
    const facing = facingRef.current

    ctx.clearRect(0, 0, MAP_W * TILE, MAP_H * TILE)

    // First pass: floor tiles and doors
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const tile = MAP[y][x]
        if (tile === FLOOR || tile === RUG || DOOR_TILES.includes(tile)) {
          drawTile(ctx, tile, x, y, player.y)
        }
      }
    }

    // Second pass: objects and walls with player
    for (let y = 0; y < MAP_H; y++) {
      const playerTileY = Math.floor((player.y + TILE - 1) / TILE)
      if (playerTileY === y) {
        drawPlayer(ctx, player.x, player.y, facing)
      }

      for (let x = 0; x < MAP_W; x++) {
        const tile = MAP[y][x]
        if (tile !== FLOOR && tile !== RUG && !DOOR_TILES.includes(tile)) {
          drawTile(ctx, tile, x, y, player.y)
        }
      }
    }

    // Draw player if below all tiles
    const playerTileY = Math.floor((player.y + TILE - 1) / TILE)
    if (playerTileY >= MAP_H) {
      drawPlayer(ctx, player.x, player.y, facing)
    }

    // Draw door labels on top
    drawDoorLabels(ctx)
  }, [drawTile, drawPlayer, drawDoorLabels])

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    const speed = 3

    const gameLoop = () => {
      const player = playerRef.current
      const keys = keysRef.current

      let newX = player.x
      let newY = player.y

      if (keys.has('w') || keys.has('arrowup')) {
        newY -= speed
        facingRef.current = 'up'
      }
      if (keys.has('s') || keys.has('arrowdown')) {
        newY += speed
        facingRef.current = 'down'
      }
      if (keys.has('a') || keys.has('arrowleft')) {
        newX -= speed
        facingRef.current = 'left'
      }
      if (keys.has('d') || keys.has('arrowright')) {
        newX += speed
        facingRef.current = 'right'
      }

      if (canMove(newX, player.y)) player.x = newX
      if (canMove(player.x, newY)) player.y = newY

      // Check door entry
      const playerTileX = Math.floor((player.x + TILE/2) / TILE)
      const playerTileY = Math.floor((player.y + TILE/2) / TILE)
      const currentTile = MAP[playerTileY]?.[playerTileX]

      if (DOOR_TILES.includes(currentTile) && !doorTriggeredRef.current) {
        const doorConfig = DOOR_CONFIG[currentTile]
        if (doorConfig) {
          doorTriggeredRef.current = true
          onEnterDoor(doorConfig.room)
        }
      } else if (!DOOR_TILES.includes(currentTile)) {
        doorTriggeredRef.current = false
      }

      render(ctx)
      animationId = requestAnimationFrame(gameLoop)
    }

    gameLoop()
    return () => cancelAnimationFrame(animationId)
  }, [render, canMove, onEnterDoor])

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault()
        keysRef.current.add(key)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase())
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={MAP_W * TILE}
        height={MAP_H * TILE}
        className="border-4 border-[#5C4033] rounded-lg"
        style={{
          imageRendering: 'pixelated',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}
      />

      {/* Controls hint */}
      <div className="absolute bottom-2 left-2 text-[10px] text-white/70 font-mono bg-black/50 px-2 py-1 rounded">
        WASD or Arrow Keys to move
      </div>

    </div>
  )
}
