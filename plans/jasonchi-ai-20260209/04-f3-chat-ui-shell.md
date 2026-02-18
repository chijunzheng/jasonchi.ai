# Feature: Chat UI Shell (No AI)

**ID:** F3
**Tier:** 1 — Core UI
**Status:** ✅ Completed
**Priority:** High
**Estimated Complexity:** Large
**Dependencies:** F0

## Description

Build the complete chat interface with horizontal category pills, card-based responses, starter prompts, follow-up chips, and typing animation — all with mock/static responses. No AI integration yet (that's F6).

## Acceptance Criteria

- [ ] Horizontal category pills: Work, Projects, Skills, Education, Honest, Meta
- [ ] Clicking a category pill loads mock response for that category
- [ ] Card-based responses (not plain text bubbles)
- [ ] User messages appear as simple text bubbles
- [ ] "Ask Me Hard Questions" starter prompts visible in empty state
- [ ] Clicking a starter prompt sends it as a message
- [ ] Follow-up suggestion chips appear after AI responses
- [ ] Typing indicator with animated dots during response
- [ ] Typing effect: 15-20ms per character for AI responses
- [ ] Chat input with send button (disabled when empty)
- [ ] Auto-scroll to latest message
- [ ] Full-width layout (no sidebar)
- [ ] Mobile responsive

## Implementation Details

### Files to Create

- `frontend/src/components/chat/chat-section.tsx` — Main chat container
- `frontend/src/components/chat/category-pills.tsx` — Horizontal category navigation
- `frontend/src/components/chat/chat-message.tsx` — Individual message (user or AI)
- `frontend/src/components/chat/response-card.tsx` — Card-based AI response
- `frontend/src/components/chat/chat-input.tsx` — Input field + send button
- `frontend/src/components/chat/starter-prompts.tsx` — Initial prompt suggestions
- `frontend/src/components/chat/follow-up-chips.tsx` — Post-response suggestions
- `frontend/src/components/chat/typing-indicator.tsx` — Animated typing dots
- `frontend/src/hooks/use-typing-effect.ts` — Character-by-character reveal
- `frontend/src/hooks/use-chat.ts` — Chat state management (messages, loading, etc.)
- `frontend/src/types/chat.ts` — Chat type definitions
- `frontend/src/lib/mock-responses.ts` — Static mock responses for each category

### Type Definitions

```typescript
// types/chat.ts
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  category?: ContentCategory
  timestamp: Date
  followUps?: string[]
  isTyping?: boolean
}

export interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  activeCategory: ContentCategory | null
  error: string | null
}
```

### Component Hierarchy

```
<ChatSection>
  ├── <CategoryPills activeCategory={...} onSelect={...} />
  ├── <div className="messages-container">
  │   ├── <StarterPrompts /> (visible when no messages)
  │   ├── <ChatMessage /> × N
  │   │   ├── User message → plain text bubble
  │   │   └── AI message → <ResponseCard /> with typing effect
  │   ├── <TypingIndicator /> (when loading)
  │   └── <FollowUpChips /> (after last AI message)
  ├── <ChatInput onSend={...} disabled={isLoading} />
</ChatSection>
```

### Hooks

```typescript
// use-typing-effect.ts
function useTypingEffect(text: string, speed?: number): {
  displayText: string
  isComplete: boolean
  skip: () => void
}

// use-chat.ts (mock version)
function useChat(): {
  messages: ChatMessage[]
  isLoading: boolean
  activeCategory: ContentCategory | null
  sendMessage: (content: string) => void
  selectCategory: (category: ContentCategory) => void
  error: string | null
}
```

### Starter Prompts

```typescript
const STARTER_PROMPTS = [
  "What's your biggest technical challenge you've solved?",
  "Why should we hire you over other candidates?",
  "What are your actual weaknesses?",
  "Tell me about a project that failed",
  "What's your management style?",
]
```

### Category Pills

```typescript
const CATEGORIES = [
  { id: 'work-experience', label: 'Work', icon: Briefcase },
  { id: 'projects', label: 'Projects', icon: Code },
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'honest-section', label: 'Honest', icon: Shield },
  { id: 'meta', label: 'Meta', icon: Info },
]
```

### Technical Decisions

- **Full-width chat over sidebar:** More mobile-friendly, category pills replace sidebar navigation
- **Card-based responses:** Visually distinct from user messages, supports structured content
- **Typing effect in hook:** Reusable, controllable speed, skip-able by clicking
- **Mock responses first:** Allows full UI iteration before AI dependency is ready
- **Auto-scroll with scrollIntoView:** Native API, smooth behavior

## Dependencies

### Depends On
- **F0:** shadcn components, design tokens, Lucide icons

### Blocks
- **F6:** Wire Chat UI to AI replaces mock responses with real streaming
- **F13:** SEO needs chat section metadata
- **F14:** Accessibility audit covers chat interactions

## Testing Requirements

- [ ] Category pills render and are clickable
- [ ] Clicking category loads mock response with typing effect
- [ ] Starter prompts appear when no messages
- [ ] Clicking starter prompt sends message
- [ ] User messages appear as text bubbles
- [ ] AI responses appear as cards
- [ ] Follow-up chips appear after AI response
- [ ] Typing indicator shows during loading
- [ ] Chat input disables during loading
- [ ] Auto-scroll works on new messages
- [ ] Mobile responsive (pills scroll horizontally)

## Implementation Checklist

- [ ] Create types/chat.ts
- [ ] Create lib/mock-responses.ts
- [ ] Create use-typing-effect.ts hook
- [ ] Create use-chat.ts hook (mock version)
- [ ] Create typing-indicator.tsx
- [ ] Create category-pills.tsx
- [ ] Create chat-message.tsx
- [ ] Create response-card.tsx
- [ ] Create starter-prompts.tsx
- [ ] Create follow-up-chips.tsx
- [ ] Create chat-input.tsx
- [ ] Create chat-section.tsx (orchestrates all)
- [ ] Wire into app/page.tsx
- [ ] Verify mobile responsiveness

## Notes

- The `use-chat.ts` hook is the key abstraction — F6 will swap its internals from mock to real AI without changing any UI components
- Category pills should horizontally scroll on mobile with no wrapping
- Response cards should support markdown rendering eventually (for bold, lists, code blocks)
- The typing effect should be skippable — clicking the card reveals full text immediately

---

**Created:** 2026-02-09
**Last Updated:** 2026-02-09
**Implemented By:** Claude Code
