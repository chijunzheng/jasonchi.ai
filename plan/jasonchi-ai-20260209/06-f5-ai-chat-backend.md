# Feature: AI Chat Backend (Route Handlers)

**ID:** F5
**Tier:** 2 — AI Integration
**Status:** ✅ Completed
**Priority:** High
**Estimated Complexity:** Large
**Dependencies:** F0, F1

## Description

Build the Next.js API route handlers that proxy requests to the Gemini API. The chat endpoint streams responses via SSE. Includes system prompt engineering, content injection, and follow-up chip generation.

## Acceptance Criteria

- [ ] `POST /api/chat` accepts message + conversation history, returns streaming SSE
- [ ] System prompt includes resume content as context
- [ ] Category-specific prompts guide responses for each content area
- [ ] Follow-up suggestion chips generated via secondary prompt after main response
- [ ] In-memory rate limiting: 20 requests/min per IP
- [ ] Proper error responses (4xx/5xx) with user-friendly messages
- [ ] `GEMINI_API_KEY` used server-side only (never exposed to client)
- [ ] Streaming works correctly with proper SSE format

## Implementation Details

### Files to Create

- `frontend/src/app/api/chat/route.ts` — Streaming chat endpoint
- `frontend/src/lib/gemini.ts` — Gemini API client wrapper
- `frontend/src/lib/prompts.ts` — System prompt, category prompts, follow-up generation
- `frontend/src/lib/rate-limit.ts` — Simple in-memory rate limiter

### API Contract

```typescript
// Request
POST /api/chat
{
  message: string
  conversationHistory: { role: 'user' | 'assistant', content: string }[]
  category?: ContentCategory
}

// Response: SSE stream
data: {"type": "text", "content": "I "}
data: {"type": "text", "content": "have "}
data: {"type": "text", "content": "experience..."}
data: {"type": "followUps", "content": ["Tell me more about...", "What about..."]}
data: {"type": "done"}
```

### Gemini Client

```typescript
// lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

export function createGeminiClient() { ... }
export async function* streamChat(messages, systemPrompt): AsyncGenerator<string> { ... }
export async function generateFollowUps(response, context): Promise<string[]> { ... }
```

### System Prompt Structure

```typescript
// lib/prompts.ts
export function buildSystemPrompt(content: string, category?: ContentCategory): string
export function buildFollowUpPrompt(lastResponse: string): string
export const CATEGORY_PROMPTS: Record<ContentCategory, string>
```

### Rate Limiting

```typescript
// lib/rate-limit.ts
// Simple Map<IP, {count, resetTime}> approach
// 20 requests per minute per IP
// Returns 429 when exceeded
```

### Technical Decisions

- **Route Handlers over separate backend:** Same-origin deployment, no CORS, simpler infra for MVP
- **SSE over WebSocket:** Simpler protocol, unidirectional (server→client), native `fetch` support
- **Gemini Flash over Pro for chat:** Faster, cheaper, sufficient quality for Q&A
- **Follow-up generation as secondary call:** Doesn't block the main response stream
- **In-memory rate limiting:** Good enough for MVP. Vercel's serverless nature means it resets on cold start — acceptable for this use case.

## Dependencies

### Depends On
- **F0:** Next.js route handler structure
- **F1:** Content loader for injecting resume content into prompts

### Blocks
- **F6:** Wire Chat UI needs this backend
- **F7:** JD Analyzer uses similar Gemini client patterns
- **F16:** LangGraph backend replaces these route handlers (same API contract)

## Testing Requirements

- [ ] Chat endpoint returns streaming SSE response
- [ ] System prompt includes loaded content
- [ ] Category-specific prompts modify behavior appropriately
- [ ] Follow-up chips are generated after response
- [ ] Rate limiter blocks after 20 requests/min
- [ ] Missing API key returns 500 with clear error
- [ ] Malformed request body returns 400
- [ ] Conversation history is passed to Gemini correctly

## Security Considerations

- [ ] GEMINI_API_KEY only accessed server-side
- [ ] Input sanitization on user message
- [ ] Rate limiting prevents abuse
- [ ] Conversation history size bounded (prevent token budget overflow)
- [ ] No PII logged

## Implementation Checklist

- [ ] Install @google/generative-ai package
- [ ] Create lib/gemini.ts client wrapper
- [ ] Create lib/prompts.ts with system + category prompts
- [ ] Create lib/rate-limit.ts
- [ ] Create app/api/chat/route.ts with SSE streaming
- [ ] Wire content loader into prompt building
- [ ] Add follow-up generation logic
- [ ] Add error handling and validation
- [ ] Test with curl/httpie
- [ ] Add GEMINI_API_KEY to .env.local (and .env.example)

## Notes

- The `@google/generative-ai` SDK supports streaming natively via `generateContentStream()`
- Conversation history should be truncated to last N messages to stay within token budget
- The follow-up generation can use a cheaper/faster model call since quality matters less
- Create `.env.example` with `GEMINI_API_KEY=` placeholder

---

**Created:** 2026-02-09
**Last Updated:** 2026-02-09
**Implemented By:** Claude Code
