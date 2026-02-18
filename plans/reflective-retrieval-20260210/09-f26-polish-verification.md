# Feature: Polish & Verification

**ID:** F26
**Status:** ⬜ Not Started
**Priority:** Medium
**Estimated Complexity:** Small
**Dependencies:** F18-F25

## Description

Final polish pass: run batch evals, tune prompts, iterate on comparison UI, verify all integration points, and ensure both `pnpm build` and `uvicorn main:app` work correctly.

## Acceptance Criteria

- [ ] `python -m pytest` — backend tests pass
- [ ] `uvicorn main:app` — backend starts, proposition index builds in <5s
- [ ] Chat query with no category → trace shows assess/retrieve/evaluate steps
- [ ] Chat query with category → trace shows fast-path (skip assess)
- [ ] Chat query → eval comparison panel appears below answer with metrics
- [ ] Eval panel shows reflective outperforming naive on precision + faithfulness
- [ ] JD analyzer → uses ContentIndex, trace shows full_context tool
- [ ] Frontend trace panel → shows confidence gauge, source badges, reasoning
- [ ] `python -m backend.eval.runner` — batch eval runs, prints comparison table
- [ ] `pnpm build` — frontend builds without type errors

## Implementation Checklist

- [ ] Run batch eval, analyze results
- [ ] Tune ASSESS_PROMPT thresholds if needed
- [ ] Tune EVALUATE_PROMPT quality thresholds if needed
- [ ] Verify SSE event contract between backend and frontend
- [ ] Test category fast path (sidebar click → response)
- [ ] Test free-form queries (all 5 difficulty tiers)
- [ ] Verify JD analyzer still works
- [ ] Verify cover letter still works
- [ ] `pnpm build` passes
- [ ] Manual QA: test 5-10 queries, verify traces look good

---

**Created:** 2026-02-10
**Last Updated:** 2026-02-10
