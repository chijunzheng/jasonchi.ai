# Feature: Live Eval Backend

**ID:** F22
**Status:** ⬜ Not Started
**Priority:** High
**Estimated Complexity:** Large
**Dependencies:** F20

## Description

Run a shadow naive pipeline in parallel with every reflective query. Use LLM-as-judge to score both strategies on faithfulness, context precision, answer relevance, token usage, and latency. Stream comparison as a new `eval` SSE event.

## Acceptance Criteria

- [ ] Shadow naive pipeline runs in parallel (non-blocking) on every chat query
- [ ] LLM-as-judge scores: faithfulness, context precision, answer relevance
- [ ] Token count and latency tracked for both strategies
- [ ] Comparison + verdict streamed as `eval` SSE event after answer completes
- [ ] Judge uses Gemini Flash for minimal overhead
- [ ] Eval is non-blocking: user gets answer immediately, eval arrives after

## New Files

### `backend/eval/__init__.py` (~5 lines)

Package init.

### `backend/eval/shadow_runner.py` (~80 lines)

```python
async def run_naive_shadow(query: str, conversation_history: list, category: str | None) -> NaiveResult:
    """Run the naive 'load everything' pipeline in parallel."""
    # Load all content → single LLM call → return answer + metrics
```

### `backend/eval/judge.py` (~120 lines)

```python
async def judge_faithfulness(answer: str, context: str) -> float
async def judge_relevance(question: str, answer: str) -> float
async def judge_precision(answer: str, chunks: list[str]) -> float
```

### `backend/eval/metrics.py` (~60 lines)

```python
@dataclass(frozen=True)
class StrategyMetrics:
    answer: str
    faithfulness: float
    context_precision: float
    answer_relevance: float
    tokens_used: int
    latency_ms: float
    propositions_matched: int | None
    sources_used: tuple[str, ...]

@dataclass(frozen=True)
class EvalComparison:
    reflective: StrategyMetrics
    naive: StrategyMetrics
    improvement: dict[str, str]
    verdict: str
```

## Modified Files

### `backend/main.py`

Chat endpoint: after streaming the main answer, run shadow + judge in parallel, then stream `eval` event:

```python
# After main answer streams...
eval_comparison = await run_eval_comparison(query, reflective_result, state)
yield f"data: {json.dumps({'type': 'eval', 'content': eval_comparison})}\n\n"
```

## SSE Event: `eval`

```json
{
  "type": "eval",
  "content": {
    "reflective": { "answer": "...", "faithfulness": 0.92, ... },
    "naive": { "answer": "...", "faithfulness": 0.78, ... },
    "improvement": { "faithfulness": "+17.9%", ... },
    "verdict": "Reflective used 85% fewer tokens..."
  }
}
```

## Implementation Checklist

- [ ] Create `backend/eval/__init__.py`
- [ ] Implement `shadow_runner.py` — naive pipeline (load all → answer)
- [ ] Implement `judge.py` — faithfulness, relevance, precision scoring
- [ ] Implement `metrics.py` — StrategyMetrics + EvalComparison dataclasses
- [ ] Wire into `main.py` chat endpoint — run shadow + judge after answer
- [ ] Stream `eval` SSE event with comparison data
- [ ] Verify eval data arrives after answer, doesn't block streaming

---

**Created:** 2026-02-10
**Last Updated:** 2026-02-10
