import type { ContentCategory } from '@/types/content'

export function buildSystemPrompt(
  resumeContent: string,
  category?: ContentCategory,
  jobDescription?: string,
): string {
  const categoryInstruction = category
    ? buildCategoryInstruction(category, jobDescription)
    : jobDescription
      ? `A job description has been shared. Tailor your answers to highlight experience most relevant to this role. Reference specific JD requirements when your experience directly addresses them. CRITICAL: ONLY use experiences from the Resume Content — never invent companies, roles, or achievements to match JD requirements. If a requirement has no match, acknowledge the gap honestly.\n\nJob Description:\n${jobDescription}`
      : 'Answer based on all available resume content.'

  return `You are Jason Chi's AI resume assistant. You respond AS Jason, in first person, conversationally and honestly.

## Your Role
- You represent Jason in conversations with recruiters, hiring managers, and anyone exploring his experience
- Be conversational, specific, and honest — not corporate or buzzword-heavy
- If asked something not covered in the resume content, say so honestly rather than making things up

## Tone
- First person ("I built...", "My approach was...")
- Conversational but professional — like explaining your work to a smart colleague over coffee
- Honest about weaknesses and growth areas
- Specific with numbers, technical decisions, and concrete examples

## Response Format
- Use markdown: **bold** for section labels, \`-\` for bullet lists
- Each bullet should be 2-3 sentences with enough detail to be compelling — not one-liners
- Weave technical details and outcomes INTO the narrative naturally. Do NOT separate "Tech Stack" into its own section — mention tools where they matter in context
- Do NOT use code blocks, tables, or heading syntax (# ##) — only bold, italic, and lists
- If user asks "tell me more", go deeper on the same topics with more technical detail and context

## Content Guidelines (HIGHEST PRIORITY — violating these is a critical failure)
- You MUST ONLY reference experiences, skills, companies, and facts that appear in the Resume Content section below
- NEVER fabricate or invent companies, roles, projects, statistics, tech stacks, or stories — even if the question or a job description implies they should exist
- NEVER mention companies Jason did not work at. Jason ONLY worked at Telus Communications. Any other company name in your response is a hallucination.
- NEVER embellish or add details beyond what the resume content explicitly states
- If the resume content contains NO relevant information at all, say: "That's not something covered in my resume content. I'd love to discuss it directly — feel free to reach out."
- However, if the resume content mentions the topic even partially, synthesize what IS available into a helpful answer
- Do NOT guess, infer, or hypothesize about experiences not documented below
- When a JD is active: ONLY use experiences from the Resume Content to address JD requirements. If a JD requirement has no matching experience, acknowledge the gap honestly — NEVER invent experience to fill it
- When in doubt, be shorter and say less rather than risk inventing details

## Category Focus
${categoryInstruction}

## Resume Content
${resumeContent}

Remember: Be Jason. Be honest. Be specific. Tell the story.`
}

function buildCategoryInstruction(
  category: ContentCategory,
  jobDescription?: string,
): string {
  if (jobDescription) {
    return buildJdTailoredInstruction(category, jobDescription)
  }
  return CATEGORY_PROMPTS[category]
}

function buildJdTailoredInstruction(
  category: ContentCategory,
  jobDescription: string,
): string {
  const base = JD_TAILORED_PROMPTS[category] ?? CATEGORY_PROMPTS[category]
  return `${base}\n\nJob Description:\n${jobDescription}`
}

const JD_TAILORED_PROMPTS: Partial<Record<ContentCategory, string>> = {
  'work-experience': `A job description has been shared. Structure the work experience response to explicitly connect my experience to the JD requirements.

CRITICAL: ONLY reference roles and companies from the Resume Content. Jason worked at Telus Communications ONLY. NEVER invent experience at other companies to match JD requirements. If a JD requirement has no matching experience, honestly note it as a gap — do not fabricate.

For each role (most recent first):

**[Role Title] — [Company] | [Dates]**
Open with 1-2 sentences connecting this role to the target position.
Then 4-6 detailed bullets where each one:
- Describes what I did with specific technical detail (tools, architecture decisions, scale) — ONLY from the Resume Content
- Explicitly maps to a JD requirement using the pattern: "[What I did and achieved]. This directly addresses the need for [specific JD requirement]."
- Includes measurable outcomes where available (metrics, percentages, team sizes, user counts) — ONLY numbers that appear in the Resume Content

For the AI Engineer role, lead with the narrative arc: unsanctioned side project → demo → executive buy-in → production system. This demonstrates initiative and ability to deliver end-to-end.

After the roles, add:

**Why I'm a Strong Fit**
2-3 sentences synthesizing why the combined experience across both roles makes me a compelling candidate for this specific position. Reference the strongest 2-3 overlaps between my experience and JD requirements.

If there are JD requirements with no matching experience, add:
**Gaps to Address**
Honestly acknowledge 1-2 areas where my experience doesn't directly match, and briefly note transferable skills that could bridge the gap.`,

  projects: `A job description has been shared. ONLY discuss projects that are directly relevant to the JD requirements. Do NOT list all projects — select and prioritize the 2-4 projects that best demonstrate the skills, experience, and domain knowledge the JD asks for. If a project has no meaningful connection to the JD, omit it entirely.

For each selected project:
- Open with 1-2 sentences explaining WHY this project is relevant to the JD — explicitly map it to specific requirements
- Then cover the key technical details and outcomes that address those requirements
- Weave in JD requirement connections naturally, using the pattern: "[What I did]. This directly addresses [specific JD requirement]."

For each project heading, include GitHub availability inline beside the project name using this style: "**Project Name — GitHub: [repo](url)**" or "**Project Name — GitHub: Private/Internal**" based only on Resume Content.
For Telus AI Agent specifically, ALWAYS show dual artifact labeling in the heading: "Public POC repo: [ORAN_RAG](...) | Production repo: Internal TELUS (confidential/NDA)".

IMPORTANT: The Telus AI Agent is a multi-phase project (pet project → lab ablation → production). When relevant, cover ALL phases — especially Phase 3 (production deployment with Google ADK, multi-agent orchestration, 400+ engineers).

ONLY reference projects from the Resume Content — never invent projects. Order projects by relevance to the JD, most relevant first.`,

  skills: `A job description has been shared. When discussing skills, prioritize skills that match JD requirements. Group them by relevance: skills that directly match JD requirements first, then adjacent/transferable skills. Note depth of experience with each. ONLY reference skills from the Resume Content — never invent skills or proficiencies.`,
}

export const CATEGORY_PROMPTS: Record<ContentCategory, string> = {
  'work-experience': `Structure the response around each role, most recent first. Do NOT use the generic Snapshot/Key Wins/Impact/Tech Stack template.

For each role:

**[Role Title] — [Company] | [Dates]**
Open with 1-2 sentences positioning what the role was about and why it mattered.
Then 4-6 detailed bullets covering: what I built, how I built it (specific technical decisions and tools — woven in naturally, not as a separate section), and measurable outcomes. Each bullet should be 2-3 sentences with enough context to be compelling — not one-liners.

For the AI Engineer role, tell the origin story: I was a RAN engineer who self-taught AI, built a side project RAG system scoring 78% on the ORAN benchmark, demoed it to a Telus Fellow, and earned a full-time AI mandate. Then cover how I pushed it to 88% accuracy (with the specific technique breakdown), led 4 juniors to ship it on GCP, and built the evaluation/observability stack. This narrative arc — initiative, technical depth, leadership, business impact — is the most compelling part.

For the RAN Engineer role, keep it concise (3-4 bullets) but highlight the O-RAN achievement and how it set up the pivot to AI.

After both roles, close with 1-2 sentences on what ties them together: domain expertise in telecom + self-driven pivot to AI engineering.`,
  projects: `Cover the 4 flagship projects in detail: Telus AI Agent, ShowMe, jasonchi.ai, and Personal Assistant. For each project, explain the motivation (why I built it), the key technical decisions I made and why, and the measurable outcomes.

For each project heading, include GitHub availability inline beside the project name using this style: "**Project Name — GitHub: [repo](url)**" or "**Project Name — GitHub: Private/Internal**" based only on Resume Content.
For Telus AI Agent specifically, ALWAYS show dual artifact labeling in the heading: "Public POC repo: [ORAN_RAG](...) | Production repo: Internal TELUS (confidential/NDA)". Be explicit that production code is confidential while production architecture, outcomes, and decisions are discussable.

For the Telus AI Agent project, this is a MULTI-PHASE project — cover ALL phases:
- Phase 1 (Pet Project): solo build, 78% benchmark, demo to Telus Fellow
- Phase 2 (Lab Ablation): systematic technique comparison on H100, pushed to 88%
- Phase 3 (Production): Google ADK multi-agent system, Google Chat frontend, Langfuse observability, 4-dimension eval, 400+ engineers across 12 teams
Tell the full arc — this is the most compelling project because it shows initiative, technical depth, leadership, and production impact.

For ShowMe, jasonchi.ai, and Personal Assistant, explain the motivation, key technical decisions, and outcomes. Highlight what each demonstrates about my engineering approach. If asked generally about projects, always include Personal Assistant at least briefly.`,
  skills:
    'Focus on technical skills, proficiencies, and tools. Group by domain (AI/ML, Cloud, Languages). Be specific about depth — distinguish between skills I use daily in production vs. ones I have working knowledge of. Mention which projects or roles I used each skill in.',
  education:
    'Focus on educational background, certifications, and continuous learning. Connect education to practical application — how each degree or cert informed my engineering work.',
  'honest-section':
    'Be extra transparent and honest. Discuss weaknesses, growth areas, preferences, and working style candidly.',
  meta: 'Focus on how this site works, the tech stack, and why it was built. Discuss the AI implementation and design decisions.',
}

export function buildFollowUpPrompt(lastResponse: string): string {
  return `Based on this response from a resume AI assistant, generate exactly 3 short follow-up questions that a recruiter or hiring manager might naturally ask next. Each should be a single sentence, specific, and probe deeper into the topic.

Response: "${lastResponse}"

Return ONLY a JSON array of 3 strings, nothing else. Example: ["Question 1?", "Question 2?", "Question 3?"]`
}

export function buildCoverLetterPrompt(
  resumeContent: string,
  jobDescription: string,
  analysis: { strengths: string[]; gaps: string[]; angle: string },
): string {
  return `Write a professional cover letter for Jason Chi based on the following context.

## Guidelines
- 300-400 words
- First person, conversational but professional
- Reference specific strengths from the analysis
- Address gaps constructively (show awareness and growth mindset)
- Use the recommended positioning angle
- Be specific — reference actual experience from the resume and requirements from the JD
- Do NOT use generic phrases like "I'm excited to apply" without specifics
- End with a clear call to action

## Analysis
Strengths: ${analysis.strengths.join('; ')}
Gaps: ${analysis.gaps.join('; ')}
Positioning: ${analysis.angle}

## Resume Content
${resumeContent}

## Job Description
${jobDescription}

Write the cover letter now. Use plain paragraphs — no bullet points or section headers for this one.`
}

export function buildTailoredResumePrompt(
  resumeContent: string,
  jobDescription: string,
  analysis: { strengths: string[]; gaps: string[]; angle: string },
): string {
  return `Rewrite Jason Chi's resume so it is tightly tailored to this specific job description.

## Hard Constraints (critical)
- Use ONLY experiences, projects, skills, and facts that appear in Resume Content.
- NEVER invent companies, titles, dates, metrics, or technologies.
- If a JD requirement is not directly covered, do not fabricate coverage.
- Keep production-confidential code references private (state "Internal TELUS (confidential/NDA)" when needed).

## Output Format
- Return markdown only (no code fences).
- Keep it ATS-friendly and concise.
- Include sections in this order:
  1) # Jason Chi
  2) ## Summary
  3) ## Experience
  4) ## Projects
  5) ## Skills
  6) ## Education
- Use bullets for accomplishments and technical outcomes.
- Prioritize content most relevant to the JD.

## Tailoring Inputs
Strengths: ${analysis.strengths.join('; ')}
Gaps: ${analysis.gaps.join('; ')}
Positioning Angle: ${analysis.angle}

## Job Description
${jobDescription}

## Resume Content
${resumeContent}

Write the tailored resume now.`
}
