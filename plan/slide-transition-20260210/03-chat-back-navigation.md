# Feature: Chat Back Navigation

**ID:** 03
**Status:** ⬜ Not Started
**Priority:** High
**Estimated Complexity:** Low
**Dependencies:** 01

## Description

Thread the `onBackToHero` callback from `page.tsx` through `ChatSection` to `ChatMain`, and add an ArrowLeft back button to the chat header bar for returning to the hero view.

## Acceptance Criteria

- [ ] `ChatSection` accepts optional `onBackToHero` prop
- [ ] `id="chat"` removed from chat section (no longer scroll target)
- [ ] `h-screen` changed to `h-full` (parent panel provides height)
- [ ] `ChatMain` accepts optional `onBackToHero` prop
- [ ] ArrowLeft back button appears in chat header (always visible, not just mobile)
- [ ] Clicking back button triggers slide transition back to hero
- [ ] Header layout: `[ArrowLeft] [PanelLeft (mobile)] Chat`

## Implementation Details

### Files to Create/Modify

- `frontend/src/components/chat/chat-section.tsx` — Add prop, remove id, fix height (~6 lines)
- `frontend/src/components/chat/chat-main.tsx` — Add prop, import ArrowLeft, add button (~15 lines)

### Key Components

1. **ChatSection Props**
   - Add `onBackToHero?: () => void`
   - Remove `id="chat"` from section element
   - Change `h-screen` → `h-full`
   - Pass `onBackToHero` to `<ChatMain />`

2. **ChatMain Back Button**
   - Import `ArrowLeft` from lucide-react
   - Add to `ChatMainProps`: `onBackToHero?: () => void`
   - Button: ghost variant, `h-8 w-8`, always visible
   - Positioned before the sidebar toggle in header bar
   - `sr-only` text: "Back to hero"

### Technical Decisions

- **`h-full` instead of `h-screen`:** The chat panel's absolute parent is already `inset-0` (viewport-sized), so `h-full` fills correctly without double-specifying height
- **Back button always visible:** Unlike the sidebar toggle (`lg:hidden`), the back button should be accessible on all screen sizes since it's the primary way to return to hero
- **Optional prop:** Keeps ChatMain usable standalone if needed

## Dependencies

### Depends On
- **Feature 01:** Provides `onBackToHero` callback via `navigateTo('hero')`

### Blocks
- **Feature 04:** Must complete before final verification

## Testing Requirements

- [ ] Manual: ArrowLeft button visible in chat header on desktop and mobile
- [ ] Manual: Clicking ArrowLeft triggers slide transition back to hero
- [ ] Manual: Chat fills viewport correctly (no scrollbar on the panel itself)
- [ ] Manual: Chat sidebar still opens/closes correctly on mobile

## Implementation Checklist

- [ ] Add `onBackToHero` prop to ChatSection
- [ ] Remove `id="chat"` from section
- [ ] Change `h-screen` to `h-full`
- [ ] Pass `onBackToHero` to ChatMain
- [ ] Add `onBackToHero` to ChatMainProps interface
- [ ] Import `ArrowLeft` from lucide-react
- [ ] Add back button to header bar (before sidebar toggle)
- [ ] Verify `pnpm build` passes

## Notes

- The sidebar toggle (`PanelLeft`) stays `lg:hidden` — only the back button is always visible
- ArrowLeft icon uses `h-4 w-4` to match the PanelLeft icon size

---

**Created:** 2026-02-10
**Last Updated:** 2026-02-10
**Implemented By:** —
