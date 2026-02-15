# Feature: Content System (Loader + Templates)

**ID:** F1
**Tier:** 0 — Foundation
**Status:** ✅ Completed
**Priority:** High
**Estimated Complexity:** Small
**Dependencies:** F0

## Description

Build the content loading system that reads markdown files with frontmatter and provides them to the AI chat and UI components. Create 6 template markdown files for the user to populate with their story-based content.

## Acceptance Criteria

- [ ] `lib/content-loader.ts` exports `loadContent(category)`, `loadAllContent()`, `searchContent(query)`
- [ ] Markdown files parsed with `gray-matter` for frontmatter extraction
- [ ] `types/content.ts` defines TypeScript interfaces for all content types
- [ ] 6 template markdown files created in `frontend/src/content/`
- [ ] Templates use Situation/Action/Result/Real Talk structure
- [ ] Content loads correctly at build time and runtime
- [ ] `searchContent()` performs keyword matching across all content

## Implementation Details

### Files to Create

- `frontend/src/lib/content-loader.ts` — Core content loading functions
- `frontend/src/types/content.ts` — Content type definitions
- `frontend/src/content/work-experience.md` — Work history template
- `frontend/src/content/projects.md` — Side projects template
- `frontend/src/content/skills.md` — Technical skills template
- `frontend/src/content/education.md` — Education template
- `frontend/src/content/honest-section.md` — Honest section template
- `frontend/src/content/meta.md` — Meta/about-the-site template

### Content Loader API

```typescript
// lib/content-loader.ts
export function loadContent(category: ContentCategory): ContentEntry[]
export function loadAllContent(): Record<ContentCategory, ContentEntry[]>
export function searchContent(query: string): SearchResult[]
export function getContentForPrompt(category: ContentCategory): string
```

### Type Definitions

```typescript
// types/content.ts
export type ContentCategory =
  | 'work-experience'
  | 'projects'
  | 'skills'
  | 'education'
  | 'honest-section'
  | 'meta'

export interface ContentEntry {
  title: string
  category: ContentCategory
  content: string
  frontmatter: Record<string, unknown>
  sections: ContentSection[]
}

export interface ContentSection {
  heading: string
  level: number
  content: string
}

export interface SearchResult {
  entry: ContentEntry
  section: ContentSection
  relevance: number
  snippet: string
}
```

### Template Structure

Each markdown file uses:
```markdown
---
category: work-experience
title: Work Experience
order: 1
---

## [Role Title] at [Company]

### The Situation — [what you walked into]
[Context and challenges]

### What I Did — [your approach, decisions, trade-offs]
[Actions taken with specifics]

### The Result — [outcomes with numbers]
[Measurable impact]

### Real Talk — [honest reflection]
[What you'd do differently, what surprised you]

### Tech I Used
[comma-separated technologies]
```

### Key Dependencies

```json
{
  "gray-matter": "latest"
}
```

### Technical Decisions

- **gray-matter over remark:** Simpler API for frontmatter + content splitting. We don't need full MDX rendering.
- **File-based content:** No database needed. Content changes via git commits.
- **Keyword search over vector search:** MVP simplicity. Vector embeddings are Phase 2 with LangGraph.
- **`getContentForPrompt()`:** Formats content specifically for LLM context injection (strips markdown formatting, adds clear section delimiters).

## Dependencies

### Depends On
- **F0:** Project structure and TypeScript config

### Blocks
- **F5:** AI Backend needs content loading for prompt context
- **F7:** JD Analyzer needs full content for comparison

## Testing Requirements

- [ ] `loadContent('work-experience')` returns parsed entries
- [ ] `loadAllContent()` returns all 6 categories
- [ ] `searchContent('kubernetes')` returns relevant results with snippets
- [ ] `getContentForPrompt('projects')` returns LLM-friendly text
- [ ] Handles empty/missing markdown files gracefully
- [ ] Frontmatter parsing extracts all fields correctly

## Implementation Checklist

- [ ] Install gray-matter dependency
- [ ] Create types/content.ts with all interfaces
- [ ] Create lib/content-loader.ts with all functions
- [ ] Create 6 content template markdown files
- [ ] Add search/keyword matching logic
- [ ] Add getContentForPrompt formatter
- [ ] Verify content loads in dev server

## Notes

- Templates should have clear TODO markers so the user knows exactly what to fill in
- The `meta.md` file is for "about this site" content — how the AI works, why it was built, tech stack
- `searchContent()` is a simple keyword match for MVP. Phase 2 replaces with vector search via LangGraph tools.

---

**Created:** 2026-02-09
**Last Updated:** 2026-02-09
**Implemented By:** Claude Code
