"""LLM-as-judge for scoring retrieval quality metrics."""

import json
import logging
import re

logger = logging.getLogger(__name__)

from config import gemini_release, gemini_throttle
from llm_factory import make_chat_llm


def _strip_json(text: str) -> str:
    """Strip markdown code blocks from LLM JSON output."""
    text = re.sub(r"^```json\s*", "", text.strip(), flags=re.IGNORECASE)
    text = re.sub(r"^```\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text, flags=re.IGNORECASE)
    return text.strip()


def _get_judge_llm():
    """Get a Gemini instance for judging."""
    return make_chat_llm()


async def judge_faithfulness(answer: str, context: str) -> float:
    """Score how faithful the answer is to the provided context.

    Extracts claims from the answer and verifies each against context.
    Returns 0.0-1.0 where 1.0 means all claims are supported.
    """
    llm = _get_judge_llm()
    prompt = f"""Score the faithfulness of this answer to the given context.
Faithfulness means: every claim in the answer is supported by the context.

Context:
{context[:3000]}

Answer:
{answer[:2000]}

    Respond with ONLY a JSON object:
{{"score": <float 0.0-1.0>, "reasoning": "<brief explanation>"}}
"""

    try:
        await gemini_throttle()
        try:
            result = await llm.ainvoke(prompt)
        finally:
            gemini_release()
        parsed = json.loads(_strip_json(result.content))
        score = max(0.0, min(1.0, float(parsed.get("score", 0.5))))
        logger.debug("Faithfulness score: %.2f", score)
        return score
    except Exception:
        logger.exception("judge_faithfulness failed")
        return 0.5


async def judge_relevance(question: str, answer: str) -> float:
    """Score how relevant the answer is to the question.

    Returns 0.0-1.0 where 1.0 means the answer directly addresses the question.
    """
    llm = _get_judge_llm()
    prompt = f"""Score how well this answer addresses the question.
A relevant answer directly addresses what was asked with specific information.

Question: {question}

Answer:
{answer[:2000]}

    Respond with ONLY a JSON object:
{{"score": <float 0.0-1.0>, "reasoning": "<brief explanation>"}}
"""

    try:
        await gemini_throttle()
        try:
            result = await llm.ainvoke(prompt)
        finally:
            gemini_release()
        parsed = json.loads(_strip_json(result.content))
        score = max(0.0, min(1.0, float(parsed.get("score", 0.5))))
        logger.debug("Relevance score: %.2f", score)
        return score
    except Exception:
        logger.exception("judge_relevance failed")
        return 0.5


async def judge_precision(answer: str, context_chunks: list[str]) -> float:
    """Score context precision — how much retrieved context was actually used.

    Returns 0.0-1.0 where 1.0 means all retrieved content was relevant.
    """
    if not context_chunks:
        return 0.0

    llm = _get_judge_llm()
    chunks_text = "\n---\n".join(
        f"Chunk {i+1}: {chunk[:500]}"
        for i, chunk in enumerate(context_chunks[:10])
    )

    prompt = f"""For each context chunk below, determine if it was relevant to generating this answer.

Answer:
{answer[:2000]}

Context chunks:
{chunks_text}

    Respond with ONLY a JSON object:
{{"relevant_count": <int>, "total_count": {len(context_chunks[:10])}, "score": <float 0.0-1.0>}}
"""

    try:
        await gemini_throttle()
        try:
            result = await llm.ainvoke(prompt)
        finally:
            gemini_release()
        parsed = json.loads(_strip_json(result.content))
        score = max(0.0, min(1.0, float(parsed.get("score", 0.5))))
        logger.debug("Precision score: %.2f", score)
        return score
    except Exception:
        logger.exception("judge_precision failed")
        return 0.5
