# Feature: Reflective QA Pipeline Rewrite

**ID:** F20
**Status:** ⬜ Not Started
**Priority:** Critical (Core)
**Estimated Complexity:** Large
**Dependencies:** F18, F19

## Description

Rewrite `qa_node` from a single "load everything → answer" call into a 3-phase reflective pipeline: Assess (Self-RAG) → Retrieve (A-RAG tools) → Evaluate+Answer (CRAG). The fast path for category-scoped queries skips assessment.

## Acceptance Criteria

- [ ] Phase A (Assess): LLM assesses confidence, outputs retrieval plan. Skip to answer if confidence > 0.7
- [ ] Phase B (Retrieve): Execute planned tool calls via retrieval_tools. Context tracker prevents dupes
- [ ] Phase C (Evaluate+Answer): LLM evaluates sufficiency. If < 0.6, corrective re-retrieval. If >= 0.6, generate answer
- [ ] Fast path: category queries skip Phase A, go directly to targeted retrieval
- [ ] Max 3-4 LLM calls for complex queries; 1-2 for simple ones
- [ ] Each phase produces a TraceStep with retrieval metadata
- [ ] Follow-up generation preserved

## Query Flow

```
User Query
    │
    ▼
┌─────────────────────────────────────┐
│  Phase A: ASSESS (Self-RAG)         │
│  "Can I answer without retrieval?"  │
│  Output: confidence + retrieval plan│
│  If confidence > 0.7 → skip to C   │
└──────────────┬──────────────────────┘
               │ confidence < 0.7
               ▼
┌─────────────────────────────────────┐
│  Phase B: RETRIEVE (A-RAG tools)    │
│  Agent selects: quick_scan |        │
│    deep_retrieve | full_context     │
│  Context tracker prevents dupes     │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  Phase C: EVALUATE (CRAG)           │
│  "Is retrieved context sufficient?" │
│  If < 0.6 → corrective re-retrieve │
│  If ≥ 0.6 → generate answer        │
└──────────────┬──────────────────────┘
               ▼
           ANSWER (returned)
```

## Modified Files

### `backend/graph/nodes/qa.py` (major rewrite)

Current: `get_all_content()` → one `llm.ainvoke()` → return
New: 3-phase reflective loop

```python
async def qa_node(state: GraphState) -> dict:
    # Fast path: category query → skip assess
    if state.category and state.category in CATEGORY_INSTRUCTIONS:
        return await _fast_path(state)

    # Phase A: Assess
    assess_result = await _assess(state)
    if assess_result.confidence > 0.7:
        return await _answer_with_context(state, assess_result.context, assess_result)

    # Phase B: Retrieve
    retrieval_result = _retrieve(state, assess_result.plan)

    # Phase C: Evaluate + Answer
    return await _evaluate_and_answer(state, retrieval_result, assess_result)
```

## Latency Budget

| Step | Latency | LLM Calls |
|------|---------|-----------|
| Assess | ~300ms | 1 (small prompt) |
| Retrieve | ~50ms | 0 (in-memory) |
| Evaluate + Answer | ~800ms | 1 (merged if confidence high) |
| **Simple query total** | **~1000ms** | **1-2** |
| **Complex query total** | **~1500ms** | **3-4** |

## Implementation Checklist

- [ ] Implement `_assess()` — calls Gemini with ASSESS_PROMPT, parses confidence + retrieval plan
- [ ] Implement `_retrieve()` — dispatches to retrieval_tools based on plan
- [ ] Implement `_evaluate_and_answer()` — EVALUATE_PROMPT + answer generation, corrective loop
- [ ] Implement `_fast_path()` — category-scoped direct retrieval (current behavior enhanced)
- [ ] Implement `_answer_with_context()` — shared answer generation with trace
- [ ] Each phase creates TraceStep with full retrieval metadata
- [ ] Follow-up generation preserved via `_generate_follow_ups()`
- [ ] Track total tokens/latency across all phases

---

**Created:** 2026-02-10
**Last Updated:** 2026-02-10
