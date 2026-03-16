---
category: projects
title: Projects
order: 2
---

## Prism — AI-Native Portfolio Intelligence System (GitHub: [chijunzheng/prism-holdings-intelligence-system](https://github.com/chijunzheng/prism-holdings-intelligence-system))

### The Situation — why I built it
- Retail investors lack institutional-grade analysis tools — they read headlines and react emotionally to market events, with no way to understand how a specific event impacts their specific portfolio in dollar terms
- Single-agent AI produces surface-level analysis: it can get directional accuracy right (92%) but structurally cannot identify portfolio-specific risks (0.1-0.3/5) or generate actionable recommendations (0.0/5)
- Goal: build a multi-agent adversarial analysis system that detects live market signals, runs them through 10+ specialized agents, and produces calibrated dollar-impact estimates grounded in real market data — never auto-executing trades, always presenting options with tradeoffs
- Target platform: Wealthsimple. Deployed live at https://prism-671115882624.us-central1.run.app/

### What I Did

#### Multi-Agent Adversarial Pipeline (11 Nodes, LangGraph StateGraph)
- Designed an 11-node pipeline orchestrated via LangGraph with parallel fan-out, adversarial debate, and a quality gate feedback loop
- Stage 0: parallel preparation — infer risk profile from portfolio composition (pure computation, no LLM) + fetch historical prices, computed volatility, and correlation matrix from Yahoo Finance (24h TTL cache)
- Stage 1: 4 analyst agents run in parallel (macro, fundamental, sentiment, technical) — each uses Gemini 3 Flash with Google Search grounding for live market data, producing direction, magnitude (0-1 qualitative scale), confidence, and per-ticker impacts with cited evidence
- Stage 2: adversarial debate — bull vs bear researcher argue 1-3 rounds using analyst findings, with convergence detection (both sides agree on direction OR both make concessions OR max 3 rounds) producing a debate resolution with unresolved disagreements explicitly flagged
- Stage 3: 3 risk management agents in parallel — assumptions challenger (scores confidence on every claim, identifies blind spots), magnitude validator (clamps estimates exceeding 3× monthly historical volatility from Yahoo Finance), portfolio stress tester (10,000 Monte Carlo simulations using real correlation matrix, VaR/CVaR at 95th and 99th percentiles)
- Stage 4: fund manager synthesizes all upstream inputs into 2-3 recommendation options (always including a "do nothing" baseline), then a judge agent evaluates quality across 5 dimensions — if insufficient, sends feedback for refinement (max 2 loops)
- Stage 5: research brief assembled via pure template formatting (no LLM), 11 sections with cited sources, downloadable as PDF

#### Calibration Engine — LLMs Reason, Math Computes
- Core design principle: LLMs provide qualitative reasoning (direction, causal chains, magnitude 0-1), formulas convert to calibrated dollar ranges. No dollar amount ever comes directly from an LLM
- 6-layer anchoring: portfolio value bounds (hard ceiling) → exposure weights → real historical volatility from Yahoo Finance → multi-analyst qualitative consensus → formula-based calibration (`mid = holdingValue × magnitudeScore × direction × timeMultiplier`, confidence-adaptive range widths) → Monte Carlo stress testing validation
- Time horizon scaling via sqrt-of-time: 1W = 0.49, 1M = 1.0, 6M = 2.45 — industry-standard volatility scaling
- Magnitude clamping: any analyst-estimated magnitude exceeding 3× monthly historical volatility is clamped, preventing LLM hallucination from producing unrealistic dollar estimates
- Confidence-adaptive ranges: high confidence → tighter range (3.3:1 ratio at 0.9), low confidence → wider range (3.9:1 ratio at 0.5) — system expresses "$150-$350" not "$247.32"

#### Human-in-the-Loop Checkpoints (4 Structural Pause Points)
- Uses LangGraph `interrupt()` with `interrupt_before` edges — state persisted via `MemorySaver` checkpointer, resume via `Command({ resume })`
- 4 checkpoints: after analyst team (review 4 perspectives), after debate (challenge consensus), after risk challenges (override assessments), and verdict preview (review dollar impacts before recommendations)
- Soft checkpoint behavior: auto-continues after timeout, but "I have feedback" button allows users to inject domain knowledge — pipeline recalibrates all downstream stages when user provides input
- Two pipeline modes: guided (checkpoints enabled, threadId-based persistence) and quick (stateless, used for eval harness)

#### Single Chat Interface (React 19 + Vite 6)
- Everything happens in one conversation stream — no separate pages. Rich card components (signal cards, pipeline progress, checkpoint cards, analysis report) render inline in the chat
- SSE streaming with 17 event types for real-time progressive rendering: agent thinking text, stage completions, checkpoint data, final verdict, research brief
- Three-panel layout: left sidebar (sessions/holdings/signals), center chat area with card renderer, right action center for analysis details
- Holdings panel shows real-time portfolio values and daily P&L, with "Planned Changes" section where saved recommendation actions appear
- Discriminated union pattern for card dispatch: `ChatCardRenderer.tsx` handles all card types via type-safe switch on message type

#### Query Router & Chat Agent
- Gemini-powered intent classification: chat (general conversation) / pipeline (single-signal deep analysis) / portfolio_review (multi-signal analysis)
- Pipeline sub-modes: existing_signal, risk_check, improve_portfolio, explore_ticker, new_event
- Ticker disambiguation handles ambiguous words (MY, ALL, THE, IT) using context to determine ticker vs regular word
- Chat agent refuses definitive buy/sell recommendations — presents options with tradeoffs instead

### The Result
- Multi-agent pipeline scores 4.2/5.0 overall vs 1.5/5.0 for single-agent (Gemini Flash or Pro) across 25 historical macro events
- Risk identification: 5.0/5.0 vs 0.1-0.3/5.0 — single-agent models structurally cannot identify portfolio-specific risks
- Recommendation quality: 4.6/5.0 vs 0.0/5.0 — single-agent cannot generate actionable multi-option recommendations with tradeoffs
- Range coverage (actual returns within predicted range): 68% vs 36-48% — calibration engine with volatility clamping produces realistic bounds
- Causal reasoning: 4.9/5.0 vs 2.9-3.0/5.0 — adversarial debate forces mechanism reasoning, not correlation-as-causation
- Full pipeline runs on Gemini 3 Flash (cheaper model) yet outperforms single-agent Gemini Pro (expensive model) on every quality dimension
- 25-event eval harness across 6 categories: rate decisions, CPI surprises, oil shocks, banking stress, geopolitical events, currency/FX moves — each with ground truth 5-day returns from Yahoo Finance
- pnpm monorepo with 4 packages (agents, server, frontend, shared), TypeScript + Zod throughout, deployed on Google Cloud Run

### Real Talk
- **The key architectural insight is separation of qualitative and quantitative reasoning.** LLMs hallucinate numbers — asking GPT/Gemini "how much will NVDA drop?" produces confident but ungrounded figures. By constraining LLMs to qualitative assessment (direction, magnitude 0-1, confidence) and routing dollar computation through formulas bounded by real volatility data, the system produces estimates that are both AI-informed and statistically defensible
- **Adversarial debate is more valuable than consensus.** Single-agent analysis produces one narrative. The bull-bear debate with explicit convergence detection and unresolved disagreement tracking produces stress-tested analysis. The debate transcript is often more informative than the conclusion
- **Monte Carlo with real correlations matters.** Portfolio risk isn't the sum of individual risks — correlation between holdings determines tail risk. Using the actual Yahoo Finance correlation matrix (not assumed independence) for 10,000 simulations produces VaR/CVaR numbers that account for diversification benefits (or concentration risks)
- **Human checkpoints are structural, not decorative.** Making `humanDecisionRequired: true` a literal type on every verdict means it's impossible to accidentally omit. The pipeline uses LangGraph `interrupt()` — checkpoints are architectural, not optional UI elements
- **"Do nothing" is the most important recommendation.** Most market events don't warrant action. Structurally requiring a baseline option with the cost of inaction forces the system to justify every recommendation against doing nothing — which is usually the right answer
- **Eval methodology shaped the architecture.** Running 25 historical events with ground truth returns revealed that single-agent models score 0.0/5.0 on recommendations — they literally cannot produce them. This isn't a model quality issue; it's a structural limitation. The multi-agent architecture enables qualitatively different output, not just quantitatively better output

### Tech I Used
- **Frontend:** React 19, Vite 6, React Router 7, TypeScript, CSS
- **Server:** Express.js 4, SSE streaming, session management
- **Agents:** LangGraph (StateGraph, interrupt, MemorySaver), Gemini 3 Flash Preview, Google Search grounding
- **Market Data:** Yahoo Finance API (prices, volatility, correlations), 24h TTL cache
- **Calibration:** Monte Carlo simulation (10K runs), VaR/CVaR, sqrt-of-time scaling, volatility clamping
- **Type Safety:** TypeScript 5.7, Zod 3.25, shared types package
- **Infrastructure:** pnpm workspaces, Google Cloud Run, LangSmith observability
- **Eval:** 25-event benchmark, LLM-as-judge (5 quality dimensions), 3-system comparison

---

## ShowMe — Voice-First AI Educational Platform (GitHub: [chijunzheng/ShowMe](https://github.com/chijunzheng/ShowMe))

### The Situation — why I built it
- Target audience: young learners (ages 5-12) who can't type fluently — existing AI tools are text-in/text-out with no active learning
- Voice-first interaction lowers the barrier to entry; TTS makes generated content accessible to pre-readers
- No existing platform combined AI content generation with gamified interactive learning modes
- Submitted to the Gemini 3 hackathon — built the entire application in 2 weeks, end-to-end, deployed live for judge access
- Production-ready from day one: Cloud Run backend, Firestore persistence, Cloud Storage for assets — already on cloud databases and serverless infrastructure, scalable beyond the hackathon without architectural changes
- Goal: prove that multimodal AI can power engaging education, not just chatbot Q&A

### What I Did

#### AI Model Orchestration & Fallback Chains
- Orchestrated 4 Gemini models (Flash, Pro Image, Pro TTS, Flash Lite) across 26 AI service functions
- Triple fallback strategy: primary model → secondary model → mock response — app never shows an error screen to a child
- Built repairJSON() to recover from truncated or malformed LLM outputs — common with streaming responses
- Prompt engineering: enforced JSON schema output, complexity levels (easy/medium/hard), and bilingual content support
- Design principle: graceful degradation over hard failure for every AI call

#### Real-Time Generation Pipeline
- Voice → STT → script generation → parallel image + TTS generation → slideshow assembly in under 30 seconds
- WebSocket streaming for real-time progress updates: START → SCRIPT_READY → IMAGES_GENERATING → COMPLETE
- Promise.all for parallel asset generation — images and audio render simultaneously, not sequentially
- Optimized for perceived speed: show partial results as they arrive rather than waiting for full completion

#### Interactive Learning Modes as State Machines
- Mystery Lab (8-state): detective investigation with hotspots, witnesses, timeline rebuild, and AI-evaluated warrant application
- Wonder Lab (6-state): counterfactual "what if" predictions with two-phase JIT generation — saves ~40% API costs by deferring expensive generation until needed
- Story Studio (12-state): branching narrative with 3 chapters × 3 choices, comic panel generation, and voice recording
- useReducer state machines — zero coupling between modes, independently testable, no shared global state

#### Gamification & Knowledge Graph
- XP/leveling system with question rarity tiers (common/rare/legendary), boss battles, streaks, mystery boxes, and comeback challenges — 15+ specialized components
- Knowledge Graph (Constellation Map): force-directed D3-inspired layout with AI-powered topic clustering via Gemini
- Gap discovery algorithm: analyzes explored topics and suggests unexplored related areas
- Firestore persistence with migration system — document model maps naturally to graph structures

#### Backend Architecture & Security
- Stateless Express backend on Cloud Run — Firestore for persistence, Cloud Storage for generated assets
- 23 route modules with layered middleware: rate limiting (300/15min general, 5/min for learn modes), Helmet.js CSP, CORS whitelist
- WebSocket origin validation prevents unauthorized connections to streaming endpoints
- Designed for serverless scaling: no in-memory state, all session data in Firestore

### The Result
- 75K LOC across 276 source files in 2 weeks — 125 React components, 17 custom hooks, 40+ API endpoints
- Voice-to-slideshow generation pipeline completes in under 30 seconds end-to-end
- 4 AI models orchestrated with triple fallback — zero user-facing errors from AI failures
- Submitted to Gemini 3 hackathon with live deployment
- Zero-context React architecture: 17 hooks replace Context providers entirely

### Real Talk
- useReducer over Redux/Zustand: each learning mode is a self-contained state machine — global state would create unnecessary coupling between modes that never interact
- Two-phase JIT generation in Wonder Lab: generating all content upfront wastes ~40% of API calls on paths users never explore — defer until the user commits to a branch
- Firestore over SQL: document model maps naturally to knowledge graph nodes and edges; serverless scaling matches Cloud Run's autoscaling without connection pool management
- Fallback chains are non-negotiable for child users — a 5-year-old cannot troubleshoot an error screen
- **75K LOC in 2 weeks is the proof point for AI-assisted development.** This was only possible because I used Claude Code with a structured workflow: decomposed the system into feature plan documents, identified which features could be built in parallel (e.g., the 3 learning modes are fully independent state machines), and orchestrated multiple coding agents to implement them simultaneously. The velocity came from treating agent context as an engineering problem — not from writing less code, but from writing it in parallel. The result isn't a throwaway prototype: it's deployed on cloud infrastructure with proper security middleware, rate limiting, and serverless scaling

### Tech I Used
- **Frontend:** React 18, Vite 5, Tailwind CSS 3, Vitest, React Testing Library, Playwright
- **Backend:** Node.js, Express, ws (WebSocket), Helmet.js, express-rate-limit
- **AI/ML:** Gemini 3 Flash, Gemini 3 Pro Image, Gemini 2.5 Pro TTS, Gemini 2.5 Flash Lite
- **Cloud:** Google Cloud Run, Firestore, Cloud Storage
- **Tools:** Docker, Git, GitHub

---

## jasonchi.ai — AI-Powered Portfolio with Reflective Agentic RAG (GitHub: [chijunzheng/jasonchi.ai](https://github.com/chijunzheng/jasonchi.ai))

### The Situation — why I built it
- Portfolio sites are static and forgettable — wanted an interactive one where recruiters ask questions and get AI-powered answers grounded in real content
- Opportunity to showcase AI engineering skills through the product itself — the portfolio demonstrates the techniques it describes
- Also a testbed for advanced RAG evaluation techniques: reflective retrieval, multi-granularity indexing, and shadow A/B testing
- Dual-mode architecture: works as a standalone frontend (direct Gemini) or as a distributed system with Python backend

### What I Did

#### Reflective Agentic RAG Pipeline
- 3-phase QA pipeline: Assess (Self-RAG confidence check) → Retrieve (planned retrieval with 3 search methods) → Evaluate + Answer (CRAG corrective re-retrieval if context is insufficient)
- Fast path optimization: category-scoped queries skip the assessment phase entirely for lower latency
- Context tracking prevents redundant retrieval — if a search method already ran, the pipeline skips it on re-retrieval
- LangGraph StateGraph orchestrates the agent flow with conditional edges between phases

#### Multi-Granularity Content Indexing
- Propositions: LLM-decomposed atomic facts via Gemini Flash at startup — optimized for precise, targeted retrieval
- Sections: markdown heading-based chunks preserving document structure for contextual answers
- Summaries: one-paragraph-per-category overviews for broad questions that span multiple topics
- Embeddings via text-embedding-004 with NumPy cosine similarity — no vector database dependency
- Solves the token-efficiency vs. comprehensiveness trade-off: propositions for precision, full content for recall

#### Live Evaluation & Shadow Testing
- Shadow eval: reflective pipeline and naive baseline run in parallel on the same query — toggled via ENABLE_SHADOW_EVAL flag
- LLM-as-judge scores both responses on faithfulness, context precision, and answer relevance (3 metrics)
- Batch eval: 50 curated questions across 5 difficulty tiers — trivial, single-fact, cross-section, multi-category, global synthesis
- SSE events stream eval comparison data alongside answers for transparent quality measurement

#### Frontend & Streaming Architecture
- Next.js 16 with React 19 and React Compiler — 49 components, 6 custom hooks
- SSE streaming: text chunks, follow-up suggestions, execution trace, and eval comparison all stream in real-time
- Dual accent theme: blue (oklch 262 hue) in light mode, amber (oklch 86 hue) in dark mode via CSS custom properties
- Chat sidebar layout: ChatSection owns state via useChat hook, passes to ChatSidebar + ChatMain

### The Result
- Production reflective agentic RAG serving live portfolio queries with full execution trace transparency
- 49 React components, 6 custom hooks, 29 backend Python files
- 50-question eval suite across 5 difficulty tiers validates retrieval quality on every change
- Dual-mode architecture: standalone frontend or distributed with backend — progressive enhancement
- Multi-granularity indexing enables both precise fact retrieval and comprehensive category answers

### Real Talk
- Most queries don't need full reflective retrieval — Self-RAG assessment saves tokens by short-circuiting simple questions
- Gemini rate limiting required BOTH a semaphore (concurrency) AND a rate controller (gap between calls) — a semaphore alone still bursts
- Multi-granularity indexing is the key architectural insight — propositions for precision, full content for recall, summaries for breadth
- Markdown as content source: no database needed, version-controlled, and parseable at multiple granularity levels

### Tech I Used
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Zod
- **Backend:** Python, FastAPI, Uvicorn, LangGraph, LangChain, Pydantic
- **AI/ML:** Gemini 2.5-Flash, text-embedding-004, NumPy
- **Eval:** LLM-as-judge, shadow evaluation, 5-tier batch eval
- **Tools:** Docker, pnpm, Vercel Analytics, LangSmith

---

## Master's Thesis Project: CSI-SandGlassNet — Deep Learning for Wireless Channel Compression (GitHub: [chijunzheng/CSI-SandGlassNet](https://github.com/chijunzheng/CSI-SandGlassNet))

### The Situation — why I built it
- M.Sc. master's thesis project at Liverpool John Moores University (2024) — designed a novel deep learning architecture for compressing wireless channel state information (CSI)
- CSI feedback is the bottleneck in massive MIMO systems: base stations need channel knowledge from user devices, but transmitting full CSI tensors consumes too much uplink bandwidth
- Existing approaches: CsiNet (pure CNN) was fast but inaccurate at high compression; transformer-based models (TransNet, SwinCFNet) improved accuracy but at 5-20× higher compute cost
- Goal: match transformer-level accuracy at CNN-level compute cost — a practical deployment requirement for real-time wireless systems

### What I Did

#### SandGlassNet Architecture Design
- Symmetric encoder-decoder "sandglass" structure with two processing stages (S1, S2): each stage applies Conv2d downsampling (stride = patch size) → flatten to token sequence → transformer blocks → reshape
- Encoder compresses CSI tensor (2, 32, 32) through two hierarchical downsampling stages, then a fully connected compression head maps to a latent codeword — codeword dimension computed as 32² × 2 / CR (e.g., 64 dimensions at CR=32)
- Decoder mirrors the encoder: FC decompression → two upsampling stages using ConvTranspose2d with transformer blocks at each level → reconstructed CSI
- Sin/cos positional embeddings added over tokenized spatial positions before each transformer stage — preserves spatial ordering that raw attention would lose

#### Transformer Block Internals
- Each block: LayerNorm → multi-head self-attention → residual connection → LayerNorm → feed-forward network (with controllable expansion ratio) → residual connection
- Attention models long-range dependencies across flattened CSI patches — critical because wireless channel correlations span the entire antenna array, not just adjacent elements
- Feed-forward expansion ratio and number of attention heads were tuned per stage — S1 (higher resolution, more tokens) uses fewer heads to control compute; S2 (lower resolution) uses more heads for richer representations
- Pre-norm (LayerNorm before attention) chosen over post-norm for more stable training with limited dataset size

#### Why Hybrid Conv + Transformer (Not Pure Either)
- Pure CNN (CsiNet): 388M FLOPs but −9.10 dB NMSE at CR=32 indoor — fast inference but misses long-range correlations in the channel matrix, NMSE degrades sharply at high compression
- Pure Transformer (SwinCFNet): −11.65 dB NMSE but 5,495M FLOPs — captures global dependencies at impractical compute cost for edge deployment on base station hardware
- SandGlassNet's hybrid approach: convolutions reduce spatial dimensions first (cheap local processing), then transformers operate on a smaller token sequence (efficient global attention) — 284M FLOPs for −11.33 dB NMSE
- Key architectural insight: run attention on downsampled tokens, not raw pixels — reduces sequence length quadratically, making self-attention affordable without sacrificing global modeling

#### Hierarchical Structure Ablation (S1/S2 Configuration)
- Tested multiple encoder-decoder configurations varying: number of stages (1 vs. 2), channel widths per stage, and transformer depth per stage
- Trade-off triangle: deeper hierarchy → better NMSE but more parameters and training time; shallow → faster but worse reconstruction
- Final configuration balanced the accuracy/compute slope — gained most of the NMSE improvement with modest parameter increase
- This ablation was more informative than single-metric comparisons because it mapped the Pareto frontier of accuracy vs. compute vs. training time

#### Baseline Replication & Cross-Model Comparison
- Replicated CsiNet (2018) as baseline: indoor CR=4 achieved −16.01 dB (original: −17.36 dB), confirming directional consistency before proposing improvements
- Outdoor replication was weaker (−6.98 dB vs. original −8.75 dB at CR=4) — motivating the need for architectures with stronger global modeling
- Cross-model comparison at CR=32 indoor: CsiNet −9.10 dB (388M FLOPs), TransNet −11.46 dB (479M FLOPs), SwinCFNet −11.65 dB (5,495M FLOPs), SandGlassNet −11.33 dB (284M FLOPs)
- Cross-model comparison at CR=32 outdoor: CsiNet −4.24 dB, TransNet −4.74 dB, SwinCFNet −5.12 dB, SandGlassNet −4.94 dB — consistent efficiency advantage across scenarios

#### Training Pipeline & Reproducibility
- Full PyTorch pipeline: CLI-driven configuration (--batchsize 200, --nepoch 1000, --lr 0.001, --cr {4,8,16,32}, --data_scenario {indoor,outdoor}), Adam optimizer with MSE loss
- Automatic checkpointing by validation loss — best model saved per run, test-only mode via --test_only --ckpt flag for evaluation without retraining
- TensorBoard logging with optional Weights & Biases integration (--wandb_proj) for cross-run experiment comparison
- Reproducibility: timestamped run directories, args.json snapshots, source code backup (main.py, model/, utils/) per experiment — any result traceable to exact configuration
- Evaluation metrics computed via FFT-domain comparison: convert real/imaginary channels to complex tensors, compute NMSE in frequency domain, plus correlation statistic rho

### The Result
- At CR=32 indoor: −11.33 dB NMSE with 284M FLOPs vs. SwinCFNet's −11.65 dB at 5,495M FLOPs — similar accuracy at ~20× lower compute
- Best performance-per-FLOP ratio among all compared models across both indoor and outdoor scenarios
- Three ablation studies each validated with measurable improvements: positional encoding (faster convergence + better final NMSE), transformer blocks (captures global CSI correlations convolutions miss), hierarchical depth (Pareto-optimal accuracy/compute configuration)
- Systematic evaluation across 4 compression ratios × 2 scenarios × 4+ model variants — not cherry-picked configurations

### Real Talk
- The key insight was that convolutions and transformers are complementary, not competing — convolutions handle local structure cheaply, transformers handle global structure on reduced-dimension tokens
- Positional encoding was almost cut for simplicity, but ablation showed it was essential — attention without positional awareness treats CSI patches as an unordered set, which is wrong for spatial data
- Outdoor scenarios consistently performed worse across all models — channel variability is fundamentally harder, and the COST2100 outdoor dataset may be undersized for robust training
- Running attention on downsampled tokens (not raw spatial dimensions) was the key compute efficiency trick — it's the same principle behind vision transformers like ViT, applied to the wireless domain
- The experiment infrastructure (checkpointing, logging, reproducibility) took significant upfront investment but was essential for tracking dozens of ablation runs — this discipline carried directly into my RAG evaluation pipeline work

### Tech I Used
- **Deep Learning:** PyTorch, custom transformer blocks, convolutional autoencoders, positional embeddings
- **Data:** COST2100 dataset (indoor/outdoor), MATLAB file parsing, NumPy, SciPy
- **Experiment Tracking:** TensorBoard, Weights & Biases, argparse CLI, JSON config snapshots
- **Evaluation:** NMSE, NMSE(dB), rho (correlation), FLOPs analysis
- **Tools:** Git, GitHub, Jupyter Notebook

---

## Telus AI Agent — From Pet Project to Production Agentic RAG (GitHub — Public POC: [chijunzheng/ORAN_RAG](https://github.com/chijunzheng/ORAN_RAG) | Production: Internal TELUS repo, confidential/NDA)

### The Situation — why I built it
- Daily pain point as a RAN engineer: hours searching through thousands of pages of 3GPP/ORAN specifications for answers that should be instantly queryable
- No existing tool handled the technical density and cross-reference nature of telecom specs — generic search returned noise
- Opportunity to learn AI/ML by solving a real problem rather than following tutorials
- What started as an unsanctioned side project built on personal time evolved through three distinct phases — pet project, lab optimization, and production-ready platform build — with rollout planned across 12 teams (400+ engineers)
- Production implementation code is enterprise-confidential and not shareable; architecture, decisions, and measurable outcomes are fully discussable

### What I Did

#### Phase 1: Pet Project RAG (Solo, Personal Time)
- Built initial RAG system using FastAPI, Google GenAI API, and Vertex AI Vector Search to answer technical RAN questions
- Document ingestion: PyPDF for PDFs + python-docx for Word specs — multi-format parsing handles the heterogeneous spec ecosystem
- Chunking strategy: experimented with fixed-size (512 tokens), paragraph-level, and section-based approaches — section-based won because 3GPP specs have rigid, self-contained section structures that break poorly at arbitrary boundaries
- Vertex AI Vector Search over Pinecone/Weaviate: native GCP integration meant fewer moving parts, and tunable parameters (distance measure, neighbor count, leaf node search fraction) let me optimize for telecom-specific retrieval patterns
- Streamlit frontend: built a functional demo UI in 2 days — intentional trade-off of polish for speed, since the goal was demonstrating RAG quality to leadership
- Adopted the [ORAN benchmark](https://arxiv.org/pdf/2407.06245) as an external evaluation standard — avoids overfitting to self-created test sets
- **Result: 78% benchmark accuracy vs. 62% raw LLM baseline — demo to a Telus Fellow earned a full-time AI engineering mandate**

#### Phase 2: Lab Ablation Studies (Single H100 GPU)
- Goal: systematic ablation study isolating the contribution of each improvement technique to push accuracy higher and secure executive buy-in

##### LLM Continual Pre-Training
- Fine-tuned Qwen-3-8B via continual pre-training on curated 3GPP/ORAN triplets (subject, relation, object) — e.g., (gNB-DU, connects-to, gNB-CU via F1 interface)
- 8-bit quantization freed enough VRAM for batch size 4 on a single H100 — ~2 weeks wall-clock time with checkpoint evaluation every 500 steps
- Result: **+2% accuracy** — smallest individual gain, but checkpoint-level analysis revealed which telecom sub-domains benefited most

##### Embedding Fine-Tuning
- Curated triplets: query + positive chunk (correct answer source) + negative chunk (plausible but incorrect)
- Contrastive learning objective: push domain-relevant query-chunk pairs closer in embedding space while separating negatives
- Result: **+3% accuracy** — better ROI than LLM fine-tuning for a fraction of the compute cost

##### Retrieval Optimization
- Hybrid retrieval: fused semantic similarity scores with BM25 lexical scores using reciprocal rank fusion — telecom acronyms (gNB-DU, E2SM) need exact match, but conceptual queries need semantic understanding — **+5% accuracy**
- Contextual chunking: prepended a Gemini-generated document summary to each chunk before embedding — gives the retriever document-level awareness at chunk-level granularity — **+5% accuracy**
- These retrieval-side improvements delivered 2-5x the ROI of model fine-tuning in a fraction of the time

- **Result: 88% benchmark accuracy (26 points above raw LLM, 10 above naive RAG). Presented to CTO, VP, and Director — systematic ablation evidence secured the production mandate**

#### Phase 3: Production-Ready Platform Build on GCP (Team of 5)
- Chose GCP for its AI capabilities and natural fit with Telus's existing cloud infrastructure
- Google's managed RAG solution performed well in US region demo but was unusable in the Canadian region required by Telus data sovereignty policy — pivoted to building custom system with lower-level Google APIs
- Built custom RAG pre-processing pipeline, Vertex AI Vector Search as vector database, and multi-agent orchestration via Google ADK (Agent Development Kit)
- Initially shipped with Google Chat as the frontend for zero-adoption-friction — later replaced with a purpose-built web frontend when Chat's limitations became blockers (see "Custom Frontend" below)

##### Agentic Document Ingestion
- Built agentic ingestion system processing 2,000+ documents from heterogeneous formats (PDF, DOCX, PPTX, XLSX, images) — Google Drive → GCS mirroring (10-min cron) → swarm-based parallel processing
- Swarm architecture: **VisualTranscriber** (Gemini vision for diagrams/flowcharts), **DataTranscriber** (structured extraction from tables/spreadsheets), **SemanticChunker** (section-aware splitting with contextual summaries)
- Indexer generates dense + sparse embeddings per chunk, batch API calls (250 chunks/batch), upserting into Vertex AI Vector Search for hybrid retrieval
- Firestore ledger for idempotent processing state tracking; asyncio semaphores + exponential backoff for API quota management
- Cloud Tasks pattern for query-time CPU allocation: lightweight API enqueues tasks to high-CPU worker instances, enabling independent scaling of API and compute tiers

##### Operational ETL Foundation (Splunk + On-Prem Config -> BigQuery)
- Built dual-path Splunk KPI ingestion: HEC push for low-latency feed + Search API pull every 15 minutes for completeness/reconciliation, with hourly reconciliation and nightly backfill
- Designed for ~5,000 sites with ~500 KPI metrics/site at 15-minute cadence (~240M potential site-KPI intervals/day before filtering), with watermark-based incremental processing
- Used GCS as immutable raw landing before BigQuery (`raw -> staging -> curated`) to enable replay, auditability, and safe schema evolution
- Integrated on-prem vendor configuration data from distributed servers using hybrid connectors (Samsung-primary API integration plus encrypted scheduled file export for smaller vendor systems)
- Modeled configuration with SCD Type 2 history plus current-state views, then joined with KPI facts to support AI answers and root-cause analysis
- Enforced quality gates (completeness, duplicates, referential checks, freshness SLA) with quarantine tables and batch-level lineage metadata

##### Multi-Agent System & Memory
- Google ADK for multi-agent orchestration — selected for built-in tool use, memory management, and seamless Google GenAI API integration
- **Short-term memory:** ADK's native database session service storing conversation history, events, and tool calls in Cloud SQL
- **Long-term memory:** Firestore vector database for semantic retrieval of past context; Cloud SQL for structured metadata queries
- Context compacted via LLM summarization at 50% context window threshold — empirically tested as the optimal point before answer quality degrades

##### Frontend Evolution: Google Chat → Custom Web Application
- **V1 — Google Chat:** initial deployment as a Chat bot via Apps Script — zero adoption friction since all Telus employees already had access. Custom cards displayed agent reasoning (retrieved chunks, tool calls, decisions) with thumbs up/down feedback stored in Cloud SQL
- **Why we outgrew Google Chat:** Chat's rigid card format couldn't render diagrams, graphs, or rich visual content from source documents. No support for multi-session management. No path to integrating dashboards for KPI visualization, performance trends, or configuration management. As the platform's scope expanded beyond Q&A, the interface became the bottleneck
- **V2 — Custom Web Frontend:** designed and deployed a purpose-built web application with a Gemini/ChatGPT-style conversational UI — left sidebar for session management and navigation, center panel for main chat content with rich rendering
- **Diagram and visual artifact retrieval:** during document ingestion, the VisualTranscriber agent extracts diagrams, flowcharts, and architecture images from source documents, saves them as separate artifacts on GCS with unique URIs, and embeds the GCS URI references directly into the text chunks. When retrieved chunks contain embedded diagram references, the frontend fetches the artifact from GCS and renders it inline alongside the text answer — supplementing explanations with the original visual context from the source document
- **Knowledge base management UI:** users can browse every document ingested into the shared knowledge base, view document metadata and chunk breakdowns, and ingest new documents directly through the frontend — making the knowledge base a collaboratively maintained shared resource rather than a static corpus
- **Authentication and access control:** Google Identity-Aware Proxy (IAP) configured at the load balancer layer — only authenticated Telus Google Workspace accounts can access the frontend, which connects to the backend API. Zero custom auth code; IAP handles OAuth flow, session tokens, and access enforcement
- **Extensible platform architecture:** the custom frontend is designed as an extensible agentic platform, not a single-purpose chatbot. Future use cases planned on the same interface: KPI dashboard with performance trends and anomaly visualization, configuration management for RAN parameters, proactive root cause analysis agent surfacing issues before tickets are filed, and capacity planning tools — similar to how Google's app ecosystem serves many use cases from a unified platform

##### Observability & 4-Dimension Evaluation
- Initially deployed Langfuse on a dedicated Cloud Run container for end-to-end tracing of every query
- Built automated evaluation pipeline: **Fact judge** (golden dataset by domain experts), **Retrieval judge** (LLM-generated query/chunk pairs), **Tool-call judge** (domain expert query/expected tool-call pairs), **Performance judge** (latency and cost vs. SLA)
- Evaluation runs automatically on every Cloud Run deployment, with reports diffable against previous versions
- Later evolved observability from Langfuse to a self-hosted LGTM stack (Loki, Grafana, Tempo, Mimir) with a custom ADK Telemetry Plugin and an AI-powered Observability Agent that investigates incidents via natural language — see the dedicated [Observability Agent project](#observability-agent) below for the full technical deep-dive

- **Result: Production-ready agentic RAG platform completed by end of 2025, with pilot usage and planned rollout across 12 teams (400+ engineers). Reduced spec search time from 2 hours to 20 minutes per query. User dissatisfaction improved from 50% to 30% after 3 months of feedback-driven iteration. Custom web frontend replaced Google Chat with rich diagram rendering, multi-session management, and knowledge base browsing — architected as an extensible agentic platform for future use cases (KPI dashboards, configuration management, proactive RCA)**

### The Result (Full Journey)
- Accuracy progression: 62% (raw LLM) → 78% (naive RAG) → 88% (optimized) — a 42% relative improvement
- Project arc: unsanctioned solo side project → lab ablation study → company-backed production system in under 2 years
- Ablation breakdown: hybrid retrieval (+5%) > contextual chunking (+5%) > embedding fine-tuning (+3%) > LLM continual pre-training (+2%)
- Key finding: retrieval quality improvements outperformed generator improvements by 2-5x on ROI
- Led and upskilled 4 junior engineers from zero AI experience to independently owning production system components
- 4-dimension automated eval pipeline catches regressions on every deployment before they reach users
- Presented to CTO, VP, and Director at each phase — built executive trust through evidence, not promises

### Real Talk
- **Solving your own pain point produces the best demos.** This started because *I* was frustrated searching specs. That authenticity was obvious to evaluators — the demo wasn't hypothetical, it was me showing how I already used it daily
- **Section-based chunking was a domain insight.** Generic chunking strategies (fixed-size, paragraph) performed poorly because 3GPP sections are designed as self-contained reference units. Domain knowledge applied to retrieval architecture matters more than fancier models
- **Fine-tuning the LLM gave the smallest ROI.** Two weeks training Qwen-3-8B on an H100 for +2% vs. days of engineering for +5% from hybrid search. Lesson: for most RAG systems, exhaust retrieval-side improvements before touching model weights
- **Don't trust vendor promises blindly.** Google's managed RAG worked great in the US region demo but fell apart in the Canadian region we needed. Should have demanded a Canadian-region proof of concept before committing
- **The ablation methodology was more valuable than any single technique.** Isolating each improvement independently built evidence-based decision making into the team's approach — and gave executives confidence in continued investment
- **Observability should be day-one, not an afterthought.** We bolted on Langfuse after hitting production issues. If tracing had been there from the start, we'd have caught the context window degradation problem much earlier
- **Google Chat was the right V1, but know when to graduate.** Zero-friction adoption got us early users and feedback fast. But Chat's rigid card format became the bottleneck the moment we needed to render diagrams from source documents, manage multiple sessions, or plan for dashboards. The lesson: ship on an existing platform to validate demand, but architect for the migration you'll inevitably need. We designed the backend API to be frontend-agnostic from day one, so swapping Google Chat for a custom web app was a backend-zero-change operation
- **Visual artifacts in chunks changed answer quality.** Telecom specs are diagram-heavy — a text-only answer about an F1 interface architecture is incomplete without the reference diagram. Embedding GCS URIs directly into chunks during ingestion means retrieval automatically surfaces the right visuals. The frontend just needed to fetch and render them — the intelligence is in the ingestion pipeline, not the UI
- **Leading juniors slowed me down at first, but 10x'd the outcome.** My instinct was to build everything myself. But investing in the team meant we could parallelize pipeline, evaluation, and frontend work. The 4 engineers I mentored now own AI system components independently

### Tech I Used
- **Phase 1:** Python, FastAPI, Uvicorn, Pydantic, Streamlit, Google GenAI API, Vertex AI Vector Search, PyPDF, python-docx
- **Phase 2:** PyTorch, Qwen-3-8B, H100 GPU, 8-bit quantization, Rank-BM25, contrastive learning, ORAN benchmark
- **Phase 3:** Google ADK, Cloud Run, Cloud Build, Cloud SQL (MySQL), Firestore, Cloud Storage, Cloud Tasks, Cloud Scheduler, BigQuery, Google Identity-Aware Proxy (IAP), Langfuse, OpenTelemetry, self-hosted LGTM stack (Grafana, Loki, Tempo, Mimir), PromQL, LogQL, TraceQL
- **Frontend (V1):** Google Chat, Apps Script | **(V2):** Custom web application (Gemini/ChatGPT-style UI), Google IAP authentication
- **Tools:** Docker, Git, GitHub, GitLab, uv, Jupyter Notebook, Claude Code

---

## AI-Powered Observability Agent for the LGTM Stack {#observability-agent}

### The Situation — why I built it
- The agentic copilot serving 400+ engineers was instrumented with Langfuse, but production debugging still required manually searching Tempo traces, writing LogQL queries in Loki, cross-referencing Grafana dashboards, and piecing together the story across multiple tabs — 10-15 minutes per investigation for an experienced developer
- No existing tool could correlate signals across all three observability backends (traces, logs, metrics) through natural language — developers needed to know PromQL, LogQL, and TraceQL to investigate incidents
- Goal: build an AI agent that lets developers investigate production incidents through conversation, autonomously querying the LGTM stack and correlating evidence across backends — and measure its quality rigorously with an eval framework

### What I Did

#### Self-Hosted LGTM Stack Deployment
- Deployed the full Grafana LGTM stack on a GCE VM (e2-standard-4, Container-Optimized OS) running Docker Compose with 5 containers: OpenTelemetry Collector (OTLP on gRPC/HTTP), Tempo for traces, Loki for logs, Mimir for metrics, and Grafana for dashboards
- OTel Collector acts as the single ingestion point — receives all telemetry from Cloud Run via Direct VPC Egress and routes to appropriate backends: traces to Tempo via OTLP, metrics to Mimir via Prometheus Remote Write, logs to Loki via push API
- Each backend stores data in dedicated GCS buckets (`nexus-observability-tempo`, `nexus-observability-loki`, `nexus-observability-mimir`) with local volumes only for WAL and index caches; Tempo retains 30 days of traces
- VM has no external IP — Cloud NAT for outbound, IAP-protected HTTPS load balancer (Google-managed SSL via sslip.io) for authenticated Grafana access
- Automated entire deployment via a single idempotent script (`deploy-gce.sh`): GCS bucket creation, firewall rules, config upload, VM provisioning with startup script, Cloud Run env var updates, and load balancer setup
- Pre-provisioned Grafana with all 3 datasources and 12 dashboards covering: request overview, LLM metrics, token cost tracking, error rates, trace exploration, log exploration, retrieval metrics, and eval results

#### Custom ADK Telemetry Plugin (OpenTelemetry Instrumentation)
- Built a custom `NexusTelemetryPlugin` that hooks into Google ADK's lifecycle callbacks to instrument every boundary in the agent's execution — every new agent or tool automatically inherits full observability without additional code
- **Agent spans** (`before_agent`/`after_agent`): wraps full agent invocations, capturing agent name and session ID
- **LLM metrics** (`before_model`/`after_model`): records model name, call latency, token usage (input/output), estimated cost in USD, and model errors
- **Tool spans** (`before_tool`/`after_tool`): wraps each tool call, capturing tool name, execution time, retrieved document count, and tool errors
- AI-specific OTel metrics: `nexus.llm.duration` (histogram), `nexus.token.input/output` (counter), `nexus.cost.estimated` (counter), `nexus.tool.duration` (histogram), `nexus.retrieval.doc_count` (histogram), `nexus.error.count` (counter), `nexus.request.duration` (histogram)
- Dual-export configuration: traces, logs, and metrics flow to both the self-hosted LGTM stack AND Google Cloud (Cloud Trace, Cloud Logging) simultaneously — same telemetry powers both the agent's investigations and the team's existing GCP workflows
- All telemetry operations wrapped in defensive error handling — if OTel is unavailable, instrumentation degrades to safe no-ops without impacting agent execution
- Handled ADK's async generator context corruption bug by patching OTel's context detach mechanism and using ContextVars for reliable log correlation
- Structured logging via `google.cloud.logging.StructuredLogHandler` with automatic trace/span ID injection for seamless log-to-trace navigation in both Cloud Logging and Grafana

#### 4-Agent Pipeline Architecture
- **Agent 1 — Intent Classifier:** lightweight routing via gemini-2.5-flash-lite, classifies into 7 categories (latency, failure, cost, eval, query generation, comparison, exploration) using intent definitions with boundary cases and 12 few-shot examples; keyword pre-filter provides fast-path routing for unambiguous patterns without an LLM call
- **Agent 2 — Investigation Planner:** reasoning-capable LLM (gemini-3-flash) calls all three backend discovery tools (Mimir metrics list, Loki label list, Tempo tag list) in parallel to verify what data actually exists before planning; query hints contain real metric names instead of guesses; produces tool allowlist with softer constraints for ambiguous intents
- **Agent 3 — Investigator:** pure evidence gatherer (gemini-3-flash, 25-iteration ReAct budget); explicit system prompt: "Your sole job is gathering evidence. A synthesis agent will write the final answer." Receives plan + query hints from planner, accesses 4 query tools, outputs raw evidence items; no synthesis pressure means full budget on following up empty results and cross-referencing signals
- **Agent 4 — Synthesizer:** single LLM call, no tools, always runs even if investigator exhausted budget early; receives all evidence + original question, produces structured answer (Finding, Evidence, Analysis, Next Steps) with anti-hallucination directive ("Base ONLY on provided evidence")
- Cross-signal correlation step before ReAct loop: given a trace ID, service name, or time window, fans out to Tempo, Loki, and Mimir in parallel via `asyncio.gather`, merging evidence into a single context block — connects *what happened* (traces) with *what the system was thinking* (logs) and *how it was performing* (metrics) without spending ReAct iterations on fan-out
- Sessions persisted in Cloud SQL for multi-turn follow-up investigations

#### Four LGTM Query Tools
- `tool_query_tempo`: search traces by service, operation, duration, and tags; fetch full trace details; list available tags and values
- `tool_query_loki`: execute LogQL range and instant queries; list labels and label values; filter by service, level, agent, and event
- `tool_query_mimir`: execute PromQL instant and range queries; list metrics and series; fetch metric metadata
- `tool_generate_query`: translate natural language into PromQL, LogQL, or TraceQL; returns query for developer review before execution — never blindly runs unbounded queries

#### Eval-Driven Architecture Iteration (V1 → V3)
- Built a formal evaluation framework: 50 curated questions across 6 intent categories, scored by an LLM-as-judge (Gemini) on 6 dimensions: intent accuracy, source selection, tool coverage, query correctness, answer quality, and composite score
- **Raw LLM baseline (0.371 composite):** established the floor — zero tool coverage, zero query correctness, 0.5 answer quality (plausible-sounding but fabricated answers)
- **V1 — Pure ReAct (0.731):** standard ReAct loop with all 4 tools always available; agent improvises entire investigation plan; keyword-based intent classification misroutes ambiguous questions; improvised PromQL has wrong syntax; prompt engineering couldn't fix the architecture
- **V2 — Quasi-Agentic Pipeline (0.797, +9.1%):** added deterministic stages around single ReAct agent: LLM intent classifier with definitions + few-shot, planner with backend routing + tool allowlist, 17 validated PromQL/LogQL templates, pre-execution front-loading; source selection jumped to 0.907, intent accuracy to 0.940; BUT hit hard ceiling at ~0.80 — single agent exhausted 6-call budget on tool calls in 62% of questions, falling back to deterministic template (scored 0.5 on answer quality)
- **V3 — 4-Agent Pipeline (0.882, +20.7%):** broke single-agent architecture into 4 specialized agents; template-fallback rate dropped from 62% to 0%; answer quality jumped from 0.638 to 0.833 (+30.8%) — largest single-dimension gain in entire evolution
- Ran ablation study removing each agent individually: intent classifier is the keystone (−0.328 composite without it — cascade failure), planner discovery has real value (−0.118), synthesizer is structurally important (−0.017)

#### Grafana Integration
- Embedded the Observability Agent directly into Grafana as an iframe panel in the Copilot dashboard — developers never leave Grafana to investigate incidents
- The iframe calls the agent's Cloud Run API, which queries the same LGTM backends that power the surrounding dashboards — no separate data pipeline or context switch
- The agent is self-observable: it exports its own telemetry back into the LGTM stack, so you can trace the agent investigating its own traces

### The Result
- Achieved 0.882 composite score on 50-question benchmark, +20.7% over single-agent baseline and +137.7% over raw LLM (0.371)
- Answer quality improved from 0.637 (V1) to 0.833 (V3), a +30.8% gain driven entirely by separating evidence gathering from synthesis
- Eliminated template-fallback problem: 0% template fallback in V3 vs. 62% in V2
- Reduced incident investigation time from 10-15 minutes of manual PromQL/LogQL/TraceQL authoring and dashboard-switching to under 30 seconds via natural language
- Used daily by 8-person development team to debug, optimize, and operate the agentic copilot platform
- Token cost tracking by model/agent identified one sub-agent consuming 40% of total LLM budget — led to a model swap that cut costs without impacting quality
- Tool duration histograms surfaced a retrieval timeout causing 15% of requests to fall back to sequential execution
- 12 pre-provisioned Grafana dashboards provide real-time visibility into request rate, P95 latency, success rate, tokens/s, cost rate, and error distribution

### Real Talk
- **Eval-driven development works, but question-level analysis matters more than aggregate scores.** The composite score going up is nice, but the real insight came from examining individual questions that failed: the "30-second request" question that got misclassified as "failure" instead of "latency" revealed the entire classifier-as-keystone dynamic. Aggregate metrics hide the most instructive failures
- **The budget ceiling was the most important finding.** V1 to V2 improved every process metric (intent, source selection, tool coverage) but answer quality stayed flat at 0.638. Without the eval framework, we would have thought V2 was working well. The eval revealed that the single-agent architecture had a structural ceiling — no amount of prompt engineering could fix it
- **Separation of concerns is an architecture principle, not just a code organization principle.** When I split the single ReAct agent into 4 agents, each with a focused prompt and its own tool set, every agent got better at its job. The investigator uses all 25 iterations for evidence because it doesn't worry about writing a nice answer. The synthesizer always runs because it has no tool budget to exhaust
- **Self-hosting the LGTM stack was the right call.** I needed the agent to query Tempo, Loki, and Mimir via HTTP APIs — not just view dashboards. That means direct access to the backends, which Grafana Cloud would have added complexity to (authentication, API gateway, network routing). Self-hosting on a single VM with Docker Compose keeps the architecture simple and the latency low
- **Instrument at the framework level, not the application level.** By hooking into ADK's lifecycle callbacks, every new agent or tool automatically gets full observability. We never have to remember to add tracing to a new component — it's inherited. This is the only sustainable approach for a system where agents and tools change frequently
- **The observability agent investigating its own traces is genuinely useful.** When the agent itself is slow, developers can ask it "why was the last observability query slow?" and it traces its own execution. Self-referential debugging sounds like a gimmick but actually closes the feedback loop

### Tech I Used
- **Observability Stack:** Grafana, Loki, Tempo, Mimir, OpenTelemetry (Python SDK, OTLP gRPC/HTTP exporters), PromQL, LogQL, TraceQL, Google Cloud Trace, Google Cloud Logging
- **AI/Agent:** Google ADK (Agent Development Kit), Gemini 2.5 Flash Lite, Gemini 3 Flash, custom ADK telemetry plugin, ReAct agents, multi-agent pipeline
- **Infrastructure:** Docker Compose, GCE (Container-Optimized OS), GCS, Cloud NAT, IAP-protected HTTPS load balancer, Cloud Run (agent API), Cloud SQL (session persistence)
- **Evaluation:** LLM-as-judge (Gemini), 50-question curated benchmark, 6-dimension scoring, ablation study framework
- **Backend:** Python, FastAPI, asyncio, aiohttp
- **Tools:** Docker, Git, GitHub, uv, Claude Code

---

## Cortex (Second Brain) — Personal Life Management Assistant (GitHub: [chijunzheng/Cortex-second-brain](https://github.com/chijunzheng/Cortex-second-brain))

### The Situation — why I built it
- Wanted a single-interface personal assistant that could capture memories, track finances, manage household inventory, and deliver automated digests — all through natural conversation in a chat interface (Telegram in this case)
- Existing personal productivity tools fragment attention across multiple apps (banking apps, note-taking apps, to-do lists, spreadsheets) — Cortex consolidates everything into the app I already check 50+ times a day
- Google Sheets as the primary data store was a deliberate choice: human-readable, manually editable, and familiar — no black-box database that only the app can access
- Started building Cortex before OpenClaw existed — this was born from personal need, not trend-following. Still actively improving it today and will keep extending it as new personal use cases emerge
- Built entirely with AI-assisted development using Claude Code

### What I Did

#### Single-Interface Architecture
- Designed a Telegram bot as the only user interface — no web dashboards, no mobile apps. Every feature (finance tracking, memory capture, inventory management, knowledge base search) is accessible via Telegram commands and natural language
- Flask backend deployed on Cloud Run with Google Sheets (12 sheets) as the primary human-readable data store and Firestore for vector embeddings and document storage
- Dual-mode architecture for dev/prod: in-memory Python dicts replace Firestore and Sheets in development mode, so all 37 test files run without GCP credentials — controlled by a single `ENVIRONMENT` env var

#### Automated Financial Pipeline
- End-to-end statement processing: user uploads PDF to Telegram → type detection via Gemini → transaction extraction → deduplication (SHA-256 hash) → batch save to Sheets + Firestore → merchant category auto-learning → dashboard update → summary sent back to user
- Merchant auto-learning system: `_Merchant_Categories` sheet learns merchant→category mappings from processed transactions, with fuzzy matching (0.80 threshold) for variant merchant names — users correct by editing the sheet directly
- Spending analytics: daily/weekly/monthly digests with top categories, top merchants, budget utilization, and anomaly detection (>2x previous period spending flagged automatically)
- Immutable data processing: all transaction transformations return new objects — e.g., `apply_merchant_categories()` returns `[{**tx} for tx in transactions]`, never mutating input

#### Memory & Knowledge Management
- 7 memory types (Task, Event, Inventory, Note, Memory, Project, Idea) across 10 life domains with AI-powered classification and entity extraction (dates, people, places, amounts)
- Google Drive knowledge base integration: OAuth-connected Drive search lets users query their own documents via natural language — "what do my notes say about..." triggers semantic search across Drive files
- Vector embeddings in Firestore for semantic memory retrieval — find related past memories when capturing new ones

#### Household Inventory System
- Receipt photo OCR via Gemini: snap a grocery receipt → items extracted → matched against `_Item_Catalog` for normalization → pending inventory updates queued in `_Inventory_Pending` for user approval (`/inv ok` or `/inv skip`)
- Location-aware tracking (fridge, pantry, freezer) with status management (in stock, low, out) and confidence scoring
- Kitchen digest: automated inventory summary highlighting items that are low or expired

#### Automated Digests & Reminders
- Cloud Scheduler triggers daily digests (tasks, events, bills due), weekly summaries, spending reports (Sunday 8pm), and adaptive check-in nudges
- Digest check-off system: each digest item gets a short code — `/tick T1 B2` checks off task 1 and bill 2 directly from the digest, zero navigation required
- Gemini-generated daily focus suggestions based on pending tasks and upcoming events

#### Production Reliability
- Telegram idempotency: `claim_update_once()` with 6-hour TTL prevents duplicate processing when Telegram retries webhook deliveries
- PDF processing lock with 30-minute TTL prevents concurrent processing of the same file
- All webhook endpoints return 200 regardless of processing outcome — prevents Telegram retry storms
- Integration calls (merchant categories, dashboard updates) wrapped in try/except so core processing continues even if secondary features fail
- gRPC safety: Docker sets `GRPC_POLL_STRATEGY=poll` and `GRPC_ENABLE_FORK_SUPPORT=0` to prevent SIGSEGV crashes in Firestore's gRPC library

### The Result
- ~20K LOC across 50+ source files with 37 test files (7,446 lines of tests)
- 12-sheet Google Sheets schema serving as both data store and human-readable audit trail
- Automated financial pipeline: PDF upload → categorized transactions → dashboard update in a single Telegram interaction
- Merchant auto-learning reduces manual categorization over time — most recurring merchants are auto-categorized after 2-3 transactions
- Daily/weekly automated digests with one-tap check-off codes keep life management to <5 minutes per day
- Dual-mode architecture means all tests run without GCP credentials — zero cloud dependency for development

### Real Talk
- **Google Sheets as a database sounds crazy, but it works for personal scale.** I can open my spreadsheet and see every transaction, every memory, every inventory item — no database GUI needed. The trade-off is write latency (Sheets API is slow), which matters less for a personal tool processing a few documents per day
- **Single-interface discipline is harder than it sounds.** Every feature I add, I ask "can this be done in Telegram?" If it needs a dashboard, I build a text-based Telegram summary instead. This constraint forces good UX thinking — if you can't explain a feature in a Telegram message, the feature is too complex
- **Immutability matters even in personal projects.** The financial pipeline processes real money. Mutating transaction objects mid-pipeline caused subtle bugs where merchant category overrides would disappear. Switching to immutable transforms (`[{**tx} for tx in transactions]`) eliminated an entire class of bugs
- **Dual-mode architecture was the highest-ROI architectural decision.** Being able to run all 37 test files with zero GCP credentials means I can iterate fast locally. Without it, every test run would need real Firestore and Sheets — which is both slow and expensive
- **Built entirely with AI-assisted development (Claude Code).** The structured workflow (plan documents → parallel agent execution) let me build a production-grade system with 12 integrated Google Cloud services as a solo side project. The velocity came from treating agent context as an engineering problem — decomposing the system into independent modules that agents could implement in parallel

### Tech I Used
- **Backend:** Python 3.11, Flask, Gunicorn, Pydantic, tenacity
- **AI/ML:** Gemini 2.5 Flash, Gemini 2.0 Flash (PDF classification, transaction extraction, OCR, entity extraction)
- **Cloud:** Google Cloud Run, Cloud Tasks, Cloud Storage, Cloud Scheduler, Firestore, Google Sheets API
- **Integrations:** Telegram Bot API, Google Drive API, Google OAuth
- **Data:** PyPDF, Google Sheets (12 sheets), Firestore vectors
- **Testing:** pytest (37 files, 7.4K LOC), dual-mode architecture (in-memory dev stores)
- **Tools:** Docker, Git, GitHub, Claude Code
