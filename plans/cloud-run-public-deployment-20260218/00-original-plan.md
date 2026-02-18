# Original Plan: Public Cloud Run Deployment

**Created:** 2026-02-18

## Goal
Deploy the full recruiter-facing website to Google Cloud Run so it is publicly accessible with stable frontend↔backend connectivity.

## Scope
1. Deploy FastAPI backend to Cloud Run with required runtime env vars.
2. Deploy Next.js frontend to Cloud Run with `BACKEND_URL` bound to backend service URL.
3. Ensure unauthenticated public access for recruiter use.
4. Verify endpoints and capture production URL handoff.

## Constraints
- Do not start local dev servers.
- Reuse existing repository structure (`backend/`, `frontend/`) and avoid unrelated code changes.
- Keep secrets out of source files.

## Deployment Approach
- Use `gcloud run deploy --source` for each service.
- Region: `us-central1` (unless already constrained by existing resources).
- Service names:
  - `jasonchi-backend`
  - `jasonchi-frontend`
- Set backend env vars from secure local environment values.
- Set frontend `BACKEND_URL` to deployed backend HTTPS URL.
- Verify with Cloud Run service describe + HTTP checks.
