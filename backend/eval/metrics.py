"""Metric dataclasses and comparison logic for eval framework."""

from dataclasses import dataclass


@dataclass(frozen=True)
class StrategyMetrics:
    """Metrics collected from a single strategy execution."""

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
    """Side-by-side comparison of reflective vs naive strategies."""

    reflective: StrategyMetrics
    naive: StrategyMetrics
    improvement: dict[str, str]
    verdict: str


def compute_improvement(reflective: StrategyMetrics, naive: StrategyMetrics) -> dict[str, str]:
    """Compute percentage improvement for each metric."""
    improvements: dict[str, str] = {}

    if naive.faithfulness > 0:
        delta = ((reflective.faithfulness - naive.faithfulness) / naive.faithfulness) * 100
        improvements["faithfulness"] = f"{delta:+.1f}%"
    else:
        improvements["faithfulness"] = "N/A"

    if naive.context_precision > 0:
        delta = ((reflective.context_precision - naive.context_precision) / naive.context_precision) * 100
        improvements["contextPrecision"] = f"{delta:+.1f}%"
    else:
        improvements["contextPrecision"] = "N/A"

    if naive.answer_relevance > 0:
        delta = ((reflective.answer_relevance - naive.answer_relevance) / naive.answer_relevance) * 100
        improvements["answerRelevance"] = f"{delta:+.1f}%"
    else:
        improvements["answerRelevance"] = "N/A"

    if naive.tokens_used > 0:
        saved = ((naive.tokens_used - reflective.tokens_used) / naive.tokens_used) * 100
        improvements["tokensSaved"] = f"{saved:.1f}%"
    else:
        improvements["tokensSaved"] = "N/A"

    latency_diff = reflective.latency_ms - naive.latency_ms
    improvements["latencyOverhead"] = f"{latency_diff:+.0f}ms"

    return improvements


def generate_verdict(reflective: StrategyMetrics, naive: StrategyMetrics) -> str:
    """Generate a human-readable verdict comparing the two strategies."""
    parts: list[str] = []

    if naive.tokens_used > 0:
        token_savings = ((naive.tokens_used - reflective.tokens_used) / naive.tokens_used) * 100
        if token_savings > 0:
            parts.append(f"Reflective used {token_savings:.0f}% fewer tokens")

    if reflective.faithfulness > naive.faithfulness:
        parts.append("with higher faithfulness")
    elif reflective.faithfulness < naive.faithfulness:
        parts.append("but with slightly lower faithfulness")

    if reflective.context_precision > naive.context_precision + 0.1:
        parts.append("Targeted retrieval produced a more specific answer with concrete details")

    latency_diff = reflective.latency_ms - naive.latency_ms
    if latency_diff > 100:
        parts.append(f"at a cost of {latency_diff:.0f}ms additional latency")

    return ". ".join(parts) + "." if parts else "Both strategies performed similarly."


def comparison_to_dict(comparison: EvalComparison) -> dict:
    """Serialize an EvalComparison to a JSON-compatible dict."""
    return {
        "reflective": {
            "answer": comparison.reflective.answer,
            "faithfulness": comparison.reflective.faithfulness,
            "contextPrecision": comparison.reflective.context_precision,
            "answerRelevance": comparison.reflective.answer_relevance,
            "tokensUsed": comparison.reflective.tokens_used,
            "latencyMs": round(comparison.reflective.latency_ms, 1),
            "propositionsMatched": comparison.reflective.propositions_matched,
            "sourcesUsed": list(comparison.reflective.sources_used),
        },
        "naive": {
            "answer": comparison.naive.answer,
            "faithfulness": comparison.naive.faithfulness,
            "contextPrecision": comparison.naive.context_precision,
            "answerRelevance": comparison.naive.answer_relevance,
            "tokensUsed": comparison.naive.tokens_used,
            "latencyMs": round(comparison.naive.latency_ms, 1),
            "propositionsMatched": comparison.naive.propositions_matched,
            "sourcesUsed": list(comparison.naive.sources_used),
        },
        "improvement": comparison.improvement,
        "verdict": comparison.verdict,
    }
