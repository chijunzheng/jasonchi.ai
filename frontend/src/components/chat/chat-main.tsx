'use client'

import { useEffect, useRef } from 'react'
import { ArrowLeft, PanelLeft, X, FileSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ChatMessage as ChatMessageType } from '@/types/chat'
import type { ContentCategory } from '@/types/content'
import type { JdContext } from '@/types/jd-analysis'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { ChatEmptyState } from './chat-empty-state'
import { ConfidenceIndicator } from './confidence-indicator'
import { ErrorCard } from './error-card'
import { FollowUpChips } from './follow-up-chips'
import { SessionSummary } from './session-summary'
import { TracePanel } from './trace-panel'
import { EvalComparison } from './eval-comparison'
import { TypingIndicator } from './typing-indicator'

interface ChatMainProps {
  readonly messages: readonly ChatMessageType[]
  readonly isLoading: boolean
  readonly error: string | null
  readonly activeCategory: ContentCategory | null
  readonly onSend: (message: string) => void
  readonly onRetry: () => void
  readonly onToggleSidebar: () => void
  readonly onBackToHero?: () => void
  readonly jdContext?: JdContext
  readonly onClearJdContext?: () => void
}

export function ChatMain({
  messages,
  isLoading,
  error,
  activeCategory,
  onSend,
  onRetry,
  onToggleSidebar,
  onBackToHero,
  jdContext,
  onClearJdContext,
}: ChatMainProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const lastAssistantMessage = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant')
  const showFollowUps =
    !isLoading &&
    !error &&
    lastAssistantMessage?.followUps &&
    lastAssistantMessage.followUps.length > 0

  const categoryLabel = activeCategory
    ? activeCategory.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Chat'

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Header bar */}
      <div className="flex h-14 items-center gap-3 border-b px-4">
        {onBackToHero && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={onBackToHero}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 lg:hidden"
          onClick={onToggleSidebar}
        >
          <PanelLeft className="h-4 w-4" />
          <span className="sr-only">Open sidebar</span>
        </Button>
        <h2 className="text-sm font-semibold">{categoryLabel}</h2>
        {jdContext && (
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <FileSearch className="h-3 w-3" />
            Tailored to: {jdContext.analysis.matchLevel}
            <button
              onClick={onClearJdContext}
              className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
              aria-label="Clear JD context"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto p-4"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <ChatEmptyState onSelect={onSend} disabled={isLoading} />
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {messages.map((message, index) => (
              <div key={message.id} className="space-y-1">
                <ChatMessage
                  message={message}
                  isStreaming={
                    isLoading &&
                    message.role === 'assistant' &&
                    index === messages.length - 1
                  }
                />
                {message.role === 'assistant' && (
                  <>
                    <ConfidenceIndicator category={message.category} />
                    {message.trace && <TracePanel trace={message.trace} />}
                    {message.eval && <EvalComparison data={message.eval} />}
                  </>
                )}
              </div>
            ))}

            {isLoading && !messages.some((m) => m.role === 'assistant' && !m.content) && (
              <TypingIndicator />
            )}

            {error && <ErrorCard message={error} onRetry={onRetry} />}

            {showFollowUps && (
              <FollowUpChips
                chips={lastAssistantMessage.followUps!}
                onSelect={onSend}
                disabled={isLoading}
              />
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Session Summary */}
      {messages.length > 0 && (
        <div className="mx-auto w-full max-w-2xl px-4">
          <SessionSummary messages={messages} />
        </div>
      )}

      {/* Chat input */}
      <div className="border-t p-4">
        <div className="mx-auto max-w-2xl">
          <ChatInput onSend={onSend} disabled={isLoading} />
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            Powered by Gemini + LangGraph
          </p>
        </div>
      </div>
    </div>
  )
}
