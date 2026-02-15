# Feature: Micro-Commitment CTA

**ID:** F11
**Tier:** 4 — Engagement
**Status:** ✅ Completed
**Priority:** Medium
**Estimated Complexity:** Small
**Dependencies:** F0

## Description

A lightweight lead capture form with just 2 fields: "What role are you hiring for?" and "Your email." Appears in the hero section (secondary CTA) and contextually after meaningful chat engagement.

## Acceptance Criteria

- [ ] 2-field form: role/position + email
- [ ] Appears in hero section as secondary CTA
- [ ] Conditionally appears after meaningful chat engagement (5+ messages)
- [ ] Submission sends notification (via email or Google Sheets webhook)
- [ ] Success confirmation message after submission
- [ ] Form validates email format
- [ ] Non-intrusive design (doesn't block content)

## Implementation Details

### Files to Create

- `frontend/src/components/hero/micro-commitment.tsx` — Hero placement
- `frontend/src/components/chat/engagement-cta.tsx` — Chat contextual placement
- `frontend/src/app/api/lead/route.ts` — Lead capture endpoint

### Form Design

```
┌─────────────────────────────────────────┐
│ Interested? Let's connect.              │
│                                         │
│ What role?  [___________________]       │
│ Your email  [___________________]       │
│                                         │
│ [Let's Talk →]                          │
└─────────────────────────────────────────┘
```

### Lead Notification Options

1. **Email notification:** Use Resend or nodemailer to send yourself an email
2. **Google Sheets:** POST to Google Apps Script webhook
3. **Simple file/log:** Write to a server-side log (simplest MVP)

### Technical Decisions

- **2 fields only:** Minimal friction. Name not required — email + role is enough signal.
- **No database:** Notification-based, not stored. GDPR-simple.
- **Conditional appearance:** After 5+ messages suggests genuine interest, not tire-kickers.

## Dependencies

### Depends On
- **F0:** shadcn input, button components

### Blocks
- None

## Testing Requirements

- [ ] Form renders in hero section
- [ ] Form validates email format
- [ ] Submission sends notification
- [ ] Success message appears after submission
- [ ] Chat CTA appears only after 5+ messages

## Implementation Checklist

- [ ] Create micro-commitment.tsx for hero
- [ ] Create engagement-cta.tsx for chat
- [ ] Create app/api/lead/route.ts
- [ ] Add email validation
- [ ] Wire notification delivery
- [ ] Test submission flow

## Notes

- This is the lowest-friction conversion path — easier than scheduling a call
- Keep it visually lightweight in the hero — it's secondary to the JD Analyzer CTA
- Consider rate-limiting the lead endpoint to prevent spam

---

**Created:** 2026-02-09
**Last Updated:** 2026-02-09
**Implemented By:** Claude Code
