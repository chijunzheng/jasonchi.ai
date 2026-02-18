# jasonchi.ai

AI-native portfolio and recruiter copilot with:
- `frontend/`: Next.js 16 chat-first portfolio UI
- `backend/`: FastAPI + LangGraph retrieval and JD analysis API

## Features
- Unified profile overview + conversational interview mode
- Job Description Analyzer (paste or upload PDF/DOCX/TXT/MD)
- Reflective retrieval pipeline with streaming answers
- Category-scoped fast path for low-latency follow-ups

## Local Setup

### 1) Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env .env  # or set env vars directly
uvicorn main:app --reload --port 8000
```

### 2) Frontend
```bash
cd frontend
pnpm install
pnpm dev
```

## Required Environment
Set in `.env` (root or backend):
- `GEMINI_API_KEY`
- `GOOGLE_API_KEY` (if used by your LangChain/Google SDK path)
- `NEXT_PUBLIC_BACKEND_URL` (frontend -> backend API base)

## Quality Checks
```bash
pnpm --dir frontend exec tsc --noEmit
pnpm --dir frontend lint
python3 -m py_compile backend/main.py backend/graph/nodes/qa.py backend/config.py
```

## Deployment
- Frontend: Next.js deployment target of choice
- Backend: Docker/Cloud Run (`backend/Dockerfile`)

### Cloud Run (2 Services)
Use the committed Cloud Run Dockerfiles for repeatable redeploys:
- `backend/Dockerfile.cloudrun`
- `frontend/Dockerfile.cloudrun`

Example flow:
1. Build/push backend image and deploy `jasonchi-backend`.
2. Build/push frontend image and deploy `jasonchi-frontend`.
3. Set frontend env vars:
   - `BACKEND_URL=https://<backend-service-url>`
   - `NEXT_PUBLIC_BACKEND_URL=https://<backend-service-url>`
