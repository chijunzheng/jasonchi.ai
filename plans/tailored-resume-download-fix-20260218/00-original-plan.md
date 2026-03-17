# Original Plan: Tailored Resume Download Fix

**Created:** 2026-02-18

## Goal
Make the "Download Tailored Resume" action generate and download a JD-specific resume instead of linking to static `/resume.pdf`.

## Scope
1. Add a dedicated tailored-resume API contract.
2. Implement backend generation endpoint and frontend route fallback.
3. Wire the chat header button to call API, download generated file, and show loading/error feedback.
4. Verify type/lint checks and run review pass.
