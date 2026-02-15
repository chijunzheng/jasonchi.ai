---
category: education
title: Education
order: 4
---

## Master of Computer Science at Liverpool John Moores University [2022–2024]

### The Situation — what drew me there
- Electrical/Telecom RAN engineering was my foundation from undergrad, but I wanted to pivot into AI/ML with formal academic grounding
- Chose Liverpool John Moores University for its software engineering and AI research strengths, UK tech industry connections, and flexible part-time program that allowed me to work full-time while studying
- Goal: build rigorous ML fundamentals — not just API-level usage, but the math and architecture intuition needed to design novel models
- The program's thesis requirement was a major draw — I wanted a substantial research project, not just coursework

### What I Did

#### Thesis: CSI-SandGlassNet — Deep Learning for Wireless Channel Compression
- Designed SandGlassNet, a transformer-assisted autoencoder for compressing wireless channel state information (CSI) — the core feedback mechanism in MIMO wireless systems
- Architecture: convolutional downsampling captures local spatial structure, transformer blocks model long-range channel correlations, convolutional upsampling reconstructs the signal — a "sandglass" encoder-decoder with positional embeddings over tokenized CSI patches
- Input: CSI tensors shaped (2, 32, 32) representing real/imaginary channels; output: reconstructed CSI from a compressed latent codeword at compression ratios 4×, 8×, 16×, 32×
- Evaluated against CsiNet (classic CNN baseline), TransNet, and SwinCFNet on the COST2100 indoor/outdoor dataset

#### Thesis Results: Near-SOTA Accuracy at 20x Lower Compute
- At CR=32 indoor: SandGlassNet achieved −11.33 dB NMSE with only 284M FLOPs vs. SwinCFNet's −11.65 dB at 5,495M FLOPs — similar accuracy at ~20× lower compute
- Ablation studies validated each architectural choice: positional encoding improved convergence and final NMSE; transformer blocks captured global CSI correlations that pure convolutions missed; hierarchical encoder-decoder depth was tuned for optimal accuracy/compute balance
- Metrics: MSE (training), NMSE and NMSE(dB) via FFT-domain comparison, rho (correlation) — standard wireless channel reconstruction metrics
- Baseline replication of CsiNet 2018 confirmed directional consistency before proposing improvements

#### Training Pipeline & Experiment Infrastructure
- Built full PyTorch training pipeline: CLI-driven configuration, Adam optimizer with MSE loss, automatic checkpointing by validation loss, TensorBoard logging, optional Weights & Biases integration
- Reproducibility: timestamped run directories, argument snapshots (args.json), source code backup per experiment run
- Tested across indoor/outdoor scenarios at 4 compression ratios — systematic grid of experiments, not just cherry-picked configurations
- Compared CsiNet, TransNet, SwinCFNet, and SandGlassNet variants with consistent evaluation protocol

### The Result
- Graduated with Merit
- SandGlassNet: best performance-per-FLOP ratio among all compared models — competitive NMSE at dramatically lower compute cost
- Three ablation studies (positional encoding, transformer blocks, hierarchical structure) each demonstrated measurable accuracy improvements, justifying every architectural component
- Built a production-style ML experiment pipeline with checkpointing, logging, and reproducible configurations
- Research directly informed my approach to evaluation-driven AI development at Telus — the ablation methodology carried over to RAG system optimization

### Real Talk
- The thesis taught me that compute efficiency matters as much as raw accuracy — a lesson that directly applied when optimizing RAG retrieval at Telus (retrieval improvements gave 2-5× better ROI than model fine-tuning)
- Working full-time while completing a master's part-time was brutal but forced ruthless prioritization — I learned to scope experiments tightly and iterate on the highest-signal ablations first
- The hybrid conv + transformer architecture was a deliberate design choice, not a kitchen-sink approach — each component was justified by ablation evidence, which became my standard for all future architecture decisions
- If I could redo it: I'd start the thesis earlier and run more compression ratio experiments — the outdoor scenario results were weaker and deserved more investigation

### Tech I Used
- **Deep Learning:** PyTorch, custom transformer blocks, convolutional autoencoders, positional embeddings
- **Data:** COST2100 dataset (indoor/outdoor), MATLAB file parsing, NumPy, SciPy
- **Experiment Tracking:** TensorBoard, Weights & Biases, argparse CLI, JSON config snapshots
- **Evaluation:** NMSE, NMSE(dB), rho (correlation), FLOPs analysis
- **Tools:** Git, Jupyter Notebook

---

## Bachelor of Science in Electrical Engineering (Multimedia Systems) at Toronto Metropolitan University [2012–2017]
- Multimedia systems concentration: digital signal processing, data compression, communications theory, and embedded systems
- Mathematical foundation (linear algebra, probability, Fourier analysis) made self-teaching ML fundamentals dramatically easier — not learning math from scratch, just applying it in new contexts
- Telecom fundamentals (modulation, MIMO, channel modeling) became essential domain knowledge for RAN engineering at Telus and the ORAN RAG project
- Signal processing and compression theory directly informed thesis work on CSI compression (SandGlassNet) years later

---

## Certifications & Continuous Learning

### Executive PG Programme in Software Development (DevOps) — IIIT Bangalore / upGrad [May 2022]
- Completed a structured program covering software engineering fundamentals, CI/CD pipelines, containerization (Docker), orchestration (Kubernetes), infrastructure as code, and cloud deployment patterns
- This was my bridge from telecom engineering to software engineering — the DevOps foundations (Docker, CI/CD, cloud architecture) directly enabled my later AI engineering work on GCP
- Practical projects reinforced production deployment skills: containerized applications, automated testing pipelines, and cloud infrastructure management
- The program's emphasis on engineering discipline — version control, automated testing, reproducible builds — shaped how I approach ML system development (not just model training)

### Self-Directed Learning
- Studied transformer architectures, embeddings, and retrieval systems through papers (Attention Is All You Need, RETRO, Self-RAG, CRAG) and hands-on implementation
- Completed deep learning coursework covering CNNs, RNNs, attention mechanisms, and training optimization — applied directly in thesis work
- Built multiple RAG systems from scratch to understand retrieval-generation trade-offs before working with production frameworks (LangChain, LangGraph, Google ADK)
- Active in AI engineering communities — learning from open-source projects, technical blogs, and conference talks to stay current with rapidly evolving tooling
- Philosophy: learn by building real systems that solve real problems, not by following tutorials — every major skill was acquired through a project with measurable outcomes
