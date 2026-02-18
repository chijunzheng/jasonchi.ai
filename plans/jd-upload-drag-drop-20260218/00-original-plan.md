# Original Plan: JD Upload + Drag-and-Drop Analyzer UX

**Created:** 2026-02-18

## Goal
Allow recruiters to analyze a job description by either pasting text or uploading a file, with a professional drag-and-drop UX and a simple browse flow.

## Scope
1. Add JD upload UI in analyzer modal with drag-and-drop and browse controls.
2. Support file types: PDF, DOCX, TXT, MD.
3. Extend `/api/analyze-jd` to accept multipart uploads and extract text.
4. Preserve existing paste flow and downstream chat handoff context.

## Technical Approach
- Frontend modal submits either JSON (paste-only) or `FormData` (file upload).
- Next.js API route parses JSON or multipart and forwards to backend when `BACKEND_URL` is configured.
- FastAPI `/api/analyze-jd` handles multipart uploads and extracts text via `pypdf` + `python-docx`.
- Return resolved JD text in response metadata for chat-context continuity.

## Constraints
- No dev server startup.
- Keep existing JD analysis schema and response compatibility.
