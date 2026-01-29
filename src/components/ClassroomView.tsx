'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Room dimensions
const ROOM_WIDTH = 640
const ROOM_HEIGHT = 480
const TILE_SIZE = 32

// Player settings
const PLAYER_SPEED = 3
const PLAYER_SIZE = 24

// Collision map: 0 = walkable, 1 = blocked, 2-5 = interaction zones
const COLLISION_MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0,0,1],
  [1,0,0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,5,5,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,1],
  [1,0,5,5,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,1],
  [1,0,0,0,0,0,0,3,3,3,3,3,0,0,0,0,4,4,0,1],
  [1,0,0,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
]

const AREA_INFO: Record<number, { id: string; name: string; color: string }> = {
  2: { id: 'instruction', name: 'Teaching Space', color: '#4a7ba8' },
  3: { id: 'environment', name: 'Discussion Table', color: '#1e3a5f' },
  4: { id: 'planning', name: 'Teacher Desk', color: '#2d5a87' },
  5: { id: 'assessment', name: 'Student Work', color: '#6b7280' },
}

interface ClassroomViewProps {
  onAreaSelect: (area: string) => void
  width?: number
  height?: number
}

export default function ClassroomView({
  onAreaSelect,
  width = ROOM_WIDTH,
  height = ROOM_HEIGHT
}: ClassroomViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nearbyArea, setNearbyArea] = useState<string | null>(null)
  const [nearbyName, setNearbyName] = useState<string | null>(null)

  // Player position (pixels)
  const playerRef = useRef({ x: width / 2, y: height - 80 })
  const keysRef = useRef<Set<string>>(new Set())

  // Scale factors
  const scaleX = width / ROOM_WIDTH
  const scaleY = height / ROOM_HEIGHT

  // Draw the classroom
  const render = useCallback((ctx: CanvasRenderingContext2D) => {
    const w = width
    const h = height
    const player = playerRef.current

    // Clear
    ctx.clearRect(0, 0, w, h)

    // Floor - wooden planks
    ctx.fillStyle = '#8B7355'
    ctx.fillRect(0, 0, w, h)

    // Floor plank lines
    ctx.strokeStyle = '#6B5344'
    ctx.lineWidth = 1
    for (let y = 0; y < h; y += 20 * scaleY) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
    // Vertical plank variation
    ctx.strokeStyle = '#7B6354'
    for (let x = 0; x < w; x += 60 * scaleX) {
      for (let y = 0; y < h; y += 40 * scaleY) {
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x, y + 20 * scaleY)
        ctx.stroke()
      }
    }

    // Walls
    const wallHeight = 40 * scaleY

    // Back wall (top)
    ctx.fillStyle = '#E8E0D5'
    ctx.fillRect(0, 0, w, wallHeight)
    ctx.fillStyle = '#D4C9BC'
    ctx.fillRect(0, wallHeight - 8, w, 8)

    // Left wall
    ctx.fillStyle = '#DDD5CA'
    ctx.fillRect(0, 0, 30 * scaleX, h)

    // Right wall
    ctx.fillStyle = '#DDD5CA'
    ctx.fillRect(w - 30 * scaleX, 0, 30 * scaleX, h)

    // === WHITEBOARD (Teaching Space) ===
    const boardX = w * 0.25
    const boardY = 8 * scaleY
    const boardW = w * 0.5
    const boardH = 60 * scaleY

    // Board frame
    ctx.fillStyle = '#5C4033'
    ctx.fillRect(boardX - 6, boardY - 4, boardW + 12, boardH + 8)

    // White surface
    ctx.fillStyle = '#FAFAFA'
    ctx.fillRect(boardX, boardY, boardW, boardH)

    // Writing on board
    ctx.fillStyle = '#2563EB'
    ctx.fillRect(boardX + 20, boardY + 12, boardW * 0.3, 6)
    ctx.fillStyle = '#1E293B'
    ctx.fillRect(boardX + 20, boardY + 24, boardW * 0.6, 4)
    ctx.fillRect(boardX + 20, boardY + 32, boardW * 0.5, 4)
    ctx.fillRect(boardX + 20, boardY + 40, boardW * 0.4, 4)

    // Marker tray
    ctx.fillStyle = '#A0A0A0'
    ctx.fillRect(boardX + boardW * 0.3, boardY + boardH - 2, boardW * 0.4, 8)
    ctx.fillStyle = '#3B82F6'
    ctx.fillRect(boardX + boardW * 0.35, boardY + boardH, 15, 5)
    ctx.fillStyle = '#EF4444'
    ctx.fillRect(boardX + boardW * 0.45, boardY + boardH, 15, 5)
    ctx.fillStyle = '#22C55E'
    ctx.fillRect(boardX + boardW * 0.55, boardY + boardH, 15, 5)

    // === WINDOWS (left wall) ===
    for (let i = 0; i < 2; i++) {
      const winX = 4 * scaleX
      const winY = (100 + i * 120) * scaleY
      const winW = 22 * scaleX
      const winH = 80 * scaleY

      // Frame
      ctx.fillStyle = '#8B7355'
      ctx.fillRect(winX, winY, winW, winH)

      // Glass
      ctx.fillStyle = '#87CEEB'
      ctx.fillRect(winX + 3, winY + 3, winW - 6, winH - 6)

      // Cross frame
      ctx.fillStyle = '#8B7355'
      ctx.fillRect(winX + winW/2 - 2, winY, 4, winH)
      ctx.fillRect(winX, winY + winH/2 - 2, winW, 4)

      // Light reflection
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.fillRect(winX + 5, winY + 5, 8, 15)
    }

    // === STUDENT WORK BULLETIN BOARD ===
    const bullX = 40 * scaleX
    const bullY = 150 * scaleY
    const bullW = 80 * scaleX
    const bullH = 100 * scaleY

    // Cork board
    ctx.fillStyle = '#D2691E'
    ctx.fillRect(bullX, bullY, bullW, bullH)

    // Frame
    ctx.strokeStyle = '#5C4033'
    ctx.lineWidth = 4
    ctx.strokeRect(bullX, bullY, bullW, bullH)

    // Pinned papers
    const papers = [
      { x: 8, y: 10, w: 25, h: 30, color: '#FFFFFF', rot: -5 },
      { x: 45, y: 8, w: 25, h: 25, color: '#FFFACD', rot: 3 },
      { x: 10, y: 50, w: 28, h: 25, color: '#E0FFFF', rot: 2 },
      { x: 42, y: 55, w: 25, h: 30, color: '#FFFFFF', rot: -3 },
    ]
    papers.forEach(p => {
      ctx.save()
      ctx.translate(bullX + p.x * scaleX, bullY + p.y * scaleY)
      ctx.rotate(p.rot * Math.PI / 180)
      ctx.fillStyle = p.color
      ctx.fillRect(0, 0, p.w * scaleX, p.h * scaleY)
      ctx.fillStyle = '#333'
      ctx.fillRect(4, 6, p.w * scaleX * 0.6, 2)
      ctx.fillRect(4, 12, p.w * scaleX * 0.8, 2)
      ctx.restore()
    })

    // Push pins
    ctx.fillStyle = '#FF0000'
    ctx.beginPath()
    ctx.arc(bullX + 20 * scaleX, bullY + 15 * scaleY, 4, 0, Math.PI * 2)
    ctx.arc(bullX + 55 * scaleX, bullY + 12 * scaleY, 4, 0, Math.PI * 2)
    ctx.arc(bullX + 22 * scaleX, bullY + 55 * scaleY, 4, 0, Math.PI * 2)
    ctx.arc(bullX + 52 * scaleX, bullY + 60 * scaleY, 4, 0, Math.PI * 2)
    ctx.fill()

    // === DISCUSSION TABLE (oval) ===
    const tableX = w * 0.35
    const tableY = h * 0.45
    const tableW = w * 0.3
    const tableH = h * 0.25

    // Table shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    ctx.beginPath()
    ctx.ellipse(tableX + tableW/2 + 5, tableY + tableH/2 + 5, tableW/2, tableH/2, 0, 0, Math.PI * 2)
    ctx.fill()

    // Table top
    ctx.fillStyle = '#A0522D'
    ctx.beginPath()
    ctx.ellipse(tableX + tableW/2, tableY + tableH/2, tableW/2, tableH/2, 0, 0, Math.PI * 2)
    ctx.fill()

    // Table edge
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.ellipse(tableX + tableW/2, tableY + tableH/2, tableW/2, tableH/2, 0, 0, Math.PI * 2)
    ctx.stroke()

    // Wood grain
    ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.ellipse(tableX + tableW/2, tableY + tableH/2, tableW/3, tableH/3, 0, 0, Math.PI * 2)
    ctx.stroke()

    // Chairs around table
    const chairPositions = [
      { x: tableX - 15, y: tableY + tableH * 0.3 },
      { x: tableX - 15, y: tableY + tableH * 0.6 },
      { x: tableX + tableW + 5, y: tableY + tableH * 0.3 },
      { x: tableX + tableW + 5, y: tableY + tableH * 0.6 },
      { x: tableX + tableW * 0.25, y: tableY - 20 },
      { x: tableX + tableW * 0.55, y: tableY - 20 },
      { x: tableX + tableW * 0.25, y: tableY + tableH + 5 },
      { x: tableX + tableW * 0.55, y: tableY + tableH + 5 },
    ]
    chairPositions.forEach(pos => {
      // Chair seat
      ctx.fillStyle = '#4A5568'
      ctx.fillRect(pos.x, pos.y, 20, 18)
      // Chair back (simplified)
      ctx.fillStyle = '#2D3748'
      ctx.fillRect(pos.x + 2, pos.y - 5, 16, 6)
    })

    // === TEACHER'S DESK ===
    const deskX = w * 0.75
    const deskY = h * 0.3
    const deskW = 100 * scaleX
    const deskH = 60 * scaleY

    // Desk shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    ctx.fillRect(deskX + 4, deskY + 4, deskW, deskH)

    // Desk top
    ctx.fillStyle = '#654321'
    ctx.fillRect(deskX, deskY, deskW, deskH)

    // Desk edge detail
    ctx.fillStyle = '#4A3520'
    ctx.fillRect(deskX, deskY + deskH - 6, deskW, 6)

    // Drawer
    ctx.fillStyle = '#5C4033'
    ctx.fillRect(deskX + 10, deskY + deskH - 20, deskW - 20, 14)
    ctx.fillStyle = '#B8860B'
    ctx.fillRect(deskX + deskW/2 - 8, deskY + deskH - 14, 16, 4)

    // Laptop
    ctx.fillStyle = '#374151'
    ctx.fillRect(deskX + 15, deskY + 10, 40, 25)
    ctx.fillStyle = '#1E293B'
    ctx.fillRect(deskX + 17, deskY + 12, 36, 18)
    ctx.fillStyle = '#60A5FA'
    ctx.fillRect(deskX + 22, deskY + 15, 26, 12)
    // Keyboard
    ctx.fillStyle = '#4B5563'
    ctx.fillRect(deskX + 15, deskY + 36, 40, 12)

    // Coffee mug
    ctx.fillStyle = '#DC2626'
    ctx.beginPath()
    ctx.arc(deskX + 75, deskY + 25, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1E1E1E'
    ctx.beginPath()
    ctx.arc(deskX + 75, deskY + 25, 6, 0, Math.PI * 2)
    ctx.fill()

    // Papers
    ctx.fillStyle = '#FFFFFF'
    ctx.save()
    ctx.translate(deskX + 60, deskY + 40)
    ctx.rotate(-0.1)
    ctx.fillRect(0, 0, 25, 18)
    ctx.restore()

    // Teacher chair
    ctx.fillStyle = '#1E3A5F'
    ctx.fillRect(deskX + 30, deskY + deskH + 8, 35, 28)
    ctx.fillStyle = '#2D5A87'
    ctx.fillRect(deskX + 32, deskY + deskH - 5, 31, 14)

    // === BOOKSHELF (right wall) ===
    const shelfX = w - 50 * scaleX
    const shelfY = 100 * scaleY
    const shelfW = 40 * scaleX
    const shelfH = 120 * scaleY

    // Shelf frame
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(shelfX, shelfY, shelfW, shelfH)

    // Shelves
    ctx.fillStyle = '#A0522D'
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(shelfX + 2, shelfY + i * 30 * scaleY, shelfW - 4, 4)
    }

    // Books (pre-defined sizes to avoid shaking)
    const bookColors = ['#1E40AF', '#DC2626', '#059669', '#7C3AED', '#D97706', '#0891B2']
    const bookSizes = [
      [8, 24], [6, 20], [9, 26], [7, 22],
      [7, 23], [8, 21], [6, 25], [9, 20],
      [8, 22], [7, 24], [6, 21], [8, 26],
    ]
    for (let shelf = 0; shelf < 3; shelf++) {
      let bookX = shelfX + 4
      for (let i = 0; i < 4; i++) {
        const [bookW, bookH] = bookSizes[shelf * 4 + i]
        ctx.fillStyle = bookColors[(shelf * 4 + i) % bookColors.length]
        ctx.fillRect(bookX, shelfY + shelf * 30 * scaleY + 5 + (28 - bookH), bookW, bookH)
        bookX += bookW + 1
      }
    }

    // === POSTERS ===
    // Poster 1 - "Aim High"
    ctx.fillStyle = '#2D5A87'
    ctx.fillRect(w - 45 * scaleX, 10 * scaleY, 35 * scaleX, 45 * scaleY)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `bold ${10 * scaleY}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('AIM', w - 27 * scaleX, 30 * scaleY)
    ctx.fillText('HIGH', w - 27 * scaleX, 42 * scaleY)

    // Poster 2 - "Think"
    ctx.fillStyle = '#7C3AED'
    ctx.fillRect(45 * scaleX, 10 * scaleY, 40 * scaleX, 35 * scaleY)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('THINK', 65 * scaleX, 32 * scaleY)

    // === CLOCK ===
    const clockX = w - 70 * scaleX
    const clockY = 20 * scaleY
    const clockR = 15 * scaleY

    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(clockX, clockY, clockR, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1E1E1E'
    ctx.lineWidth = 2
    ctx.stroke()

    // Clock hands
    ctx.strokeStyle = '#1E1E1E'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(clockX, clockY)
    ctx.lineTo(clockX + 8, clockY - 4)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(clockX, clockY)
    ctx.lineTo(clockX - 2, clockY - 10)
    ctx.stroke()

    // === PLANT ===
    const plantX = w - 55 * scaleX
    const plantY = h * 0.55

    // Pot
    ctx.fillStyle = '#B45309'
    ctx.beginPath()
    ctx.moveTo(plantX, plantY)
    ctx.lineTo(plantX + 25, plantY)
    ctx.lineTo(plantX + 20, plantY + 25)
    ctx.lineTo(plantX + 5, plantY + 25)
    ctx.closePath()
    ctx.fill()

    // Plant leaves
    ctx.fillStyle = '#22C55E'
    ctx.beginPath()
    ctx.ellipse(plantX + 12, plantY - 15, 8, 20, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(plantX + 5, plantY - 10, 6, 15, -0.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(plantX + 20, plantY - 10, 6, 15, 0.4, 0, Math.PI * 2)
    ctx.fill()

    // === RUG under discussion table ===
    ctx.fillStyle = '#4A5568'
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.ellipse(tableX + tableW/2, tableY + tableH/2, tableW/2 + 30, tableH/2 + 25, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1

    // === PLAYER CHARACTER ===
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.beginPath()
    ctx.ellipse(player.x + 2, player.y + PLAYER_SIZE/2 + 2, PLAYER_SIZE/2, PLAYER_SIZE/4, 0, 0, Math.PI * 2)
    ctx.fill()

    // Body
    ctx.fillStyle = '#3B82F6'
    ctx.beginPath()
    ctx.arc(player.x, player.y, PLAYER_SIZE/2, 0, Math.PI * 2)
    ctx.fill()

    // Head
    ctx.fillStyle = '#FBBF24'
    ctx.beginPath()
    ctx.arc(player.x, player.y - 8, PLAYER_SIZE/3, 0, Math.PI * 2)
    ctx.fill()

    // Direction indicator
    ctx.fillStyle = '#1E40AF'
    ctx.beginPath()
    ctx.arc(player.x, player.y - PLAYER_SIZE/2 - 4, 4, 0, Math.PI * 2)
    ctx.fill()

  }, [width, height, scaleX, scaleY])

  // Check nearby area
  const checkNearbyArea = useCallback((x: number, y: number) => {
    const mapX = Math.floor(x / (width / 20))
    const mapY = Math.floor(y / (height / 15))

    if (mapX >= 0 && mapX < 20 && mapY >= 0 && mapY < 15) {
      const cell = COLLISION_MAP[mapY]?.[mapX]
      if (cell && cell >= 2 && cell <= 5) {
        return AREA_INFO[cell]
      }
    }
    return null
  }, [width, height])

  // Check collision
  const canMove = useCallback((x: number, y: number) => {
    const margin = PLAYER_SIZE / 2
    const points = [
      { x: x - margin, y: y - margin },
      { x: x + margin, y: y - margin },
      { x: x - margin, y: y + margin },
      { x: x + margin, y: y + margin },
    ]

    for (const p of points) {
      const mapX = Math.floor(p.x / (width / 20))
      const mapY = Math.floor(p.y / (height / 15))

      if (mapX < 0 || mapX >= 20 || mapY < 0 || mapY >= 15) return false
      if (COLLISION_MAP[mapY]?.[mapX] === 1) return false
    }
    return true
  }, [width, height])

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number

    const gameLoop = () => {
      const player = playerRef.current
      const keys = keysRef.current

      let newX = player.x
      let newY = player.y

      if (keys.has('w') || keys.has('arrowup')) newY -= PLAYER_SPEED
      if (keys.has('s') || keys.has('arrowdown')) newY += PLAYER_SPEED
      if (keys.has('a') || keys.has('arrowleft')) newX -= PLAYER_SPEED
      if (keys.has('d') || keys.has('arrowright')) newX += PLAYER_SPEED

      // Check collision and update position
      if (canMove(newX, player.y)) player.x = newX
      if (canMove(player.x, newY)) player.y = newY

      // Check nearby area
      const area = checkNearbyArea(player.x, player.y)
      setNearbyArea(area?.id || null)
      setNearbyName(area?.name || null)

      render(ctx)
      animationId = requestAnimationFrame(gameLoop)
    }

    gameLoop()
    return () => cancelAnimationFrame(animationId)
  }, [render, canMove, checkNearbyArea])

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()

      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
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
        className="border-4 border-[#2d4a6f] rounded-lg"
        style={{
          boxShadow: '0 0 40px rgba(45, 90, 135, 0.3)',
        }}
      />

      {/* Controls hint */}
      <div className="absolute bottom-3 left-3 text-[10px] text-white/60 font-mono bg-black/40 px-2 py-1 rounded">
        WASD: Move | SPACE: Interact
      </div>

      {/* Area prompt */}
      <AnimatePresence>
        {nearbyArea && nearbyName && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur rounded-lg px-4 py-2 border border-[#4a7ba8]"
          >
            <p className="text-center text-sm text-white font-bold">{nearbyName}</p>
            <p className="text-center text-xs text-[#7db4e0] mt-1">
              Press <kbd className="px-1.5 py-0.5 bg-[#2d5a87] rounded text-[10px] mx-1">SPACE</kbd> to explore
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
