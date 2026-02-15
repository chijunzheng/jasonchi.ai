# Feature: SEO, OG Tags, Performance

**ID:** F13
**Tier:** 5 — Polish
**Status:** ✅ Completed
**Priority:** Medium
**Estimated Complexity:** Small
**Dependencies:** F2, F3, F4

## Description

Optimize for search engines, social sharing, and performance. Target Lighthouse 90+ on all categories.

## Acceptance Criteria

- [ ] Metadata configured in app/layout.tsx (title, description, keywords)
- [ ] Open Graph tags for social sharing (title, description, image)
- [ ] Twitter Card meta tags
- [ ] Canonical URL set
- [ ] robots.txt and sitemap.xml generated
- [ ] Lighthouse Performance score 90+
- [ ] Lighthouse Accessibility score 90+
- [ ] Lighthouse Best Practices score 90+
- [ ] Lighthouse SEO score 90+
- [ ] Images optimized (next/image)
- [ ] Fonts preloaded (Geist via next/font handles this)

## Implementation Details

### Files to Create/Modify

- `frontend/src/app/layout.tsx` — Add comprehensive metadata
- `frontend/src/app/opengraph-image.tsx` — Dynamic OG image (optional)
- `frontend/public/robots.txt` — Search engine directives
- `frontend/src/app/sitemap.ts` — Dynamic sitemap generation

### Metadata

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: 'Jason Chi | AI Engineer — Interview My AI',
  description: 'Interactive AI resume. Chat with my AI, analyze job descriptions, generate cover letters.',
  keywords: ['AI Engineer', 'Resume', 'Jason Chi', ...],
  openGraph: {
    title: 'Jason Chi | Interview My AI',
    description: '...',
    url: 'https://jasonchi.ai',
    siteName: 'Jason.AI',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    ...
  },
}
```

### Performance Optimizations

- Lazy-load below-fold components (chat section, heatmap)
- Optimize images with next/image
- Minimize client-side JS in hero (Server Components)
- Bundle analysis with @next/bundle-analyzer

## Dependencies

### Depends On
- **F2, F3, F4:** Core UI must be complete for meaningful Lighthouse testing

### Blocks
- None

## Implementation Checklist

- [ ] Add comprehensive metadata to layout.tsx
- [ ] Create OG image (1200x630)
- [ ] Create robots.txt
- [ ] Create sitemap.ts
- [ ] Run Lighthouse audit and fix issues
- [ ] Add lazy loading for below-fold components
- [ ] Verify OG tags with social media debuggers

---

**Created:** 2026-02-09
**Last Updated:** 2026-02-09
**Implemented By:** Claude Code
