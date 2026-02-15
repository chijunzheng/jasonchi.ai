# Feature: Hero Callback Wiring

**ID:** 02
**Status:** ⬜ Not Started
**Priority:** High
**Estimated Complexity:** Low
**Dependencies:** 01

## Description

Wire the `onEnterChat` callback from `page.tsx` through `HeroSection` to `ScrollCTA`, replacing the `scrollIntoView` behavior with the new slide transition trigger.

## Acceptance Criteria

- [ ] `HeroSection` accepts optional `onEnterChat` prop
- [ ] `min-h-screen` removed from hero section (parent panel handles sizing)
- [ ] `ScrollCTA` accepts optional `onClick` prop
- [ ] `ScrollCTA` uses `onClick` when provided, falls back to `scrollIntoView`
- [ ] Clicking "Ask me anything" triggers slide transition to chat
- [ ] aria-label updated to "Go to chat section"

## Implementation Details

### Files to Create/Modify

- `frontend/src/components/hero/hero-section.tsx` — Add prop, remove min-h-screen (~5 lines)
- `frontend/src/components/hero/scroll-cta.tsx` — Accept onClick, update handler (~8 lines)

### Key Components

1. **HeroSection Props**
   - Add `onEnterChat?: () => void`
   - Pass to `<ScrollCTA onClick={onEnterChat} />`
   - Remove `min-h-screen` from section className

2. **ScrollCTA Props**
   - Add `onClick?: () => void`
   - Handler: `onClick ? onClick() : scrollIntoView` fallback
   - Update aria-label

### Technical Decisions

- **Optional prop with fallback:** Keeps ScrollCTA backwards-compatible if used elsewhere
- **Remove `min-h-screen`:** Parent absolute panel is already viewport-height; hero content scrolls internally via `overflow-y-auto` on the panel

## Dependencies

### Depends On
- **Feature 01:** Provides `onEnterChat` callback via `navigateTo('chat')`

### Blocks
- **Feature 04:** Must complete before final verification

## Testing Requirements

- [ ] Manual: Click "Ask me anything" → triggers slide transition
- [ ] Manual: Hero content scrolls internally when overflowing viewport

## Implementation Checklist

- [ ] Add `onEnterChat` prop to HeroSection
- [ ] Remove `min-h-screen` from HeroSection
- [ ] Pass `onEnterChat` to ScrollCTA as `onClick`
- [ ] Add `onClick` prop to ScrollCTA
- [ ] Update click handler with fallback logic
- [ ] Update aria-label
- [ ] Verify `pnpm build` passes

## Notes

- HeroSection remains a server-compatible component (no hooks), only ScrollCTA is `'use client'`
- The `bg-grid-pattern` and padding stay on the section for visual consistency

---

**Created:** 2026-02-10
**Last Updated:** 2026-02-10
**Implemented By:** —
