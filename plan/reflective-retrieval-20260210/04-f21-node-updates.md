# Feature: JD Analyzer & Cover Letter Node Updates

**ID:** F21
**Status:** ⬜ Not Started
**Priority:** Medium
**Estimated Complexity:** Small
**Dependencies:** F18

## Description

Update `jd_analyzer_node` and `cover_letter_node` to use `ContentIndex` for targeted content retrieval instead of `get_all_content()`. Use `full_context` for relevant categories.

## Acceptance Criteria

- [ ] JD analyzer uses `ContentIndex.get_full_category()` for work-experience, projects, skills
- [ ] Cover letter uses `ContentIndex.get_full_category()` for same categories
- [ ] Trace steps updated to reflect tool usage: `full_context(["work-experience", "projects", "skills"])`
- [ ] Both nodes still function correctly with existing API contracts

## Modified Files

### `backend/graph/nodes/jd_analyzer.py`

Replace:
```python
resume_content = get_all_content()
```
With:
```python
from graph.tools.content_index import get_content_index
index = get_content_index()
resume_content = index.get_full_category(["work-experience", "projects", "skills"])
```

### `backend/graph/nodes/cover_letter.py`

Same pattern: replace `get_all_content()` with targeted `ContentIndex` calls.

## Implementation Checklist

- [ ] Update jd_analyzer.py imports and content retrieval
- [ ] Update cover_letter.py imports and content retrieval
- [ ] Update trace tool_calls to reflect new retrieval method
- [ ] Verify JD analysis endpoint still works
- [ ] Verify cover letter endpoint still works

---

**Created:** 2026-02-10
**Last Updated:** 2026-02-10
