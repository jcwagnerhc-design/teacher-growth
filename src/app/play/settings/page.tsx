'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Save,
  User,
  Sparkles,
  Trash2,
  Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import CharacterCreator from '@/components/CharacterCreator'
import PixelCharacter, { CharacterCustomization, DEFAULT_CHARACTER } from '@/components/PixelCharacter'
import ClassroomCustomizer from '@/components/ClassroomCustomizer'
import { ClassroomCustomization, DEFAULT_CLASSROOM } from '@/types/classroom'

const defaultProfile = {
  name: 'Teacher',
  character: DEFAULT_CHARACTER,
  mantra: 'listens more than lectures',
  classroom: DEFAULT_CLASSROOM,
}

export default function SettingsPage() {
  const router = useRouter()
  const [name, setName] = useState(defaultProfile.name)
  const [character, setCharacter] = useState<CharacterCustomization>(defaultProfile.character)
  const [mantra, setMantra] = useState(defaultProfile.mantra)
  const [classroom, setClassroom] = useState<ClassroomCustomization>(defaultProfile.classroom)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'character' | 'classroom'>('profile')

  useEffect(() => {
    const savedProfile = localStorage.getItem('teacher-profile')
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile)
      setName(parsed.name || defaultProfile.name)
      setCharacter({ ...DEFAULT_CHARACTER, ...parsed.character })
      setMantra(parsed.mantra || defaultProfile.mantra)
      setClassroom(parsed.classroom || DEFAULT_CLASSROOM)
    }
  }, [])

  const handleSave = () => {
    const savedProfile = localStorage.getItem('teacher-profile')
    const existing = savedProfile ? JSON.parse(savedProfile) : {}

    localStorage.setItem('teacher-profile', JSON.stringify({
      ...existing,
      name,
      character,
      mantra,
      classroom,
    }))

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset your profile? This will start you over from onboarding.')) {
      localStorage.removeItem('teacher-profile')
      router.push('/onboarding')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Settings</h1>
          <button
            onClick={handleSave}
            className={cn(
              'p-2 transition-colors',
              saved ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
            )}
          >
            <Save className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Save confirmation */}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-3 text-center text-emerald-400"
          >
            Changes saved!
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={cn(
              'flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'profile'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            )}
          >
            <User className="w-5 h-5" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('character')}
            className={cn(
              'flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'character'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            )}
          >
            <Sparkles className="w-5 h-5" />
            Character
          </button>
          <button
            onClick={() => setActiveTab('classroom')}
            className={cn(
              'flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'classroom'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            )}
          >
            <Home className="w-5 h-5" />
            Classroom
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Preview */}
            <div className="flex justify-center py-4">
              <PixelCharacter customization={character} level={4} size="lg" />
            </div>

            {/* Name */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <label className="block text-sm text-slate-400 mb-2">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-lg focus:border-amber-500 outline-none transition-colors"
                placeholder="Your name"
              />
            </div>

            {/* Mantra */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <label className="block text-sm text-slate-400 mb-2">Growth Mantra</label>
              <div className="flex items-start gap-2">
                <span className="text-slate-500 pt-3 shrink-0">&ldquo;I&apos;m becoming a teacher who</span>
                <textarea
                  value={mantra}
                  onChange={(e) => setMantra(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:border-amber-500 outline-none transition-colors resize-none"
                  placeholder="listens more than lectures"
                  rows={2}
                />
                <span className="text-slate-500 pt-3 shrink-0">&rdquo;</span>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border border-red-900/50 rounded-xl p-4">
              <h3 className="text-red-400 font-medium mb-2">Danger Zone</h3>
              <p className="text-sm text-slate-400 mb-4">
                Reset your profile to start over from onboarding. This cannot be undone.
              </p>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Reset Profile
              </button>
            </div>
          </motion.div>
        )}

        {/* Character Tab */}
        {activeTab === 'character' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <CharacterCreator value={character} onChange={setCharacter} level={4} />

            <p className="text-center text-slate-500 text-sm mt-6">
              Your character gains visual effects as you level up!
            </p>
          </motion.div>
        )}

        {/* Classroom Tab */}
        {activeTab === 'classroom' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ClassroomCustomizer value={classroom} onChange={setClassroom} />

            <p className="text-center text-slate-500 text-sm mt-6">
              Customize your classroom environment!
            </p>
          </motion.div>
        )}
      </main>

      {/* Fixed Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-lg border-t border-slate-800">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleSave}
            className={cn(
              'w-full py-4 rounded-xl font-semibold text-lg transition-all',
              saved
                ? 'bg-emerald-500 text-white'
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
            )}
          >
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
