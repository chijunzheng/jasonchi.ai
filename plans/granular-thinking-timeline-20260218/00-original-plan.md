# Original Plan: Granular Thinking Timeline UX

**Created:** 2026-02-18

## Goal
Make processing feel transparent during long answer generation by showing granular, step-based progress that updates/passes over like ChatGPT.

## Scope
1. Define a normalized set of processing phases for chat loading UX.
2. Add a frontend timeline indicator that shows active + completed steps.
3. Keep backend status events as source-of-truth and add client-side staged hints for the long drafting phase before first token.
4. Ensure timeline clears cleanly on first streamed token, `done`, and errors.
