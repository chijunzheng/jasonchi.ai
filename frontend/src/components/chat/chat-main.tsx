'use client'

import { useEffect, useRef, useState } from 'react'
import { PanelLeft, X, FileSearch, IdCard, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { ChatMessage as ChatMessageType } from '@/types/chat'
import type { ContentCategory } from '@/types/content'
import type { JdContext, JDAnalysis } from '@/types/jd-analysis'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { ChatEmptyState } from './chat-empty-state'
import { ProfileOverview } from './profile-overview'
import { ConfidenceIndicator } from './confidence-indicator'
import { ErrorCard } from './error-card'
import { FollowUpChips } from './follow-up-chips'
import { SessionSummary } from './session-summary'
import { TracePanel } from './trace-panel'
import { EvalComparison } from './eval-comparison'
import { TypingIndicator } from './typing-indicator'
import { trackEvent } from '@/lib/analytics'

interface ChatMainProps {
  readonly messages: readonly ChatMessageType[]
  readonly isLoading: boolean
  readonly loadingStatus?: string | null
  readonly error: string | null
  readonly activeCategory: ContentCategory | null
  readonly onSend: (message: string) => void
  readonly onRetry: () => void
  readonly onToggleSidebar: () => void
  readonly onAnalysisComplete?: (jobDescription: string, analysis: JDAnalysis) => void
  readonly jdContext?: JdContext
  readonly onClearJdContext?: () => void
}

export function ChatMain({
  messages,
  isLoading,
  loadingStatus,
  error,
  activeCategory,
  onSend,
  onRetry,
  onToggleSidebar,
  onAnalysisComplete,
  jdContext,
  onClearJdContext,
}: ChatMainProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [overviewOpen, setOverviewOpen] = useState(false)
  const [isDownloadingTailoredResume, setIsDownloadingTailoredResume] = useState(false)
  const [tailoredResumeError, setTailoredResumeError] = useState<string | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    setTailoredResumeError(null)
  }, [jdContext?.jobDescription])

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

  const handleTailoredResumeDownload = async () => {
    if (!jdContext || isDownloadingTailoredResume) return

    setTailoredResumeError(null)
    setIsDownloadingTailoredResume(true)
    try {
      const response = await fetch('/api/tailored-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: jdContext.jobDescription,
          analysis: jdContext.analysis,
        }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(
          payload?.error ?? 'Failed to generate tailored resume.',
        )
      }

      const contentDisposition = response.headers.get('content-disposition') ?? ''
      const fileNameMatch = contentDisposition.match(/filename=\"?([^"]+)\"?/)
      const fileName = fileNameMatch?.[1]?.trim() || 'jason-chi-tailored-resume.pdf'

      const blob = await response.blob()
      if (!blob.size) {
        throw new Error('Generated resume file was empty. Please retry.')
      }
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = fileName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)

      trackEvent('resume_downloaded', {
        context: 'tailored',
        matchLevel: jdContext.analysis.matchLevel,
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to generate tailored resume.'
      setTailoredResumeError(message)
    } finally {
      setIsDownloadingTailoredResume(false)
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Header bar */}
      <div className="flex h-14 items-center gap-3 border-b px-4">
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
        <div className="ml-auto flex items-center gap-2">
          <Dialog open={overviewOpen} onOpenChange={setOverviewOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="hero-subsurface gap-1.5 rounded-full px-2.5 text-xs font-semibold sm:px-3"
              >
                <IdCard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Profile Overview</span>
                <span className="sm:hidden">Profile</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="top-auto right-0 bottom-0 left-0 max-h-[85vh] w-full translate-x-0 translate-y-0 overflow-y-auto rounded-t-2xl border-x-0 border-b-0 p-4 sm:top-[50%] sm:right-auto sm:bottom-auto sm:left-[50%] sm:max-h-[90vh] sm:max-w-3xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl sm:border">
              <DialogHeader>
                <DialogTitle>Profile Overview</DialogTitle>
                <DialogDescription>
                  Quick snapshot plus direct actions to start the conversation.
                </DialogDescription>
              </DialogHeader>
              <ProfileOverview
                compact
                onQueryChat={(query) => {
                  setOverviewOpen(false)
                  onSend(query)
                }}
                onAnalysisComplete={(jobDescription, analysis) => {
                  setOverviewOpen(false)
                  onAnalysisComplete?.(jobDescription, analysis)
                }}
              />
            </DialogContent>
          </Dialog>
          {jdContext && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="hero-subsurface gap-1.5 rounded-full px-2.5 text-xs font-semibold sm:px-3"
                onClick={handleTailoredResumeDownload}
                disabled={isDownloadingTailoredResume}
              >
                <FileDown className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {isDownloadingTailoredResume
                    ? 'Generating Tailored Resume...'
                    : 'Download Tailored Resume'}
                </span>
                <span className="sm:hidden">
                  {isDownloadingTailoredResume ? 'Generating...' : 'Tailored Resume'}
                </span>
              </Button>
              <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <FileSearch className="h-3 w-3" />
                Tailored to: {jdContext.analysis.matchLevel}
                <button
                  onClick={onClearJdContext}
                  className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
                  aria-label="Clear job description context"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
              {tailoredResumeError && (
                <span className="hidden text-xs text-destructive md:inline">
                  {tailoredResumeError}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto p-4"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <ChatEmptyState
            onSelect={onSend}
            onAnalysisComplete={onAnalysisComplete}
            disabled={isLoading}
          />
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

            {isLoading && Boolean(loadingStatus) && !messages.some((m) => m.role === 'assistant' && !m.content) && (
              <TypingIndicator status={loadingStatus} />
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
