# Feature: Wire Chat UI to AI

**ID:** F6
**Tier:** 2 — AI Integration
**Status:** ✅ Completed
**Priority:** High
**Estimated Complexity:** Medium
**Dependencies:** F3, F5

## Description

Replace the mock chat responses with real AI streaming. Update `use-chat.ts` to use fetch-based SSE, add confidence indicator for source attribution, wire follow-up chips to generated suggestions, and add error handling with retry.

## Acceptance Criteria

- [ ] `use-chat.ts` hook fetches from `/api/chat` with SSE streaming
- [ ] AI responses stream character-by-character as they arrive
- [ ] Follow-up chips populated from AI-generated suggestions
- [ ] Confidence indicator shows which content sources were used
- [ ] Error card with retry button on failed requests
- [ ] Conversation history sent with each request (last N messages)
- [ ] Category selection sends category context to API
- [ ] Loading state managed correctly during streaming
- [ ] Token budget prevents conversation history from getting too large

## Implementation Details

### Files to Modify

- `frontend/src/hooks/use-chat.ts` — Replace mock logic with SSE streaming

### Files to Create

- `frontend/src/components/chat/confidence-indicator.tsx` — Source attribution
- `frontend/src/components/chat/error-card.tsx` — Error display with retry
- `frontend/src/lib/sse-client.ts` — SSE parsing utility

### SSE Client

```typescript
// lib/sse-client.ts
export async function* streamSSE(url: string, body: object): AsyncGenerator<SSEEvent> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  // Parse SSE events from ReadableStream
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  // ... yield parsed events
}
```

### Updated use-chat Hook

```typescript
// hooks/use-chat.ts
function useChat(): {
  messages: ChatMessage[]
  isLoading: boolean
  activeCategory: ContentCategory | null
  sendMessage: (content: string) => void
  selectCategory: (category: ContentCategory) => void
  retry: () => void
  error: string | null
}
```

### Confidence Indicator

```typescript
// Shows which content categories contributed to the response
// e.g., "Based on: Work Experience, Skills"
// Simple badge display, no complex provenance tracking
```

### Technical Decisions

- **fetch + ReadableStream over EventSource:** `EventSource` only supports GET. We need POST for sending conversation history.
- **Conversation truncation:** Keep last 10 messages max, or truncate by estimated token count (~4 chars per token).
- **Retry on error:** Simple retry button, no automatic retry to avoid runaway API calls.
- **Confidence indicator MVP:** Based on category context, not actual RAG provenance. Phase 2 with LangGraph provides real source tracking.

## Dependencies

### Depends On
- **F3:** Chat UI shell (components to wire into)
- **F5:** AI backend (API to connect to)

### Blocks
- **F10:** Session Summary needs conversation data from this hook

## Testing Requirements

- [ ] Sending a message returns streamed AI response
- [ ] Response renders character-by-character
- [ ] Follow-up chips update after each response
- [ ] Category selection changes response context
- [ ] Error card appears on API failure
- [ ] Retry button re-sends the last message
- [ ] Conversation history is included in requests
- [ ] Old messages are truncated to stay within token budget

## Implementation Checklist

- [ ] Create lib/sse-client.ts
- [ ] Update use-chat.ts with real API integration
- [ ] Create confidence-indicator.tsx
- [ ] Create error-card.tsx with retry button
- [ ] Add conversation history management
- [ ] Wire follow-up chips to generated suggestions
- [ ] Add loading/error states
- [ ] Test end-to-end flow

## Notes

- The key insight is that the `use-chat.ts` hook is the only file that changes — all UI components from F3 remain untouched
- This is where the "client-side-first" architecture pays off: route handlers are same-origin, no CORS
- The SSE client should handle partial JSON events and reconnection gracefully

---

**Created:** 2026-02-09
**Last Updated:** 2026-02-09
**Implemented By:** Claude Code
