"""Shadow naive pipeline — runs the old 'load everything' approach in parallel."""

import logging
import time

from langchain_core.messages import BaseMessage, SystemMessage

logger = logging.getLogger(__name__)

from config import gemini_release, gemini_throttle
from graph.tools.content_retrieval import get_all_content
from llm_factory import make_chat_llm
from prompts.templates import SYSTEM_PROMPT


async def run_naive_shadow(
    messages: list[BaseMessage],
    category: str | None,
) -> dict:
    """Run the naive 'load everything' pipeline.

    Returns the answer + metrics (tokens, latency) for comparison.
    This is the old approach: dump all content into the prompt.
    """
    start = time.perf_counter()
    logger.info("Running naive shadow pipeline...")

    resume_content = get_all_content()
    system_prompt = SYSTEM_PROMPT.format(
        category_instruction="Answer based on all available resume content.",
        resume_content=resume_content,
    )

    llm = make_chat_llm()

    llm_messages = [SystemMessage(content=system_prompt)] + list(messages)
    await gemini_throttle()
    try:
        result = await llm.ainvoke(llm_messages)
    finally:
        gemini_release()
    tokens = result.usage_metadata.get("total_tokens", 0) if result.usage_metadata else 0
    latency_ms = (time.perf_counter() - start) * 1000

    logger.info("Naive shadow complete: tokens=%d, latency=%.0fms", tokens, latency_ms)

    return {
        "answer": result.content,
        "tokens_used": tokens,
        "latency_ms": latency_ms,
        "sources_used": ("all",),
    }
