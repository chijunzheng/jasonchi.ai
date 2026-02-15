"""Cover Letter node — generates a cover letter from JD analysis."""

import logging
import time

from langchain_core.messages import AIMessage

from config import gemini_release, gemini_throttle
from graph.state import GraphState, TraceStep
from graph.tools.content_index import get_content_index
from llm_factory import make_chat_llm
from prompts.templates import COVER_LETTER_PROMPT

logger = logging.getLogger(__name__)


async def cover_letter_node(state: GraphState) -> dict:
    """Generate a cover letter based on JD analysis."""
    start = time.perf_counter()

    # Use ContentIndex for targeted retrieval instead of get_all_content()
    index = await get_content_index()
    resume_content = index.get_full_category(
        ["work-experience", "projects", "skills"],
    )
    analysis = state.cover_letter_analysis or {}

    prompt = COVER_LETTER_PROMPT.format(
        resume_content=resume_content,
        job_description=state.job_description,
        strengths="; ".join(analysis.get("strengths", [])),
        gaps="; ".join(analysis.get("gaps", [])),
        angle=analysis.get("angle", ""),
    )

    llm = make_chat_llm()

    try:
        await gemini_throttle()
        try:
            result = await llm.ainvoke(prompt)
        finally:
            gemini_release()
    except Exception:
        logger.exception("Cover letter generation failed")
        raise

    response_text = result.content

    latency = (time.perf_counter() - start) * 1000
    tokens = result.usage_metadata.get("total_tokens", 0) if result.usage_metadata else 0

    return {
        "messages": [AIMessage(content=response_text)],
        "response_chunks": [response_text],
        "trace_steps": [
            TraceStep(
                node="cover_letter",
                reasoning="Generated cover letter from analysis",
                tool_calls=["full_context([work-experience, projects, skills])"],
                latency_ms=latency,
                tokens_used=tokens,
                retrieval_method="full_context",
                sources_used=["work-experience", "projects", "skills"],
            )
        ],
        "total_tokens": state.total_tokens + tokens,
        "total_latency_ms": state.total_latency_ms + latency,
    }
