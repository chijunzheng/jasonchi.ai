import asyncio
import logging
import time
from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)

# Global semaphore + rate limiter to throttle concurrent Gemini API calls.
# Prevents 429 burst errors on accounts with low concurrency/RPM limits.
gemini_semaphore = asyncio.Semaphore(1)

_last_call_time = 0.0
_rate_lock = asyncio.Lock()


async def gemini_throttle():
    """Acquire semaphore and enforce minimum interval between API calls."""
    global _last_call_time
    await gemini_semaphore.acquire()
    try:
        async with _rate_lock:
            # Read from settings at runtime so operators can tune without code changes.
            min_interval = float(getattr(settings, "gemini_min_call_interval_seconds", 0.0) or 0.0)
            if min_interval < 0:
                min_interval = 0.0

            now = time.monotonic()
            elapsed = now - _last_call_time
            if elapsed < min_interval:
                await asyncio.sleep(min_interval - elapsed)
            _last_call_time = time.monotonic()
    except BaseException:
        # If we're cancelled while waiting for the rate lock/sleep, don't leak the semaphore permit.
        gemini_semaphore.release()
        raise


def gemini_release():
    """Release the semaphore after an API call completes."""
    gemini_semaphore.release()


class Settings(BaseSettings):
    gemini_api_key: str = ""
    langsmith_api_key: str = ""
    langsmith_project: str = "jasonchi-ai"
    host: str = "0.0.0.0"
    port: int = 8000
    content_dir: Path = Path(__file__).resolve().parent.parent / "frontend" / "src" / "content"
    model_name: str = "gemini-3-flash-preview"
    # Lower-latency model for follow-up chip generation.
    followup_model_name: str = "gemini-2.5-flash-lite"
    embedding_model: str = "models/gemini-embedding-001"
    max_history_messages: int = 10
    rate_limit_rpm: int = 20
    # Force the multi-call reflective pipeline even for small resume content.
    # Useful for testing, but can hit quota/rate limits on low-tier accounts.
    force_reflective_pipeline: bool = False
    # When enabled, disable some LLM-heavy indexing/pipeline steps to reduce quota usage.
    low_quota_mode: bool = False
    # When enabled, index build may call LLM for richer proposition decomposition/summaries.
    # Disabled by default to avoid long cold-start latency.
    enable_llm_index_enrichment: bool = False
    # Cap context size for category fast-path answers to reduce prompt tokens/latency.
    # Set <= 0 to disable truncation.
    fast_path_max_context_chars: int = 7000
    # Skip the evaluate step in reflective pipeline (saves 1 LLM call + corrective retrieval).
    # When True, retrieved context goes straight to answer generation without quality scoring.
    skip_evaluation: bool = True
    # Skip the assess LLM call for reflective chat and use direct retrieval planning.
    # Reduces first-token latency for follow-up queries.
    skip_assessment_for_reflective: bool = True
    # Generate follow-up questions via LLM.
    # Uses followup_model_name for lower latency.
    generate_followups_with_llm: bool = True
    # Prewarm content index on startup in a background task.
    prewarm_content_index: bool = True
    # Minimum gap between Gemini API calls, to avoid burst 429s on low-quota accounts.
    # Keep low for responsive UX; increase via env if you encounter 429 spikes.
    gemini_min_call_interval_seconds: float = 0.8
    # langchain_google_genai retries can spam quota on 429; default to fail-fast.
    gemini_max_retries: int = 0
    enable_shadow_eval: bool = False

    model_config = {
        "env_file": [
            ".env",
            str(Path(__file__).resolve().parent.parent / ".env"),
        ],
        "env_file_encoding": "utf-8",
    }

    @model_validator(mode="after")
    def _validate_api_key(self) -> "Settings":
        if not self.gemini_api_key:
            raise ValueError(
                "GEMINI_API_KEY is not set. "
                "Add it to the project's .env (repo root) or export it as an environment variable."
            )
        return self


settings = Settings()
