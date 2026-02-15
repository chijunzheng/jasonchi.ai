"""Router node — classifies user intent to dispatch to specialist nodes."""

import logging
import time

from graph.state import GraphState, TraceStep

logger = logging.getLogger(__name__)

VALID_INTENTS = {"chat", "jd_analysis", "cover_letter", "session_summary"}


async def router_node(state: GraphState) -> dict:
    """Classify the latest user message intent."""
    start = time.perf_counter()

    # Avoid an extra LLM call: API endpoints already set intent and required fields.
    # Derive deterministically from the state payload.
    intent = state.intent if state.intent in VALID_INTENTS else "chat"
    if state.conversation_text:
        intent = "session_summary"
    elif state.cover_letter_analysis is not None:
        intent = "cover_letter"

    latency = (time.perf_counter() - start) * 1000
    logger.debug("Router intent='%s' latency=%.0fms", intent, latency)

    return {
        "intent": intent,
        "trace_steps": [
            TraceStep(
                node="router",
                reasoning=f"Classified intent as '{intent}'",
                latency_ms=latency,
                tokens_used=0,
            )
        ],
        "total_tokens": 0,
        "total_latency_ms": latency,
    }
