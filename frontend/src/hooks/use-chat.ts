'use client'

import { useCallback, useState } from 'react'
import type { ContentCategory } from '@/types/content'
import type { ChatMessage } from '@/types/chat'
import type { JdContext } from '@/types/jd-analysis'
import { streamSSE, type TraceData, type EvalComparisonData } from '@/lib/sse-client'
import { getMockResponse } from '@/lib/mock-responses'

const MAX_HISTORY_MESSAGES = 10
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_CHAT === 'true'

const QUERY_CATEGORY_HINTS: Record<string, ContentCategory> = {
  'tell me about your work experience': 'work-experience',
  'tell me about your projects': 'projects',
  'tell me about your skills': 'skills',
  'tell me about your education': 'education',
  'tell me about your ai engineer role at telus': 'work-experience',
  'tell me about your ran engineer role at telus': 'work-experience',
  'how did your side project turn into a production mandate?': 'work-experience',
  'tell me about leading and mentoring your team': 'work-experience',
  'tell me about the showme hackathon project': 'projects',
  "tell me about your master's thesis": 'education',
}

function inferCategoryFromQuery(query: string): ContentCategory | null {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, ' ')
  return QUERY_CATEGORY_HINTS[normalized] ?? null
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

interface UseChatOptions {
  readonly jdContext?: JdContext
}

export function useChat({ jdContext }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<readonly ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] =
    useState<ContentCategory | null>(null)

  const addMockResponse = useCallback(
    (category: ContentCategory | null) => {
      const { content, followUps } = getMockResponse(category)
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: createId(),
          role: 'assistant',
          content,
          category: category ?? undefined,
          timestamp: Date.now(),
          followUps,
        }
        setMessages((prev) => [...prev, assistantMessage])
        setIsLoading(false)
        setLoadingStatus(null)
      }, 800)
    },
    [],
  )

  const streamResponse = useCallback(
    async (
      userContent: string,
      history: readonly ChatMessage[],
      category: ContentCategory | null,
    ) => {
      const assistantId = createId()
      let fullContent = ''
      let followUps: readonly string[] = []

      try {
        const conversationHistory = history
          .filter((m) => !m.synthetic)
          .slice(-MAX_HISTORY_MESSAGES)
          .map((m) => ({
            role: m.role,
            content: m.content,
          }))

        const requestBody: Record<string, unknown> = {
          message: userContent,
          conversationHistory,
          category: category ?? undefined,
        }
        if (jdContext?.jobDescription) {
          requestBody.jobDescription = jdContext.jobDescription
        }

        for await (const event of streamSSE('/api/chat', requestBody)) {
          switch (event.type) {
            case 'status':
              setLoadingStatus((event.content as string) || 'Thinking...')
              break

            case 'text':
              if (fullContent.length === 0) {
                setLoadingStatus(null)
              }
              fullContent += event.content as string
              setMessages((prev) => {
                const existing = prev.find((m) => m.id === assistantId)
                if (existing) {
                  return prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: fullContent }
                      : m,
                  )
                }
                return [
                  ...prev,
                  {
                    id: assistantId,
                    role: 'assistant' as const,
                    content: fullContent,
                    category: category ?? undefined,
                    timestamp: Date.now(),
                  },
                ]
              })
              break

            case 'followUps':
              followUps = event.content as readonly string[]
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, followUps } : m,
                ),
              )
              break

            case 'trace':
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, trace: event.content as TraceData }
                    : m,
                ),
              )
              break

            case 'eval':
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, eval: event.content as EvalComparisonData }
                    : m,
                ),
              )
              break

            case 'error':
              throw new Error(event.content as string)

            case 'done':
              setLoadingStatus(null)
              break
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Something went wrong'
        setError(errorMessage)

        // If no content was streamed, remove the empty assistant message
        if (!fullContent) {
          setMessages((prev) => prev.filter((m) => m.id !== assistantId))
        }
      } finally {
        setIsLoading(false)
        setLoadingStatus(null)
      }
    },
    [jdContext?.jobDescription],
  )

  const sendMessage = useCallback(
    (content: string) => {
      if (isLoading) return

      setError(null)
      setLoadingStatus('Understanding your question...')
      const inferredCategory = activeCategory ?? inferCategoryFromQuery(content)
      if (!activeCategory && inferredCategory) {
        setActiveCategory(inferredCategory)
      }

      const userMessage: ChatMessage = {
        id: createId(),
        role: 'user',
        content,
        category: inferredCategory ?? undefined,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      if (USE_MOCK) {
        addMockResponse(inferredCategory)
      } else {
        streamResponse(content, [...messages, userMessage], inferredCategory)
      }
    },
    [isLoading, messages, activeCategory, addMockResponse, streamResponse],
  )

  const selectCategory = useCallback(
    (category: ContentCategory) => {
      if (isLoading) return

      setActiveCategory(category)
      setError(null)
      setLoadingStatus('Understanding your question...')
      const categoryPrompt =
        category === 'projects'
          ? 'Tell me about your projects and include GitHub links beside each project name. For Telus AI Agent, include both the public POC repo and internal production repo (confidential/NDA).'
          : `Tell me about your ${category.replace(/-/g, ' ')}`

      const userMessage: ChatMessage = {
        id: createId(),
        role: 'user',
        content: categoryPrompt,
        category,
        timestamp: Date.now(),
      }

      const updated = [...messages, userMessage]
      setMessages(updated)
      setIsLoading(true)

      if (USE_MOCK) {
        addMockResponse(category)
      } else {
        streamResponse(
          categoryPrompt,
          updated,
          category,
        )
      }
    },
    [isLoading, messages, addMockResponse, streamResponse],
  )

  const injectAssistantMessage = useCallback(
    (
      content: string,
      followUps?: readonly string[],
      userPrompt?: string,
    ) => {
      const newMessages: ChatMessage[] = []

      if (userPrompt) {
        newMessages.push({
          id: createId(),
          role: 'user',
          content: userPrompt,
          timestamp: Date.now(),
          synthetic: true,
        })
      }

      newMessages.push({
        id: createId(),
        role: 'assistant',
        content,
        timestamp: Date.now(),
        followUps,
        synthetic: true,
      })

      setMessages((prev) => [...prev, ...newMessages])
    },
    [],
  )

  const retry = useCallback(() => {
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'user')
    if (lastUserMessage) {
      setError(null)
      setIsLoading(true)
      setLoadingStatus('Understanding your question...')

      if (USE_MOCK) {
        addMockResponse(activeCategory)
      } else {
        streamResponse(lastUserMessage.content, messages, activeCategory)
      }
    }
  }, [messages, activeCategory, addMockResponse, streamResponse])

  return {
    messages,
    isLoading,
    loadingStatus,
    activeCategory,
    sendMessage,
    injectAssistantMessage,
    selectCategory,
    retry,
    error,
  }
}
