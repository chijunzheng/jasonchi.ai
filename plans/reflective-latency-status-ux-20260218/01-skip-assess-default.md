# Feature: Skip Assess LLM by Default

**ID:** 01
**Status:** ✅ Completed
**Priority:** High
**Dependencies:** -

## Description
Bypass the reflective assess LLM call and use a deterministic deep-retrieve plan to cut first-token latency.

## Acceptance Criteria
- [x] Reflective path can skip assess via config.
- [x] Default behavior is latency-first.
- [x] Trace remains compatible with existing UI.

## Implementation Notes
- Added `skip_assessment_for_reflective` in `backend/config.py`.
- Added `_assess_or_default` and `_default_reflective_plan` in `backend/graph/nodes/qa.py`.
- Routed reflective paths to `_assess_or_default`.
