# Full-Page Slide Transition: Hero ↔ Chat

## Goal
Replace the scrolling two-section layout with a full-page slide transition. Clicking "Ask me anything" slides the hero up and reveals the chat view. A back button returns to the hero. No new dependencies — pure CSS transitions.

## Current State
- `page.tsx`: Simple `<HeroSection /> <ChatSection />` vertical stack
- User scrolls or clicks "Ask me anything" → `scrollIntoView({ behavior: 'smooth' })`
- Both sections take full viewport height but are stacked in normal document flow

## Architecture

Both views are **always mounted** (chat state persists). A viewport-locked container with CSS `transform: translateY()` handles the animation.

```
┌─ div.relative.h-dvh.overflow-hidden ────────────────────┐
│                                                           │
│  ┌─ Hero Panel (absolute inset-0) ─────────────────────┐ │
│  │  translateY(0)  →  translateY(-100vh)                │ │
│  │  overflow-y-auto (internal scroll)                   │ │
│  │  HeroSection { onEnterChat }                         │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─ Chat Panel (absolute inset-0) ─────────────────────┐ │
│  │  translateY(100vh)  →  translateY(0)                 │ │
│  │  ChatSection { onBackToHero }                        │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

- **700ms ease-in-out** transition (GPU-composited transform)
- **URL hash `#chat`** for deep-linking + browser back button
- **Scroll lock** during transition via `isTransitioning` state
- **`onTransitionEnd` guard** filters for `propertyName === 'transform'` to avoid bubbling from child transitions

## Files to Modify (6 files, ~95 lines total)

### 1. `frontend/src/app/page.tsx` — Core orchestration (~50 lines)
- Convert to `'use client'`
- Add `view` state (`'hero' | 'chat'`)
- Add `isTransitioning` state for scroll lock during animation
- Add `mounted` state to suppress transition on initial `#chat` deep-link
- Hash management: `popstate` listener for browser back, `history.pushState` for navigation
- Viewport-locked container: `relative h-dvh overflow-hidden`
- Two absolute panels with `transition-transform duration-700 ease-in-out`
- Hero panel: `overflow-y-auto` when not transitioning, `overflow-hidden` during
- `onTransitionEnd` handler filters `propertyName === 'transform'` + `currentTarget === target`

### 2. `frontend/src/components/hero/hero-section.tsx` — Accept callback (~5 lines changed)
- Add `onEnterChat?: () => void` prop
- Remove `min-h-screen` (parent panel handles sizing; content scrolls internally)
- Pass `onEnterChat` to `<ScrollCTA onClick={onEnterChat} />`

### 3. `frontend/src/components/hero/scroll-cta.tsx` — Use callback (~8 lines changed)
- Add `onClick?: () => void` prop
- Use `onClick` if provided, fallback to `scrollIntoView` for backwards compatibility
- Update aria-label to "Go to chat section"

### 4. `frontend/src/components/chat/chat-section.tsx` — Thread callback (~6 lines changed)
- Add `onBackToHero?: () => void` prop
- Remove `id="chat"` (no longer scroll target)
- Change `h-screen` → `h-full` (parent panel is viewport-height)
- Pass `onBackToHero` to `<ChatMain />`

### 5. `frontend/src/components/chat/chat-main.tsx` — Add back button (~15 lines added)
- Add `onBackToHero?: () => void` to `ChatMainProps`
- Import `ArrowLeft` from lucide-react
- Add back button before sidebar toggle in header bar:
  ```
  [ArrowLeft] [PanelLeft (mobile)] Chat
  ```
- Back button is always visible (not `lg:hidden`), ghost variant, `h-8 w-8`

### 6. `frontend/src/components/jd-analyzer/jd-analyzer-modal.tsx` — Remove scrollIntoView (~1 line)
- In `handleDiscussInChat`: remove `document.getElementById('chat')?.scrollIntoView(...)` line
- The modal is only accessible from the chat view, so no navigation needed

## Edge Cases Handled

| Edge Case | Solution |
|-----------|----------|
| Hero content overflows viewport | Hero panel has `overflow-y-auto` for internal scrolling |
| Scroll momentum during transition | Set `overflow-hidden` during transition, restore via `onTransitionEnd` |
| `onTransitionEnd` bubbling from child buttons | Filter: `e.propertyName === 'transform' && e.currentTarget === e.target` |
| Deep-link to `/#chat` | `mounted` flag suppresses transition on initial render |
| Browser back button | `popstate` listener syncs `view` state with hash |
| Mobile Safari dynamic viewport | `h-dvh` instead of `h-screen` |
| `prefers-reduced-motion` | Tailwind's `motion-reduce:` variant or CSS media query |
| Chat sidebar `position: fixed` | Transform on parent creates containing block — sidebar moves with chat panel correctly |

## Implementation Sequence

1. **page.tsx** — Add view state, transition container, hash management
2. **hero-section.tsx + scroll-cta.tsx** — Accept and use callbacks
3. **chat-section.tsx + chat-main.tsx** — Thread callback, add back button
4. **jd-analyzer-modal.tsx** — Remove scrollIntoView
5. **Test** — Manual verification

## Verification

1. `pnpm dev` — app loads showing hero section
2. Click "Ask me anything" → hero slides up, chat slides into view (700ms)
3. Click ArrowLeft in chat header → reverse animation back to hero
4. Navigate to `/#chat` directly → chat view shown immediately (no transition flash)
5. Use browser back button after navigating to chat → returns to hero
6. On hero: scroll down through content (TL;DR, social proof) → internal scrolling works
7. During transition: no scroll jitter or momentum bleed
8. `pnpm build` → no type errors
