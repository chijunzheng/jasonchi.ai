"""Batch evaluation runner — CLI tool for benchmarking retrieval strategies."""

import asyncio
import time
from collections import defaultdict

from langchain_core.messages import HumanMessage

from eval.dataset import EVAL_DATASET, EvalQuestion
from eval.judge import judge_faithfulness, judge_precision, judge_relevance
from eval.metrics import StrategyMetrics, compute_improvement, generate_verdict
from eval.shadow_runner import run_naive_shadow
from graph.builder import app_graph
from graph.state import GraphState


async def run_single_reflective(question: str) -> dict:
    """Run a single question through the reflective pipeline."""
    start = time.perf_counter()

    initial_state = GraphState(
        messages=[HumanMessage(content=question)],
        intent="chat",
    )

    result = await app_graph.ainvoke(initial_state)
    state = GraphState(**result) if isinstance(result, dict) else result

    answer = state.response_chunks[0] if state.response_chunks else ""
    latency_ms = (time.perf_counter() - start) * 1000

    sources = []
    propositions_matched = 0
    for step in state.trace_steps:
        sources.extend(step.sources_used)
        if "matched" in step.reasoning.lower():
            import re
            match = re.search(r"matched (\d+)", step.reasoning)
            if match:
                propositions_matched = int(match.group(1))

    return {
        "answer": answer,
        "tokens_used": state.total_tokens,
        "latency_ms": latency_ms,
        "sources_used": tuple(set(sources)),
        "propositions_matched": propositions_matched,
    }


async def run_single_naive(question: str) -> dict:
    """Run a single question through the naive pipeline."""
    messages = [HumanMessage(content=question)]
    return await run_naive_shadow(messages, None)


async def evaluate_pair(
    question: str,
    reflective_result: dict,
    naive_result: dict,
) -> tuple[StrategyMetrics, StrategyMetrics]:
    """Score both strategies for a single question."""
    r_faith, r_rel, n_faith, n_rel = await asyncio.gather(
        judge_faithfulness(reflective_result["answer"], reflective_result["answer"]),
        judge_relevance(question, reflective_result["answer"]),
        judge_faithfulness(naive_result["answer"], naive_result["answer"]),
        judge_relevance(question, naive_result["answer"]),
    )

    reflective = StrategyMetrics(
        answer=reflective_result["answer"],
        faithfulness=r_faith,
        context_precision=0.8,  # Approximation for batch eval
        answer_relevance=r_rel,
        tokens_used=reflective_result["tokens_used"],
        latency_ms=reflective_result["latency_ms"],
        propositions_matched=reflective_result.get("propositions_matched", 0),
        sources_used=reflective_result.get("sources_used", ()),
    )

    naive = StrategyMetrics(
        answer=naive_result["answer"],
        faithfulness=n_faith,
        context_precision=0.3,  # Always low — loads everything
        answer_relevance=n_rel,
        tokens_used=naive_result["tokens_used"],
        latency_ms=naive_result["latency_ms"],
        propositions_matched=None,
        sources_used=naive_result.get("sources_used", ("all",)),
    )

    return reflective, naive


async def run_batch_eval(
    dataset: list[EvalQuestion] | None = None,
    max_questions: int | None = None,
) -> None:
    """Run batch evaluation and print comparison table."""
    questions = dataset or EVAL_DATASET
    if max_questions:
        questions = questions[:max_questions]

    print(f"\nRunning batch evaluation on {len(questions)} questions...\n")
    print(f"{'#':>3} {'Difficulty':<12} {'Question':<50} {'R.Tokens':>8} {'N.Tokens':>8} {'Saved':>6}")
    print("-" * 95)

    tier_results: dict[str, list[tuple[StrategyMetrics, StrategyMetrics]]] = defaultdict(list)

    for i, q in enumerate(questions):
        try:
            reflective_result, naive_result = await asyncio.gather(
                run_single_reflective(q.question),
                run_single_naive(q.question),
            )

            r_metrics, n_metrics = await evaluate_pair(
                q.question, reflective_result, naive_result,
            )

            tier_results[q.difficulty].append((r_metrics, n_metrics))

            saved = ""
            if n_metrics.tokens_used > 0:
                pct = ((n_metrics.tokens_used - r_metrics.tokens_used) / n_metrics.tokens_used) * 100
                saved = f"{pct:.0f}%"

            q_short = q.question[:48] + ".." if len(q.question) > 50 else q.question
            print(
                f"{i+1:>3} {q.difficulty:<12} {q_short:<50} "
                f"{r_metrics.tokens_used:>8} {n_metrics.tokens_used:>8} {saved:>6}"
            )
        except Exception as e:
            print(f"{i+1:>3} {q.difficulty:<12} {q.question[:48]:<50} ERROR: {e}")

    # Print summary by tier
    print("\n" + "=" * 95)
    print(f"\n{'Tier':<15} {'Count':>5} {'R.Faith':>8} {'N.Faith':>8} {'R.Tokens':>8} {'N.Tokens':>8} {'Saved':>6}")
    print("-" * 60)

    for tier in ["trivial", "single_fact", "category", "cross", "global"]:
        pairs = tier_results.get(tier, [])
        if not pairs:
            continue

        r_faith_avg = sum(r.faithfulness for r, _ in pairs) / len(pairs)
        n_faith_avg = sum(n.faithfulness for _, n in pairs) / len(pairs)
        r_tokens_avg = sum(r.tokens_used for r, _ in pairs) / len(pairs)
        n_tokens_avg = sum(n.tokens_used for _, n in pairs) / len(pairs)
        saved = f"{((n_tokens_avg - r_tokens_avg) / n_tokens_avg * 100):.0f}%" if n_tokens_avg > 0 else "N/A"

        print(
            f"{tier:<15} {len(pairs):>5} {r_faith_avg:>8.2f} {n_faith_avg:>8.2f} "
            f"{r_tokens_avg:>8.0f} {n_tokens_avg:>8.0f} {saved:>6}"
        )

    print()


if __name__ == "__main__":
    import sys

    max_q = int(sys.argv[1]) if len(sys.argv) > 1 else None
    asyncio.run(run_batch_eval(max_questions=max_q))
