'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings } from 'lucide-react'

import PixelCharacter, { DEFAULT_CHARACTER, CharacterCustomization } from '@/components/PixelCharacter'
import ClassroomPokemon, { RoomType } from '@/components/ClassroomPokemon'
import CoachRoom from '@/components/CoachRoom'
import JournalRoom from '@/components/JournalRoom'
import GoalsRoom from '@/components/GoalsRoom'
import ArchiveRoom from '@/components/ArchiveRoom'
import { DEFAULT_CLASSROOM } from '@/types/classroom'

export default function PlayPage() {
  const router = useRouter()
  const [profile, setProfile] = useState({ character: DEFAULT_CHARACTER, level: 4, name: 'Teacher', classroom: DEFAULT_CLASSROOM })

  // Room state - classroom is the hub, doors lead to other rooms
  const [currentRoom, setCurrentRoom] = useState<'classroom' | RoomType>('classroom')
  const [roomTransition, setRoomTransition] = useState(false)

  // Load profile
  useEffect(() => {
    const saved = localStorage.getItem('teacher-profile')
    if (saved) {
      const parsed = JSON.parse(saved)
      setProfile({
        character: { ...DEFAULT_CHARACTER, ...parsed.character },
        level: 4,
        name: parsed.name || 'Teacher',
        classroom: parsed.classroom || DEFAULT_CLASSROOM,
      })
    }
  }, [])

  // Handle door entry - transition to the appropriate room
  const handleEnterDoor = useCallback((room: RoomType) => {
    setRoomTransition(true)
    setTimeout(() => {
      setCurrentRoom(room)
      setRoomTransition(false)
    }, 400)
  }, [])

  // Handle exiting any room back to classroom
  const handleExitRoom = useCallback(() => {
    setRoomTransition(true)
    setTimeout(() => {
      setCurrentRoom('classroom')
      setRoomTransition(false)
    }, 400)
  }, [])

  return (
    <div className="min-h-screen text-white overflow-hidden bg-[#0a1628] flex flex-col">

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-30 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-700">
            <PixelCharacter
              customization={profile.character as CharacterCustomization}
              level={profile.level}
              size="sm"
            />
            <div>
              <p className="font-semibold text-sm">{profile.name}</p>
              <p className="text-xs text-slate-400">Teacher</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/play/settings')}
            className="p-2 bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Room View with Transition */}
      <div className="relative w-full flex-1 flex items-center justify-center pt-16">
        {/* Transition overlay */}
        <AnimatePresence>
          {roomTransition && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black z-40"
            />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {currentRoom === 'classroom' && (
            <motion.div
              key="classroom"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ClassroomPokemon onEnterDoor={handleEnterDoor} />
            </motion.div>
          )}

          {currentRoom === 'coach' && (
            <motion.div
              key="coach"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CoachRoom onExit={handleExitRoom} />
            </motion.div>
          )}

          {currentRoom === 'journal' && (
            <motion.div
              key="journal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <JournalRoom onExit={handleExitRoom} />
            </motion.div>
          )}

          {currentRoom === 'goals' && (
            <motion.div
              key="goals"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <GoalsRoom onExit={handleExitRoom} />
            </motion.div>
          )}

          {currentRoom === 'archive' && (
            <motion.div
              key="archive"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ArchiveRoom onExit={handleExitRoom} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
