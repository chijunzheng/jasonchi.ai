# Feature: Session Summary

**ID:** F10
**Tier:** 4 — Engagement
**Status:** ✅ Completed
**Priority:** Medium
**Estimated Complexity:** Medium
**Dependencies:** F6

## Description

After 3+ messages exchanged, offer a session summary that Gemini generates from the conversation. Users can copy it as markdown or open a pre-filled mailto: link — designed for recruiters to quickly share findings with their team.

## Acceptance Criteria

- [ ] Summary prompt appears after 3+ messages exchanged
- [ ] `POST /api/session-summary` generates structured summary from conversation
- [ ] Summary includes: key topics discussed, candidate highlights, recommended next steps
- [ ] Copy as markdown button
- [ ] "Email this summary" opens mailto: with pre-filled subject and body
- [ ] Non-intrusive UI (collapsible panel or floating card)
- [ ] Summary regenerates if more conversation happens after initial summary

## Implementation Details

### Files to Create

- `frontend/src/app/api/session-summary/route.ts` — Summary generation endpoint
- `frontend/src/components/chat/session-summary.tsx` — Summary display component

### API Contract

```typescript
// Request
POST /api/session-summary
{ messages: { role: string, content: string }[] }

// Response
{
  summary: string           // Markdown formatted
  keyTopics: string[]       // 3-5 topics discussed
  highlights: string[]      // Key takeaways about the candidate
  nextSteps: string[]       // Recommended actions
}
```

### Summary Display

```
┌─────────────────────────────────────────┐
│ Session Summary                  [Copy] │
│                               [Email ↗] │
├─────────────────────────────────────────┤
│ Topics: Work Experience, AI Projects    │
│                                         │
│ Key Highlights:                         │
│ - 5+ years AI/ML experience            │
│ - Built multi-agent systems at scale    │
│                                         │
│ Recommended Next Steps:                 │
│ - Schedule technical deep-dive          │
│ - Review ShowMe project demo            │
└─────────────────────────────────────────┘
```

### Technical Decisions

- **3-message threshold:** Enough context for meaningful summary, not too aggressive
- **Markdown output:** Universal format, easy to paste into Slack/email/docs
- **mailto: over direct email:** No email infrastructure needed, user controls sending

## Dependencies

### Depends On
- **F6:** Needs conversation data from chat integration

### Blocks
- None

## Testing Requirements

- [ ] Summary doesn't appear before 3 messages
- [ ] Summary appears after 3+ messages
- [ ] Generated summary is relevant to conversation
- [ ] Copy-to-clipboard works
- [ ] mailto: link opens with pre-filled content

## Implementation Checklist

- [ ] Create app/api/session-summary/route.ts
- [ ] Add summary prompt to lib/prompts.ts
- [ ] Create session-summary.tsx component
- [ ] Add message count tracking to use-chat.ts
- [ ] Wire summary trigger logic
- [ ] Test with various conversation lengths

## Notes

- The summary is a conversion tool — it gives recruiters something tangible to share internally
- Don't auto-generate on every message after 3 — show a "Generate Summary" button that appears
- The mailto: body should be URL-encoded markdown that renders well in email clients

---

**Created:** 2026-02-09
**Last Updated:** 2026-02-09
**Implemented By:** Claude Code
