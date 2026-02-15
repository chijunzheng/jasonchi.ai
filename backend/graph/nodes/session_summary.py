"""Session Summary node — generates conversation summary."""

import json
import logging
import time

from config import gemini_release, gemini_throttle
from graph.state import GraphState, TraceStep
from llm_factory import make_chat_llm
from prompts.templates import SESSION_SUMMARY_PROMPT

logger = logging.getLogger(__name__)


def _strip_code_blocks(text: str) -> str:
    import re
    text = re.sub(r"^```json\s*", "", text.strip(), flags=re.IGNORECASE)
    text = re.sub(r"^```\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text, flags=re.IGNORECASE)
    return text.strip()


async def session_summary_node(state: GraphState) -> dict:
    """Generate a structured summary of the conversation."""
    start = time.perf_counter()

    prompt = SESSION_SUMMARY_PROMPT.format(
        conversation_text=state.conversation_text,
    )

    llm = make_chat_llm()

    await gemini_throttle()
    try:
        result = await llm.ainvoke(prompt)
    finally:
        gemini_release()

    response_text = _strip_code_blocks(result.content)
    try:
        summary = json.loads(response_text)
    except Exception:
        logger.exception("Session summary JSON parse failed")
        raise

    latency = (time.perf_counter() - start) * 1000
    tokens = result.usage_metadata.get("total_tokens", 0) if result.usage_metadata else 0

    return {
        "analysis_result": summary,
        "trace_steps": [
            TraceStep(
                node="session_summary",
                reasoning=f"Summarized {len(state.conversation_text)} chars of conversation",
                latency_ms=latency,
                tokens_used=tokens,
            )
        ],
        "total_tokens": state.total_tokens + tokens,
        "total_latency_ms": state.total_latency_ms + latency,
    }
