# Feature: Cover Letter Generator

**ID:** F8
**Tier:** 3 — JD Analysis
**Status:** ✅ Completed
**Priority:** Medium
**Estimated Complexity:** Small
**Dependencies:** F7

## Description

Generate tailored cover letters using the JD analysis results and full resume content as context. Streams the response and provides copy/download options.

## Acceptance Criteria

- [ ] `POST /api/cover-letter` streams a cover letter response
- [ ] Uses JD analysis results + full resume content as context
- [ ] Cover letter output displays in readable format
- [ ] Copy-to-clipboard button with confirmation
- [ ] Download as .txt file
- [ ] Loading state during generation
- [ ] Cover letter is 300-400 words, specific to the JD

## Implementation Details

### Files to Create

- `frontend/src/app/api/cover-letter/route.ts` — Streaming cover letter endpoint
- `frontend/src/components/jd-analyzer/cover-letter-output.tsx` — Display with copy/download

### API Contract

```typescript
// Request
POST /api/cover-letter
{
  jobDescription: string
  analysis: JDAnalysis     // From previous analyze-jd call
  companyName?: string
  roleTitle?: string
}

// Response: SSE stream (same format as chat)
data: {"type": "text", "content": "Dear "}
data: {"type": "text", "content": "Hiring Manager..."}
data: {"type": "done"}
```

### Cover Letter Output

```
┌─────────────────────────────────────────┐
│ Generated Cover Letter          [Copy] │
│                                [Download]│
├─────────────────────────────────────────┤
│                                         │
│ Dear Hiring Manager,                    │
│                                         │
│ I'm excited about the ML Engineer       │
│ position at [Company]...                │
│                                         │
│ [Streaming text with typing effect]     │
│                                         │
└─────────────────────────────────────────┘
```

### Technical Decisions

- **Streaming over JSON:** Cover letter is long-form text — streaming provides better UX
- **Reuses F7's analysis:** No need to re-analyze the JD. Analysis results provide structured context for the cover letter prompt.
- **Download as .txt:** Simplest format. User can paste into any document.

## Dependencies

### Depends On
- **F7:** JD analysis results used as context

### Blocks
- None

## Testing Requirements

- [ ] Cover letter generates and streams correctly
- [ ] Copy-to-clipboard works
- [ ] Download produces valid .txt file
- [ ] Cover letter references specific JD requirements
- [ ] Loading state shows during generation

## Implementation Checklist

- [ ] Create app/api/cover-letter/route.ts
- [ ] Add cover letter prompt to lib/prompts.ts
- [ ] Create cover-letter-output.tsx with copy/download
- [ ] Wire "Generate Cover Letter" CTA from analysis results
- [ ] Test with various JDs

## Notes

- The cover letter prompt should explicitly reference strengths from the analysis and address gaps constructively
- Company name and role title should be extracted from the JD if possible
- Keep cover letters to 300-400 words — respect recruiters' time

---

**Created:** 2026-02-09
**Last Updated:** 2026-02-09
**Implemented By:** Claude Code
