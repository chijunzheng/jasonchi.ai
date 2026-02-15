export type ContentCategory =
  | 'work-experience'
  | 'projects'
  | 'skills'
  | 'education'
  | 'honest-section'
  | 'meta'

export interface ContentEntry {
  readonly title: string
  readonly category: ContentCategory
  readonly content: string
  readonly frontmatter: Readonly<Record<string, unknown>>
  readonly sections: readonly ContentSection[]
}

export interface ContentSection {
  readonly heading: string
  readonly level: number
  readonly content: string
}

export interface SearchResult {
  readonly entry: ContentEntry
  readonly section: ContentSection
  readonly relevance: number
  readonly snippet: string
}
