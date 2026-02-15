export type { ContentCategory, ContentEntry, ContentSection, SearchResult } from './content'
export type { ChatMessage, ChatState } from './chat'

export interface JDAnalysis {
  readonly score: number
  readonly strengths: readonly string[]
  readonly gaps: readonly string[]
  readonly suggestions: readonly string[]
  readonly coverLetterAvailable: boolean
}
