# Feature: JD Analyzer

**ID:** F7
**Tier:** 3 — JD Analysis
**Status:** ✅ Completed
**Priority:** High
**Estimated Complexity:** Large
**Dependencies:** F0, F1, F5

## Description

Build the JD (Job Description) Analyzer that lets recruiters paste a job description and get an instant fit analysis with match score, strengths, gaps, and recommended positioning angle. Uses Gemini Pro for higher analysis quality.

## Acceptance Criteria

- [ ] Modal dialog for pasting JD text
- [ ] `POST /api/analyze-jd` returns structured JSON analysis
- [ ] SVG circular progress with count-up fill animation for match score
- [ ] Strengths listed with green indicators
- [ ] Gaps listed with amber indicators and constructive framing
- [ ] Recommended positioning angle section
- [ ] Interview questions to ask section
- [ ] Response validated with Zod schema before rendering
- [ ] "Generate Cover Letter" CTA after analysis
- [ ] "Discuss in Chat" CTA to continue conversation about the analysis
- [ ] Loading state with skeleton/spinner during analysis
- [ ] Handles empty/invalid JD input gracefully

## Implementation Details

### Files to Create

- `frontend/src/app/api/analyze-jd/route.ts` — JD analysis endpoint
- `frontend/src/components/jd-analyzer/jd-analyzer-modal.tsx` — Main modal
- `frontend/src/components/jd-analyzer/match-score.tsx` — SVG circular progress
- `frontend/src/components/jd-analyzer/strengths-list.tsx` — Green strength items
- `frontend/src/components/jd-analyzer/gaps-list.tsx` — Amber gap items
- `frontend/src/components/jd-analyzer/analysis-results.tsx` — Results container
- `frontend/src/types/jd-analysis.ts` — Zod schemas + TypeScript types

### API Contract

```typescript
// Request
POST /api/analyze-jd
{ jobDescription: string }

// Response (validated by Zod)
{
  matchScore: number        // 0-100
  matchLevel: string        // "Strong Match" | "Good Match" | "Partial Match"
  strengths: string[]       // 3-5 items
  gaps: string[]            // 1-3 items
  angle: string             // Positioning advice
  interviewQuestions: string[]  // 3-5 questions
}
```

### Zod Schema

```typescript
// types/jd-analysis.ts
import { z } from 'zod'

export const JDAnalysisSchema = z.object({
  matchScore: z.number().min(0).max(100),
  matchLevel: z.enum(['Strong Match', 'Good Match', 'Partial Match', 'Weak Match']),
  strengths: z.array(z.string()).min(2).max(6),
  gaps: z.array(z.string()).max(4),
  angle: z.string(),
  interviewQuestions: z.array(z.string()).min(2).max(6),
})

export type JDAnalysis = z.infer<typeof JDAnalysisSchema>
```

### Match Score Component

```
SVG circular progress:
- Outer ring: gray track
- Inner ring: colored fill (green >75, amber 50-75, red <50)
- Center: score number with count-up animation
- Below: matchLevel text
```

### Technical Decisions

- **Gemini Pro over Flash:** JD analysis requires deeper reasoning — Pro produces higher quality structured output
- **Zod validation on response:** Gemini's JSON output can be malformed. Zod catches issues before rendering.
- **Modal over page:** Keeps user on the main page, analysis feels like a quick tool not a separate flow
- **"Discuss in Chat" CTA:** Sends analysis context into the chat conversation for follow-up questions

## Dependencies

### Depends On
- **F0:** shadcn dialog, design tokens
- **F1:** Content loader for full resume context
- **F5:** Gemini client patterns, rate limiting

### Blocks
- **F8:** Cover Letter Generator uses analysis results
- **F14:** Accessibility audit covers modal interactions

## Testing Requirements

- [ ] Empty JD input shows validation error
- [ ] Valid JD returns structured analysis
- [ ] Match score animation renders correctly
- [ ] Strengths and gaps display with correct styling
- [ ] Zod validation catches malformed Gemini responses
- [ ] Modal opens and closes correctly
- [ ] "Generate Cover Letter" CTA is functional
- [ ] "Discuss in Chat" sends context to chat
- [ ] Loading state shows during analysis (3-8 seconds typical)

## Security Considerations

- [ ] JD text sanitized before sending to API
- [ ] Rate limiting applied (reuse from F5)
- [ ] No JD text stored server-side
- [ ] Input length capped (prevent token abuse)

## Implementation Checklist

- [ ] Install zod dependency
- [ ] Create types/jd-analysis.ts with Zod schema
- [ ] Create app/api/analyze-jd/route.ts
- [ ] Create match-score.tsx SVG component
- [ ] Create strengths-list.tsx
- [ ] Create gaps-list.tsx
- [ ] Create analysis-results.tsx container
- [ ] Create jd-analyzer-modal.tsx
- [ ] Wire "Analyze JD" CTA from hero section
- [ ] Add loading and error states
- [ ] Test with sample JDs

## Notes

- The JD Analyzer is one of the highest-value features — it's what makes the site a *tool*, not just a portfolio
- Score should be realistic: 60-85% typical range. Never 100%, rarely below 40%
- The analysis prompt should load ALL content (not just relevant category) for comprehensive matching
- Consider caching analysis results in sessionStorage to avoid re-analyzing same JD

---

**Created:** 2026-02-09
**Last Updated:** 2026-02-09
**Implemented By:** Claude Code
