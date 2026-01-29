'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Star,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  Heart,
  Presentation,
  BarChart3,
  MessageCircle,
  Target,
  Rocket,
  TrendingUp,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const DEMO_USER_ID = 'demo-user-001'

// The 4 domains of the framework
const DOMAINS = [
  { id: 'planning', name: 'Planning & Prep', icon: ClipboardList, color: 'navyLight' },
  { id: 'environment', name: 'Classroom Culture', icon: Heart, color: 'navy' },
  { id: 'instruction', name: 'Instruction', icon: Presentation, color: 'navyBright' },
  { id: 'assessment', name: 'Assessment', icon: BarChart3, color: 'silver' },
]

interface Reflection {
  id: string
  createdAt: string
  domains: string[]
  skillId: string | null
  skillName: string | null
  primaryResponse: string
  followUpResponse: string | null
  xpEarned: number
}

export default function JournalPage() {
  const router = useRouter()
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [collapsedDomains, setCollapsedDomains] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchReflections = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        userId: DEMO_USER_ID,
        limit: '100', // Fetch more since we're grouping
      })

      const response = await fetch(`/api/reflections?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data = await response.json()
      setReflections(data.reflections)
    } catch (err) {
      console.error('Failed to fetch reflections:', err)
    }
  }, [])

  useEffect(() => {
    setIsLoading(true)
    fetchReflections().finally(() => setIsLoading(false))
  }, [fetchReflections])

  // Group reflections by domain
  const reflectionsByDomain = useMemo(() => {
    const grouped: Record<string, Reflection[]> = {
      planning: [],
      environment: [],
      instruction: [],
      assessment: [],
    }

    reflections.forEach(r => {
      const primaryDomain = r.domains[0] || 'instruction'
      if (grouped[primaryDomain]) {
        grouped[primaryDomain].push(r)
      } else {
        grouped.instruction.push(r)
      }
    })

    return grouped
  }, [reflections])

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/reflections?id=${id}&userId=${DEMO_USER_ID}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setReflections(prev => prev.filter(r => r.id !== id))
        setExpandedId(null)
      }
    } catch (err) {
      console.error('Failed to delete:', err)
    } finally {
      setIsDeleting(false)
      setDeleteConfirm(null)
    }
  }

  const toggleDomain = (domainId: string) => {
    setCollapsedDomains(prev => {
      const next = new Set(prev)
      if (next.has(domainId)) {
        next.delete(domainId)
      } else {
        next.add(domainId)
      }
      return next
    })
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      navyLight: { bg: 'bg-[#2d5a87]', text: 'text-[#7db4e0]', border: 'border-[#4a7ba8]' },
      navy: { bg: 'bg-[#1e3a5f]', text: 'text-[#6ba3d6]', border: 'border-[#3d5a7f]' },
      navyBright: { bg: 'bg-[#4a7ba8]', text: 'text-[#a0c4e8]', border: 'border-[#6ba3d6]' },
      silver: { bg: 'bg-[#6b7280]', text: 'text-[#c0c0c0]', border: 'border-[#9ca3af]' },
    }
    return colors[color] || colors.navy
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const dateOnly = date.toISOString().split('T')[0]
    if (dateOnly === today.toISOString().split('T')[0]) return 'Today'
    if (dateOnly === yesterday.toISOString().split('T')[0]) return 'Yesterday'

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f2744] to-[#0a1628] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0a1628] border-b-4 border-[#2d4a6f] p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-black flex items-center gap-2 uppercase tracking-wider">
            <BookOpen className="w-5 h-5 text-[#7db4e0]" />
            Journal
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Star className="w-8 h-8 text-[#7db4e0]" />
            </motion.div>
            <p className="text-slate-500 mt-4 text-sm">Loading...</p>
          </div>
        ) : reflections.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">No reflections yet.</p>
            <button
              onClick={() => router.push('/play/reflect')}
              className="px-6 py-3 bg-[#2d5a87] text-white font-bold border-4 border-[#4a7ba8]"
              style={{ boxShadow: '4px 4px 0 #0a1628' }}
            >
              Start Reflecting
            </button>
          </div>
        ) : (
          <>
            {DOMAINS.map(domain => {
              const domainReflections = reflectionsByDomain[domain.id]
              const colors = getColorClasses(domain.color)
              const isCollapsed = collapsedDomains.has(domain.id)
              const Icon = domain.icon

              return (
                <div key={domain.id}>
                  {/* Domain Header */}
                  <button
                    onClick={() => toggleDomain(domain.id)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 border-4',
                      colors.border,
                      colors.bg
                    )}
                    style={{ boxShadow: '3px 3px 0 #0a1628' }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-white" />
                      <span className="font-black uppercase tracking-wide">{domain.name}</span>
                      <span className="text-white/60 text-sm font-bold">
                        ({domainReflections.length})
                      </span>
                    </div>
                    <ChevronDown className={cn('w-5 h-5 transition-transform', isCollapsed && '-rotate-90')} />
                  </button>

                  {/* Domain Reflections */}
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        {domainReflections.length === 0 ? (
                          <div className="p-4 bg-[#0a1628]/50 border-x-4 border-b-4 border-[#1e3a5f] text-center">
                            <p className="text-slate-600 text-sm">No reflections in this domain yet</p>
                          </div>
                        ) : (
                          <div className="border-x-4 border-b-4 border-[#1e3a5f] divide-y-2 divide-[#1e3a5f]">
                            {domainReflections.map((reflection) => {
                              const isExpanded = expandedId === reflection.id

                              return (
                                <div key={reflection.id} className="bg-[#0f2744]">
                                  {/* Collapsed Row */}
                                  <button
                                    onClick={() => setExpandedId(isExpanded ? null : reflection.id)}
                                    className="w-full p-3 text-left flex items-center gap-3 hover:bg-[#1e3a5f]/30 transition-colors"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-slate-300 line-clamp-1">
                                        {reflection.primaryResponse}
                                      </p>
                                    </div>
                                    <div className="text-right shrink-0 flex items-center gap-2">
                                      <div>
                                        <p className="text-[10px] text-slate-500">{formatDate(reflection.createdAt)}</p>
                                        <p className="text-xs text-[#c0c0c0] font-bold">+{reflection.xpEarned}</p>
                                      </div>
                                      <ChevronRight className={cn('w-4 h-4 text-slate-600 transition-transform', isExpanded && 'rotate-90')} />
                                    </div>
                                  </button>

                                  {/* Expanded Content */}
                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="px-3 pb-3 space-y-3">
                                          <div className="h-px bg-[#2d4a6f]" />

                                          <div className="bg-[#1e3a5f]/50 p-3 border-2 border-[#2d4a6f]">
                                            <p className="text-sm text-slate-300">{reflection.primaryResponse}</p>
                                          </div>

                                          {reflection.followUpResponse && (
                                            <div className="bg-[#1e3a5f]/30 p-3 border-2 border-[#2d4a6f]">
                                              <p className="text-[10px] text-[#7db4e0] uppercase tracking-wide font-bold mb-1">Reflection</p>
                                              <p className="text-sm text-slate-400">{reflection.followUpResponse}</p>
                                            </div>
                                          )}

                                          <div className="flex items-center justify-between text-xs text-slate-500">
                                            <div className="flex items-center gap-2">
                                              <Calendar className="w-3 h-3" />
                                              <span>
                                                {new Date(reflection.createdAt).toLocaleDateString('en-US', {
                                                  weekday: 'short',
                                                  month: 'short',
                                                  day: 'numeric'
                                                })}
                                              </span>
                                              {reflection.skillName && (
                                                <>
                                                  <span className="text-slate-600">•</span>
                                                  <span className={colors.text}>{reflection.skillName}</span>
                                                </>
                                              )}
                                            </div>

                                            {/* Delete */}
                                            {deleteConfirm === reflection.id ? (
                                              <div className="flex items-center gap-2">
                                                <span className="text-red-400 text-[10px]">Delete?</span>
                                                <button
                                                  onClick={() => handleDelete(reflection.id)}
                                                  disabled={isDeleting}
                                                  className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold border-2 border-red-400"
                                                >
                                                  {isDeleting ? '...' : 'Yes'}
                                                </button>
                                                <button
                                                  onClick={() => setDeleteConfirm(null)}
                                                  className="px-2 py-1 bg-slate-700 text-white text-[10px] font-bold border-2 border-slate-600"
                                                >
                                                  No
                                                </button>
                                              </div>
                                            ) : (
                                              <button
                                                onClick={() => setDeleteConfirm(reflection.id)}
                                                className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a1628] border-t-4 border-[#2d4a6f] z-30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            <button onClick={() => router.push('/play')} className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-[#7db4e0] transition-colors p-2">
              <Rocket className="w-5 h-5" />
              <span className="text-[10px] font-bold">Base</span>
            </button>
            <button onClick={() => router.push('/play/reflect')} className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-[#a0c4e8] transition-colors p-2">
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px] font-bold">Log</span>
            </button>
            <button onClick={() => router.push('/play/coach')} className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-[#c0c0c0] transition-colors p-2">
              <MessageCircle className="w-5 h-5" />
              <span className="text-[10px] font-bold">Coach</span>
            </button>
            <button onClick={() => router.push('/play/goals')} className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-[#7db4e0] transition-colors p-2">
              <Target className="w-5 h-5" />
              <span className="text-[10px] font-bold">Goals</span>
            </button>
            <button onClick={() => router.push('/play/progress')} className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-[#6ba3d6] transition-colors p-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-[10px] font-bold">Progress</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}
