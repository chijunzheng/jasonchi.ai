# Original Plan: Reflective Chat Streaming + Latency Fix

**Created:** 2026-02-18

## Goal
Make post-JD follow-up queries stream tokens immediately and reduce end-to-end latency without degrading response quality.

## Scope
1. Add streaming path for reflective (non-category) QA queries.
2. Remove expensive full-resume safety-net retry that causes 20k+ token spikes.
3. Route `/api/chat` to streaming execution for both fast-path and reflective-path when shadow eval is off.
4. Verify with backend/frontend checks and focused review.
