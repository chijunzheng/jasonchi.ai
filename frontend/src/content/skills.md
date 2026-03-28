---
category: skills
title: Technical Skills
order: 3
---

## Languages & Frameworks

### Proficient
python, google ADK(agent development kit)

### Experienced
numpy, pandas, google vertex AI discovery engine api, google vertex AI generative models api, langfuse, langgraph, pydanticAI

### Familiar
pytorch, langchain, llamaindex

## Cloud & Infrastructure

### Platforms
GCP, AWS 

### Tools
Docker, Docker Compose, Kubernetes, Terraform, CI/CD, cloud run, cloud build, cloud functions, cloud scheduler, cloud pub/sub, cloud storage, cloud sql, cloud spanner, cloud bigtable, big query, cloudsql, IAM, cloud monitoring, cloud logging, cloud trace, Grafana, Loki, Tempo, Mimir, OpenTelemetry Collector, JIRA, Confluence, Git, GitHub, GitLab, uv, Jupyter Notebook, claude code, gemini-cli, codex, cline, cursor, antigravity

## AI & Machine Learning

### Models & Frameworks
Claude code, Codex, gemini-cli, pytorch, Hugging face, milvus, pinecone, weaviate, redis vector db, chroma, qdrant, faiss 

### Practices
- **AI-assisted development (power user):** Developed a structured AI-first SDLC for building full products with coding agents: AI-generated architecture proposals in planning, AI-driven code generation (Claude Code, Cursor) with human oversight, AI-assisted code review on every PR, and eval-gated releases (ship only when benchmark score improves over baseline). Built custom agent skills (reusable prompt templates) for plan generation, feature tracking, and code review. This workflow powered the development of ShowMe (75K LOC), jasonchi.ai, and contributed to production system velocity at Telus. Progressed from Cursor (early adoption) to Claude Code (current primary tool) and Codex as the agentic paradigm matured
- **Context engineering:** Designing structured prompts, plan documents, and agent contexts that maximize AI output quality — treating context as an engineering artifact, not an afterthought
- **Prompt engineering:** Schema-enforced outputs, multi-turn orchestration, fallback chains, and domain-specific prompt tuning (e.g., telecom-specific retrieval prompts)
- **RAG systems:** End-to-end pipeline design — chunking strategies, hybrid retrieval, contextual chunking, multi-granularity indexing, corrective re-retrieval
- **Fine-tuning:** Continual pre-training (LLM), contrastive learning (embeddings), ablation-driven evaluation
- **Evaluation:** LLM-as-judge, multi-dimension automated eval pipelines, shadow A/B testing, benchmark-driven development
- **Observability, telemetry & engineering metrics:** Self-hosted LGTM stack (Grafana, Loki, Tempo, Mimir), OpenTelemetry (Python SDK, OTLP gRPC/HTTP exporters, dual-export configurations), PromQL, LogQL, TraceQL, custom ADK telemetry plugins (lifecycle callback instrumentation), AI-specific metrics (LLM duration, token consumption, cost estimation, tool latency), engineering KPI design (cycle time, error trends, eval health, AI adoption tracking), Grafana dashboard provisioning, Langfuse tracing, Google Cloud Trace, Google Cloud Logging, distributed trace correlation, structured JSON logging with trace/span ID injection
- **Guardrails & reliability:** context window management, graceful degradation patterns, anti-hallucination directives, defensive telemetry (safe no-ops when OTel unavailable)
- **Data processing & pipelines:** Agentic document ingestion (5,000+ docs, swarm-based parallel processing), dual-path Splunk KPI ETL (HEC push + 15-min Search API pull), Samsung-primary on-prem multi-server config ETL to centralized BigQuery, raw->staging->curated modeling with GCS landing, SCD Type 2 + current-state dimension design, Cloud Tasks orchestration, data quality gates (completeness/duplicates/referential/freshness), idempotent processing with state tracking (Firestore ledger)

## Soft Skills

### Leadership
team leadership, mentoring, cross-functional collaboration, project management

### Communication
technical writing, presentations, stakeholder management, translating technical concepts for non-technical audiences, conflict resolution
