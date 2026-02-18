# Original Plan: Unified Chat + Embedded Profile Overview

**Created:** 2026-02-17

## Goals
1. Make chat the default/only entry view (hero page obsolete in UX).
2. Embed a condensed profile overview in chat empty state for instant recruiter context.
3. Keep profile accessible after first message via a header-triggered overview modal/sheet.
4. Ensure chips/actions send direct chat queries.
5. Rename CTA copy from "Analyze a JD" to "Analyze a Job Description" and prioritize it.
6. Remove Back button from chat header.

## Implementation
- Simplify `frontend/src/app/page.tsx` to render chat-first layout.
- Update chat components (`chat-section`, `chat-main`, `chat-empty-state`) for overview UX.
- Add reusable `profile-overview` chat component composed from existing hero building blocks.
- Update hero CTA button ordering/labels and rename lingering "JD" labels in UI text.
- Verify with lint/type checks and diff review.
