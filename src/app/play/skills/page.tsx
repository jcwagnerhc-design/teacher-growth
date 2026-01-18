'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Skills page is now the main /play page (classroom)
// This redirect ensures any old links still work
export default function SkillsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/play')
  }, [router])

  return null
}
