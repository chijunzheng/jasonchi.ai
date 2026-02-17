'use client'

import { useEffect, useRef, useState } from 'react'
import { useChat } from '@/hooks/use-chat'
import { ChatSidebar } from './chat-sidebar'
import { ChatMain } from './chat-main'
import type { JdContext } from '@/types/jd-analysis'
import {
  formatAnalysisMessage,
  getAnalysisFollowUps,
} from '@/lib/format-jd-analysis'

interface ChatSectionProps {
  readonly onBackToHero?: () => void
  readonly jdContext?: JdContext | null
  readonly onClearJdContext?: () => void
  readonly initialQuery?: string | null
  readonly onClearInitialQuery?: () => void
}

export function ChatSection({ onBackToHero, jdContext, onClearJdContext, initialQuery, onClearInitialQuery }: ChatSectionProps) {
  const {
    messages,
    isLoading,
    activeCategory,
    sendMessage,
    injectAssistantMessage,
    selectCategory,
    retry,
    error,
  } = useChat({ jdContext: jdContext ?? undefined })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Send initial query from hero chip clicks.
  // Ref prevents strict mode double-fires.
  const sentQueryRef = useRef<string | null>(null)
  useEffect(() => {
    if (initialQuery && sentQueryRef.current !== initialQuery) {
      sentQueryRef.current = initialQuery
      sendMessage(initialQuery)
      onClearInitialQuery?.()
    }
  }, [initialQuery, sendMessage, onClearInitialQuery])

  // Inject formatted analysis when JD context arrives (no API call needed).
  // sentJdRef prevents strict mode double-fires: on re-run, ref already
  // matches the JD text so the condition fails and no duplicate inject occurs.
  const sentJdRef = useRef<string | null>(null)
  useEffect(() => {
    if (
      jdContext &&
      sentJdRef.current !== jdContext.jobDescription
    ) {
      sentJdRef.current = jdContext.jobDescription
      const markdown = formatAnalysisMessage(jdContext.analysis)
      const followUps = getAnalysisFollowUps(jdContext.analysis)
      injectAssistantMessage(
        markdown,
        followUps,
        'Analyze how my experience matches this job description.',
      )
    }
  }, [jdContext, injectAssistantMessage])

  return (
    <section className="flex h-full">
      <ChatSidebar
        activeCategory={activeCategory}
        onSelectCategory={(category) => {
          selectCategory(category)
          setSidebarOpen(false)
        }}
        disabled={isLoading}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <ChatMain
        messages={messages}
        isLoading={isLoading}
        error={error}
        activeCategory={activeCategory}
        onSend={sendMessage}
        onRetry={retry}
        onToggleSidebar={() => setSidebarOpen(true)}
        onBackToHero={onBackToHero}
        jdContext={jdContext ?? undefined}
        onClearJdContext={onClearJdContext}
      />
    </section>
  )
}
