# Original Plan: Chat Latency Optimization

**Date:** 2026-02-12  
**Issue:** First chat request takes ~77s (index build ~65s + generation ~12s), which is too slow for interactive UX.

## Goal

Reduce first-response latency and steady-state response latency without changing API contract.

## Root Cause Evidence

- `content_index` is built lazily on first chat request.
- `work-experience.md` (~18k chars) triggers LLM proposition decomposition in index build, dominating startup latency.
- Fast-path QA loads full category context, resulting in large prompts and slower answer generation.
- Follow-up suggestions trigger an extra LLM call for every answer.

## Implementation Plan

1. Make LLM index enrichment opt-in (disabled by default):
   - Proposition decomposition via LLM.
   - Long-section LLM summaries.
2. Keep deterministic/heuristic indexing and summaries as default fast path.
3. Add QA fast-path context size cap to reduce prompt tokens for large categories.
4. Disable LLM follow-up generation by default and use deterministic follow-ups.
5. Prewarm content index in background at backend startup.
6. Validate syntax and run targeted runtime checks.

## Acceptance Criteria

- First request avoids LLM-heavy cold-start indexing by default.
- Category fast-path requests use bounded prompt context.
- Follow-up generation no longer requires a second LLM call by default.
- Behavior remains configurable via settings/env overrides.
