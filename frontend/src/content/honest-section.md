---
category: honest-section
title: The Honest Section
order: 5
---

## Things I'm Still Learning

### Currently Working On
- **Frontend & full-stack depth.** My background is EE → RAN → AI engineering. I built jasonchi.ai in Next.js 16 / React 19 / TypeScript to push myself beyond backend Python — it's functional, but I'm still building intuition for component architecture, performance patterns, and design systems
- **Scaling AI systems beyond a single team.** The Telus RAG platform is built for rollout across 12 teams (400+ engineers), but I haven't yet dealt with multi-tenant AI platforms, cross-org model governance, or enterprise-scale prompt management — those are next-level challenges I want to tackle
- **Agentic system reliability.** Multi-agent orchestration with Google ADK works, but agent-to-agent communication is still fragile — error propagation, retry semantics, and graceful degradation across agent boundaries are patterns I'm actively learning through production experience
- **Staying current with AI tooling velocity.** The landscape shifts monthly — I went from Gemini/NotebookLM to Cursor to Claude Code in under a year. Keeping my team current while filtering signal from hype is a skill I'm still refining

### Where I've Struggled
- **The Google managed RAG pivot cost weeks.** I trusted a US-region demo and built architecture around it before discovering it was unusable in Canada. Should have demanded a Canadian-region proof of concept upfront — learned to validate vendor promises in-region before committing
- **Underestimating the organizational complexity of AI projects.** Data sovereignty policies, stakeholder expectation management after a major pivot, and convincing leadership to keep investing during the messy middle were all harder than the engineering. I'm an engineer who had to learn to be a communicator
- **Observability as an afterthought.** We bolted on Langfuse after hitting production issues. If tracing had been there from day one, we would have caught the context window degradation problem much earlier instead of debugging from user complaints
- **Working full-time while completing a part-time master's was brutal.** I managed it, but it forced ruthless prioritization and there were times I couldn't give either role 100%. I learned to scope tightly and pursue only the highest-signal work — but I won't pretend it was sustainable
- **Fine-tuning ROI misjudgment.** Spent 2 weeks training Qwen-3-8B on an H100 for +2% accuracy, when hybrid retrieval gave +5% in a fraction of the time. I now exhaust retrieval-side improvements before touching model weights, but I had to learn that the expensive way

## What I'm Looking For

### Ideal Role
- Building production AI systems that solve real problems for real users — not research papers, not proofs of concept that never ship
- A team where I can be both a technical contributor and a multiplier — writing code and helping others level up
- End-to-end ownership from data pipeline to deployment to evaluation — I'm energized by closing the loop, not by owning a single slice
- An environment that values evaluation-driven development: if you can't measure it, you can't improve it
- Companies where AI is a core product capability, not a side experiment — I want to work where AI engineering is taken seriously enough to have real infrastructure, real evaluation, and real stakes

### Dealbreakers
- **Pure research without deployment.** I respect research, but I need to see my work used by real people — shipping is what motivates me
- **AI-washing.** Companies that slap "AI-powered" on marketing but don't invest in proper evaluation, observability, or data quality. If there's no eval pipeline, I'll spend my first month building one — and I need a team that sees that as valuable, not overhead
- **No autonomy.** I went from unsanctioned side project to company-backed production system by taking initiative. I need an environment that trusts engineers to identify problems and propose solutions, not just execute tickets
- TODO: Any other dealbreakers? (e.g., fully remote vs. hybrid preferences, company size, industry constraints)

## Working Style

### How I Work Best
- **Learn by building.** Every major skill I have was acquired through a project with measurable outcomes — not tutorials, not courses in isolation. Give me a real problem and a deadline
- **Evaluation-driven development.** I build measurement first, then iterate against it. The 4-dimension eval pipeline at Telus and the 5-tier eval suite on jasonchi.ai both came from this instinct
- **Incremental migration over rewrites.** The Telus system went from Streamlit demo → Google Chat production without a ground-up rewrite. I replace components one at a time, validating at each step
- **Module ownership for team productivity.** When I led 4 juniors, I partitioned the codebase so each engineer owned a distinct module — minimized merge conflicts, created clear accountability, and let us parallelize without coordination overhead
- **I default to transparency.** The Google Chat bot shows retrieved chunks, tool calls, and agent decisions. I'd rather show users how the AI works than hide behind a polished abstraction — trust comes from explainability

### What Colleagues Say
- **"He builds things before asking permission — and they work."** The ORAN RAG project started as an unsanctioned side project. Leadership found out when I demoed a working system, not a slide deck
- **"He makes AI accessible."** Colleagues who had never touched AI tools are now using Claude Code and Cursor daily because of the practical, workflow-specific training I ran — not abstract lectures, but "here's how this saves you 2 hours on this specific task"
- **"He invests in the team, not just the code."** The 4 junior engineers I mentored now independently own AI system components. I'd rather ship a slightly slower product with a stronger team than a faster product I built alone
- TODO: If you have specific quotes or feedback from performance reviews, Slack messages, or 360 reviews, add them here — direct quotes carry more weight than paraphrasing
