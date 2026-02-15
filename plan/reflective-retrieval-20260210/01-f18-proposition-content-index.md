# Feature: Proposition & Content Index

**ID:** F18
**Status:** ⬜ Not Started
**Priority:** Critical (Foundation)
**Estimated Complexity:** Large
**Dependencies:** F16, F17

## Description

Build the retrieval foundation: decompose all 6 content files into atomic propositions at startup, compute embeddings, and provide a unified `ContentIndex` with keyword search, semantic search, section-level, and full-file access. Also add retrieval-specific prompt templates.

## Acceptance Criteria

- [ ] `Proposition` dataclass with id, text, category, section, parent_chunk, keywords
- [ ] Gemini Flash decomposes each content file into propositions at startup
- [ ] `@lru_cache` ensures propositions are computed once per process
- [ ] `ContentIndex` provides: `keyword_search()`, `semantic_search()`, `get_section()`, `get_full_category()`, `get_all_summaries()`
- [ ] `text-embedding-004` embeds all propositions, stored as numpy array in memory
- [ ] Cosine similarity search over in-memory numpy array (sub-ms for ~100 vectors)
- [ ] Category summaries generated at startup (1-paragraph per category)
- [ ] Retrieval prompts: ASSESS_PROMPT, EVALUATE_PROMPT, DECOMPOSE_PROMPT
- [ ] `embedding_model` setting added to config.py
- [ ] `numpy` added to requirements.txt

## New Files

### `backend/graph/tools/proposition_index.py` (~150 lines)

```python
@dataclass(frozen=True)
class Proposition:
    id: str                    # "work-experience::0::3"
    text: str                  # "Led migration of monolith to microservices at Company X"
    category: str              # "work-experience"
    section: str               # "What I Did"
    parent_chunk: str          # Original paragraph
    keywords: frozenset[str]   # Extracted keywords
```

- One Gemini Flash call per file at startup (6 calls, ~2-3s, cached)
- Yields ~50-100 propositions for the full corpus
- `@lru_cache` for persistence across requests

### `backend/graph/tools/content_index.py` (~200 lines)

```python
class ContentIndex:
    propositions: list[Proposition]
    sections: dict[str, list[Section]]
    full_files: dict[str, str]
    summaries: dict[str, str]
    embeddings: np.ndarray

    def keyword_search(query, top_k=10) -> list[Proposition]
    def semantic_search(query, top_k=5) -> list[Proposition]
    def get_section(category, section) -> str
    def get_full_category(category) -> str
    def get_all_summaries() -> str
```

### `backend/prompts/retrieval_prompts.py` (~80 lines)

- `ASSESS_PROMPT` — confidence assessment + retrieval planning
- `EVALUATE_PROMPT` — quality checking retrieved context
- `DECOMPOSE_PROMPT` — proposition extraction instruction

## Modified Files

### `backend/config.py`
- Add `embedding_model: str = "models/text-embedding-004"`

### `backend/requirements.txt`
- Add `numpy>=1.26.0,<3.0.0`
- Add `google-genai` (for embeddings API)

## Implementation Checklist

- [ ] Create `Proposition` and `Section` dataclasses in `proposition_index.py`
- [ ] Implement `decompose_content()` using Gemini Flash + DECOMPOSE_PROMPT
- [ ] Implement `build_propositions()` with `@lru_cache` caching
- [ ] Create `ContentIndex` class with all search methods
- [ ] Implement keyword search (case-insensitive token matching)
- [ ] Implement embedding computation via `text-embedding-004`
- [ ] Implement semantic search (cosine similarity over numpy array)
- [ ] Generate category summaries at startup
- [ ] Write ASSESS_PROMPT, EVALUATE_PROMPT, DECOMPOSE_PROMPT
- [ ] Add config + requirements changes
- [ ] Verify: startup builds index in <5s, search returns relevant results

---

**Created:** 2026-02-10
**Last Updated:** 2026-02-10
