# Feature: Hero Section

**ID:** F2
**Tier:** 1 — Core UI
**Status:** ✅ Completed
**Priority:** High
**Estimated Complexity:** Medium
**Dependencies:** F0

## Description

Build the HR-friendly hero section that passes the "6-second squint test." Stats count up on scroll, JD Analyzer CTA is prominently placed, and TL;DR is copy-to-clipboard. This is a Server Component for fast SSR.

## Acceptance Criteria

- [ ] Hero renders with name, title, tagline, and professional appearance
- [ ] 3 stats cards with count-up animation triggered by scroll into view
- [ ] Quick Facts section: location, availability, work auth, target roles
- [ ] TL;DR card with copy-to-clipboard (checkmark confirmation)
- [ ] Social proof: company/tech logos + recognition badges
- [ ] JD Analyzer CTA prominently placed (not buried)
- [ ] Scroll CTA to chat section below
- [ ] Mobile responsive: single column, stacked stats, full-width CTAs
- [ ] Animations use requestAnimationFrame (no library deps)

## Implementation Details

### Files to Create

- `frontend/src/components/hero/hero-section.tsx` — Main hero container (Server Component wrapper)
- `frontend/src/components/hero/stats-counter.tsx` — Animated stat card (Client Component)
- `frontend/src/components/hero/quick-facts.tsx` — Location, availability, work auth
- `frontend/src/components/hero/tldr-card.tsx` — Copy-to-clipboard summary
- `frontend/src/components/hero/social-proof.tsx` — Company logos + recognition
- `frontend/src/components/hero/jd-analyzer-cta.tsx` — Prominent CTA for JD analysis
- `frontend/src/hooks/use-count-up.ts` — Count-up animation hook
- `frontend/src/hooks/use-copy-to-clipboard.ts` — Copy + confirmation hook
- `frontend/src/hooks/use-intersection-observer.ts` — Scroll trigger hook

### Component Hierarchy

```
<HeroSection>
  ├── Name + Title + Tagline
  ├── <StatsCounter /> × 3 (uses useCountUp + useIntersectionObserver)
  ├── <JDAnalyzerCTA /> (prominent, eye-catching)
  ├── <QuickFacts />
  ├── <TldrCard /> (uses useCopyToClipboard)
  ├── <SocialProof />
  └── Scroll CTA → chat section
</HeroSection>
```

### Hooks

```typescript
// use-count-up.ts
function useCountUp(end: number, duration?: number): { value: number; ref: RefObject }

// use-copy-to-clipboard.ts
function useCopyToClipboard(): { copied: boolean; copy: (text: string) => void }

// use-intersection-observer.ts
function useIntersectionObserver(options?: IntersectionObserverInit): {
  ref: RefObject
  isIntersecting: boolean
}
```

### Stats Data (from constants.ts)

```typescript
const STATS = [
  { label: 'Years Experience', value: 5, suffix: '+' },
  { label: 'Apps Shipped', value: 23, suffix: '' },
  { label: 'Tech Stacks', value: 12, suffix: '' },
]
```

### Technical Decisions

- **Server Component wrapper, Client Component children:** Hero shell renders server-side for fast LCP. Interactive parts (count-up, copy) are small Client Components.
- **requestAnimationFrame over framer-motion:** No animation library needed for simple count-up. Keeps bundle small.
- **IntersectionObserver for scroll trigger:** Native API, no library, fires once when stats scroll into view.

## Dependencies

### Depends On
- **F0:** Design system, shadcn components, constants

### Blocks
- **F13:** SEO needs hero metadata
- **F14:** Accessibility audit covers hero elements

## Testing Requirements

- [ ] Hero renders all sections in correct order
- [ ] Count-up animation triggers on scroll into view
- [ ] Copy-to-clipboard works and shows checkmark confirmation
- [ ] Mobile layout is single-column with stacked elements
- [ ] JD Analyzer CTA is visually prominent
- [ ] All text is readable on both light and dark themes

## Implementation Checklist

- [ ] Create hero-section.tsx container
- [ ] Create stats-counter.tsx with count-up animation
- [ ] Create use-count-up.ts hook
- [ ] Create use-intersection-observer.ts hook
- [ ] Create quick-facts.tsx
- [ ] Create tldr-card.tsx with copy functionality
- [ ] Create use-copy-to-clipboard.ts hook
- [ ] Create social-proof.tsx
- [ ] Create jd-analyzer-cta.tsx
- [ ] Add scroll CTA linking to chat section
- [ ] Verify mobile responsiveness
- [ ] Wire into app/page.tsx

## Notes

- Stats values should come from `lib/constants.ts` — single source of truth
- JD Analyzer CTA should stand out visually (gradient bg, icon, clear action text)
- The scroll CTA should smooth-scroll to the chat section using `scrollIntoView`
- Social proof logos can be placeholder text badges for now (actual logos later)

---

**Created:** 2026-02-09
**Last Updated:** 2026-02-09
**Implemented By:** Claude Code
