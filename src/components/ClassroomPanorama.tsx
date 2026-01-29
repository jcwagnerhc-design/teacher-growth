'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Presentation, Heart, ClipboardList, BarChart3 } from 'lucide-react'

// Areas positioned around the room (angle in degrees, 0 = front)
const AREAS = [
  {
    id: 'instruction',
    name: 'Teaching Space',
    angle: 0,
    width: 80,
    icon: Presentation,
    color: '#4a7ba8',
    description: 'Whiteboard & instruction area'
  },
  {
    id: 'assessment',
    name: 'Student Work',
    angle: -70,
    width: 50,
    icon: BarChart3,
    color: '#6b7280',
    description: 'Bulletin board with student work'
  },
  {
    id: 'planning',
    name: 'Teacher Desk',
    angle: 70,
    width: 50,
    icon: ClipboardList,
    color: '#2d5a87',
    description: 'Your planning station'
  },
  {
    id: 'environment',
    name: 'Discussion Table',
    angle: 180,
    width: 70,
    icon: Heart,
    color: '#1e3a5f',
    description: 'Class discussion area'
  },
]

interface ClassroomPanoramaProps {
  onAreaSelect: (area: string) => void
  width?: number
  height?: number
}

export default function ClassroomPanorama({
  onAreaSelect,
  width = 640,
  height = 400
}: ClassroomPanoramaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const angleRef = useRef(0) // Current view angle in degrees
  const targetAngleRef = useRef(0)
  const [focusedArea, setFocusedArea] = useState<string | null>(null)
  const keysRef = useRef<Set<string>>(new Set())

  // Normalize angle to -180 to 180
  const normalizeAngle = (a: number) => {
    while (a > 180) a -= 360
    while (a < -180) a += 360
    return a
  }

  // Check which area we're looking at
  const getVisibleArea = useCallback((viewAngle: number) => {
    for (const area of AREAS) {
      const diff = Math.abs(normalizeAngle(viewAngle - area.angle))
      if (diff < area.width / 2) {
        return area
      }
    }
    return null
  }, [])

  // Render the panoramic view
  const render = useCallback((ctx: CanvasRenderingContext2D, currentAngle: number) => {
    const w = width
    const h = height

    // Sky/ceiling gradient
    const ceilGradient = ctx.createLinearGradient(0, 0, 0, h * 0.4)
    ceilGradient.addColorStop(0, '#0a0a15')
    ceilGradient.addColorStop(1, '#1a1a2e')
    ctx.fillStyle = ceilGradient
    ctx.fillRect(0, 0, w, h * 0.4)

    // Floor gradient
    const floorGradient = ctx.createLinearGradient(0, h * 0.6, 0, h)
    floorGradient.addColorStop(0, '#1a3a5a')
    floorGradient.addColorStop(1, '#0f2744')
    ctx.fillStyle = floorGradient
    ctx.fillRect(0, h * 0.6, w, h * 0.4)

    // Wall area (middle band)
    ctx.fillStyle = '#2d4a6f'
    ctx.fillRect(0, h * 0.4, w, h * 0.2)

    // Draw floor grid for depth
    ctx.strokeStyle = 'rgba(100, 150, 200, 0.1)'
    ctx.lineWidth = 1
    for (let i = 0; i < 10; i++) {
      const y = h * 0.6 + (i / 10) * h * 0.4
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    // Draw vertical lines on walls for texture
    ctx.strokeStyle = 'rgba(100, 150, 200, 0.08)'
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, h * 0.35)
      ctx.lineTo(x, h * 0.65)
      ctx.stroke()
    }

    // Draw each area based on view angle
    for (const area of AREAS) {
      // Calculate where this area appears on screen based on angle difference
      const angleDiff = normalizeAngle(area.angle - currentAngle)

      // Only render if within ~120 degree FOV
      if (Math.abs(angleDiff) > 70) continue

      // Convert angle to screen position (center = 0 degrees diff)
      const screenX = w / 2 + (angleDiff / 70) * (w / 2)

      // Size based on how centered it is
      const centeredness = 1 - Math.abs(angleDiff) / 70
      const areaWidth = 120 + centeredness * 80
      const areaHeight = 100 + centeredness * 60

      const areaX = screenX - areaWidth / 2
      const areaY = h / 2 - areaHeight / 2

      // Draw area panel
      ctx.fillStyle = area.color
      ctx.globalAlpha = 0.6 + centeredness * 0.4

      // Panel with slight 3D effect
      ctx.fillRect(areaX, areaY, areaWidth, areaHeight)

      // Border
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2 + centeredness * 2
      ctx.strokeRect(areaX, areaY, areaWidth, areaHeight)

      // Inner shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)'
      ctx.fillRect(areaX + 4, areaY + 4, areaWidth - 8, 4)

      // Highlight if focused
      if (focusedArea === area.id) {
        ctx.strokeStyle = '#ffff00'
        ctx.lineWidth = 3
        ctx.strokeRect(areaX - 2, areaY - 2, areaWidth + 4, areaHeight + 4)
      }

      // Icon placeholder (circle)
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.beginPath()
      ctx.arc(screenX, h / 2 - 15, 20 + centeredness * 10, 0, Math.PI * 2)
      ctx.fill()

      // Icon symbol
      ctx.fillStyle = area.color
      ctx.font = `bold ${16 + centeredness * 8}px monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const symbols: Record<string, string> = {
        instruction: '📋',
        environment: '💬',
        planning: '📝',
        assessment: '📊'
      }
      ctx.fillText(symbols[area.id] || '?', screenX, h / 2 - 15)

      // Area name
      ctx.fillStyle = '#fff'
      ctx.font = `bold ${12 + centeredness * 4}px monospace`
      ctx.fillText(area.name, screenX, h / 2 + 25 + centeredness * 10)

      ctx.globalAlpha = 1
    }

    // Draw subtle vignette
    const vignetteGradient = ctx.createRadialGradient(w/2, h/2, h*0.3, w/2, h/2, w*0.7)
    vignetteGradient.addColorStop(0, 'rgba(0,0,0,0)')
    vignetteGradient.addColorStop(1, 'rgba(0,0,0,0.4)')
    ctx.fillStyle = vignetteGradient
    ctx.fillRect(0, 0, w, h)

    // Crosshair
    ctx.strokeStyle = 'rgba(125, 180, 224, 0.5)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(w/2 - 15, h/2)
    ctx.lineTo(w/2 - 5, h/2)
    ctx.moveTo(w/2 + 5, h/2)
    ctx.lineTo(w/2 + 15, h/2)
    ctx.moveTo(w/2, h/2 - 15)
    ctx.lineTo(w/2, h/2 - 5)
    ctx.moveTo(w/2, h/2 + 5)
    ctx.lineTo(w/2, h/2 + 15)
    ctx.stroke()

    // Compass at bottom
    const compassY = h - 30
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(w/2 - 60, compassY - 10, 120, 25)

    ctx.fillStyle = '#7db4e0'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'center'

    // Show what direction we're facing
    let facing = 'FRONT'
    if (Math.abs(currentAngle) < 30) facing = 'BOARD'
    else if (currentAngle > 60 && currentAngle < 120) facing = 'DESK'
    else if (currentAngle < -60 && currentAngle > -120) facing = 'WORK'
    else if (Math.abs(currentAngle) > 150) facing = 'TABLE'
    else if (currentAngle > 0) facing = '→'
    else facing = '←'

    ctx.fillText(facing, w/2, compassY + 3)

  }, [width, height, focusedArea])

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let lastFocused: string | null = null

    const gameLoop = () => {
      // Handle continuous key presses - MUCH SLOWER rotation
      const keys = keysRef.current
      if (keys.has('a') || keys.has('arrowleft')) {
        targetAngleRef.current = normalizeAngle(targetAngleRef.current - 1.5)
      }
      if (keys.has('d') || keys.has('arrowright')) {
        targetAngleRef.current = normalizeAngle(targetAngleRef.current + 1.5)
      }

      // Smooth rotation towards target - slower easing
      const diff = normalizeAngle(targetAngleRef.current - angleRef.current)
      if (Math.abs(diff) > 0.3) {
        angleRef.current = normalizeAngle(angleRef.current + diff * 0.08)
      } else {
        angleRef.current = targetAngleRef.current
      }

      // Check what we're looking at (only update state if changed)
      const visible = getVisibleArea(angleRef.current)
      const newFocused = visible?.id || null
      if (newFocused !== lastFocused) {
        lastFocused = newFocused
        setFocusedArea(newFocused)
      }

      render(ctx, angleRef.current)
      animationId = requestAnimationFrame(gameLoop)
    }

    gameLoop()
    return () => cancelAnimationFrame(animationId)
  }, [render, getVisibleArea])

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()

      if (['a', 'd', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault()
        keysRef.current.add(key)
      }

      // Quick turn with W/S
      if (key === 'w' || key === 'arrowup') {
        e.preventDefault()
        targetAngleRef.current = 0 // Face front (board)
      }
      if (key === 's' || key === 'arrowdown') {
        e.preventDefault()
        targetAngleRef.current = 180 // Face back (table)
      }

      // Interact
      if ((key === ' ' || key === 'enter') && focusedArea) {
        e.preventDefault()
        onAreaSelect(focusedArea)
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
  }, [focusedArea, onAreaSelect])

  const visibleArea = AREAS.find(a => a.id === focusedArea)

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

      {/* HUD */}
      <div className="absolute bottom-4 left-4 text-[10px] text-slate-400 font-mono bg-black/30 px-2 py-1 rounded">
        A/D: Look around | W: Board | S: Table | SPACE: Interact
      </div>

      {/* Area info popup */}
      <AnimatePresence>
        {visibleArea && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur rounded-lg px-4 py-2 border border-[#4a7ba8]"
          >
            <p className="text-center text-sm text-white font-bold">{visibleArea.name}</p>
            <p className="text-center text-xs text-slate-400">{visibleArea.description}</p>
            <p className="text-center text-xs text-[#7db4e0] mt-1">
              Press <kbd className="px-1.5 py-0.5 bg-[#2d5a87] rounded text-[10px] mx-1">SPACE</kbd> to explore
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
