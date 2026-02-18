# Feature: Retrieval Tools & State Updates

**ID:** F19
**Status:** ⬜ Not Started
**Priority:** Critical
**Estimated Complexity:** Medium
**Dependencies:** F18

## Description

Create three A-RAG-style retrieval tools the agent selects from (quick_scan, deep_retrieve, full_context), and extend `TraceStep` with retrieval-specific fields for transparent trace display.

## Acceptance Criteria

- [ ] `quick_scan(query)` — keyword matching + category summaries, for simple factual Qs
- [ ] `deep_retrieve(query, categories?)` — semantic search over propositions, for specific experience Qs
- [ ] `full_context(categories)` — loads complete category content, for broad Qs / cover letters
- [ ] Each tool returns `RetrievalResult` with content, sources, method, confidence metadata
- [ ] `TraceStep` extended with: retrieval_decision, retrieval_method, sources_used, confidence_score, quality_check
- [ ] Context tracker prevents duplicate retrieval of same propositions

## New Files

### `backend/graph/tools/retrieval_tools.py` (~120 lines)

```python
@dataclass(frozen=True)
class RetrievalResult:
    content: str
    sources: tuple[str, ...]
    method: str                 # "quick_scan" | "deep_retrieve" | "full_context"
    propositions_matched: int
    tokens_used: int

def quick_scan(query: str) -> RetrievalResult
def deep_retrieve(query: str, categories: list[str] | None = None) -> RetrievalResult
def full_context(categories: list[str]) -> RetrievalResult
```

## Modified Files

### `backend/graph/state.py`

Add to `TraceStep`:
```python
retrieval_decision: str | None = None     # "skipped: high confidence" / "needed: low on X"
retrieval_method: str | None = None       # "quick_scan" | "deep_retrieve" | "full_context"
sources_used: list[str] = Field(default_factory=list)  # ["work-experience::section-2"]
confidence_score: float | None = None     # Self-assessed 0-1
quality_check: str | None = None          # "sufficient" | "corrective retrieval triggered"
```

## Implementation Checklist

- [ ] Create `RetrievalResult` dataclass
- [ ] Implement `quick_scan()` using `ContentIndex.keyword_search()` + summaries
- [ ] Implement `deep_retrieve()` using `ContentIndex.semantic_search()`
- [ ] Implement `full_context()` using `ContentIndex.get_full_category()`
- [ ] Add context tracker (set of seen proposition IDs) to prevent dupes
- [ ] Extend `TraceStep` with retrieval fields
- [ ] Update `_trace_to_dict()` in `main.py` to serialize new fields

---

**Created:** 2026-02-10
**Last Updated:** 2026-02-10
