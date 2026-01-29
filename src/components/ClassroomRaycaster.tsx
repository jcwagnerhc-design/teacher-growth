'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

// Map: 0 = empty, 1 = wall, 2-5 = interaction zones (rendered as empty but tracked)
// 2 = teaching space (instruction), 3 = discussion table (environment)
// 4 = teacher desk (planning), 5 = student work (assessment)
// 6 = window wall, 7 = door wall, 8 = bookshelf wall, 9 = bulletin board wall
const MAP_WIDTH = 16
const MAP_HEIGHT = 16

const MAP = [
  [8,8,6,6,1,1,2,2,2,2,1,1,6,6,8,8],
  [9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7],
  [9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,4,4,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,4,4,1],
  [1,5,5,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,5,5,0,0,0,3,3,3,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,3,3,3,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,3,3,3,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,7,7,1,1,1,1,1,1,1],
]

// Sprites for interactive areas
const SPRITES = [
  { x: 7.5, y: 2.5, type: 'instruction', name: 'Teaching Space', icon: '📋' },
  { x: 7.5, y: 8, type: 'environment', name: 'Discussion Table', icon: '💬' },
  { x: 14, y: 5.5, type: 'planning', name: 'Teacher Desk', icon: '📝' },
  { x: 1.5, y: 6.5, type: 'assessment', name: 'Student Work', icon: '📊' },
]

// Wall types with distinct colors
const WALL_COLORS: Record<number, { light: string; dark: string }> = {
  1: { light: '#4a7ba8', dark: '#2d5a87' },      // Regular wall - blue
  2: { light: '#5a9fd4', dark: '#3d7ab0' },      // Whiteboard wall - bright blue
  6: { light: '#87CEEB', dark: '#5BA3C7' },      // Window - sky blue
  7: { light: '#8B4513', dark: '#654321' },      // Door - brown
  8: { light: '#8B5A2B', dark: '#6B4423' },      // Bookshelf - wood brown
  9: { light: '#CD853F', dark: '#A0682A' },      // Bulletin board - cork/tan
}

// Colors matching Blair Academy palette
const COLORS = {
  ceiling: '#1a1a2e',  // Darker ceiling
  floor: '#2d5a87',
}

const AREA_COLORS: Record<string, string> = {
  instruction: '#4a7ba8',
  environment: '#1e3a5f',
  planning: '#2d5a87',
  assessment: '#6b7280',
}

interface ClassroomRaycasterProps {
  onAreaSelect: (area: string) => void
  width?: number
  height?: number
}

export default function ClassroomRaycaster({
  onAreaSelect,
  width = 640,
  height = 400
}: ClassroomRaycasterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nearbyArea, setNearbyArea] = useState<string | null>(null)
  const [nearbyName, setNearbyName] = useState<string | null>(null)

  // Player state - SLOWER movement to reduce nausea
  const playerRef = useRef({
    x: 8,
    y: 12,
    angle: -Math.PI / 2, // Facing north (toward the board)
    moveSpeed: 0.04,  // Slower!
    rotSpeed: 0.03,   // Slower turning!
  })

  // Keys pressed
  const keysRef = useRef<Set<string>>(new Set())

  // Render the scene
  const render = useCallback((ctx: CanvasRenderingContext2D) => {
    const player = playerRef.current
    const w = width
    const h = height
    const fov = Math.PI / 3 // 60 degrees FOV

    // Clear canvas - ceiling with gradient
    const ceilGradient = ctx.createLinearGradient(0, 0, 0, h / 2)
    ceilGradient.addColorStop(0, '#0f0f1a')
    ceilGradient.addColorStop(1, '#1a1a2e')
    ctx.fillStyle = ceilGradient
    ctx.fillRect(0, 0, w, h / 2)

    // Floor with gradient for depth
    const floorGradient = ctx.createLinearGradient(0, h / 2, 0, h)
    floorGradient.addColorStop(0, '#1a3a5a')
    floorGradient.addColorStop(0.5, '#2d5a87')
    floorGradient.addColorStop(1, '#1e4a6f')
    ctx.fillStyle = floorGradient
    ctx.fillRect(0, h / 2, w, h / 2)

    // Draw floor grid pattern for depth perception
    ctx.strokeStyle = 'rgba(100, 150, 200, 0.15)'
    ctx.lineWidth = 1
    for (let fy = h / 2; fy < h; fy += 20) {
      const depth = (fy - h / 2) / (h / 2)
      ctx.globalAlpha = 0.1 + depth * 0.2
      ctx.beginPath()
      ctx.moveTo(0, fy)
      ctx.lineTo(w, fy)
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // Raycasting
    const numRays = w
    const zBuffer: number[] = []

    for (let i = 0; i < numRays; i++) {
      const rayAngle = player.angle - fov / 2 + (i / numRays) * fov

      // DDA Algorithm for raycasting
      const rayDirX = Math.cos(rayAngle)
      const rayDirY = Math.sin(rayAngle)

      let mapX = Math.floor(player.x)
      let mapY = Math.floor(player.y)

      const deltaDistX = Math.abs(1 / rayDirX)
      const deltaDistY = Math.abs(1 / rayDirY)

      let stepX: number, stepY: number
      let sideDistX: number, sideDistY: number

      if (rayDirX < 0) {
        stepX = -1
        sideDistX = (player.x - mapX) * deltaDistX
      } else {
        stepX = 1
        sideDistX = (mapX + 1 - player.x) * deltaDistX
      }

      if (rayDirY < 0) {
        stepY = -1
        sideDistY = (player.y - mapY) * deltaDistY
      } else {
        stepY = 1
        sideDistY = (mapY + 1 - player.y) * deltaDistY
      }

      // DDA
      let hit = false
      let side = 0 // 0 for x-side, 1 for y-side
      let hitType = 1

      while (!hit) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX
          mapX += stepX
          side = 0
        } else {
          sideDistY += deltaDistY
          mapY += stepY
          side = 1
        }

        if (mapX < 0 || mapX >= MAP_WIDTH || mapY < 0 || mapY >= MAP_HEIGHT) {
          hit = true
        } else {
          const mapValue = MAP[mapY][mapX]
          // Hit if it's a wall type (1, 2, 6, 7, 8, 9)
          if (mapValue === 1 || mapValue === 2 || mapValue >= 6) {
            hit = true
            hitType = mapValue
          }
        }
      }

      // Calculate distance (with fish-eye correction)
      let perpWallDist: number
      if (side === 0) {
        perpWallDist = (mapX - player.x + (1 - stepX) / 2) / rayDirX
      } else {
        perpWallDist = (mapY - player.y + (1 - stepY) / 2) / rayDirY
      }

      zBuffer[i] = perpWallDist

      // Calculate wall height
      const lineHeight = Math.floor(h / perpWallDist)
      const drawStart = Math.max(0, Math.floor(-lineHeight / 2 + h / 2))
      const drawEnd = Math.min(h, Math.floor(lineHeight / 2 + h / 2))

      // Get wall color based on type
      const wallColor = WALL_COLORS[hitType] || WALL_COLORS[1]
      const color = side === 0 ? wallColor.light : wallColor.dark

      // Distance shading
      const shade = Math.min(1, 2 / perpWallDist)

      // Draw wall slice
      ctx.fillStyle = color
      ctx.globalAlpha = Math.max(0.4, shade)
      ctx.fillRect(i, drawStart, 1, drawEnd - drawStart)

      // Add vertical line detail for texture (every 4 pixels)
      if (i % 4 === 0 && lineHeight > 20) {
        ctx.fillStyle = side === 0 ? wallColor.dark : '#000'
        ctx.globalAlpha = 0.1
        ctx.fillRect(i, drawStart, 1, drawEnd - drawStart)
      }

      // Add horizontal brick/panel lines for texture
      if (lineHeight > 30) {
        ctx.fillStyle = '#000'
        ctx.globalAlpha = 0.08
        const brickHeight = Math.max(8, lineHeight / 8)
        for (let by = drawStart; by < drawEnd; by += brickHeight) {
          ctx.fillRect(i, by, 1, 1)
        }
      }

      ctx.globalAlpha = 1
    }

    // Render sprites (sorted by distance)
    const spritesWithDist = SPRITES.map(sprite => {
      const dx = sprite.x - player.x
      const dy = sprite.y - player.y
      return {
        ...sprite,
        dist: dx * dx + dy * dy,
      }
    }).sort((a, b) => b.dist - a.dist)

    for (const sprite of spritesWithDist) {
      const dx = sprite.x - player.x
      const dy = sprite.y - player.y

      // Transform sprite to camera space
      const invDet = 1 / (Math.cos(player.angle - Math.PI/2) * Math.sin(player.angle) -
                         Math.sin(player.angle - Math.PI/2) * Math.cos(player.angle))

      const transformX = invDet * (Math.sin(player.angle) * dx - Math.cos(player.angle) * dy)
      const transformY = invDet * (-Math.sin(player.angle - Math.PI/2) * dx +
                                   Math.cos(player.angle - Math.PI/2) * dy)

      if (transformY <= 0) continue // Behind camera

      const spriteScreenX = Math.floor((w / 2) * (1 + transformX / transformY))

      // Sprite size on screen
      const spriteHeight = Math.abs(Math.floor(h / transformY)) * 0.8
      const spriteWidth = spriteHeight

      const drawStartY = Math.floor(-spriteHeight / 2 + h / 2)
      const drawStartX = Math.floor(spriteScreenX - spriteWidth / 2)

      // Only draw if in front of walls (check z-buffer)
      const spriteLeft = Math.max(0, drawStartX)
      const spriteRight = Math.min(w, drawStartX + spriteWidth)

      let visible = false
      for (let x = spriteLeft; x < spriteRight; x++) {
        if (transformY < zBuffer[x]) {
          visible = true
          break
        }
      }

      if (!visible) continue

      // Draw sprite as a colored rectangle with icon
      const alpha = Math.max(0.4, Math.min(1, 3 / transformY))
      ctx.globalAlpha = alpha

      // Glow effect
      ctx.fillStyle = AREA_COLORS[sprite.type] || '#4a7ba8'
      ctx.shadowColor = AREA_COLORS[sprite.type] || '#4a7ba8'
      ctx.shadowBlur = 20

      // Draw a floating panel/sign
      const panelWidth = Math.min(spriteWidth * 0.8, 120)
      const panelHeight = Math.min(spriteHeight * 0.6, 80)
      const panelX = spriteScreenX - panelWidth / 2
      const panelY = h / 2 - panelHeight / 2

      // Panel background
      ctx.fillRect(panelX, panelY, panelWidth, panelHeight)

      // Panel border
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.strokeRect(panelX, panelY, panelWidth, panelHeight)

      // Icon/text
      ctx.shadowBlur = 0
      ctx.fillStyle = '#fff'
      ctx.font = `bold ${Math.min(panelHeight * 0.4, 24)}px monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(sprite.icon, spriteScreenX, h / 2 - 5)

      // Name below icon
      ctx.font = `${Math.min(panelHeight * 0.2, 12)}px monospace`
      ctx.fillText(sprite.name, spriteScreenX, h / 2 + panelHeight * 0.25)

      ctx.globalAlpha = 1
    }

    ctx.shadowBlur = 0

    // Draw crosshair
    ctx.strokeStyle = '#7db4e0'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(w / 2 - 10, h / 2)
    ctx.lineTo(w / 2 + 10, h / 2)
    ctx.moveTo(w / 2, h / 2 - 10)
    ctx.lineTo(w / 2, h / 2 + 10)
    ctx.stroke()

    // Draw minimap in top-right corner
    const mapSize = 100
    const mapX = w - mapSize - 10
    const mapY = 10
    const cellSize = mapSize / MAP_WIDTH

    // Minimap background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.fillRect(mapX - 2, mapY - 2, mapSize + 4, mapSize + 4)

    // Draw map cells
    for (let my = 0; my < MAP_HEIGHT; my++) {
      for (let mx = 0; mx < MAP_WIDTH; mx++) {
        const cell = MAP[my][mx]
        if (cell === 1 || cell === 2 || cell >= 6) {
          const wc = WALL_COLORS[cell] || WALL_COLORS[1]
          ctx.fillStyle = wc.dark
        } else if (cell >= 3 && cell <= 5) {
          // Interaction zones
          ctx.fillStyle = 'rgba(100, 200, 255, 0.3)'
        } else {
          ctx.fillStyle = '#1a3a5a'
        }
        ctx.fillRect(mapX + mx * cellSize, mapY + my * cellSize, cellSize, cellSize)
      }
    }

    // Draw player on minimap
    const playerMapX = mapX + player.x * cellSize
    const playerMapY = mapY + player.y * cellSize

    // Player direction line
    ctx.strokeStyle = '#ffff00'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(playerMapX, playerMapY)
    ctx.lineTo(
      playerMapX + Math.cos(player.angle) * 8,
      playerMapY + Math.sin(player.angle) * 8
    )
    ctx.stroke()

    // Player dot
    ctx.fillStyle = '#ffff00'
    ctx.beginPath()
    ctx.arc(playerMapX, playerMapY, 3, 0, Math.PI * 2)
    ctx.fill()

    // Minimap border
    ctx.strokeStyle = '#4a7ba8'
    ctx.lineWidth = 2
    ctx.strokeRect(mapX - 2, mapY - 2, mapSize + 4, mapSize + 4)

  }, [width, height])

  // Update player position
  const update = useCallback(() => {
    const player = playerRef.current
    const keys = keysRef.current

    let newX = player.x
    let newY = player.y

    // Rotation
    if (keys.has('arrowleft') || keys.has('q')) {
      player.angle -= player.rotSpeed
    }
    if (keys.has('arrowright') || keys.has('e')) {
      player.angle += player.rotSpeed
    }

    // Movement
    const moveX = Math.cos(player.angle) * player.moveSpeed
    const moveY = Math.sin(player.angle) * player.moveSpeed
    const strafeX = Math.cos(player.angle + Math.PI/2) * player.moveSpeed
    const strafeY = Math.sin(player.angle + Math.PI/2) * player.moveSpeed

    if (keys.has('w') || keys.has('arrowup')) {
      newX += moveX
      newY += moveY
    }
    if (keys.has('s') || keys.has('arrowdown')) {
      newX -= moveX
      newY -= moveY
    }
    if (keys.has('a')) {
      newX -= strafeX
      newY -= strafeY
    }
    if (keys.has('d')) {
      newX += strafeX
      newY += strafeY
    }

    // Collision detection
    const margin = 0.3
    const mapAtNewX = MAP[Math.floor(player.y)]?.[Math.floor(newX)]
    const mapAtNewY = MAP[Math.floor(newY)]?.[Math.floor(player.x)]

    if (mapAtNewX !== 1 && newX > margin && newX < MAP_WIDTH - margin) {
      player.x = newX
    }
    if (mapAtNewY !== 1 && newY > margin && newY < MAP_HEIGHT - margin) {
      player.y = newY
    }

    // Check for nearby interaction areas
    let foundArea: string | null = null
    let foundName: string | null = null

    for (const sprite of SPRITES) {
      const dx = sprite.x - player.x
      const dy = sprite.y - player.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < 2.5) {
        foundArea = sprite.type
        foundName = sprite.name
        break
      }
    }

    setNearbyArea(foundArea)
    setNearbyName(foundName)

  }, [])

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number

    const gameLoop = () => {
      update()
      render(ctx)
      animationId = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [update, render])

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()

      if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault()
        keysRef.current.add(key)
      }

      if ((key === ' ' || key === 'enter') && nearbyArea) {
        e.preventDefault()
        onAreaSelect(nearbyArea)
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
        width={width}
        height={height}
        className="border-4 border-[#2d4a6f] bg-[#0a1628]"
        style={{
          imageRendering: 'pixelated',
          boxShadow: '0 0 40px rgba(45, 90, 135, 0.3)',
        }}
      />

      {/* HUD */}
      <div className="absolute bottom-4 left-4 text-[10px] text-slate-500 font-mono">
        WASD: Move | Q/E or ←→: Turn | SPACE: Interact
      </div>

      {/* Interaction prompt */}
      {nearbyArea && nearbyName && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-sm rounded-lg px-4 py-2 border border-[#4a7ba8]"
        >
          <p className="text-center text-sm text-white">
            Press <kbd className="px-2 py-0.5 bg-[#2d5a87] rounded text-xs mx-1">SPACE</kbd> to explore
          </p>
          <p className="text-center text-xs text-[#7db4e0] mt-1">{nearbyName}</p>
        </motion.div>
      )}
    </div>
  )
}
