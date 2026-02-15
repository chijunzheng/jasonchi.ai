"""LangGraph state schema for the resume assistant graph."""

from typing import Literal

from pydantic import BaseModel, Field
from langchain_core.messages import BaseMessage
from langgraph.graph import add_messages
from typing import Annotated


class TraceStep(BaseModel):
    """A single step in the agent execution trace."""

    node: str
    reasoning: str = ""
    tool_calls: list[str] = Field(default_factory=list)
    latency_ms: float = 0
    tokens_used: int = 0

    # Reflective retrieval fields
    retrieval_decision: str | None = None
    retrieval_method: str | None = None
    sources_used: list[str] = Field(default_factory=list)
    confidence_score: float | None = None
    quality_check: str | None = None


class GraphState(BaseModel):
    """State that flows through the LangGraph."""

    # Core conversation
    messages: Annotated[list[BaseMessage], add_messages] = Field(default_factory=list)

    # Routing
    intent: Literal["chat", "jd_analysis", "cover_letter", "session_summary"] = "chat"
    category: str | None = None

    # Content context
    resume_content: str = ""

    # JD analysis specific
    job_description: str = ""
    analysis_result: dict | None = None

    # Cover letter specific
    cover_letter_analysis: dict | None = None

    # Session summary specific
    conversation_text: str = ""

    # Streaming output
    response_chunks: list[str] = Field(default_factory=list)
    follow_ups: list[str] = Field(default_factory=list)

    # Tracing (F17)
    trace_steps: list[TraceStep] = Field(default_factory=list)
    total_tokens: int = 0
    total_latency_ms: float = 0
