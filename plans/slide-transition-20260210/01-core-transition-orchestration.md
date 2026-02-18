# Feature: Core Transition Orchestration (page.tsx)

**ID:** 01
**Status:** ⬜ Not Started
**Priority:** High
**Estimated Complexity:** Medium
**Dependencies:** None

## Description

Convert `frontend/src/app/page.tsx` from a static server component into a client component that orchestrates the full-page slide transition between hero and chat views using CSS `transform: translateY()`.

## Acceptance Criteria

- [ ] Page renders hero view by default
- [ ] `view` state toggles between `'hero'` and `'chat'`
- [ ] Transition uses GPU-composited `translateY` (700ms ease-in-out)
- [ ] `isTransitioning` state prevents scroll during animation
- [ ] `mounted` flag suppresses transition on initial `#chat` deep-link
- [ ] URL hash `#chat` updates via `history.pushState`
- [ ] Browser back button works via `popstate` listener
- [ ] `onTransitionEnd` correctly filters bubbling child transitions
- [ ] Hero panel has `overflow-y-auto` when idle, `overflow-hidden` during transition

## Implementation Details

### Files to Create/Modify

- `frontend/src/app/page.tsx` — Full rewrite (~50 lines)

### Key Components

1. **View State Machine**
   - `view: 'hero' | 'chat'` — current active panel
   - `isTransitioning: boolean` — scroll lock during animation
   - `mounted: boolean` — suppresses CSS transition class on first render

2. **Hash-Based Navigation**
   - `navigateTo(target)` — sets view + pushes hash to history
   - `popstate` listener — syncs view state with browser navigation
   - `getInitialView()` — reads hash on mount for deep-linking

3. **Transition Container**
   - Outer: `relative h-dvh overflow-hidden`
   - Hero panel: `absolute inset-0`, translates Y 0 ↔ -100%
   - Chat panel: `absolute inset-0`, translates Y 100% ↔ 0
   - `onTransitionEnd` filters `propertyName === 'transform'` + `currentTarget === target`

### Technical Decisions

- **`h-dvh` over `h-screen`:** Handles mobile Safari dynamic viewport correctly
- **`requestAnimationFrame` for mounted:** Ensures first paint completes before enabling transitions
- **Guard in `navigateTo`:** Prevents double-firing during ongoing transition

## Dependencies

### Depends On
- None (foundation feature)

### Blocks
- **Feature 02:** Hero callbacks need `navigateTo('chat')` from page
- **Feature 03:** Chat back button needs `navigateTo('hero')` from page

## Testing Requirements

- [ ] Manual: Hero shows on load at `/`
- [ ] Manual: Chat shows on load at `/#chat` (no transition flash)
- [ ] Manual: Browser back/forward syncs view
- [ ] Manual: No scroll jitter during 700ms transition

## Implementation Checklist

- [ ] Convert page.tsx to `'use client'`
- [ ] Add state: `view`, `isTransitioning`, `mounted`
- [ ] Add `getInitialView()`, `navigateTo()`, `handleTransitionEnd()`
- [ ] Add `popstate` listener with cleanup
- [ ] Build viewport-locked container with two absolute panels
- [ ] Pass `onEnterChat` to HeroSection, `onBackToHero` to ChatSection
- [ ] Verify `pnpm build` passes

## Notes

- The `heroRef` is kept for potential future use (scroll-to-top on return)
- `useCallback` on `navigateTo` and `handleTransitionEnd` prevents unnecessary re-renders of child components

---

**Created:** 2026-02-10
**Last Updated:** 2026-02-10
**Implemented By:** —
