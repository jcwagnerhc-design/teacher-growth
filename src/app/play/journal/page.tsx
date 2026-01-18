'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Filter,
  TrendingUp,
  Lightbulb,
  Clock,
  Star,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  ClipboardList,
  Heart,
  Presentation,
  BarChart3,
  Sparkles,
  Target,
  Award,
  Rocket,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Demo user ID for development - in production this would come from auth
const DEMO_USER_ID = 'demo-user-001'
const PAGE_SIZE = 20

// Domain configuration
const DOMAINS = [
  { id: 'planning', name: 'Teacher Desk', icon: ClipboardList, color: 'emerald' },
  { id: 'environment', name: 'Class Community', icon: Heart, color: 'rose' },
  { id: 'instruction', name: 'Teaching Space', icon: Presentation, color: 'violet' },
  { id: 'assessment', name: 'Student Work', icon: Star, color: 'amber' },
]

interface Reflection {
  id: string
  createdAt: string
  domains: string[]
  primaryResponse: string
  followUpResponse: string | null
  xpEarned: number
  xpByDomain: Record<string, number> | null
  prompt: string | null
}

// Calculate insights from reflections
function calculateInsights(reflections: Reflection[]) {
  const domainCounts: Record<string, number> = {}
  const recentDomains: string[] = []

  reflections.forEach((r, i) => {
    // Count domains - each reflection can have multiple domains
    r.domains.forEach(domain => {
      domainCounts[domain] = (domainCounts[domain] || 0) + 1
    })
    // Track recent domains for focus detection
    if (i < 5 && r.domains.length > 0) {
      recentDomains.push(r.domains[0])
    }
  })

  // Find most reflected domain
  const topDomain = Object.entries(domainCounts).sort((a, b) => b[1] - a[1])[0]

  // Find least reflected domain
  const allDomains = ['planning', 'environment', 'instruction', 'assessment']
  const leastDomain = allDomains.find(d => !domainCounts[d]) ||
    Object.entries(domainCounts).sort((a, b) => a[1] - b[1])[0]?.[0]

  // Check for patterns in recent reflections
  const recentDomainCounts: Record<string, number> = {}
  recentDomains.forEach(d => {
    recentDomainCounts[d] = (recentDomainCounts[d] || 0) + 1
  })
  const focusedDomain = Object.entries(recentDomainCounts).find(([_, count]) => count >= 3)

  return {
    totalReflections: reflections.length,
    topDomain: topDomain ? { id: topDomain[0], count: topDomain[1] } : null,
    leastDomain: leastDomain ? { id: leastDomain, count: domainCounts[leastDomain] || 0 } : null,
    focusedDomain,
    totalXp: reflections.reduce((sum, r) => sum + r.xpEarned, 0),
  }
}

export default function JournalPage() {
  const router = useRouter()
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [filterDomain, setFilterDomain] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showInsights, setShowInsights] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Fetch reflections from API
  const fetchReflections = useCallback(async (domain: string | null, currentOffset: number, append: boolean = false) => {
    try {
      const params = new URLSearchParams({
        userId: DEMO_USER_ID,
        limit: PAGE_SIZE.toString(),
        offset: currentOffset.toString(),
      })
      if (domain) {
        params.set('domain', domain)
      }

      const response = await fetch(`/api/reflections?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch reflections')
      }

      const data = await response.json()

      if (append) {
        setReflections(prev => [...prev, ...data.reflections])
      } else {
        setReflections(data.reflections)
      }

      setHasMore(data.pagination.hasMore)
      setOffset(currentOffset + data.reflections.length)
    } catch (err) {
      console.error('Failed to fetch reflections:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch reflections')
    }
  }, [])

  // Initial load and filter changes
  useEffect(() => {
    setIsLoading(true)
    setOffset(0)
    fetchReflections(filterDomain, 0).finally(() => setIsLoading(false))
  }, [filterDomain, fetchReflections])

  // Load more handler
  const handleLoadMore = async () => {
    setIsLoadingMore(true)
    await fetchReflections(filterDomain, offset, true)
    setIsLoadingMore(false)
  }

  const insights = calculateInsights(reflections)

  const getDomainConfig = (domainId: string) => {
    return DOMAINS.find(d => d.id === domainId) || DOMAINS[0]
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      emerald: { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-400' },
      rose: { bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-400' },
      violet: { bg: 'bg-violet-500', text: 'text-violet-400', border: 'border-violet-400' },
      amber: { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-400' },
    }
    return colors[color] || colors.emerald
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const dateOnly = date.toISOString().split('T')[0]
    if (dateOnly === today.toISOString().split('T')[0]) return 'Today'
    if (dateOnly === yesterday.toISOString().split('T')[0]) return 'Yesterday'

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Get primary domain for a reflection
  const getPrimaryDomain = (reflection: Reflection) => {
    return reflection.domains[0] || 'instruction'
  }

  // Get domain label for display
  const getDomainLabel = (reflection: Reflection) => {
    if (reflection.domains.length === 0) return 'Daily Moment'
    if (reflection.domains.length === 1) {
      const domain = getDomainConfig(reflection.domains[0])
      return domain.name
    }
    return `${reflection.domains.length} domains`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-400" />
            Reflective Journal
          </h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
            <BookOpen className="w-6 h-6 text-violet-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{insights.totalReflections}</p>
            <p className="text-xs text-slate-400">Reflections</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
            <Target className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{insights.totalXp}</p>
            <p className="text-xs text-slate-400">Total XP</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
            <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{Object.keys(DOMAINS).length}</p>
            <p className="text-xs text-slate-400">Domains</p>
          </div>
        </motion.div>

        {/* Insights Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={() => setShowInsights(!showInsights)}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-violet-400" />
              <span className="font-semibold">Patterns & Insights</span>
            </div>
            <ChevronDown className={cn('w-5 h-5 transition-transform', showInsights && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {showInsights && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-3 bg-slate-900/30 border-x border-b border-slate-800 rounded-b-xl">
                  {insights.topDomain && (
                    <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <div className={cn('p-2 rounded-lg', getColorClasses(getDomainConfig(insights.topDomain.id).color).bg)}>
                        {(() => {
                          const Icon = getDomainConfig(insights.topDomain.id).icon
                          return <Icon className="w-4 h-4 text-white" />
                        })()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Your Focus Area</p>
                        <p className="text-xs text-slate-400">
                          You&apos;ve reflected on <span className={getColorClasses(getDomainConfig(insights.topDomain.id).color).text}>{getDomainConfig(insights.topDomain.id).name}</span> {insights.topDomain.count} times - that&apos;s your strength!
                        </p>
                      </div>
                    </div>
                  )}

                  {insights.leastDomain && insights.leastDomain.count < 2 && (
                    <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <div className="p-2 rounded-lg bg-slate-700">
                        <Target className="w-4 h-4 text-slate-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Growth Opportunity</p>
                        <p className="text-xs text-slate-400">
                          Consider reflecting more on <span className={getColorClasses(getDomainConfig(insights.leastDomain.id).color).text}>{getDomainConfig(insights.leastDomain.id).name}</span> - you&apos;ve only logged {insights.leastDomain.count} reflection{insights.leastDomain.count !== 1 ? 's' : ''} there.
                        </p>
                      </div>
                    </div>
                  )}

                  {insights.focusedDomain && (
                    <div className="flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                      <div className="p-2 rounded-lg bg-emerald-500">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-emerald-400">Current Focus</p>
                        <p className="text-xs text-slate-400">
                          Your last few reflections have centered on {getDomainConfig(insights.focusedDomain[0]).name}. Intentional practice like this drives real growth.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Filter Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 flex-wrap"
        >
          <button
            onClick={() => setFilterDomain(null)}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
              !filterDomain
                ? 'bg-white text-slate-900'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            )}
          >
            <Filter className="w-4 h-4" />
            All
          </button>
          {DOMAINS.map(domain => {
            const colors = getColorClasses(domain.color)
            return (
              <button
                key={domain.id}
                onClick={() => setFilterDomain(filterDomain === domain.id ? null : domain.id)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                  filterDomain === domain.id
                    ? `${colors.bg} text-white`
                    : `bg-slate-800 ${colors.text} hover:bg-slate-700`
                )}
              >
                <domain.icon className="w-4 h-4" />
                {domain.name}
              </button>
            )
          })}
        </motion.div>

        {/* Reflections List */}
        <div className="space-y-3">
          {filteredReflections.map((reflection, i) => {
            const domain = getDomainConfig(reflection.domain)
            const colors = getColorClasses(domain.color)
            const isExpanded = expandedId === reflection.id

            return (
              <motion.div
                key={reflection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className={cn(
                  'bg-slate-900/50 border rounded-xl overflow-hidden transition-all',
                  isExpanded ? colors.border : 'border-slate-800'
                )}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : reflection.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('p-2 rounded-lg', colors.bg)}>
                      <domain.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{reflection.skill}</span>
                        {reflection.imageUrl && (
                          <ImageIcon className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-2">
                        {reflection.primaryResponse}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-500 mb-1">{formatDate(reflection.date)}</p>
                      <p className="text-xs text-amber-400">+{reflection.xpEarned} XP</p>
                    </div>
                    <ChevronRight className={cn('w-5 h-5 text-slate-500 transition-transform', isExpanded && 'rotate-90')} />
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-4">
                        <div className="h-px bg-slate-800" />

                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">What happened</p>
                          <p className="text-sm text-slate-300">{reflection.primaryResponse}</p>
                        </div>

                        {reflection.followUpResponse && (
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Your reflection</p>
                            <p className="text-sm text-slate-300">{reflection.followUpResponse}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(reflection.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                          <span className={cn('flex items-center gap-1', colors.text)}>
                            <domain.icon className="w-3 h-3" />
                            {domain.name}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}

          {filteredReflections.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500">No reflections in this area yet.</p>
              <button
                onClick={() => router.push('/play/reflect')}
                className="mt-4 px-4 py-2 bg-violet-500 text-white rounded-lg font-medium hover:bg-violet-400 transition-colors"
              >
                Start Reflecting
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800 z-30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <button onClick={() => router.push('/play')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors">
              <Rocket className="w-6 h-6" />
              <span className="text-xs">Base</span>
            </button>
            <button onClick={() => router.push('/play/reflect')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-violet-400 transition-colors">
              <BookOpen className="w-6 h-6" />
              <span className="text-xs">Log</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-white">
              <Sparkles className="w-6 h-6" />
              <span className="text-xs font-bold">Journal</span>
            </button>
            <button onClick={() => router.push('/play/profile')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors">
              <Award className="w-6 h-6" />
              <span className="text-xs">Rank</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}
