# Feature: "Discuss in Chat" Auto-Message

**ID:** 04
**Status:** ✅ Completed
**Priority:** Medium
**Estimated Complexity:** Low
**Dependencies:** 01, 02

## Description

When JD context arrives (user clicks "Discuss in Chat"), automatically send an initial message: "How does my experience align with this role?" The first LLM response will reference the JD, providing immediate value.

## Acceptance Criteria

- [x] Auto-sends initial message when `jdContext` is set and not already sent
- [x] Uses `sentJdRef` to prevent strict mode double-fires
- [x] Only fires once per unique JD (changing JD triggers a new auto-send)
- [x] Does not fire when `isLoading` is true

## Files Modified

- `frontend/src/components/chat/chat-section.tsx` - `useEffect` with `sentJdRef` guard

## Implementation Note

This was implemented as part of Phase 1 since the `useEffect` naturally lives in `chat-section.tsx` alongside the JD state wiring. The `sentJdRef` pattern prevents double-fires: React strict mode re-runs effects but keeps refs intact, so on the second run the ref already matches and the send is skipped.

---

**Created:** 2026-02-13
**Implemented By:** Claude
