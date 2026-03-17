---
category: work-experience
title: Work Experience
order: 1
---

## AI Engineer at Telus Communications [2024 – Present]

### The Situation
- Full-time RAN engineer who self-taught ML/AI on personal time, motivated by the pain of manually digesting thousands of pages of 3GPP/ORAN specifications
- Built a pet project RAG system scoring 78% on the [ORAN benchmark](https://arxiv.org/pdf/2407.06245) vs. 62% for raw LLM — a 26% relative improvement
- Demoed to a Telus Fellow, earned full-time GenAI mandate within weeks
- Used lab resources (single H100 GPU) to push benchmark accuracy to 88% through retrieval and fine-tuning improvements
- Presented results to CTO, VP, and Director — project went from unsanctioned side project to company-backed production initiative within 2 months
- Led a team of 4 junior engineers to build a production-ready agentic RAG platform on GCP by end of 2025, prepared for rollout across 12 teams (400+ engineers)

### What I Did

#### Pet Project & Proof of Concept
- Built initial RAG system to answer technical RAN questions using FastAPI, Google GenAI API, and Vertex AI Vector Search
- Created a Streamlit frontend for internal demos
- Achieved 78% accuracy on ORAN benchmark — 16 percentage points above raw LLM baseline (62%)
- Demo to Telus Fellow secured full-time AI engineering mandate

#### Fine-Tuning & Retrieval Optimization
- Fine-tuned open-source LLM (Qwen-3-8B) via continual pre-training on curated 3GPP/ORAN triplets (subject, object, relations) — 8-bit quantized to fit single H100 GPU, ~2 weeks training — **+2% accuracy**
- Implemented hybrid retrieval combining semantic search with BM25 keyword search — **+5% accuracy**
- Fine-tuned embedding model on curated query + positive/negative chunk pairs — **+3% accuracy**
- Added contextual chunking: appends document-level summary to each chunk for richer LLM context — **+5% accuracy**
- Net result: 88% benchmark accuracy (26 points above raw LLM, 10 above naive RAG)

#### Production Architecture on GCP
- Chose GCP for its AI capabilities and natural fit with Telus's Google Workspace workflows (Google Chat as primary interface)
- Google's managed RAG solution performed well in US region demo but was unusable in the Canadian region required by Telus data sovereignty policy — pivoted to building custom system with lower-level Google APIs
- Built custom RAG pre-processing pipeline, Vertex AI Vector Search as vector database (chosen for tunable parameters: distance measure, neighbor count, leaf node search fraction), and multi-agent orchestration via Google ADK
- Led 4 junior engineers through architecture, hands-on coding, and troubleshooting

#### Agentic Document Ingestion Pipeline
- Designed and built an agentic ingestion system to process 5,000+ documents (3GPP specs, ORAN standards, vendor documents, internal documents) from heterogeneous formats (PDF, DOCX, PPTX, XLSX, images) into a unified searchable index
- Google Drive → GCS mirroring: Cloud Run cron job polls shared Google Drive folders every 10 minutes and syncs new/updated files to Cloud Storage — engineers simply drop documents into Drive and the pipeline handles the rest
- Swarm-based parallel processing: each document dispatched to specialized agents — **VisualTranscriber** (Gemini vision for diagrams, flowcharts, architecture images), **DataTranscriber** (structured extraction from tables, spreadsheets, configuration files), **SemanticChunker** (hierarchical section-aware splitting with contextual summaries)
- **Indexer** generates both dense embeddings (text-embedding-004) and sparse embeddings (BM25 term frequencies) per chunk, upserting into Vertex AI Vector Search with metadata for hybrid retrieval
- Batch embedding API: groups chunks into batches of 250 for embedding generation — reduces API round trips by ~50x compared to per-chunk calls
- Firestore ledger tracks processing state per document (pending → processing → indexed → failed) with idempotent retries — same document uploaded twice produces identical index state
- Concurrency controls: asyncio semaphores limit parallel Gemini calls per swarm to stay within API quotas; exponential backoff with jitter on transient failures
- Cloud Tasks for query-time CPU allocation: query requests enqueue a Cloud Task that calls back to a `/worker` endpoint on a high-CPU Cloud Run instance — decouples the lightweight API surface from compute-intensive retrieval and generation, enabling independent scaling of each tier

#### Data Integration & Operational Context
- Designed and implemented two production-grade ETL pipelines into centralized BigQuery:
  1) KPI telemetry from Splunk
  2) Site configuration data from on-prem vendor network element management platforms (distributed across multiple servers)
- Purpose: give the Agentic AI system operational context, not just static document context, so answers can include current KPI trends and configuration state

##### Pipeline A: Splunk KPI Data -> BigQuery (Step-by-Step)
1. **Source mapping and schema contract**
   - Cataloged Splunk indexes/sourcetypes for KPI events (throughput, latency, error rate, availability, utilization, counters).
   - Defined canonical KPI schema in BigQuery (site_id, cell_id, vendor, kpi_name, kpi_value, interval_start/end, ingest_ts, source_server, parsing_version).
   - Standardized units and naming conventions so multi-vendor KPI signals can be compared.
   - Capacity-planned for ~5,000 sites with ~500 KPI metrics per site at a 15-minute cadence (~240M potential site-KPI intervals/day before filtering and aggregation).
2. **Incremental extraction from Splunk**
   - Implemented dual ingestion paths:
     - **Push path:** Splunk HEC for near-real-time KPI delivery (low-latency operational feed).
     - **Pull path:** Splunk Search API every 15 minutes using watermarks (`last_success_ts -> current_ts`) for completeness and reconciliation.
   - Added hourly reconciliation jobs and nightly backfill jobs to recover delayed/missed records.
   - Added retry/backoff and request throttling to protect Splunk clusters during peak windows.
3. **Raw landing zone in cloud**
   - Wrote raw extracts to GCS first (immutable batches) before transformation.
   - Captured ingestion metadata (batch_id, extract_window, row_count, checksum, source_index) for traceability.
   - Loaded raw batches into BigQuery `raw_kpi_*` partitioned tables for replayability and audit.
   - Chose GCS-first landing over direct BigQuery ingestion to improve replay, auditability, and schema-change isolation.
4. **Data quality gate (pre-transform)**
   - Ran schema, null, duplicate, range, and timestamp-validity checks.
   - Enforced quality thresholds (for example: mandatory-field completeness >=99.5%, duplicate rate <=0.5%, freshness lag <=30 minutes for curated operational views).
   - Tagged bad records with reject reasons into quarantine tables instead of dropping silently.
   - Published quality metrics per batch (accepted %, rejected %, top error types).
5. **Transformation and normalization**
   - Normalized vendor-specific KPI names/fields to a single semantic model.
   - Converted units and aligned time granularity to a standard 15-minute analysis interval.
   - Deduplicated by business keys (`site_id + cell_id + kpi_name + interval_start + source_server`).
6. **Business modeling in BigQuery**
   - Built fact tables (`fact_kpi_interval`) partitioned by date and clustered by site/cell/kpi for query efficiency.
   - Built dimensions (`dim_site`, `dim_cell`, `dim_vendor`, `dim_kpi`) for consistent analytics joins.
   - Added SLA views and trend views consumed by dashboards and AI runtime tools.
7. **Reliable load and idempotency**
   - Used staged tables + `MERGE` patterns for idempotent upserts.
   - Ensured reruns produce the same end state (safe replay of failed windows).
   - Recorded watermark advancement only after successful end-to-end load.
8. **Orchestration and scaling**
   - Used Cloud Tasks to fan out extraction/transform tasks by time slice or site group for parallel throughput.
   - Applied queue-level rate limits and retry policies to control downstream pressure.
   - Kept each worker stateless so failed tasks can be retried safely.
9. **Monitoring and operations**
   - Instrumented latency, freshness lag, row-volume drift, and failure rates with alerting thresholds.
   - Used volume-drift rules (for example, significant deviation vs. rolling baseline) to detect upstream outages or parser regressions early.
   - Added run-level audit logs for every ETL stage (extract, load raw, quality gate, transform, publish).
   - Built backfill mode for historical reprocessing without disrupting daily incremental runs.

##### Pipeline B: On-Prem Vendor Configuration Data -> BigQuery (Step-by-Step)
1. **On-prem source discovery**
   - Mapped configuration sources across multiple vendor element-management servers (Samsung as primary source, plus smaller vendor systems with different schemas/export mechanisms).
   - Classified data domains: site parameters, cell definitions, software versions, feature flags, neighbor lists, hardware profiles.
   - Created source-to-target mapping specs with field-level lineage.
2. **Secure extraction from distributed servers**
   - Implemented hybrid extraction by source capability:
     - **API connectors** for Samsung and other vendor platforms with stable management APIs.
     - **Scheduled encrypted file exports (SFTP)** for legacy servers without robust API support.
   - Deployed extractor workers per source server to isolate failures and simplify retries.
   - Standardized output format (CSV/JSON) and timestamped batch manifests.
   - Enforced encrypted transfer to cloud ingress with integrity validation (checksums).
3. **Landing and registry**
   - Stored each file in a raw bucket path keyed by vendor/server/date/batch.
   - Registered batches in a control table with status lifecycle (`received -> validated -> transformed -> published`).
   - Kept original payloads immutable to support audit and replay.
4. **Structural validation and parsing**
   - Validated schema versions, mandatory fields, and referential dependencies between config entities.
   - Enforced config quality checks (schema compliance, key uniqueness, cross-entity references, and allowed-value checks on critical parameters).
   - Parsed vendor-specific payloads into normalized staging tables.
   - Routed malformed files/rows to quarantine datasets with actionable error messages.
5. **Configuration normalization and harmonization**
   - Unified parameter names and enum values across vendors.
   - Resolved entity identity keys (site/cell/sector) across systems to establish canonical IDs.
   - Applied business rules to produce analysis-ready config records.
6. **Change-data handling (history + current state)**
   - Generated hash fingerprints to detect true config changes.
   - Maintained SCD Type 2 history for key config tables (effective_from/effective_to/current_flag).
   - Published both current-state views and change-history views for root-cause analysis.
7. **Load patterns and consistency**
   - Loaded normalized data into BigQuery `dim_config_*` tables with deterministic merge rules.
   - Used transactional batch markers so partially failed loads do not become visible.
   - Enabled safe reprocessing for late-arriving or corrected batches.
8. **Cross-domain enrichment with KPI facts**
   - Joined config dimensions with KPI fact tables to answer questions like:
     - "Did a config change precede KPI degradation?"
     - "Which sites with same vendor/software profile show similar failures?"
   - Materialized join-friendly views to reduce query latency for analytics and AI tools.
9. **Governance, security, and access**
   - Applied dataset-level IAM separation for raw, staging, curated, and serving layers.
   - Enforced PII/sensitive-field masking policies where needed.
   - Added lineage metadata so each AI answer can trace back to source batch/time.

##### How These Pipelines Powered the Agentic AI Platform
- The Agentic system could combine document knowledge with live operational telemetry and current configuration state.
- Tool calls in the AI workflow queried curated BigQuery views instead of raw feeds, improving answer consistency and trust.
- ETL reliability controls (idempotency, retries, quality gates, lineage) reduced hallucination risk from bad or stale operational data.
- Cloud SQL stored app/interaction metadata (document provenance, user feedback, evaluation results), while BigQuery handled large-scale KPI/config analytics.

#### Multi-Agent System & Context Management
- Used Google ADK (Agent Development Kit) for multi-agent orchestration — selected for built-in tool use, memory management, and seamless Google GenAI API integration
- **Short-term memory:** ADK's native database session service storing conversation history, events, and tool calls in Cloud SQL with structured schema
- **Long-term memory:** Firestore vector database for semantic retrieval of past context; Cloud SQL for structured metadata queries
- Context compacted via LLM summarization at 50% context window threshold — empirically tested as the optimal point before answer quality degrades

#### Frontend via Google Chat
- Built Google Chat bot integrated with backend API via Apps Script — all Telus employees already had access, zero adoption friction
- Custom cards display agent reasoning: retrieved chunks, tool calls, agent decisions — providing transparency into how answers are generated
- Thumbs up/down buttons with optional text feedback stored in Cloud SQL for continuous improvement loop

#### Observability & Evaluation (Three Iterations)
- **V1 — Custom OTel + Cloud Logging:** Built structured tracing using OpenTelemetry to observe agent traces end-to-end — captured the full lifecycle of each query including LLM thinking, tool calls, errors, latency, and cost. ADK lacked native observability, so custom instrumentation was necessary. This was functional but required stitching together separate tools and manual log correlation
- **V2 — Langfuse (open-source platform):** Migrated to Langfuse (deployed on a dedicated Cloud Run container) as it provided observability, metrics, prompt management, and evaluation in one platform. Built a custom developer dashboard linking user feedback to Langfuse traces for one-click drill-down. Langfuse served us well for prompt iteration and eval, but hit limitations at production scale: no cross-signal correlation across traces/logs/metrics, no natural-language investigation, no ability to generate PromQL/LogQL/TraceQL queries
- **V3 — Self-hosted Grafana LGTM stack + AI Observability Agent (current):** Evolved past Langfuse by self-hosting the full LGTM stack (Loki, Grafana, Tempo, Mimir) and building an AI-powered Observability Agent on top — see the dedicated section below. This was built rapidly using AI-assisted development (Claude Code) with eval-driven iteration: 3 architecture versions in weeks, each driven by question-level failure analysis from a 50-question LLM-as-judge benchmark
- Built 4-dimension automated evaluation pipeline:
  - **Fact judge** — curated golden dataset by domain experts
  - **Retrieval judge** — LLM-generated query/chunk pairs
  - **Tool-call judge** — domain expert query/expected tool-call pairs
  - **Performance judge** — latency and cost vs. engineering SLA
- Evaluation runs automatically on every Cloud Run deployment, with reports diffable against previous versions to catch regressions before users

#### Self-Hosted LGTM Stack & AI-Powered Observability Agent
- After identifying limitations with Langfuse for production-scale observability (no cross-signal correlation, no natural-language investigation, no PromQL/LogQL/TraceQL generation), built a self-hosted LGTM stack (Loki, Grafana, Tempo, Mimir) and an AI-powered Observability Agent
- Deployed the full LGTM stack on a GCE VM (e2-standard-4, Container-Optimized OS) running Docker Compose — OpenTelemetry Collector as single ingestion point, Tempo for traces, Loki for logs, Mimir for metrics, Grafana for dashboards, all backed by GCS buckets for durability (30-day trace retention)
- Built a custom `NexusTelemetryPlugin` hooking into ADK's lifecycle callbacks (`before_agent`, `after_agent`, `before_model`, `after_model`, `before_tool`, `after_tool`, plus error handlers) to emit AI-specific OTel metrics: LLM call duration, token consumption by model/agent, estimated cost in USD, tool execution latency, retrieval document counts, and error rates by type
- Configured dual-export OpenTelemetry: traces, logs, and metrics flow simultaneously to both the self-hosted LGTM stack (for agent investigation) and Google Cloud (Cloud Trace, Cloud Logging) for production monitoring — same telemetry powers both the observability agent's investigations and the team's existing GCP workflows
- Built an AI-powered Observability Agent using Google ADK with Gemini, embedded directly into Grafana as an iframe panel — developers investigate incidents through natural language without writing PromQL, LogQL, or TraceQL
- Architected a 4-agent pipeline: **Intent Classifier** (gemini-2.5-flash-lite, 7 categories, keyword fast-path), **Investigation Planner** (gemini-3-flash, parallel backend discovery before planning), **Investigator** (25-iteration ReAct agent, pure evidence gathering, no synthesis pressure), **Synthesizer** (single LLM call, always runs, structured output with anti-hallucination directive)
- Built 4 specialized LGTM query tools: Tempo trace search (by service, operation, duration, tags), Loki log queries (LogQL range/instant with label filtering), Mimir metric queries (PromQL instant/range with series listing), and natural-language-to-query translator (generates PromQL/LogQL/TraceQL for developer review before execution)
- Cross-signal correlation: given a trace ID, service name, or time window, fans out to Tempo, Loki, and Mimir in parallel via `asyncio.gather`, merging evidence into a single context block — connects *what happened* (traces) with *what the system was thinking* (logs) and *how it was performing* (metrics) without spending ReAct iterations on fan-out
- Eval-driven architecture iteration through 3 versions on a 50-question benchmark with LLM-as-judge scoring across 6 dimensions: V1 Pure ReAct (0.731) → V2 Quasi-Agentic Pipeline (0.797, +9.1%) → V3 4-Agent Pipeline (0.882, +20.7%) — each iteration driven by question-level failure analysis from the previous eval
- Key finding: separation of evidence gathering from synthesis broke the "budget ceiling" — V2's single agent exhausted its 6-call budget on tool calls 62% of the time, falling back to template answers; V3's dedicated investigator (25 iterations) and dedicated synthesizer eliminated template fallback entirely, driving answer quality from 0.638 to 0.833 (+30.8%)
- Ablation study on the full benchmark proved intent classification as the keystone agent (removing it drops composite by −0.328), planner discovery as real value (−0.118 without it), and synthesizer separation as a structural improvement (−0.017)
- Reduced incident investigation time from 10-15 minutes of manual dashboard-switching to under 30 seconds via natural language
- Pre-provisioned Grafana with 13 dashboards: request overview, LLM metrics, token cost tracking, error rates, trace exploration, log exploration, retrieval metrics, eval results with baseline comparison, and user feedback analytics
- Designed the metrics not just for system observability but as engineering KPIs that measure how the team builds, tests, and ships AI software: cycle time (P50/P95/P99 request latency), rework (eval score regressions triggering re-investigation), defect trends (error rates by type over time), test health (eval composite score trending across deployments), and AI adoption (token usage and cost tracking showing which agents and models are actually being used). These dashboards serve both the development team for daily operations and leadership for understanding AI investment ROI
- Automated the entire LGTM deployment via a single idempotent script: GCS bucket creation, firewall rules, VM provisioning with startup script, Cloud Run env var updates with internal IP, and IAP-protected HTTPS load balancer setup
- The observability agent is self-observable: it exports its own telemetry back into the LGTM stack, so you can trace the agent investigating its own traces

#### AI Literacy & Developer Enablement
- Taught foundational AI concepts (how LLMs, RAG, and agents work) to RAN domain experts who had no prior AI background — this was a strategic investment because the project depended on their domain knowledge for curating training data, evaluating retrieval quality, and defining golden datasets
- Training bridged the gap between AI engineering and domain expertise: once colleagues understood how retrieval and generation worked, they could contribute higher-quality data annotations, flag retrieval failures more precisely, and participate meaningfully in evaluation design
- Ran ongoing AI tooling training that evolved with the landscape: started with Gemini and NotebookLM for document Q&A, progressed to Cursor for AI-assisted coding, and most recently onboarded teams onto CLI-based coding agents like Claude Code
- Focused on practical, workflow-specific use cases rather than generic demos — e.g., using NotebookLM to digest 3GPP specs, Cursor to scaffold test suites, Claude Code to automate repetitive refactoring
- Trained the 4 junior engineers on AI-assisted development workflows — taught them how to use Cursor effectively (prompt crafting, codebase context, iterative refinement), then migrated the team to Claude Code with structured agent skills. This directly accelerated their ramp-up: juniors who would normally need months of onboarding were contributing production code within weeks because AI tools handled the boilerplate while they focused on domain-specific logic
- Extended training beyond the immediate team to broader engineering colleagues — ran lunch-and-learn sessions and 1:1 coaching for engineers curious about integrating AI tools into their own workflows, regardless of whether they were on the AI project
- Measurably improved team productivity: engineers who adopted the tools reported spending less time on boilerplate tasks and more time on design and problem-solving

#### AI-Assisted Development as a Force Multiplier
- Used AI coding agents (Cursor, then Claude Code) as a core part of my development workflow throughout this project — not as an occasional assist, but as a systematic practice that shaped how I architect and ship software
- Developed a structured approach: decompose features into plan documents with explicit dependency graphs, identify parallelizable vs. sequential work, then orchestrate multiple coding agents simultaneously to implement features in parallel
- Built custom agent skills (reusable prompt templates for plan generation, feature decomposition, and code review) that encode project context and coding standards — treating the agent's context as an engineering artifact
- This workflow was a significant factor in the project's velocity: building a production-ready agentic RAG platform with a team of 4 juniors within a year, while maintaining evaluation coverage and code quality
- The meta-insight: the same agentic orchestration principles I apply to production AI systems (tool use, context management, parallel execution) also describe how I use AI coding tools — the skills are transferable in both directions

#### AI-First SDLC: A Structured Workflow for AI-Native Teams
- Formalized the team's AI-assisted development into a structured SDLC with measurable quality gates at each stage:
  - **Planning:** Collaborative whiteboarding in team meetings + AI-generated architecture proposals — the team debates design trade-offs while AI drafts implementation plans and dependency graphs
  - **Implementation:** AI-driven code generation (Claude Code, Cursor) with human oversight — engineers focus on design decisions and domain logic while AI handles boilerplate, scaffolding, and repetitive patterns
  - **Code Review:** AI-assisted review on every PR before human approval — AI catches style violations, potential bugs, and consistency issues, freeing human reviewers to focus on architectural and business logic concerns
  - **Testing & Quality:** LLM-as-judge evaluation framework (50-question benchmark, 6 scoring dimensions) replaces traditional QA for AI agent output — the eval suite runs automatically and scores against reference answers
  - **Release:** Eval-gated deployment — we ship only when the composite benchmark score improves over the previous baseline. This is the AI-native equivalent of "deploy only when test coverage exceeds threshold." The 4-dimension automated eval pipeline (fact judge, retrieval judge, tool-call judge, performance judge) runs on every Cloud Run deployment, and results are diffable against previous versions to catch regressions
- This workflow enabled a team of 4 junior engineers to ship production-quality AI systems at a pace that would normally require a much larger or more senior team — because quality gates are automated and measurable, not dependent on senior engineer availability for every review

### The Result
- Improved ORAN benchmark accuracy from 62% (raw LLM) to 88% — a 42% relative improvement — through fine-tuned embeddings (+3%), hybrid retrieval (+5%), fine-tuned generator LLM (+2%), and contextual chunking (+5%)
- Took the project from a solo pet project to a production-ready agentic RAG platform on GCP by end of 2025, with pilot use and planned rollout across 12 teams (400+ engineers)
- Reduced average time engineers spent searching 3GPP/ORAN specs from 2 hours to 20 minutes per query, freeing 1.5 hours per engineer per week
- Led and upskilled 4 junior engineers, establishing practices around evaluation-driven AI development, agentic system design, and production observability
- 4-dimension automated eval pipeline runs on every deployment, catching regressions before they reach users
- Observability evolved through 3 iterations (custom OTel → Langfuse → self-hosted LGTM stack + AI Observability Agent), ultimately reducing incident investigation from 10-15 minutes to under 30 seconds via natural language — the AI agent achieved 0.882 composite score on a 50-question benchmark through eval-driven iteration
- Presented to CTO, VP, and Director — unsanctioned side project became company-backed production initiative within 2 months
- User dissatisfaction (thumbs-down rate) improved from 50% at launch to 30% after 3 months of feedback-driven iteration

### Real Talk
- **Don't trust vendor promises blindly.** Google's managed RAG worked great in the US region demo but fell apart in the Canadian region we needed. Spent weeks trying to make it work before accepting the pivot. Should have demanded a Canadian-region proof of concept before committing.
- **Fine-tuning the LLM gave the smallest ROI.** Two weeks training Qwen-3-8B on a single H100 for ~2% accuracy gain. Meanwhile, hybrid retrieval (+5%) and contextual chunking (+5%) each took a fraction of that time. Lesson: for most RAG systems, exhaust retrieval-side improvements before touching model weights.
- **Leading juniors slowed me down at first, but 10x'd the outcome.** My instinct was to build everything myself. But investing in the team meant we could parallelize pipeline, evaluation, and frontend work. The 4 engineers I mentored now own AI system components independently — a more durable outcome than any code I wrote.
- **Observability should be day-one, not an afterthought — and it should evolve with the system.** We bolted on Langfuse after hitting production issues (should have been day-one). But even Langfuse hit a ceiling: it couldn't correlate traces with logs and metrics, couldn't generate PromQL/LogQL queries, and couldn't investigate incidents autonomously. The third iteration — self-hosting the LGTM stack and building an AI Observability Agent on top — was built rapidly using Claude Code with eval-driven iteration (3 architecture versions, each driven by failure analysis from a 50-question benchmark). The lesson: observability isn't a one-time setup, it's a system that iterates alongside the product it monitors.
- **The hardest part wasn't technical — it was organizational.** Navigating data sovereignty policies, managing stakeholder expectations after the Google pivot, and convincing leadership to keep investing during the messy middle were all harder than the engineering. Building trust with non-technical stakeholders requires translating AI concepts into business outcomes they care about.
- **The feedback loop mattered more than expected.** Thumbs-up/down felt like a nice-to-have initially, but it became our most valuable signal for prioritizing improvements. Users surfaced edge cases and domain-specific failure modes that no benchmark could have caught.
- **Managing technical debt in a fast-moving AI project.** The system started as a Streamlit demo with hardcoded configs and no tests — classic prototype debt. Rather than rewriting from scratch, I incrementally migrated: swapped Streamlit for Google Chat, added the evaluation harness, layered in observability — each step replacing prototype patterns with production ones. When Google's managed RAG failed in Canada, I didn't patch around it; I made the hard call to rebuild on lower-level APIs, accepting short-term velocity loss to avoid compounding debt on a broken foundation. As the team grew to 4 juniors, I partitioned the codebase so each engineer owned a distinct module (pipeline, evaluation, frontend, observability) — this minimized merge conflicts and gave clear ownership boundaries, which is how you manage debt at the organizational level. The 4-dimension eval pipeline became our safety net: it let us refactor aggressively without fear of silent quality drops. And yes, some debt was strategically accepted — shipping without observability to prove value to leadership faster was the right call at the time, even though bolting on Langfuse later cost more than building it in from day one.

### Tech I Used
- **Backend:** Python, FastAPI, Uvicorn, Pydantic, PyYAML, aiohttp, httpx
- **AI/ML:** Google ADK, Google GenAI API, Vertex AI Vector Search, Vertex AI Search (Discovery Engine), LangChain, Rank-BM25, NumPy, Pandas, OpenAI API, Fuelix APIs
- **Cloud:** Google Cloud Run, Cloud Build, Cloud SQL (MySQL), Cloud Firestore, Google Cloud Storage, Google Cloud Tasks, Cloud Scheduler, Google Cloud Trace, Google Cloud Logging
- **Data Processing:** BigQuery (ETL pipelines, KPI analytics), Cloud Tasks (async job orchestration), batch embedding APIs, asyncio concurrency controls
- **Frontend:** Google Chat, Google Apps Script, Google Sheets API, Streamlit
- **Observability:** Self-hosted LGTM stack (Grafana, Loki, Tempo, Mimir), OpenTelemetry (Python SDK, OTLP exporters, dual-export to LGTM + GCP), PromQL, LogQL, TraceQL, Langfuse, Google Cloud Trace, Google Cloud Logging, Looker, BigQuery
- **Data Processing:** BeautifulSoup4, PyPDF, python-docx, python-pptx, Pillow, pdf2image, Openpyxl, Tabulate
- **Tools:** Docker, Git, GitHub, GitLab, uv, Jupyter Notebook

---

## RAN Engineer at Telus Communications [2021 – 2024]

### The Role
- Led design and deployment of the Radio Management System (RMS) — an O-RAN SMO entity that enabled Telus to establish the world's first hybrid mode O-RAN M-plane architecture
- Architected RMS as a cloud-native microservices app on Kubernetes; coordinated multi-vendor integration into production network
- Recognized by Telus leadership for contributions to network automation and orchestration

### Data Processing & Network Observability
- Architected the data ingestion requirements for RMS's observability stack — specified the pipeline for ingesting logs, alarms, performance counters, and KPI metrics from 1,000+ production O-RAN radios across multiple vendors
- Defined data schemas and processing requirements for heterogeneous vendor data formats — each radio vendor (Samsung, Nokia, Ericsson) exposes different log formats, alarm structures, and KPI naming conventions that needed normalization into a unified schema
- Kubernetes-native pipeline: microservices on K8s consumed streaming telemetry data, applied vendor-specific parsers, and wrote normalized metrics to time-series storage — enabling cross-vendor performance comparison dashboards
- Coordinated vendor integration: worked directly with Samsung, Nokia, and Ericsson engineering teams to validate data pipeline outputs — ensuring alarm correlation, KPI aggregation, and log enrichment met operational requirements
- Data pipeline served as the foundation for automated anomaly detection and capacity planning — operators could identify degraded radios from dashboard alerts rather than manual log inspection

### The Pivot to AI
- Experienced a daily pain point: engineers spending hours searching thousands of pages of 3GPP/ORAN specifications for answers that should be instantly queryable
- Self-taught ML/AI fundamentals on personal time — studied transformer architectures, embeddings, and retrieval systems through papers, courses, and hands-on experimentation
- Learned by building: created a RAG system as a side project to solve the spec-search problem, iterating from a basic prototype to a benchmarked system scoring 78% on the ORAN benchmark (vs. 62% raw LLM)
- Demoed to Telus Fellow — project quality and initiative earned a full-time AI engineering mandate, leading directly to the AI Engineer role above
