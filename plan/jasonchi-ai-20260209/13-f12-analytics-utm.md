# Feature: Analytics & UTM Tracking

**ID:** F12
**Tier:** 4 — Engagement
**Status:** ✅ Completed
**Priority:** Medium
**Estimated Complexity:** Small
**Dependencies:** F0

## Description

Add analytics tracking for key user interactions and UTM parameter parsing for attribution. Use Vercel Analytics or Plausible for privacy-friendly analytics.

## Acceptance Criteria

- [ ] Analytics provider integrated (Vercel Analytics or Plausible)
- [ ] Key events tracked: chat_started, message_sent, jd_analyzed, cover_letter_generated, resume_downloaded
- [ ] UTM parameters parsed from URL on page load
- [ ] UTM data attached to analytics events for attribution
- [ ] No PII collected
- [ ] Analytics script doesn't affect page load performance

## Implementation Details

### Files to Create

- `frontend/src/lib/analytics.ts` — Analytics event helpers
- `frontend/src/hooks/use-utm.ts` — UTM parameter parsing

### Event Tracking

```typescript
// lib/analytics.ts
export function trackEvent(name: string, properties?: Record<string, string>) { ... }

// Events to track:
trackEvent('chat_started')
trackEvent('message_sent', { category: 'work-experience' })
trackEvent('jd_analyzed', { matchScore: '78' })
trackEvent('cover_letter_generated')
trackEvent('resume_downloaded')
trackEvent('session_summary_copied')
trackEvent('lead_submitted')
```

### UTM Parsing

```typescript
// hooks/use-utm.ts
// Parse: ?ref=cold-email-acme&utm_source=email&utm_campaign=outreach
export function useUTM(): UTMParams
```

### Technical Decisions

- **Vercel Analytics:** Free tier, zero-config with Next.js, privacy-friendly
- **Custom events over page views:** User journey matters more than page count (it's a SPA)
- **UTM in query params:** Standard, works with all marketing channels

## Dependencies

### Depends On
- **F0:** Next.js project structure

### Blocks
- **F15:** Resume PDF download tracking

## Testing Requirements

- [ ] Analytics events fire on key interactions
- [ ] UTM parameters parsed correctly from URL
- [ ] Analytics don't block page rendering

## Implementation Checklist

- [ ] Install @vercel/analytics (or plausible-tracker)
- [ ] Create lib/analytics.ts event helpers
- [ ] Create hooks/use-utm.ts
- [ ] Add trackEvent calls to chat, JD analyzer, cover letter, and resume components
- [ ] Wire UTM parsing on app mount
- [ ] Verify events in analytics dashboard

## Notes

- Keep analytics minimal and privacy-friendly — no cookies, no PII
- The `ref` parameter is a simple attribution tag for cold outreach tracking
- Consider adding a simple `/api/health` endpoint that returns uptime for monitoring

---

**Created:** 2026-02-09
**Last Updated:** 2026-02-09
**Implemented By:** Claude Code
