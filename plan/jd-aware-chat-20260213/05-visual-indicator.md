# Feature: Visual Indicator + Empty State Nudge

**ID:** 05
**Status:** ✅ Completed
**Priority:** Medium
**Estimated Complexity:** Low
**Dependencies:** 01

## Description

Show a dismissible chip in the chat header when JD context is active (displaying match level). Clicking X clears the context and reverts to generic chat. Add a subtle nudge in the empty state encouraging users to try the JD Analyzer.

## Acceptance Criteria

- [x] JD chip shows in header bar when `jdContext` is set
- [x] Chip displays "Tailored to: [matchLevel]" with FileSearch icon
- [x] X button on chip calls `onClearJdContext` to dismiss
- [x] Empty state includes "Have a specific role? Try the JD Analyzer" nudge
- [x] No visual changes when JD context is null (no regression)

## Files Modified

- `frontend/src/components/chat/chat-main.tsx` - Added `jdContext`/`onClearJdContext` props, dismissible chip in header
- `frontend/src/components/chat/chat-empty-state.tsx` - Added JD nudge text with FileSearch icon

## Key Decisions

- **matchLevel displayed (not role title):** JD text doesn't have a structured role field; matchLevel ("Strong Match", "Good Match") is always available from analysis
- **Chip uses `ml-auto`:** Pushed to right side of header, doesn't interfere with category label or back button
- **Nudge is text-only:** No button/link — it's a subtle hint, not a CTA that competes with starter prompts

---

**Created:** 2026-02-13
**Implemented By:** Claude
