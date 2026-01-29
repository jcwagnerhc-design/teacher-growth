'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CharacterCustomization } from './PixelCharacter'

// Tile size - BIGGER tiles
const TILE = 48

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
const DOOR = 8
const RUG = 9
const CHAIR = 10
const PLANT = 11

// Interaction zones
const INTERACT_ZONES: Record<number, { id: string; name: string }> = {
  [WHITEBOARD]: { id: 'instruction', name: 'Teaching Space' },
  [TABLE]: { id: 'environment', name: 'Discussion Table' },
  [DESK]: { id: 'planning', name: 'Teacher Desk' },
  [BULLETIN]: { id: 'assessment', name: 'Student Work' },
  [DOOR]: { id: 'coach', name: "Coach's Office" },
}

// Map layout - more compact
const MAP = [
  [WALL, WALL, WINDOW, WALL, WHITEBOARD, WHITEBOARD, WHITEBOARD, WHITEBOARD, WALL, WINDOW, WALL, WALL, WALL, WALL],
  [WALL, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, BOOKSHELF, FLOOR, WALL],
  [WALL, BULLETIN, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, BOOKSHELF, FLOOR, WALL],
  [WALL, BULLETIN, FLOOR, FLOOR, RUG, RUG, RUG, RUG, RUG, FLOOR, FLOOR, FLOOR, FLOOR, WALL],
  [WALL, FLOOR, FLOOR, FLOOR, RUG, TABLE, TABLE, TABLE, RUG, FLOOR, FLOOR, DESK, DESK, WALL],
  [WALL, FLOOR, FLOOR, FLOOR, RUG, TABLE, TABLE, TABLE, RUG, FLOOR, FLOOR, DESK, PLANT, WALL],
  [WALL, FLOOR, FLOOR, FLOOR, RUG, RUG, RUG, RUG, RUG, FLOOR, FLOOR, FLOOR, FLOOR, WALL],
  [WALL, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, WALL],
  [WALL, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, WALL],
  [WALL, WALL, WALL, WALL, WALL, DOOR, DOOR, DOOR, WALL, WALL, WALL, WALL, WALL, WALL],
]

// What tiles block movement (DOOR is not solid - you walk through it)
const SOLID = [WALL, WHITEBOARD, TABLE, DESK, BULLETIN, BOOKSHELF, WINDOW, CHAIR, PLANT]

interface Props {
  onAreaSelect: (area: string) => void
  onEnterDoor?: () => void  // Called when player walks through door
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

export default function ClassroomPokemon({ onAreaSelect, onEnterDoor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nearbyArea, setNearbyArea] = useState<{ id: string; name: string } | null>(null)
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
        // Wooden floor tiles - warm and inviting
        ctx.fillStyle = '#DEB887'
        ctx.fillRect(px, py, TILE, TILE)
        // Plank lines
        ctx.strokeStyle = '#C4A060'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(px, py + TILE/3)
        ctx.lineTo(px + TILE, py + TILE/3)
        ctx.moveTo(px, py + TILE*2/3)
        ctx.lineTo(px + TILE, py + TILE*2/3)
        ctx.stroke()
        // Wood grain detail
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
        // Warm cream wall
        ctx.fillStyle = '#F5E6D3'
        ctx.fillRect(px, py, TILE, TILE)
        // Subtle texture
        ctx.fillStyle = '#EED9C4'
        ctx.fillRect(px, py, TILE, 6)
        ctx.fillRect(px, py + TILE - 8, TILE, 8)
        // Baseboard
        ctx.fillStyle = '#8B6914'
        ctx.fillRect(px, py + TILE - 10, TILE, 10)
        ctx.fillStyle = '#A67C00'
        ctx.fillRect(px, py + TILE - 10, TILE, 3)
        break

      case WINDOW:
        // Wall with nice window
        ctx.fillStyle = '#F5E6D3'
        ctx.fillRect(px, py, TILE, TILE)
        // Window frame - wood
        ctx.fillStyle = '#8B6914'
        ctx.fillRect(px + 6, py + 6, TILE - 12, TILE - 12)
        // Glass - sky gradient
        const skyGrad = ctx.createLinearGradient(px, py + 8, px, py + TILE - 8)
        skyGrad.addColorStop(0, '#87CEEB')
        skyGrad.addColorStop(1, '#B0E0E6')
        ctx.fillStyle = skyGrad
        ctx.fillRect(px + 10, py + 10, TILE - 20, TILE - 20)
        // Cross frame
        ctx.fillStyle = '#A67C00'
        ctx.fillRect(px + TILE/2 - 2, py + 6, 4, TILE - 12)
        ctx.fillRect(px + 6, py + TILE/2 - 2, TILE - 12, 4)
        // Light shine
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.fillRect(px + 12, py + 12, 10, 14)
        break

      case WHITEBOARD:
        // Whiteboard on wall
        ctx.fillStyle = '#F5E6D3'
        ctx.fillRect(px, py, TILE, TILE)
        // Board frame - silver/aluminum
        ctx.fillStyle = '#A0A0A0'
        ctx.fillRect(px + 4, py + 10, TILE - 8, TILE - 14)
        // White surface
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(px + 6, py + 12, TILE - 12, TILE - 18)
        // Writing
        ctx.fillStyle = '#2563EB'
        ctx.font = `bold ${TILE/4}px sans-serif`
        ctx.fillText('ABC', px + 10, py + 26)
        ctx.fillStyle = '#1E293B'
        ctx.fillRect(px + 10, py + 32, TILE - 24, 3)
        ctx.fillRect(px + 10, py + 38, TILE - 28, 3)
        // Marker tray
        ctx.fillStyle = '#808080'
        ctx.fillRect(px + 8, py + TILE - 8, TILE - 16, 6)
        break

      case TABLE:
        // Draw the rug first, then table on top
        ctx.fillStyle = '#DEB887'
        ctx.fillRect(px, py, TILE, TILE)
        // Table top - rich wood
        ctx.fillStyle = '#A0522D'
        ctx.fillRect(px + 2, py + 6, TILE - 4, TILE - 12)
        // Table edge highlight
        ctx.fillStyle = '#CD853F'
        ctx.fillRect(px + 4, py + 8, TILE - 8, 4)
        // Table shadow/depth
        ctx.fillStyle = '#8B4513'
        ctx.fillRect(px + 2, py + TILE - 8, TILE - 4, 6)
        break

      case RUG:
        // Nice blue/gray rug
        ctx.fillStyle = '#DEB887'
        ctx.fillRect(px, py, TILE, TILE)
        // Rug base
        ctx.fillStyle = '#4A6FA5'
        ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2)
        // Rug pattern - inner border
        ctx.fillStyle = '#6B8FC4'
        ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8)
        // Center design
        ctx.fillStyle = '#3D5A80'
        ctx.fillRect(px + 8, py + 8, TILE - 16, TILE - 16)
        break

      case DESK:
        // Teacher desk
        ctx.fillStyle = '#DEB887'
        ctx.fillRect(px, py, TILE, TILE)

        // Desk top - dark wood
        ctx.fillStyle = '#5D4037'
        ctx.fillRect(px + 2, py + 8, TILE - 4, TILE - 12)

        // Wood grain
        ctx.fillStyle = '#6D4C41'
        ctx.fillRect(px + 6, py + 12, TILE - 12, 3)
        ctx.fillRect(px + 8, py + 20, TILE - 16, 3)

        // Front panel if player below
        if (playerY > y * TILE) {
          ctx.fillStyle = '#4E342E'
          ctx.fillRect(px + 2, py + TILE - 10, TILE - 4, 10)
          // Drawer
          ctx.fillStyle = '#5D4037'
          ctx.fillRect(px + 8, py + TILE - 8, TILE - 16, 6)
          ctx.fillStyle = '#FFD700'
          ctx.fillRect(px + TILE/2 - 4, py + TILE - 6, 8, 3)
        }

        // Laptop
        ctx.fillStyle = '#37474F'
        ctx.fillRect(px + 8, py + 12, 16, 12)
        ctx.fillStyle = '#64B5F6'
        ctx.fillRect(px + 10, py + 14, 12, 8)
        // Coffee mug
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
        // Bulletin board
        ctx.fillStyle = '#F5E6D3'
        ctx.fillRect(px, py, TILE, TILE)
        // Cork board
        ctx.fillStyle = '#D2691E'
        ctx.fillRect(px + 4, py + 6, TILE - 8, TILE - 12)
        // Wood frame
        ctx.strokeStyle = '#8B4513'
        ctx.lineWidth = 4
        ctx.strokeRect(px + 4, py + 6, TILE - 8, TILE - 12)
        // Papers - colorful
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(px + 10, py + 12, 14, 16)
        ctx.fillStyle = '#FFFACD'
        ctx.fillRect(px + 26, py + 14, 12, 12)
        ctx.fillStyle = '#E6F3FF'
        ctx.fillRect(px + 12, py + 30, 16, 12)
        // Push pins
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
        // Bookshelf
        ctx.fillStyle = '#F5E6D3'
        ctx.fillRect(px, py, TILE, TILE)
        // Shelf frame - dark wood
        ctx.fillStyle = '#5D4037'
        ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8)

        // Shelves
        ctx.fillStyle = '#6D4C41'
        ctx.fillRect(px + 4, py + TILE/3, TILE - 8, 4)
        ctx.fillRect(px + 4, py + TILE*2/3, TILE - 8, 4)

        // Books - top shelf
        const colors1 = ['#1565C0', '#C62828', '#2E7D32', '#6A1B9A', '#EF6C00']
        let bx = px + 8
        for (let i = 0; i < 4; i++) {
          const h = 10 + (i % 2) * 4
          ctx.fillStyle = colors1[i]
          ctx.fillRect(bx, py + TILE/3 - h - 2, 7, h)
          bx += 9
        }
        // Books - bottom shelf
        bx = px + 8
        for (let i = 0; i < 4; i++) {
          const h = 12 + ((i + 1) % 2) * 3
          ctx.fillStyle = colors1[(i + 2) % 5]
          ctx.fillRect(bx, py + TILE*2/3 - h - 2, 7, h)
          bx += 9
        }
        break

      case DOOR:
        // Coach's Office Door - more prominent
        ctx.fillStyle = '#DEB887'
        ctx.fillRect(px, py, TILE, TILE)

        // Glowing aura around door (inviting)
        const doorPulse = 0.3 + Math.sin(Date.now() / 500) * 0.15
        ctx.fillStyle = `rgba(74, 124, 89, ${doorPulse})`
        ctx.fillRect(px + 2, py - 4, TILE - 4, TILE + 8)

        // Door frame - nicer wood
        ctx.fillStyle = '#5D4037'
        ctx.fillRect(px + 4, py, TILE - 8, TILE)

        // Door itself - darker, more professional
        ctx.fillStyle = '#3E2723'
        ctx.fillRect(px + 8, py + 4, TILE - 16, TILE - 4)

        // Window in door
        ctx.fillStyle = '#FFF8DC'
        ctx.fillRect(px + 12, py + 8, TILE - 24, 16)
        // Window reflection
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.fillRect(px + 14, py + 10, 6, 12)

        // Door panel below window
        ctx.fillStyle = '#4E342E'
        ctx.fillRect(px + 12, py + 28, TILE - 24, 12)

        // Handle - brass
        ctx.fillStyle = '#FFD700'
        ctx.beginPath()
        ctx.arc(px + TILE - 14, py + TILE/2 + 4, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#DAA520'
        ctx.beginPath()
        ctx.arc(px + TILE - 14, py + TILE/2 + 4, 2, 0, Math.PI * 2)
        ctx.fill()

        // "COACH" sign above door (implied by glow)
        break

      case PLANT:
        // Floor with plant
        ctx.fillStyle = '#DEB887'
        ctx.fillRect(px, py, TILE, TILE)
        // Plank lines
        ctx.strokeStyle = '#C4A060'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(px, py + TILE/3)
        ctx.lineTo(px + TILE, py + TILE/3)
        ctx.moveTo(px, py + TILE*2/3)
        ctx.lineTo(px + TILE, py + TILE*2/3)
        ctx.stroke()

        // Pot - terracotta
        ctx.fillStyle = '#E07B4A'
        ctx.beginPath()
        ctx.moveTo(px + 12, py + 24)
        ctx.lineTo(px + TILE - 12, py + 24)
        ctx.lineTo(px + TILE - 16, py + TILE - 4)
        ctx.lineTo(px + 16, py + TILE - 4)
        ctx.closePath()
        ctx.fill()
        // Pot rim
        ctx.fillStyle = '#C66A3D'
        ctx.fillRect(px + 10, py + 22, TILE - 20, 5)

        // Plant leaves
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

  // Draw player using the character customization (matching PixelCharacter style)
  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, facing: string) => {
    const skinColor = SKIN_TONES[character.skinTone] || SKIN_TONES[1]
    const hairColor = HAIR_COLORS[character.hairColor] || HAIR_COLORS[2]
    const outfit = OUTFIT_COLORS[character.outfit] || OUTFIT_COLORS[0]

    // Character is drawn at 3x scale for visibility (base is 16x20 pixels)
    const scale = 3
    const charW = 16 * scale  // 48
    const charH = 20 * scale  // 60

    // Center in tile, but draw taller than tile for proper proportions
    const cx = x + TILE/2
    const baseY = y + TILE - 8  // Feet position
    const startX = cx - charW/2
    const startY = baseY - charH

    // Helper to draw scaled pixel
    const px = (px: number, py: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color
      ctx.fillRect(startX + px * scale, startY + py * scale, w * scale, h * scale)
    }

    // Glowing indicator ring under character (pulsing)
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

    // Shadow under character
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.beginPath()
    ctx.ellipse(cx, baseY + 4, 16, 6, 0, 0, Math.PI * 2)
    ctx.fill()

    if (facing === 'up') {
      // Back view - mostly hair and back of clothes
      // Hair back
      px(5, 1, 6, 6, hairColor)
      px(4, 2, 1, 4, hairColor)
      px(11, 2, 1, 4, hairColor)

      // Back of head (skin at ears)
      px(4, 3, 1, 3, skinColor)
      px(11, 3, 1, 3, skinColor)

      // Body back
      px(4, 8, 8, 7, outfit.primary)
      px(3, 9, 1, 4, skinColor)  // Arm
      px(12, 9, 1, 4, skinColor) // Arm

      // Legs
      px(5, 15, 2, 4, '#1E3A5F')
      px(9, 15, 2, 4, '#1E3A5F')

      // Shoes
      px(4, 18, 3, 2, '#2C1810')
      px(9, 18, 3, 2, '#2C1810')
    } else if (facing === 'down') {
      // Front view - full face
      // Head
      px(5, 2, 6, 6, skinColor)
      px(4, 3, 1, 4, skinColor)
      px(11, 3, 1, 4, skinColor)

      // Hair on top
      px(5, 1, 6, 2, hairColor)
      px(4, 2, 1, 2, hairColor)
      px(11, 2, 1, 2, hairColor)

      // Eyes
      px(6, 4, 1, 2, '#2C1810')
      px(9, 4, 1, 2, '#2C1810')
      // Eye highlight
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(startX + 6 * scale, startY + 4 * scale, scale * 0.6, scale * 0.6)
      ctx.fillRect(startX + 9 * scale, startY + 4 * scale, scale * 0.6, scale * 0.6)

      // Smile
      px(7, 6, 2, 1, '#D4A574')

      // Body
      px(5, 8, 6, 7, outfit.primary)
      px(4, 9, 1, 5, outfit.primary)
      px(11, 9, 1, 5, outfit.primary)
      // Collar detail
      px(7, 8, 2, 1, outfit.secondary)
      px(7, 9, 2, 4, outfit.secondary)
      // Arms
      px(3, 9, 1, 4, skinColor)
      px(12, 9, 1, 4, skinColor)

      // Legs
      px(5, 15, 2, 4, '#1E3A5F')
      px(9, 15, 2, 4, '#1E3A5F')

      // Shoes
      px(4, 18, 3, 2, '#2C1810')
      px(9, 18, 3, 2, '#2C1810')

    } else {
      // Side views (left/right)
      const flip = facing === 'left'

      // Adjust for direction
      const fx = (px_x: number) => flip ? 15 - px_x : px_x

      // Head (side profile - narrower)
      px(fx(6), 2, 4, 6, skinColor)
      px(fx(5), 3, 1, 4, skinColor)
      px(fx(10), 3, 1, 4, skinColor)

      // Hair
      px(fx(6), 1, 4, 2, hairColor)
      px(flip ? 10 : 5, 2, 1, 5, hairColor)

      // Eye (one eye visible from side)
      px(fx(flip ? 9 : 7), 4, 1, 2, '#2C1810')

      // Body (side)
      px(fx(5), 8, 6, 7, outfit.primary)
      px(fx(4), 9, 1, 5, outfit.primary)
      px(fx(11), 9, 1, 4, outfit.primary)
      // Arm in front
      px(fx(flip ? 11 : 3), 9, 1, 4, skinColor)

      // Legs
      px(fx(6), 15, 2, 4, '#1E3A5F')
      px(fx(8), 15, 2, 4, '#1E3A5F')

      // Shoes
      px(fx(5), 18, 3, 2, '#2C1810')
      px(fx(8), 18, 3, 2, '#2C1810')
    }

  }, [character])

  // Check if can move to position
  const canMove = useCallback((x: number, y: number) => {
    // Check all four corners of player hitbox
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

  // Check for nearby interactable - larger radius for easier interaction
  const checkNearby = useCallback((x: number, y: number, facing: string) => {
    const playerTileX = Math.floor((x + TILE/2) / TILE)
    const playerTileY = Math.floor((y + TILE/2) / TILE)

    // Check in the direction player is facing first (priority)
    const facingOffsets: Record<string, [number, number][]> = {
      'up': [[0, -1], [-1, -1], [1, -1], [0, -2]],
      'down': [[0, 1], [-1, 1], [1, 1], [0, 2]],
      'left': [[-1, 0], [-1, -1], [-1, 1], [-2, 0]],
      'right': [[1, 0], [1, -1], [1, 1], [2, 0]],
    }

    // Also check adjacent tiles regardless of facing
    const allOffsets = [
      [0, -1], [0, 1], [-1, 0], [1, 0],  // Cardinal
      [-1, -1], [1, -1], [-1, 1], [1, 1], // Diagonal
    ]

    // Priority: check facing direction first
    const priorityOffsets = facingOffsets[facing] || []
    for (const [dx, dy] of priorityOffsets) {
      const checkX = playerTileX + dx
      const checkY = playerTileY + dy
      if (checkX >= 0 && checkX < MAP_W && checkY >= 0 && checkY < MAP_H) {
        const tile = MAP[checkY]?.[checkX]
        if (tile !== undefined && INTERACT_ZONES[tile]) {
          return INTERACT_ZONES[tile]
        }
      }
    }

    // Then check all adjacent
    for (const [dx, dy] of allOffsets) {
      const checkX = playerTileX + dx
      const checkY = playerTileY + dy
      if (checkX >= 0 && checkX < MAP_W && checkY >= 0 && checkY < MAP_H) {
        const tile = MAP[checkY]?.[checkX]
        if (tile !== undefined && INTERACT_ZONES[tile]) {
          return INTERACT_ZONES[tile]
        }
      }
    }

    return null
  }, [])

  // Render loop
  const render = useCallback((ctx: CanvasRenderingContext2D) => {
    const player = playerRef.current
    const facing = facingRef.current

    ctx.clearRect(0, 0, MAP_W * TILE, MAP_H * TILE)

    // Draw tiles (bottom to top for proper layering)
    // First pass: floor tiles
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const tile = MAP[y][x]
        if (tile === FLOOR || tile === RUG || tile === DOOR) {
          drawTile(ctx, tile, x, y, player.y)
        }
      }
    }

    // Second pass: objects and walls, with player inserted at right Y
    for (let y = 0; y < MAP_H; y++) {
      // Draw player if they're at this Y level
      const playerTileY = Math.floor((player.y + TILE - 1) / TILE)
      if (playerTileY === y) {
        drawPlayer(ctx, player.x, player.y, facing)
      }

      for (let x = 0; x < MAP_W; x++) {
        const tile = MAP[y][x]
        if (tile !== FLOOR && tile !== RUG && tile !== DOOR) {
          drawTile(ctx, tile, x, y, player.y)
        }
      }
    }

    // Draw player if below all tiles
    const playerTileY = Math.floor((player.y + TILE - 1) / TILE)
    if (playerTileY >= MAP_H) {
      drawPlayer(ctx, player.x, player.y, facing)
    }

  }, [drawTile, drawPlayer])

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

      // Move with collision
      if (canMove(newX, player.y)) player.x = newX
      if (canMove(player.x, newY)) player.y = newY

      // Check if player walked onto a door tile
      const playerTileX = Math.floor((player.x + TILE/2) / TILE)
      const playerTileY = Math.floor((player.y + TILE/2) / TILE)
      const currentTile = MAP[playerTileY]?.[playerTileX]

      if (currentTile === DOOR && !doorTriggeredRef.current && onEnterDoor) {
        doorTriggeredRef.current = true
        onEnterDoor()
      } else if (currentTile !== DOOR) {
        doorTriggeredRef.current = false
      }

      // Check nearby
      const nearby = checkNearby(player.x, player.y, facingRef.current)
      setNearbyArea(nearby)

      render(ctx)
      animationId = requestAnimationFrame(gameLoop)
    }

    gameLoop()
    return () => cancelAnimationFrame(animationId)
  }, [render, canMove, checkNearby])

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault()
        keysRef.current.add(key)
      }
      if ((key === ' ' || key === 'enter') && nearbyArea) {
        e.preventDefault()
        onAreaSelect(nearbyArea.id)
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
  }, [nearbyArea, onAreaSelect])

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

      {/* Controls */}
      <div className="absolute bottom-2 left-2 text-[10px] text-white/70 font-mono bg-black/50 px-2 py-1 rounded">
        WASD: Move | SPACE: Interact
      </div>

      {/* Interaction prompt */}
      <AnimatePresence>
        {nearbyArea && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/95 rounded-lg px-4 py-2 border-4 border-[#5C4033] shadow-lg"
          >
            <p className="text-center text-sm text-gray-800 font-bold">{nearbyArea.name}</p>
            <p className="text-center text-xs text-gray-600 mt-1">
              Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px] border border-gray-300">SPACE</kbd>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
