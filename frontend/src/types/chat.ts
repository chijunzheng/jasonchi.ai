import type { ContentCategory } from './content'
import type { TraceData, EvalComparisonData } from '@/lib/sse-client'

export interface ChatMessage {
  readonly id: string
  readonly role: 'user' | 'assistant'
  readonly content: string
  readonly category?: ContentCategory
  readonly timestamp: number
  readonly followUps?: readonly string[]
  readonly isTyping?: boolean
  readonly synthetic?: boolean
  readonly trace?: TraceData
  readonly eval?: EvalComparisonData
}

export interface ChatState {
  readonly messages: readonly ChatMessage[]
  readonly isLoading: boolean
  readonly activeCategory: ContentCategory | null
}
