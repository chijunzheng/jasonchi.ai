# Feature: Batch Eval CLI

**ID:** F25
**Status:** ⬜ Not Started
**Priority:** Medium
**Estimated Complexity:** Medium
**Dependencies:** F18, F20

## Description

A CLI runner for a curated 50-question evaluation dataset that benchmarks reflective vs naive retrieval strategies. Useful during development and for CI.

## Acceptance Criteria

- [ ] 50 curated test questions across 5 difficulty tiers
- [ ] Each question has ground truth: expected categories, difficulty, reference answer
- [ ] CLI runner executes all questions through both strategies
- [ ] Produces comparison table with aggregate metrics
- [ ] Runnable via `python -m backend.eval.runner`

## New Files

### `backend/eval/dataset.py` (~100 lines)

```python
@dataclass(frozen=True)
class EvalQuestion:
    question: str
    expected_categories: tuple[str, ...]
    difficulty: str  # trivial | single_fact | category | cross | global
    ground_truth_answer: str
```

50 questions across 5 tiers:
| Tier | Count | Example |
|------|-------|---------|
| Trivial | 10 | "What's your name?" |
| Single-fact | 10 | "What language is this site built in?" |
| Category-specific | 10 | "Tell me about your AWS experience" |
| Cross-category | 10 | "How do your skills relate to your projects?" |
| Global/abstract | 10 | "What makes you unique as a candidate?" |

### `backend/eval/runner.py` (~150 lines)

```python
async def run_eval(strategy: str, dataset: list[EvalQuestion]) -> EvalResults
async def compare_strategies() -> ComparisonReport
```

CLI entry point: `python -m backend.eval.runner`

Output: formatted table comparing naive vs reflective across all metrics, grouped by difficulty tier.

## Implementation Checklist

- [ ] Create `EvalQuestion` dataclass
- [ ] Write 50 curated questions (10 per tier)
- [ ] Implement `run_eval()` — run all questions through a strategy
- [ ] Implement `compare_strategies()` — side-by-side comparison
- [ ] Add CLI entry point with `__main__` block
- [ ] Format output as readable table
- [ ] Test with a few questions to verify end-to-end flow

---

**Created:** 2026-02-10
**Last Updated:** 2026-02-10
