---
category: projects
title: Projects
order: 2
---

## ShowMe — Voice-First AI Educational Platform

### The Situation — why I built it
- Target audience: young learners (ages 5-12) who can't type fluently — existing AI tools are text-in/text-out with no active learning
- Voice-first interaction lowers the barrier to entry; TTS makes generated content accessible to pre-readers
- No existing platform combined AI content generation with gamified interactive learning modes
- Submitted to the Gemini 3 hackathon — built end-to-end and deployed for judge access
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
- 75K LOC across 276 source files — 125 React components, 17 custom hooks, 40+ API endpoints
- Voice-to-slideshow generation pipeline completes in under 30 seconds end-to-end
- 4 AI models orchestrated with triple fallback — zero user-facing errors from AI failures
- Submitted to Gemini 3 hackathon with live deployment
- Zero-context React architecture: 17 hooks replace Context providers entirely

### Real Talk
- useReducer over Redux/Zustand: each learning mode is a self-contained state machine — global state would create unnecessary coupling between modes that never interact
- Two-phase JIT generation in Wonder Lab: generating all content upfront wastes ~40% of API calls on paths users never explore — defer until the user commits to a branch
- Firestore over SQL: document model maps naturally to knowledge graph nodes and edges; serverless scaling matches Cloud Run's autoscaling without connection pool management
- Fallback chains are non-negotiable for child users — a 5-year-old cannot troubleshoot an error screen
- **Built entirely with AI-assisted development.** 75K LOC in a hackathon timeframe was only possible because I used Claude Code with a structured workflow: decomposed the system into feature plan documents, identified which features could be built in parallel (e.g., learning modes are fully independent), and orchestrated multiple coding agents to implement them simultaneously. The velocity came from treating agent context as an engineering problem — not from writing less code, but from writing it in parallel

### Tech I Used
- **Frontend:** React 18, Vite 5, Tailwind CSS 3, Vitest, React Testing Library, Playwright
- **Backend:** Node.js, Express, ws (WebSocket), Helmet.js, express-rate-limit
- **AI/ML:** Gemini 3 Flash, Gemini 3 Pro Image, Gemini 2.5 Pro TTS, Gemini 2.5 Flash Lite
- **Cloud:** Google Cloud Run, Firestore, Cloud Storage
- **Tools:** Docker, Git, GitHub

---

## jasonchi.ai — AI-Powered Portfolio with Reflective Agentic RAG

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

## CSI-SandGlassNet — Deep Learning for Wireless Channel Compression

GitHub: [chijunzheng/CSI-SandGlassNet](https://github.com/chijunzheng/CSI-SandGlassNet)

### The Situation — why I built it
- Master's thesis project at Liverpool John Moores University — designed a novel deep learning architecture for compressing wireless channel state information (CSI)
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

## ORAN RAG Pet Project — Architecture Deep-Dive

### The Situation — why I built it
- Daily pain point: hours searching through thousands of pages of 3GPP/ORAN specifications for answers that should be instantly queryable
- No existing tool handled the technical density and cross-reference nature of telecom specs — generic search returned noise
- Opportunity to learn AI/ML by solving a real problem rather than following tutorials
- Built entirely on personal time while working full-time as a RAN engineer

### What I Did

#### RAG Pipeline Architecture Choices
- Document ingestion: PyPDF for PDFs + python-docx for Word specs — multi-format parsing handles the heterogeneous spec ecosystem
- Chunking strategy: experimented with fixed-size (512 tokens), paragraph-level, and section-based approaches — section-based won because 3GPP specs have rigid, self-contained section structures that break poorly at arbitrary boundaries
- Embedding: Vertex AI text-embedding for vector representations — chose managed service over self-hosted for zero-ops overhead
- Vector store: Vertex AI Vector Search with tunable recall/precision trade-offs (distance measure, neighbor count, leaf node search fraction)

#### Technology Stack Decisions
- FastAPI over Flask/Django: async Python for non-blocking LLM calls, automatic OpenAPI docs for easy handoff, Pydantic validation for type-safe request/response handling
- Streamlit for the frontend: built a functional demo UI in 2 days — intentional trade-off of polish for speed, since the goal was demonstrating RAG quality to leadership, not shipping a production frontend
- Vertex AI Vector Search over Pinecone/Weaviate: native GCP integration meant fewer moving parts, and tunable parameters let me optimize for telecom-specific retrieval patterns

#### Benchmarking & Iterative Improvement
- Adopted the ORAN benchmark (arxiv.org/pdf/2407.06245) as an external evaluation standard — avoids overfitting to self-created test sets
- Baseline measurement: raw LLM scored 62% on the benchmark without retrieval augmentation
- After RAG implementation: 78% accuracy — a 16-percentage-point improvement over raw LLM
- Tracked accuracy per question category (architecture, protocol, configuration) to identify retrieval weak spots and target improvements

### The Result
- 78% ORAN benchmark accuracy vs. 62% raw LLM baseline — 26% relative improvement
- Built entirely in spare time while working full-time as a RAN engineer
- Architecture and learnings became the foundation for the production system at Telus
- Demo to a Telus Fellow earned a full-time AI engineering mandate

### Real Talk
- Streamlit was perfect for internal demos but would not scale for production — intentional trade-off for speed over polish
- Section-based chunking for telecom specs was a domain insight: generic chunking strategies (fixed-size, paragraph) performed poorly because 3GPP sections are designed as self-contained reference units
- The 78% score convinced leadership, but showing which question categories the system got right vs. wrong mattered more than the aggregate number — category-level analysis built trust
- This project taught me that solving your own pain point produces the best demos — authenticity is obvious to evaluators

### Tech I Used
- **Backend:** Python, FastAPI, Uvicorn, Pydantic
- **AI/ML:** Google GenAI API, Vertex AI Vector Search, text-embedding
- **Data:** PyPDF, python-docx, NumPy
- **Frontend:** Streamlit
- **Tools:** Jupyter Notebook, Git

---

## LLM & Embedding Fine-Tuning — Ablation Study

### The Situation — why I built it
- Pet project RAG hit 78% on ORAN benchmark — needed to push higher to secure executive buy-in for a production mandate
- Hypothesis: domain-specific fine-tuning could close the gap between generic models and telecom-specific expertise
- Had access to a single H100 GPU in Telus lab — enough for 8-bit quantized training but not full-precision large models
- Goal: systematic ablation study isolating the contribution of each improvement technique

### What I Did

#### Dataset Curation for LLM Fine-Tuning
- Extracted knowledge triplets (subject, relation, object) from 3GPP/ORAN specifications — e.g., (gNB-DU, connects-to, gNB-CU via F1 interface)
- Curated training data focused on factual relationships between telecom concepts rather than bulk text
- Quality over quantity: small, high-signal dataset targeting the specific knowledge gaps identified in category-level benchmark analysis
- Triplet format chosen because telecom specs are fundamentally about entity relationships and protocol interactions

#### LLM Continual Pre-Training on H100
- Chose Qwen-3-8B for its strong multilingual baseline and permissive license — smaller models (1-3B) lacked capacity for telecom domain complexity, larger models (70B+) exceeded single-GPU budget
- 8-bit quantization freed enough VRAM for batch size 4 on a single H100 — critical for stable gradient updates on small domain-specific datasets
- Training configuration: learning rate warmup (10% of steps) with cosine decay, ~2 weeks wall-clock time with checkpoint evaluation every 500 steps
- Result: +2% accuracy — smallest individual gain, but the checkpoint-level analysis revealed which telecom sub-domains benefited most from continual pre-training

#### Embedding Model Fine-Tuning with Contrastive Learning
- Curated triplets: query + positive chunk (correct answer source) + negative chunk (plausible but incorrect)
- Contrastive learning objective: push domain-relevant query-chunk pairs closer in embedding space while separating negatives
- Improved retrieval precision for telecom-specific terminology that generic embeddings mapped poorly
- Result: +3% accuracy — better ROI than LLM fine-tuning for a fraction of the compute cost

#### Retrieval Optimization — Hybrid Search & Contextual Chunking
- Hybrid retrieval: fused semantic similarity scores with BM25 lexical scores using reciprocal rank fusion — telecom acronyms (gNB-DU, E2SM) need exact match, but conceptual queries need semantic understanding — +5% accuracy
- Contextual chunking: prepended a Gemini-generated document summary to each chunk before embedding — gives the retriever document-level awareness at chunk-level granularity — +5% accuracy
- These retrieval-side improvements delivered 2-5x the ROI of model fine-tuning in a fraction of the time
- Key insight: for RAG systems, retrieval quality improvements compound — better chunks → better generation → fewer hallucinations

### The Result
- 88% total ORAN benchmark accuracy — up from 78% naive RAG and 62% raw LLM baseline
- Ablation breakdown: hybrid retrieval (+5%) > contextual chunking (+5%) > embedding fine-tuning (+3%) > LLM continual pre-training (+2%)
- Key finding: retrieval quality improvements outperformed generator improvements by 2-5x on ROI
- Results presented to CTO, VP, and Director — systematic ablation evidence secured the production mandate

### Real Talk
- LLM fine-tuning had the worst ROI: 2 weeks of H100 compute for +2% vs. days of engineering for +5% from hybrid search. This shaped our team's prioritization framework: always benchmark retrieval-side changes first
- 8-bit quantization was a necessary constraint but introduced subtle quality trade-offs — full precision would likely have yielded +3-4% instead of +2%
- The ablation methodology (isolating each improvement independently) was more valuable than any single technique — it built evidence-based decision making into the team's approach
- If repeating this: start with retrieval optimization, only fine-tune models after retrieval improvements plateau

### Tech I Used
- **Training:** PyTorch, Qwen-3-8B, H100 GPU, 8-bit quantization
- **Retrieval:** Rank-BM25, Vertex AI Vector Search, text-embedding
- **Evaluation:** ORAN benchmark (arxiv.org/pdf/2407.06245), per-category accuracy tracking
- **Data:** 3GPP/ORAN specifications, curated triplet datasets
- **Tools:** Jupyter Notebook, NumPy, Pandas

---

## Cortex (Second Brain) — Personal Life Management Assistant

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
