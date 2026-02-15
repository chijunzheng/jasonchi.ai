# Jason.AI - Interactive AI Resume Platform

## Project Specification Document
**Version:** 1.0  
**Last Updated:** January 2025  
**Author:** Jason Chi

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Solution Overview](#solution-overview)
4. [Target Audiences](#target-audiences)
5. [Feature Specifications](#feature-specifications)
6. [Technical Architecture](#technical-architecture)
7. [UI/UX Design](#uiux-design)
8. [Content Requirements](#content-requirements)
9. [AI Prompt Engineering](#ai-prompt-engineering)
10. [Promotion Strategy](#promotion-strategy)
11. [Implementation Roadmap](#implementation-roadmap)
12. [Success Metrics](#success-metrics)
13. [Future Enhancements](#future-enhancements)

---

## Executive Summary

**Jason.AI** is a personal website that replaces the traditional resume submission process with an interactive AI-powered experience. Instead of sending static PDFs, recruiters and hiring managers can:

- Chat with an AI that knows everything about the candidate
- Paste a job description and get an instant fit analysis
- Generate tailored cover letters automatically
- Explore work history through a conversational interface

The site serves two audiences with a two-track design:
1. **HR Recruiters** → Fast, scannable hero section with key facts and CTAs
2. **Technical Hiring Managers** → Deep-dive AI chat with transparent agent architecture

---

## Problem Statement

### For Job Seekers
- Resumes are a "lossy format" — bullet points can't convey depth
- Cover letters are tedious and repetitive
- ATS systems filter out qualified candidates
- No way to stand out in a sea of similar applications

### For Recruiters
- 200+ applications per role, 6-10 seconds per initial screen
- Resumes all look the same
- Hard to assess true fit without interviews
- Culture fit is nearly impossible to evaluate from paper

### The Opportunity
Create a differentiated job search asset that:
- Demonstrates technical skills by being the product itself
- Provides more signal than any resume can
- Respects recruiter time while enabling depth for those who want it
- Bypasses ATS by driving direct outreach

---

## Solution Overview

### Core Concept
An AI representation of the candidate that can answer any question about their background, analyze job descriptions for fit, and generate tailored application materials.

### Key Differentiators
| Traditional Resume | Jason.AI |
|-------------------|----------|
| Static PDF | Interactive conversation |
| One-size-fits-all | Tailored to each JD |
| Claims skills | Demonstrates skills |
| Passive submission | Active engagement |
| ATS-dependent | Direct outreach vehicle |

### Tagline Options
- "Don't read my resume. Interview my AI instead."
- "I built an AI that answers questions about my background"
- "The resume that talks back"

---

## Target Audiences

### Primary: HR Recruiters (Non-Technical)

**Profile:**
- Reviews 200+ applications per role
- Spends 6-10 seconds on initial screen
- Pattern matching: keywords, years, companies
- Often on mobile between meetings
- Key question: "Can I forward this without looking dumb?"

**Needs:**
- Quick qualification check
- Easy information extraction
- Downloadable resume PDF
- One-click scheduling
- Copy-paste summary for internal notes

**Design Implications:**
- Light mode default (professional appearance)
- Above-fold hero with key stats
- Prominent CTAs (Download, Schedule, Video)
- Quick Facts card with checkbox info
- TL;DR with copy button

---

### Secondary: Technical Hiring Managers

**Profile:**
- Evaluates technical depth and fit
- Wants to understand problem-solving approach
- Interested in architecture decisions
- Values demonstrated skills over claimed skills
- Willing to spend 5-10 minutes if engaged

**Needs:**
- Technical deep-dives on projects
- Evidence of AI/ML expertise
- Code quality signals
- System design thinking
- Culture/working style fit

**Design Implications:**
- AI chat interface for exploration
- Transparent agent traces (show the tech)
- Project deep-dives with architecture discussion
- JD analyzer with honest gap assessment
- Dark mode option (developer preference)

---

## Feature Specifications

### 1. HR-Friendly Hero Section

**Purpose:** Pass the "6-second squint test" — recruiters should immediately see qualification signals.

**Components:**

```
┌─────────────────────────────────────────────────────────────┐
│ [Photo]  JASON CHI                                          │
│          AI Engineer & Full-Stack Developer                 │
│          "I build intelligent systems that ship fast"       │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                        │
│  │ 5+ yrs  │ │ 23 apps │ │ 12 tech │                        │
│  │ exp     │ │ shipped │ │ stacks  │                        │
│  └─────────┘ └─────────┘ └─────────┘                        │
│                                                             │
│  [▶ Watch 60s Intro] [Download Resume] [Schedule Call]      │
│                                                             │
│  QUICK FACTS                                                │
│  📍 SF Bay / Remote  🗓️ Immediately  🇺🇸 US Citizen         │
│  💼 Full-time       🎯 AI/ML Engineer, Founding Engineer    │
│                                                             │
│  TL;DR (copy this)                                    [📋]  │
│  "5 years building AI systems. Shipped 23 products..."      │
│                                                             │
│  [Google] [Anthropic] [AWS] | 🏆 Gemini Hackathon Winner    │
│                                                             │
│           ↓ Want to learn more? Talk to my AI ↓             │
└─────────────────────────────────────────────────────────────┘
```

**Specifications:**

| Element | Requirement |
|---------|-------------|
| Photo/Avatar | Professional headshot or branded initial |
| Name + Title | Immediately visible, large typography |
| Tagline | One memorable sentence |
| Stats | 3 key numbers (years, projects, etc.) |
| CTAs | Video intro, Resume download, Calendar link |
| Quick Facts | Location, availability, work auth, seeking |
| Target Roles | Pills/tags showing desired positions |
| TL;DR | 2-3 sentence summary with copy button |
| Social Proof | Company logos, recognition badges |
| Scroll CTA | Clear prompt to explore AI chat below |

---

### 2. 60-Second Video Intro

**Purpose:** Let recruiters assess communication skills and "vibe" without scheduling a call.

**Script Structure:**
```
[0-5s]   Hook: "Hi, I'm Jason. Let me save you some time."
[5-20s]  Who: Role, specialty, years of experience
[20-40s] What: 2-3 most impressive projects/achievements
[40-50s] Why: What you're looking for, what you bring
[50-60s] CTA: "Check out the site, or let's talk."
```

**Technical Requirements:**
- Embedded player (YouTube, Loom, or self-hosted)
- Thumbnail that entices click
- Modal overlay on click
- Mobile-responsive

---

### 3. AI Chat Interface

**Purpose:** Allow deep exploration of background through natural conversation.

**Components:**

```
┌──────────────────┬──────────────────────────────────────────┐
│                  │                                          │
│  [Avatar]        │  Chat Header                             │
│  Jason           │  "Viewing: Work Experience"              │
│  AI Engineer     │                                          │
│                  ├──────────────────────────────────────────┤
│  ● ONLINE        │                                          │
│                  │  [AI Avatar] JASON.AI                    │
│  ──────────────  │  I currently work in telecom infra...    │
│                  │                                          │
│  EXPLORE         │  [Typing indicator...]                   │
│                  │                                          │
│  ◆ Work Exp      │                                          │
│  ◇ Projects      │                                          │
│  ○ Skills        │                                          │
│  □ Education     │                                          │
│  ⚠ Honest Section│                                          │
│                  │                                          │
│  ──────────────  ├──────────────────────────────────────────┤
│                  │                                          │
│  LIVE ACTIVITY   │  [Input: Ask me anything...]    [Send]   │
│  ShowMe - 75%    │                                          │
│  2hrs ago 🔥14   │  Powered by Gemini + ADK                 │
│                  │                                          │
│  [📋 Analyze JD] │                                          │
│                  │                                          │
└──────────────────┴──────────────────────────────────────────┘
```

**Sidebar Categories:**

| Category | Icon | Content |
|----------|------|---------|
| Work Experience | ◆ | Current role, past roles, achievements |
| Side Projects | ◇ | ShowMe, Drowsy, Vibe Sleep, etc. |
| Technical Skills | ○ | Languages, frameworks, specialties |
| Education | □ | Formal education, continuous learning |
| The Honest Section | ⚠ | Preemptive objection handling |

**Chat Behavior:**
- Category click → AI responds with pre-seeded content (with typing animation)
- Free-form questions → AI retrieves from resume context and responds
- Follow-up questions → Multi-turn conversation with memory
- Typing animation for AI responses (15-20ms per character)

---

### 4. JD Analyzer

**Purpose:** Let recruiters paste a job description and get an instant fit analysis.

**Flow:**
```
[Paste JD] → [Analyze] → [Match Score + Breakdown] → [Generate Cover Letter]
```

**Output Components:**

| Component | Description |
|-----------|-------------|
| Match Score | Circular progress indicator (0-100%) |
| Match Level | "Strong Match" / "Good Match" / "Partial Match" |
| Strengths | Bullet list of aligned qualifications |
| Gaps | Honest acknowledgment of missing requirements |
| Recommended Angle | How to position for this specific role |
| Questions to Ask | Interview questions to ask the company |
| Cover Letter CTA | Button to generate tailored cover letter |

**AI Prompt Strategy:**
```
You are analyzing a job description for fit with Jason's background.

Rules:
- Be honest about gaps — never fabricate experience
- When there are gaps, pivot to adjacent strengths or learning velocity
- Acknowledge gaps briefly, don't dwell on them
- Always end with reasons to interview, not reasons to reject
- Match score should be realistic (60-90% typical range)
```

---

### 5. Cover Letter Generator

**Purpose:** Generate a tailored cover letter based on the pasted JD.

**Output:**
- Personalized opening referencing the specific role/company
- 2-3 paragraphs mapping experience to requirements
- Acknowledgment of any gaps with reframe
- Strong closing with call to action
- Copy button + Download option

---

### 6. Proof of Work Dashboard

**Purpose:** Show live activity to demonstrate you're actively building.

**Data Sources:**
- GitHub API: Recent commits, contribution streak
- Manual: Current project name and progress percentage
- Timestamp: "Last commit X hours ago"

**Display:**
```
┌────────────────────────────────────────┐
│ LIVE ACTIVITY                          │
├────────────────────────────────────────┤
│ ShowMe - Voice-first AI tutor          │
│ ████████████░░░░░░░░ 75%              │
│                                        │
│ Last commit: 2 hours ago               │
│ 🔥 14 day streak                       │
└────────────────────────────────────────┘
```

---

### 7. "The Honest Section" (Radical Transparency)

**Purpose:** Preemptively address objections and red flags.

**Content Structure:**
```markdown
## The Honest Section

**"Why side projects instead of FAANG?"**
I optimize for learning velocity and impact, not prestige. I've shipped 
more in 6 months of focused building than many do in 2 years at big tech.

**"Is 'vibe coding' a red flag?"**
It's actually a superpower. I leverage AI tools to 10x my output while 
maintaining code quality. The apps work, the architectures are sound.

**"What's the catch?"**
I get bored with maintenance. I thrive in 0→1 phases. If you need someone 
to keep the lights on, I'm not your person. If you need someone to build 
the future, let's talk.
```

---

### 8. Transparent Agent Traces (Technical Showcase)

**Purpose:** Demonstrate AI engineering skills to technical hiring managers.

**Implementation:**
```
┌─────────────────────────────────────────────────────────────┐
│ AI Response                                                 │
├─────────────────────────────────────────────────────────────┤
│ I have experience with Kubernetes from my telecom work...   │
│                                                             │
│ ▼ Show reasoning                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔧 Tool called: get_work_experience()                   │ │
│ │ 📄 Retrieved: work.md (lines 45-67)                     │ │
│ │ 🧠 Reasoning: User asked about K8s, found relevant      │ │
│ │    section in work history                              │ │
│ │ ⏱️ Latency: 340ms | Tokens: 1,247 | Cost: $0.002        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**What It Shows:**
- Tool/function calling
- RAG retrieval (if used)
- Latency optimization
- Cost awareness
- Production observability mindset

---

### 9. Theme Toggle

**Purpose:** Accommodate preferences of different audiences.

**Behavior:**
- Default: Light mode (HR-friendly, professional)
- Toggle: Dark mode (developer preference)
- Persisted in localStorage
- Smooth transition animation

---

### 10. Resume PDF with Embedded Links

**Purpose:** ATS-compatible resume that funnels to the website.

**Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ JASON CHI                                                   │
│ AI Engineer | jasonchi.ai ← Interview my AI                 │
│ SF Bay Area | Remote OK | jason@email.com                   │
│                                                             │
│ 🔗 jasonchi.ai — Ask my AI anything about my background     │
│                                                             │
│ ════════════════════════════════════════════════════════════│
│                                                             │
│ SUMMARY                                                     │
│ AI Engineer with 5+ years shipping production ML systems... │
│                                                             │
│ → See what I'm building right now (jasonchi.ai)             │
│                                                             │
│ [... standard resume content with keywords ...]             │
│                                                             │
│ ════════════════════════════════════════════════════════════│
│                                                             │
│ WHY THIS RESUME IS SHORT                                    │
│                                                             │
│ Resumes are a lossy format. I built something better:       │
│ → jasonchi.ai                                               │
│                                                             │
│ • Ask it anything about my experience                       │
│ • Paste a job description → see how I match                 │
│ • Generate a tailored cover letter in 30 seconds            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Requirements:**
- All links are clickable hyperlinks (not QR codes)
- ATS-parseable text content
- Standard section headers (Experience, Skills, Education)
- Keywords from target job descriptions
- Curiosity hooks to drive clicks ("Why is this resume short?")

---

## Technical Architecture

### Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  React + Tailwind CSS + TypeScript                          │
│  Hosted on Vercel                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
│  FastAPI + ADK (Agent Development Kit)                      │
│  Hosted on Cloud Run / Modal                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      LLM PROVIDER                           │
│  Google Gemini 2.0 Flash                                    │
│  (Fast, cheap, good context window)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CONTENT STORAGE                          │
│  Markdown files in repo (no database needed)                │
│  - resume.md                                                │
│  - work_experience.md                                       │
│  - projects.md                                              │
│  - skills.md                                                │
│  - honest_section.md                                        │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

```
src/
├── components/
│   ├── HeroSection/
│   │   ├── HeroSection.tsx
│   │   ├── StatsCard.tsx
│   │   ├── QuickFacts.tsx
│   │   ├── TldrCard.tsx
│   │   ├── SocialProof.tsx
│   │   └── VideoModal.tsx
│   ├── ChatSection/
│   │   ├── ChatSection.tsx
│   │   ├── Sidebar.tsx
│   │   ├── CategoryItem.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ProofOfWorkCard.tsx
│   │   └── AgentTrace.tsx
│   ├── JDAnalyzer/
│   │   ├── JDAnalyzer.tsx
│   │   ├── MatchScore.tsx
│   │   ├── StrengthsList.tsx
│   │   ├── GapsList.tsx
│   │   └── CoverLetterGenerator.tsx
│   └── common/
│       ├── ThemeToggle.tsx
│       ├── StatusIndicator.tsx
│       └── TypingAnimation.tsx
├── hooks/
│   ├── useTypingEffect.ts
│   ├── useChat.ts
│   └── useTheme.ts
├── services/
│   ├── api.ts
│   └── analytics.ts
├── data/
│   └── resumeData.ts
├── styles/
│   └── globals.css
└── App.tsx
```

### Backend Architecture (ADK)

```
backend/
├── main.py                 # FastAPI app
├── agents/
│   ├── router_agent.py     # Routes queries to appropriate handler
│   ├── qa_agent.py         # Answers questions about background
│   ├── jd_analyzer.py      # Analyzes job descriptions
│   └── cover_letter.py     # Generates cover letters
├── tools/
│   ├── get_work_experience.py
│   ├── get_projects.py
│   ├── get_skills.py
│   ├── get_education.py
│   ├── get_honest_section.py
│   └── search_resume.py
├── content/
│   ├── resume.md
│   ├── work_experience.md
│   ├── projects.md
│   ├── skills.md
│   └── honest_section.md
├── prompts/
│   ├── system_prompt.txt
│   ├── jd_analysis_prompt.txt
│   └── cover_letter_prompt.txt
└── config.py
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/chat` | POST | Send message, receive AI response |
| `/chat/stream` | POST | Streaming chat response |
| `/analyze-jd` | POST | Analyze job description |
| `/generate-cover-letter` | POST | Generate tailored cover letter |
| `/health` | GET | Health check |

### Data Flow

```
User Question
      │
      ▼
┌─────────────┐
│ Router Agent│ ─── Determines intent
└─────────────┘
      │
      ▼
┌─────────────┐
│ Tool Calls  │ ─── Retrieves relevant .md content
└─────────────┘
      │
      ▼
┌─────────────┐
│ QA Agent    │ ─── Synthesizes response
└─────────────┘
      │
      ▼
┌─────────────┐
│ Response    │ ─── Returns to frontend with optional trace
└─────────────┘
```

---

## UI/UX Design

### Design System

**Color Palette:**

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--bg-primary` | `#ffffff` | `#09090b` | Page background |
| `--bg-secondary` | `#f8fafc` | `#18181b` | Card backgrounds |
| `--text-primary` | `#0f172a` | `#fafafa` | Headings |
| `--text-secondary` | `#475569` | `#a1a1aa` | Body text |
| `--accent` | `#2563eb` | `#f59e0b` | CTAs, highlights |
| `--accent-secondary` | `#4f46e5` | `#f97316` | Gradients |
| `--success` | `#10b981` | `#10b981` | Positive indicators |
| `--warning` | `#f59e0b` | `#f59e0b` | Gaps, cautions |

**Typography:**

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 (Name) | System UI | 36-48px | Bold |
| H2 (Section) | System UI | 24-28px | Semibold |
| Body | System UI | 14-16px | Regular |
| Mono (Code/Stats) | JetBrains Mono | 12-14px | Regular |
| Small (Captions) | System UI | 12px | Regular |

**Spacing:**
- Base unit: 4px
- Component padding: 16-24px
- Section spacing: 48-64px

**Border Radius:**
- Small (buttons): 8px
- Medium (cards): 12px
- Large (modals): 16px
- Full (avatars): 50%

### Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 640px | Single column, stacked CTAs |
| Tablet | 640-1024px | Two column where appropriate |
| Desktop | > 1024px | Full sidebar + main layout |

### Animation Specifications

| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Page load | 300ms | ease-out | On mount |
| Theme toggle | 200ms | ease-in-out | On click |
| Typing effect | 15ms/char | linear | On message |
| Card hover | 150ms | ease-out | On hover |
| Modal open | 200ms | ease-out | On click |
| Scroll to chat | 500ms | ease-in-out | On CTA click |

---

## Content Requirements

### Resume Data Structure

```typescript
interface ResumeData {
  personal: {
    name: string;
    lastName: string;          // "Chi"
    title: string;
    tagline: string;
    email: string;
    phone?: string;
    location: string;
    availability: string;
    workAuth: string;
    seeking: string;
    targetRoles: string[];
    tldr: string;
  };
  
  stats: {
    yearsExperience: number;
    projectsShipped: number;
    techStacks: number;
  };
  
  socialLinks: {
    linkedin: string;
    github: string;
    twitter?: string;
    resume: string;
    calendly: string;
    website: string;
  };
  
  socialProof: {
    companies: string[];       // Logos of companies/tech worked with
    recognition: string[];     // Awards, certifications
  };
  
  workExperience: WorkExperience[];
  projects: Project[];
  skills: SkillCategory[];
  education: Education[];
  honestSection: HonestItem[];
  
  lookingFor: string[];        // What you want in next role
  
  proofOfWork: {
    currentProject: string;
    progress: number;
    lastCommit: string;
    streak: number;
  };
}

interface WorkExperience {
  company: string;
  title: string;
  startDate: string;
  endDate: string | "Present";
  location: string;
  description: string;
  achievements: string[];
  technologies: string[];
}

interface Project {
  name: string;
  tagline: string;
  date: string;
  description: string;
  techStack: string[];
  highlights: string[];
  link?: string;
  recognition?: string;
}

interface SkillCategory {
  category: string;
  skills: string[];
}

interface Education {
  institution: string;
  degree: string;
  field: string;
  year: string;
  highlights?: string[];
}

interface HonestItem {
  question: string;
  answer: string;
}
```

### Content Files (Markdown)

Create the following files in `/backend/content/`:

**work_experience.md**
```markdown
# Work Experience

## Current Role: AI Engineer | [Company] | 2022 – Present

I currently work in **telecom infrastructure**, managing large-scale XML 
configuration files for network management systems. My specialty is building 
**multi-agent systems** that orchestrate complex workflows.

### Key Achievements
- Designed multi-agent orchestration framework using ADK
- Built autonomous agents for configuration database management
- Reduced manual config time by 70% through intelligent automation

### Technologies
Python, ADK, LangChain, RAG, PostgreSQL, Redis, AWS

---

## Previous Role: Software Engineer | [Company] | 2020 – 2022

[Continue with details...]
```

**projects.md**
```markdown
# Side Projects

## ShowMe | Voice-First AI Tutor | February 2025

A voice-first educational app that transforms spoken questions into visual 
explanations using Gemini API.

### Features
- Smart follow-up classification
- "Always-on teacher" agent with duplex conversation
- 2D slide navigation with intelligent response hierarchies

### Tech Stack
Python, Gemini API, React, Voice interfaces

---

## Drowsy | Adaptive Bedtime Stories | 2024

A bedtime story app that uses silence detection to know when you've fallen asleep.

### Recognition
🏆 Won recognition at Google Gemini Hackathon

[Continue with other projects...]
```

---

## AI Prompt Engineering

### System Prompt

```
You are Jason's AI representative on his personal website. Your job is to 
help recruiters and hiring managers learn about Jason's background, skills, 
and experience.

## Core Rules

1. **Be honest** — Never fabricate experience or skills
2. **Advocate fairly** — Present Jason in the best accurate light
3. **Acknowledge gaps** — When asked about something Jason lacks, briefly 
   acknowledge it and pivot to related strengths or learning velocity
4. **Stay on topic** — Only discuss Jason's professional background
5. **Be conversational** — Respond naturally, not like a resume

## Tone

- Professional but warm
- Confident but not arrogant
- Concise but thorough when needed
- Honest about limitations

## When Asked About Gaps

Instead of: "Jason doesn't have Kubernetes experience."
Say: "Jason's container experience is primarily with Docker. He hasn't 
worked extensively with Kubernetes in production, but his infrastructure 
background and quick learning velocity mean he could ramp up quickly."

## When Unsure

If asked something not covered in the provided context, say:
"I don't have specific information about that. You might want to ask Jason 
directly — you can schedule a call at [calendly link]."

## Available Information

You have access to Jason's:
- Work experience
- Side projects
- Technical skills
- Education
- "Honest section" (preemptive objection handling)

Use the appropriate tools to retrieve relevant information before responding.
```

### JD Analysis Prompt

```
You are analyzing a job description to assess Jason's fit for the role.

## Input
- Job description text
- Jason's background (provided via tools)

## Output Format

Respond with a JSON object:

{
  "matchScore": 78,
  "matchLevel": "Good Match",
  "strengths": [
    "Strong AI/ML background aligns with role requirements",
    "Multi-agent system experience directly applicable",
    "Proven rapid prototyping and shipping velocity"
  ],
  "gaps": [
    "Role prefers 7+ years experience (Jason has 5)",
    "No direct experience with their specific tech stack"
  ],
  "angle": "Position as the high-velocity builder who can ship AI features 
    faster than traditional candidates. Jason's hackathon track record 
    proves he can go from idea to working product in days, not months.",
  "interviewQuestions": [
    "Ask about their AI roadmap - where can you make immediate impact?",
    "What's their current agent architecture?",
    "How do they balance shipping speed vs. technical debt?"
  ]
}

## Scoring Guidelines

- 90-100%: Near-perfect match, exceeds most requirements
- 75-89%: Strong match, meets core requirements
- 60-74%: Good match, meets many requirements with some gaps
- 40-59%: Partial match, significant gaps but transferable skills
- Below 40%: Poor match, major misalignment

## Rules

- Be realistic with scores — 100% matches are rare
- Always find at least 2-3 genuine strengths
- Be honest about gaps but frame constructively
- The "angle" should be actionable positioning advice
- Interview questions should help Jason stand out
```

### Cover Letter Prompt

```
You are generating a tailored cover letter for Jason based on a specific 
job description.

## Input
- Job description
- Company name (if available)
- Role title
- Jason's relevant background (via tools)

## Output Format

A professional cover letter that:

1. **Opening (1 paragraph)**
   - Reference the specific role
   - Hook with a compelling statement about fit
   - Mention something specific about the company if known

2. **Body (2-3 paragraphs)**
   - Map Jason's experience to their top requirements
   - Include specific achievements with metrics where possible
   - Address any obvious gaps proactively with reframes

3. **Closing (1 paragraph)**
   - Reiterate enthusiasm and fit
   - Clear call to action
   - Professional sign-off

## Tone
- Confident but not arrogant
- Specific, not generic
- Enthusiastic but professional

## Rules
- Never fabricate experience
- Use specific examples from Jason's actual background
- Keep to ~300-400 words
- Avoid clichés ("I'm a passionate self-starter...")
```

---

## Promotion Strategy

### Stealth Phase (Colleagues Don't Know)

| Channel | Action | Risk |
|---------|--------|------|
| Direct cold email | Anti-resume pitch to hiring managers | None |
| Recruiter InMail | LinkedIn DM to external recruiters | Very Low |
| Referrals | Friends at other companies forward link | None |
| AngelList/Wellfound | Startup job board profile | Low |
| AI/ML Discord servers | Share in job channels | None |

### Plausibly Deniable Phase

| Channel | Action | Cover Story |
|---------|--------|-------------|
| LinkedIn contact info | Add URL (not Featured) | "Side project" |
| GitHub README | Link from profile | "Portfolio demo" |
| Dev.to / Medium | Technical blog post | "Sharing learnings" |

### Public Launch Phase

| Channel | Action | Expected Outcome |
|---------|--------|------------------|
| Hacker News "Show HN" | Launch post | Viral potential |
| Twitter/X thread | "I built an AI to represent me" | Engagement |
| LinkedIn post + Featured | Full public launch | Inbound recruiter interest |
| Reddit | r/cscareerquestions, r/MachineLearning | Community feedback |

### Cold Outreach Template

**Subject:** I built an AI that can answer any question about my background

**Body:**
```
Hey [Name],

I saw you're hiring for [role]. Instead of sending a resume, I built something:

**jasonchi.ai** ← Talk to my AI. Ask it anything.

It knows my full work history, can analyze your job description, and will 
honestly tell you where I'm a fit (and where I'm not).

If you're curious, it takes 30 seconds. If not, no worries.

— Jason
```

### Show HN Post Template

**Title:** Show HN: I built an AI that interviews on my behalf so recruiters can skip the resume

**Body:**
```
Hey HN,

I got tired of the resume → cover letter → ATS → ghosted cycle, so I built 
an alternative: an AI that knows my entire background and can answer any 
question a recruiter might have.

Features:
- Chat interface to explore my experience
- Paste a JD → get instant fit analysis with honest gap assessment
- Generate tailored cover letters
- "Honest section" that preemptively addresses red flags

Tech: React, FastAPI, Gemini 2.0, ADK (Google's agent framework)

The JD analyzer is the most useful part IMO — it gives a realistic match 
score and tells you exactly how to position yourself for the role.

Demo: [link]
Code: [GitHub link if open-sourcing]

Would love feedback, especially from anyone who's hired engineers recently.
```

---

## Implementation Roadmap

### Phase 1: MVP (Week 1)
**Goal:** Functional site with core features

- [ ] Set up React project with Tailwind
- [ ] Build Hero Section (static content)
- [ ] Build Chat UI (frontend only, mock responses)
- [ ] Implement theme toggle
- [ ] Deploy frontend to Vercel
- [ ] Create content markdown files

### Phase 2: Backend Integration (Week 2)
**Goal:** Working AI chat

- [ ] Set up FastAPI backend
- [ ] Integrate Gemini API
- [ ] Implement basic ADK agent with tools
- [ ] Connect frontend to backend
- [ ] Deploy backend to Cloud Run
- [ ] Test end-to-end chat flow

### Phase 3: JD Analyzer (Week 3)
**Goal:** Full JD analysis and cover letter generation

- [ ] Build JD analyzer endpoint
- [ ] Build cover letter generator endpoint
- [ ] Build JD analyzer modal UI
- [ ] Implement match score visualization
- [ ] Add cover letter output and copy/download

### Phase 4: Polish & Extras (Week 4)
**Goal:** Production-ready with differentiating features

- [ ] Record 60-second intro video
- [ ] Add transparent agent traces
- [ ] Implement Proof of Work dashboard (GitHub API)
- [ ] Create downloadable PDF resume
- [ ] Add analytics tracking (UTM parameters)
- [ ] Performance optimization
- [ ] Mobile responsiveness audit

### Phase 5: Launch (Week 5)
**Goal:** Start promotion

- [ ] Soft launch: Test with 5-10 friends
- [ ] Begin stealth outreach (10 cold emails/week)
- [ ] Add to LinkedIn contact info
- [ ] Write Dev.to technical post
- [ ] (Optional) Show HN post

---

## Success Metrics

### Primary Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Website visits | 500/month | Analytics |
| Chat sessions started | 30% of visits | Event tracking |
| JD analyses completed | 10% of visits | Event tracking |
| Outreach response rate | 20%+ | Manual tracking |
| Interview requests | 5+/month | Manual tracking |

### Secondary Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Avg. session duration | 2+ minutes | Analytics |
| Resume downloads | 15% of visits | Event tracking |
| Calendar bookings | 5+/month | Calendly |
| Social shares | 10+/month | Share tracking |

### Tracking Implementation

Add UTM parameters to all outbound links:
```
?ref=cold-email-[company]
?ref=linkedin-dm
?ref=hn
?ref=twitter
?ref=referral-[name]
```

---

## Future Enhancements

### V2 Features (Post-Launch)

| Feature | Description | Priority |
|---------|-------------|----------|
| Voice Mode | Talk to the AI via microphone | High |
| Multi-agent visualization | Show agent handoffs in UI | Medium |
| Eval dashboard | Public accuracy/hallucination metrics | Medium |
| Adversarial mode | Let users try to break the agent | Low |
| Calendar integration | Real-time availability from calendar | Low |
| Recruiter accounts | Save JD analyses, track conversations | Low |

### Voice Mode Spec

```
┌─────────────────────────────────────────────┐
│                                             │
│         [🎤]  Click to talk                 │
│                                             │
│  "Tell me about your Kubernetes experience" │
│                                             │
│         [Transcribing...]                   │
│                                             │
│  AI responds via text + optional TTS        │
│                                             │
└─────────────────────────────────────────────┘
```

### Open Source Potential

Consider open-sourcing as a template others can use:
- Increases visibility (GitHub stars, forks)
- Content for Show HN / Product Hunt
- Positions you as a thought leader
- Others improve the code via PRs

---

## Appendix

### A. Tech Stack Justification

| Choice | Alternatives | Why This |
|--------|-------------|----------|
| React | Vue, Svelte | Most familiar, best ecosystem |
| Tailwind | CSS Modules, styled-components | Rapid iteration, design system |
| FastAPI | Express, Flask | Async, automatic docs, typing |
| Gemini | Claude, GPT-4 | Fast, cheap, good context window |
| ADK | LangChain, raw API | Shows Google ecosystem knowledge |
| Vercel | Netlify, Cloudflare | Best React DX, easy deploys |
| Cloud Run | Lambda, Modal | Good for containers, scales to zero |

### B. Cost Estimates

| Service | Estimated Monthly Cost |
|---------|----------------------|
| Vercel (Frontend) | Free tier |
| Cloud Run (Backend) | ~$5-10 |
| Gemini API | ~$5-20 (depends on traffic) |
| Domain | ~$12/year |
| **Total** | **~$15-35/month** |

### C. Security Considerations

- [ ] Rate limiting on API endpoints
- [ ] Input sanitization for JD text
- [ ] No PII storage (conversations not logged)
- [ ] CORS configured for frontend domain only
- [ ] API keys in environment variables, not code
- [ ] HTTPS everywhere

### D. Accessibility Checklist

- [ ] Keyboard navigation for all interactions
- [ ] Screen reader labels on interactive elements
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] Reduced motion option
- [ ] Alt text on images

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2025 | Initial specification |

---

*This document is a living spec. Update as the project evolves.*