"""JD Analyzer node — analyzes job description fit against resume."""

import json
import logging
import re
import time

from config import gemini_release, gemini_throttle
from graph.state import GraphState, TraceStep
from graph.tools.content_index import get_content_index
from llm_factory import make_chat_llm
from prompts.templates import JD_ANALYSIS_PROMPT

logger = logging.getLogger(__name__)


def _strip_code_blocks(text: str) -> str:
    """Remove markdown code block wrappers from LLM output."""
    text = re.sub(r"^```json\s*", "", text.strip(), flags=re.IGNORECASE)
    text = re.sub(r"^```\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text, flags=re.IGNORECASE)
    return text.strip()


async def jd_analyzer_node(state: GraphState) -> dict:
    """Analyze a job description against resume content."""
    start = time.perf_counter()

    # Use ContentIndex for targeted retrieval instead of get_all_content()
    index = await get_content_index()
    resume_content = index.get_full_category(
        ["work-experience", "projects", "skills"],
    )

    prompt = JD_ANALYSIS_PROMPT.format(
        resume_content=resume_content,
        job_description=state.job_description,
    )

    llm = make_chat_llm()

    await gemini_throttle()
    try:
        result = await llm.ainvoke(prompt)
    finally:
        gemini_release()

    response_text = _strip_code_blocks(result.content)
    try:
        analysis = json.loads(response_text)
    except Exception:
        logger.exception("JD analysis JSON parse failed")
        raise

    latency = (time.perf_counter() - start) * 1000
    tokens = result.usage_metadata.get("total_tokens", 0) if result.usage_metadata else 0

    return {
        "analysis_result": analysis,
        "trace_steps": [
            TraceStep(
                node="jd_analyzer",
                reasoning=f"Analyzed JD — match score: {analysis.get('matchScore', '?')}%",
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
