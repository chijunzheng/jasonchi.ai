# Feature: Theme Toggle & Layout

**ID:** F4
**Tier:** 1 — Core UI
**Status:** ✅ Completed
**Priority:** High
**Estimated Complexity:** Small
**Dependencies:** F0

## Description

Build the site-wide layout shell with sticky header, footer, and theme toggle. Default to light mode (HR-friendly), with smooth dark mode transition.

## Acceptance Criteria

- [ ] Header: name/logo left, theme toggle + "Download Resume" button right
- [ ] Header becomes sticky on scroll past hero section
- [ ] Theme toggle switches between light and dark mode
- [ ] Theme persisted in localStorage via `next-themes`
- [ ] Default theme is light (system preference respected)
- [ ] Smooth transition animation on theme change (200ms)
- [ ] Footer with social links and "Built with Next.js + Gemini" tagline
- [ ] Mobile responsive header (compact layout)

## Implementation Details

### Files to Create

- `frontend/src/components/layout/header.tsx` — Sticky header
- `frontend/src/components/layout/footer.tsx` — Site footer
- `frontend/src/components/layout/theme-toggle.tsx` — Sun/moon toggle
- `frontend/src/components/layout/theme-provider.tsx` — next-themes wrapper

### Component Hierarchy

```
<ThemeProvider>
  <Header>
    ├── Logo/Name (left)
    └── <ThemeToggle /> + Download Resume button (right)
  </Header>
  <main>{children}</main>
  <Footer>
    ├── Social links (GitHub, LinkedIn, etc.)
    └── "Built with Next.js + Gemini" tagline
  </Footer>
</ThemeProvider>
```

### Sticky Header Behavior

```typescript
// Header becomes sticky after scrolling past hero
// Use CSS position: sticky with a top offset
// Or track scroll position and add/remove class
```

### Technical Decisions

- **next-themes over custom:** Handles SSR hydration, localStorage, system preference, and flicker prevention out of the box
- **Sun/Moon icons from Lucide:** Consistent with shadcn icon set
- **CSS transition on theme change:** `transition: background-color 200ms, color 200ms` on body
- **Sticky header via CSS:** `position: sticky; top: 0` — no JS scroll listener needed

## Dependencies

### Depends On
- **F0:** ThemeProvider setup, Lucide icons, shadcn button

### Blocks
- **F13:** SEO/performance depends on layout structure

## Testing Requirements

- [ ] Header renders with name and buttons
- [ ] Theme toggle switches themes visually
- [ ] Theme persists across page reload
- [ ] Header becomes sticky on scroll
- [ ] Footer renders with correct links
- [ ] Mobile header is compact and usable

## Implementation Checklist

- [ ] Create theme-provider.tsx (next-themes wrapper)
- [ ] Create theme-toggle.tsx (sun/moon button)
- [ ] Create header.tsx with sticky behavior
- [ ] Create footer.tsx with social links
- [ ] Wire providers into app/layout.tsx
- [ ] Add CSS transition for theme changes
- [ ] Verify on mobile viewport

## Notes

- The "Download Resume" button in the header is a placeholder for now — it links to a static PDF URL
- Footer social links come from `lib/constants.ts`
- Keep header minimal — it shouldn't compete with the hero section for attention

---

**Created:** 2026-02-09
**Last Updated:** 2026-02-09
**Implemented By:** Claude Code
