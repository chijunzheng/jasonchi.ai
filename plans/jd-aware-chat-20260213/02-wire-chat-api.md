# Feature: Wire JD Context into Chat API

**ID:** 02
**Status:** ✅ Completed
**Priority:** High
**Estimated Complexity:** Medium
**Dependencies:** 01

## Description

Update `useChat` hook to accept optional `jdContext` and include `jobDescription` in SSE request body. Update Next.js API route to accept the field and handle it for both the backend proxy path and direct-Gemini fallback.

## Acceptance Criteria

- [x] `useChat` accepts `UseChatOptions` with optional `jdContext`
- [x] `streamResponse` includes `jobDescription` in request body when JD context present
- [x] `chatRequestSchema` in route.ts accepts optional `jobDescription` (max 10000 chars)
- [x] Direct-Gemini path appends JD context section to system prompt
- [x] Backend proxy path forwards `jobDescription` transparently (it's in the JSON body)

## Files Modified

- `frontend/src/hooks/use-chat.ts` - Added `UseChatOptions`, `jdContext` param, request body injection
- `frontend/src/app/api/chat/route.ts` - Added `jobDescription` to schema, system prompt injection

## Key Decisions

- **Only `jobDescription` string in dependency array:** `jdContext?.jobDescription` is the stable primitive; analysis object changes don't affect API calls
- **Same JD prompt for frontend fallback and backend:** Both paths append identical `Active Job Description` section

---

**Created:** 2026-02-13
**Implemented By:** Claude
