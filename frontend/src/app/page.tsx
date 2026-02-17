'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { HeroSection } from '@/components/hero/hero-section'
import { ChatSection } from '@/components/chat/chat-section'
import type { JdContext, JDAnalysis } from '@/types/jd-analysis'

type View = 'hero' | 'chat'

export default function Home() {
  const [view, setView] = useState<View>('hero')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [jdContext, setJdContext] = useState<JdContext | null>(null)
  const [initialQuery, setInitialQuery] = useState<string | null>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<View>('hero')
  const isTransitioningRef = useRef(false)
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Handle deep-link to #chat after hydration, then enable transitions
  useEffect(() => {
    if (window.location.hash === '#chat') {
      viewRef.current = 'chat'
      setView('chat')
    }
    requestAnimationFrame(() => setMounted(true))
  }, [])

  const clearTransitionLock = useCallback(() => {
    if (transitionTimer.current) {
      clearTimeout(transitionTimer.current)
      transitionTimer.current = null
    }
    isTransitioningRef.current = false
    setIsTransitioning(false)
  }, [])

  const navigateTo = useCallback((target: View, skipPush = false) => {
    if (isTransitioningRef.current || target === viewRef.current) return
    // Update refs synchronously to prevent stale-closure double-fires
    isTransitioningRef.current = true
    viewRef.current = target
    setIsTransitioning(true)
    setView(target)
    // Safety timeout: clear lock if transitionend never fires
    if (transitionTimer.current) clearTimeout(transitionTimer.current)
    transitionTimer.current = setTimeout(clearTransitionLock, 800)
    if (!skipPush) {
      const hash = target === 'chat' ? '#chat' : ''
      if (window.location.hash !== hash) {
        history.pushState(null, '', hash || window.location.pathname)
      }
    }
  }, [clearTransitionLock])

  // Sync browser back/forward with view state through navigateTo
  useEffect(() => {
    const handlePopState = () => {
      const next = window.location.hash === '#chat' ? 'chat' : 'hero'
      navigateTo(next, true)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [navigateTo])

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (
        e.propertyName === 'transform' &&
        e.currentTarget === e.target
      ) {
        clearTransitionLock()
      }
    },
    [clearTransitionLock],
  )

  const handleQueryChat = useCallback(
    (query: string) => {
      setInitialQuery(query)
      navigateTo('chat')
    },
    [navigateTo],
  )

  const handleAnalysisComplete = useCallback(
    (jobDescription: string, analysis: JDAnalysis) => {
      setJdContext({ jobDescription, analysis })
      navigateTo('chat')
    },
    [navigateTo],
  )

  const isChat = view === 'chat'
  const transitionClass = mounted
    ? 'transition-transform duration-700 ease-in-out'
    : ''

  return (
    <div className="relative h-dvh overflow-hidden">
      {/* Hero panel */}
      <div
        ref={heroRef}
        className={`absolute inset-0 overflow-hidden ${transitionClass} ${
          isChat ? '-translate-y-full' : 'translate-y-0'
        }`}
        onTransitionEnd={handleTransitionEnd}
      >
        <HeroSection
          onEnterChat={() => navigateTo('chat')}
          onQueryChat={handleQueryChat}
          onAnalysisComplete={handleAnalysisComplete}
        />
      </div>

      {/* Chat panel */}
      <div
        className={`absolute inset-0 ${transitionClass} ${
          isChat ? 'translate-y-0' : 'translate-y-full'
        }`}
        onTransitionEnd={handleTransitionEnd}
      >
        <ChatSection
          onBackToHero={() => navigateTo('hero')}
          jdContext={jdContext}
          onClearJdContext={() => setJdContext(null)}
          initialQuery={initialQuery}
          onClearInitialQuery={() => setInitialQuery(null)}
        />
      </div>
    </div>
  )
}
