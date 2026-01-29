'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import { CharacterCustomization } from './PixelCharacter'

// Tile size
const TILE = 48
const ROOM_W = 10
const ROOM_H = 8

// Color palettes
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

const DEFAULT_CHARACTER: CharacterCustomization = {
  skinTone: 1, hairStyle: 0, hairColor: 2, outfit: 0,
  accessory: 0, bodyType: 0, facialHair: 0, makeup: 0,
}

interface Message {
  role: 'user' | 'coach'
  content: string
}

interface Props {
  onExit: () => void
}

export default function CoachRoom({ onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [character, setCharacter] = useState<CharacterCustomization>(DEFAULT_CHARACTER)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'coach', content: "Welcome to my office! What's on your mind today? I'm here to help you reflect on your teaching practice." }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load character
  useEffect(() => {
    const profileStr = localStorage.getItem('teacher-profile')
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr)
        if (profile.character) setCharacter(profile.character)
      } catch (e) { /* ignore */ }
    }
  }, [])

  // Draw the room
  const render = useCallback((ctx: CanvasRenderingContext2D) => {
    const w = ROOM_W * TILE
    const h = ROOM_H * TILE

    // Cozy office background - warm wood tones
    const floorGrad = ctx.createLinearGradient(0, h * 0.5, 0, h)
    floorGrad.addColorStop(0, '#8B6914')
    floorGrad.addColorStop(1, '#6B4F12')
    ctx.fillStyle = floorGrad
    ctx.fillRect(0, 0, w, h)

    // Walls
    ctx.fillStyle = '#F5E6D3'
    ctx.fillRect(0, 0, w, h * 0.45)

    // Wainscoting
    ctx.fillStyle = '#D4B896'
    ctx.fillRect(0, h * 0.35, w, h * 0.1)
    ctx.fillStyle = '#C4A060'
    ctx.fillRect(0, h * 0.35, w, 4)
    ctx.fillRect(0, h * 0.44, w, 4)

    // Floor planks
    ctx.strokeStyle = '#7A5D1A'
    ctx.lineWidth = 1
    for (let y = h * 0.5; y < h; y += TILE / 2) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    // Bookshelf on left wall
    ctx.fillStyle = '#5D4037'
    ctx.fillRect(20, 40, 80, 130)
    // Shelves
    ctx.fillStyle = '#6D4C41'
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(20, 55 + i * 30, 80, 6)
    }
    // Books
    const bookColors = ['#1565C0', '#C62828', '#2E7D32', '#6A1B9A', '#EF6C00', '#00838F']
    let bx = 26
    for (let shelf = 0; shelf < 3; shelf++) {
      bx = 26
      for (let b = 0; b < 5; b++) {
        const bh = 18 + (b % 3) * 4
        ctx.fillStyle = bookColors[(shelf + b) % bookColors.length]
        ctx.fillRect(bx, 60 + shelf * 30 - bh, 12, bh)
        bx += 14
      }
    }

    // Cozy armchair for coach (right side)
    // Chair back
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(w - 130, 100, 90, 80)
    ctx.fillStyle = '#A0522D'
    ctx.fillRect(w - 125, 105, 80, 70)
    // Cushion
    ctx.fillStyle = '#2E7D32'
    ctx.fillRect(w - 120, 140, 70, 35)
    ctx.fillStyle = '#388E3C'
    ctx.fillRect(w - 115, 145, 60, 25)

    // Coach character (sitting in chair)
    drawCoach(ctx, w - 85, 115)

    // Small table in center
    ctx.fillStyle = '#6D4C41'
    ctx.fillRect(w/2 - 40, h * 0.55, 80, 50)
    ctx.fillStyle = '#5D4037'
    ctx.fillRect(w/2 - 35, h * 0.55, 70, 8)

    // Coffee cups on table
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(w/2 - 15, h * 0.58, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#6F4E37'
    ctx.beginPath()
    ctx.arc(w/2 - 15, h * 0.58, 7, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#87CEEB'
    ctx.beginPath()
    ctx.arc(w/2 + 15, h * 0.58, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#6F4E37'
    ctx.beginPath()
    ctx.arc(w/2 + 15, h * 0.58, 7, 0, Math.PI * 2)
    ctx.fill()

    // Player's chair (left side, facing coach)
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(50, 160, 70, 60)
    ctx.fillStyle = '#A0522D'
    ctx.fillRect(55, 165, 60, 50)
    // Cushion
    ctx.fillStyle = '#3B82F6'
    ctx.fillRect(60, 180, 50, 30)
    ctx.fillStyle = '#60A5FA'
    ctx.fillRect(65, 185, 40, 20)

    // Player sitting
    drawPlayer(ctx, 85, 155, character)

    // Window with curtains
    ctx.fillStyle = '#87CEEB'
    ctx.fillRect(w/2 - 50, 20, 100, 80)
    // Window frame
    ctx.strokeStyle = '#F5F5DC'
    ctx.lineWidth = 6
    ctx.strokeRect(w/2 - 50, 20, 100, 80)
    ctx.beginPath()
    ctx.moveTo(w/2, 20)
    ctx.lineTo(w/2, 100)
    ctx.moveTo(w/2 - 50, 60)
    ctx.lineTo(w/2 + 50, 60)
    ctx.stroke()
    // Curtains
    ctx.fillStyle = '#8B0000'
    ctx.fillRect(w/2 - 70, 10, 25, 100)
    ctx.fillRect(w/2 + 45, 10, 25, 100)

    // Rug under furniture
    ctx.fillStyle = '#722F37'
    ctx.beginPath()
    ctx.ellipse(w/2, h * 0.7, 150, 60, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#8B3A3A'
    ctx.beginPath()
    ctx.ellipse(w/2, h * 0.7, 130, 50, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#CD853F'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.ellipse(w/2, h * 0.7, 110, 40, 0, 0, Math.PI * 2)
    ctx.stroke()

    // Plant in corner
    ctx.fillStyle = '#E07B4A'
    ctx.beginPath()
    ctx.moveTo(w - 50, h - 30)
    ctx.lineTo(w - 30, h - 30)
    ctx.lineTo(w - 35, h - 60)
    ctx.lineTo(w - 45, h - 60)
    ctx.closePath()
    ctx.fill()
    // Leaves
    ctx.fillStyle = '#228B22'
    ctx.beginPath()
    ctx.ellipse(w - 40, h - 80, 20, 30, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#32CD32'
    ctx.beginPath()
    ctx.ellipse(w - 50, h - 70, 15, 25, -0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(w - 30, h - 70, 15, 25, 0.3, 0, Math.PI * 2)
    ctx.fill()

  }, [character])

  // Draw the coach (Professor McGonagall-style wise witch mentor)
  const drawCoach = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Emerald green pointed witch hat
    ctx.fillStyle = '#1B5E20'
    ctx.beginPath()
    ctx.moveTo(x, y - 45)  // Hat tip
    ctx.lineTo(x - 25, y - 8)
    ctx.lineTo(x + 25, y - 8)
    ctx.closePath()
    ctx.fill()

    // Hat brim - wide and elegant
    ctx.fillStyle = '#14532D'
    ctx.beginPath()
    ctx.ellipse(x, y - 8, 32, 10, 0, 0, Math.PI * 2)
    ctx.fill()

    // Hat band with gold trim
    ctx.fillStyle = '#B8860B'
    ctx.fillRect(x - 22, y - 18, 44, 4)

    // Head - mature face
    ctx.fillStyle = '#F5DEB3'
    ctx.beginPath()
    ctx.arc(x, y + 20, 28, 0, Math.PI * 2)
    ctx.fill()

    // Tight hair pulled back - clean black with gray at temples
    ctx.fillStyle = '#1C1C1C'
    // Hair swept back from forehead
    ctx.beginPath()
    ctx.ellipse(x, y, 26, 18, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    // Side hair - sleek, pulled back
    ctx.fillStyle = '#1C1C1C'
    ctx.beginPath()
    ctx.moveTo(x - 26, y + 5)
    ctx.quadraticCurveTo(x - 30, y + 15, x - 24, y + 25)
    ctx.lineTo(x - 20, y + 20)
    ctx.quadraticCurveTo(x - 24, y + 12, x - 22, y + 5)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(x + 26, y + 5)
    ctx.quadraticCurveTo(x + 30, y + 15, x + 24, y + 25)
    ctx.lineTo(x + 20, y + 20)
    ctx.quadraticCurveTo(x + 24, y + 12, x + 22, y + 5)
    ctx.fill()
    // Gray at temples
    ctx.fillStyle = '#6B6B6B'
    ctx.beginPath()
    ctx.arc(x - 22, y + 8, 4, 0, Math.PI * 2)
    ctx.arc(x + 22, y + 8, 4, 0, Math.PI * 2)
    ctx.fill()
    // Tight bun at back of head
    ctx.fillStyle = '#1C1C1C'
    ctx.beginPath()
    ctx.arc(x, y - 2, 14, 0, Math.PI * 2)
    ctx.fill()

    // Rectangular spectacles - signature McGonagall style
    ctx.strokeStyle = '#333333'
    ctx.lineWidth = 2.5
    ctx.strokeRect(x - 16, y + 14, 12, 10)
    ctx.strokeRect(x + 4, y + 14, 12, 10)
    // Bridge
    ctx.beginPath()
    ctx.moveTo(x - 4, y + 19)
    ctx.lineTo(x + 4, y + 19)
    ctx.stroke()
    // Temple arms hint
    ctx.beginPath()
    ctx.moveTo(x - 16, y + 17)
    ctx.lineTo(x - 22, y + 15)
    ctx.moveTo(x + 16, y + 17)
    ctx.lineTo(x + 22, y + 15)
    ctx.stroke()

    // Sharp green eyes behind glasses
    ctx.fillStyle = '#228B22'
    ctx.beginPath()
    ctx.ellipse(x - 10, y + 19, 4, 3, 0, 0, Math.PI * 2)
    ctx.ellipse(x + 10, y + 19, 4, 3, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1a1a1a'
    ctx.beginPath()
    ctx.arc(x - 10, y + 19, 2, 0, Math.PI * 2)
    ctx.arc(x + 10, y + 19, 2, 0, Math.PI * 2)
    ctx.fill()

    // Thin, stern lips
    ctx.fillStyle = '#BC8F8F'
    ctx.beginPath()
    ctx.ellipse(x, y + 32, 8, 3, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#8B7355'
    ctx.beginPath()
    ctx.moveTo(x - 7, y + 32)
    ctx.lineTo(x + 7, y + 32)
    ctx.stroke()

    // High collar emerald robes
    ctx.fillStyle = '#1B5E20'
    // High collar
    ctx.beginPath()
    ctx.moveTo(x - 15, y + 42)
    ctx.lineTo(x - 20, y + 48)
    ctx.lineTo(x - 25, y + 95)
    ctx.lineTo(x + 25, y + 95)
    ctx.lineTo(x + 20, y + 48)
    ctx.lineTo(x + 15, y + 42)
    ctx.closePath()
    ctx.fill()

    // Robe collar detail
    ctx.fillStyle = '#14532D'
    ctx.beginPath()
    ctx.moveTo(x - 15, y + 42)
    ctx.lineTo(x, y + 52)
    ctx.lineTo(x + 15, y + 42)
    ctx.fill()

    // Gold brooch at collar
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.arc(x, y + 50, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#B8860B'
    ctx.beginPath()
    ctx.arc(x, y + 50, 3, 0, Math.PI * 2)
    ctx.fill()

    // Robe folds
    ctx.strokeStyle = '#0D3311'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x - 8, y + 55)
    ctx.lineTo(x - 12, y + 95)
    ctx.moveTo(x + 8, y + 55)
    ctx.lineTo(x + 12, y + 95)
    ctx.stroke()

    // Hands folded
    ctx.fillStyle = '#F5DEB3'
    ctx.beginPath()
    ctx.ellipse(x, y + 72, 12, 8, 0, 0, Math.PI * 2)
    ctx.fill()

    // Wand resting in hands
    ctx.fillStyle = '#5D4037'
    ctx.save()
    ctx.translate(x - 15, y + 68)
    ctx.rotate(-0.2)
    ctx.fillRect(0, 0, 35, 5)
    // Wand handle detail
    ctx.fillStyle = '#3E2723'
    ctx.fillRect(0, 0, 8, 5)
    ctx.restore()
  }

  // Draw the player (sitting, facing right toward coach)
  const drawPlayer = (ctx: CanvasRenderingContext2D, x: number, y: number, char: CharacterCustomization) => {
    const skinColor = SKIN_TONES[char.skinTone] || SKIN_TONES[1]
    const hairColor = HAIR_COLORS[char.hairColor] || HAIR_COLORS[2]
    const outfit = OUTFIT_COLORS[char.outfit] || OUTFIT_COLORS[0]
    const scale = 2.5

    // Head (facing right)
    ctx.fillStyle = skinColor
    ctx.beginPath()
    ctx.arc(x, y + 10, 11 * scale, 0, Math.PI * 2)
    ctx.fill()

    // Hair
    ctx.fillStyle = hairColor
    ctx.beginPath()
    ctx.arc(x - 5, y + 5, 12 * scale, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(x - 12 * scale, y, 20 * scale, 8)

    // Eye (side profile - one eye visible)
    ctx.fillStyle = '#2C1810'
    ctx.beginPath()
    ctx.arc(x + 6, y + 10, 2.5, 0, Math.PI * 2)
    ctx.fill()
    // Eye highlight
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(x + 5, y + 9, 1, 0, Math.PI * 2)
    ctx.fill()

    // Body (sitting, facing right)
    ctx.fillStyle = outfit.primary
    ctx.fillRect(x - 15, y + 35, 30, 40)
    ctx.fillStyle = outfit.secondary
    ctx.fillRect(x - 5, y + 35, 10, 25)

    // Arm reaching toward table
    ctx.fillStyle = skinColor
    ctx.fillRect(x + 10, y + 45, 25, 8)
  }

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    const loop = () => {
      render(ctx)
      animationId = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(animationId)
  }, [render])

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Handle sending message
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      // Build messages array including the new user message
      const allMessages = [
        ...messages.map(m => ({
          role: m.role === 'coach' ? 'assistant' as const : 'user' as const,
          content: m.content
        })),
        { role: 'user' as const, content: userMessage }
      ]

      const response = await fetch('/api/coaching/open-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user-001',
          messages: allMessages
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.response) {
          setMessages(prev => [...prev, { role: 'coach', content: data.response }])
        } else {
          setMessages(prev => [...prev, { role: 'coach', content: "I couldn't connect to the AI service. Check your API key in .env" }])
        }
      } else {
        setMessages(prev => [...prev, { role: 'coach', content: "Connection failed. The AI service may be down or the API key may be invalid." }])
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'coach', content: "Network error. Please check your connection." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex flex-col items-center">
      {/* Room canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={ROOM_W * TILE}
          height={ROOM_H * TILE}
          className="border-4 border-[#5D4037] rounded-lg"
          style={{
            imageRendering: 'pixelated',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        />

        {/* Exit button */}
        <button
          onClick={onExit}
          className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Classroom
        </button>
      </div>

      {/* Chat interface */}
      <div className="w-full max-w-[480px] mt-4 bg-slate-900/90 rounded-xl border border-slate-700 overflow-hidden">
        {/* Messages */}
        <div className="h-48 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-100'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-700 rounded-lg px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-700 p-3 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Share what's on your mind..."
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
