import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type {
  ContentCategory,
  ContentEntry,
  ContentSection,
  SearchResult,
} from '@/types/content'

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content')

function parseSections(content: string): readonly ContentSection[] {
  const lines = content.split('\n')
  const sections: ContentSection[] = []
  let currentSection: ContentSection | null = null
  const contentLines: string[] = []

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/)

    if (headingMatch) {
      if (currentSection) {
        sections.push({
          ...currentSection,
          content: contentLines.join('\n').trim(),
        })
        contentLines.length = 0
      }
      currentSection = {
        heading: headingMatch[2],
        level: headingMatch[1].length,
        content: '',
      }
    } else if (currentSection) {
      contentLines.push(line)
    }
  }

  if (currentSection) {
    sections.push({
      ...currentSection,
      content: contentLines.join('\n').trim(),
    })
  }

  return sections
}

function readMarkdownFile(
  filePath: string,
  category: ContentCategory,
): ContentEntry | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { data: frontmatter, content } = matter(raw)
    const sections = parseSections(content)

    return {
      title: (frontmatter.title as string) ?? category,
      category,
      content,
      frontmatter,
      sections,
    }
  } catch {
    return null
  }
}

export function loadContent(category: ContentCategory): ContentEntry[] {
  const filePath = path.join(CONTENT_DIR, `${category}.md`)
  const entry = readMarkdownFile(filePath, category)
  return entry ? [entry] : []
}

export function loadAllContent(): Record<ContentCategory, ContentEntry[]> {
  const categories: ContentCategory[] = [
    'work-experience',
    'projects',
    'skills',
    'education',
    'honest-section',
    'meta',
  ]

  const result = {} as Record<ContentCategory, ContentEntry[]>
  for (const category of categories) {
    result[category] = loadContent(category)
  }
  return result
}

export function searchContent(query: string): SearchResult[] {
  const allContent = loadAllContent()
  const queryLower = query.toLowerCase()
  const keywords = queryLower.split(/\s+/).filter((k) => k.length > 2)
  const results: SearchResult[] = []

  for (const entries of Object.values(allContent)) {
    for (const entry of entries) {
      for (const section of entry.sections) {
        const text = `${section.heading} ${section.content}`.toLowerCase()
        const matchCount = keywords.filter((kw) => text.includes(kw)).length

        if (matchCount > 0) {
          const relevance = matchCount / keywords.length
          const snippetStart = Math.max(
            0,
            text.indexOf(keywords[0]) - 50,
          )
          const snippet = section.content.slice(snippetStart, snippetStart + 200)

          results.push({ entry, section, relevance, snippet })
        }
      }
    }
  }

  return results.sort((a, b) => b.relevance - a.relevance)
}

export function getContentForPrompt(category: ContentCategory): string {
  const entries = loadContent(category)
  if (entries.length === 0) return ''

  return entries
    .map((entry) => {
      const header = `=== ${entry.title.toUpperCase()} ===`
      const sectionText = entry.sections
        .map((s) => `[${s.heading}]\n${s.content}`)
        .join('\n\n')
      return `${header}\n\n${sectionText}`
    })
    .join('\n\n---\n\n')
}

export function getAllContentForPrompt(): string {
  const allContent = loadAllContent()
  return Object.entries(allContent)
    .filter(([, entries]) => entries.length > 0)
    .map(([category, entries]) => {
      const header = `=== ${category.toUpperCase().replace(/-/g, ' ')} ===`
      const entryText = entries
        .map((entry) =>
          entry.sections
            .map((s) => `[${s.heading}]\n${s.content}`)
            .join('\n\n'),
        )
        .join('\n\n---\n\n')
      return `${header}\n\n${entryText}`
    })
    .join('\n\n========\n\n')
}
