# Original Plan: Recruiter-Friendly Chat Output Format

**Date:** 2026-02-12  
**Issue:** Chat answers are often long paragraphs and hard to scan quickly.

## Goal

Make chat responses easier for recruiters to read by default, without changing API behavior.

## Approach

1. Update chat system prompt to prefer short, structured, bullet-first responses.
2. Add explicit output template guidance for experience-heavy answers.
3. Mirror the same guidance in frontend fallback prompt generator for consistency.
4. Validate syntax and run one runtime QA sample to confirm output shape.

## Acceptance Criteria

- Chat responses default to skimmable sections + bullets.
- Answers remain first-person, factual, and concise.
- Backend and frontend fallback prompts are aligned.
