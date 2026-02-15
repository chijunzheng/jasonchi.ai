# Feature: Cleanup & Verification

**ID:** 04
**Status:** ⬜ Not Started
**Priority:** Medium
**Estimated Complexity:** Low
**Dependencies:** 01, 02, 03

## Description

Remove the now-obsolete `scrollIntoView` call from `jd-analyzer-modal.tsx` and run full build verification to confirm the slide transition works end-to-end with no type errors.

## Acceptance Criteria

- [ ] `scrollIntoView` removed from `handleDiscussInChat` in jd-analyzer-modal.tsx
- [ ] `pnpm build` completes with zero type errors
- [ ] Manual verification of all transition scenarios passes

## Implementation Details

### Files to Create/Modify

- `frontend/src/components/jd-analyzer/jd-analyzer-modal.tsx` — Remove 1 line

### Key Components

1. **JD Analyzer Modal Cleanup**
   - In `handleDiscussInChat`: remove `document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })`
   - The modal is only accessible from the chat view, so closing it already returns to chat — no navigation needed

2. **Build Verification**
   - `pnpm build` must pass with zero errors
   - Focus on TypeScript type-checking for new optional props

### Technical Decisions

- **No replacement navigation:** The JD Analyzer modal is opened from within the chat sidebar, so when the user clicks "Discuss in Chat" they're already on the chat view — just closing the modal suffices

## Dependencies

### Depends On
- **Feature 01:** Core orchestration must be in place
- **Feature 02:** Hero callbacks must work
- **Feature 03:** Chat back navigation must work

### Blocks
- None (final feature)

## Testing Requirements

### Manual Verification Checklist

- [ ] `pnpm dev` — app loads showing hero section
- [ ] Click "Ask me anything" → hero slides up, chat slides in (700ms)
- [ ] Click ArrowLeft in chat header → reverse animation back to hero
- [ ] Navigate to `/#chat` directly → chat view shown immediately (no flash)
- [ ] Browser back button after navigating to chat → returns to hero
- [ ] Hero: scroll down through TL;DR, social proof → internal scrolling works
- [ ] During transition: no scroll jitter or momentum bleed
- [ ] JD Analyzer: "Discuss in Chat" closes modal correctly
- [ ] `pnpm build` → no type errors

## Implementation Checklist

- [ ] Remove `scrollIntoView` line from jd-analyzer-modal.tsx
- [ ] Run `pnpm build`
- [ ] Fix any type errors
- [ ] Run manual verification checklist above

## Notes

- This is the integration/verification feature — all prior features must be complete
- If build fails, likely cause is mismatched prop types between parent and child components

---

**Created:** 2026-02-10
**Last Updated:** 2026-02-10
**Implemented By:** —
