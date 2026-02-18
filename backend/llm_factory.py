"""Centralized Gemini client construction.

We keep this in one place so we can tune retry behavior and model selection
without touching every call site.
"""

from __future__ import annotations

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

from config import settings


def _make_chat_llm(model_name: str) -> ChatGoogleGenerativeAI:
    """Create a ChatGoogleGenerativeAI with best-effort retry configuration."""
    base_kwargs = {
        "model": model_name,
        "google_api_key": settings.gemini_api_key,
    }

    # langchain_google_genai uses `retries` (tenacity) in current versions.
    try:
        return ChatGoogleGenerativeAI(**base_kwargs, retries=settings.gemini_max_retries)
    except TypeError as e:
        if "retries" in str(e):
            return ChatGoogleGenerativeAI(**base_kwargs)
        raise


def make_chat_llm() -> ChatGoogleGenerativeAI:
    """Create the primary answer-generation chat LLM."""
    return _make_chat_llm(settings.model_name)


def make_followup_llm() -> ChatGoogleGenerativeAI:
    """Create the lightweight follow-up generation LLM."""
    return _make_chat_llm(settings.followup_model_name)


def make_embeddings_model() -> GoogleGenerativeAIEmbeddings:
    """Create an embeddings model."""
    return GoogleGenerativeAIEmbeddings(
        model=settings.embedding_model,
        google_api_key=settings.gemini_api_key,
    )
