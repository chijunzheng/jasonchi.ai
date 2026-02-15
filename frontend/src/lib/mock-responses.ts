import type { ContentCategory } from '@/types/content'

interface MockResponse {
  readonly content: string
  readonly followUps: readonly string[]
}

const MOCK_RESPONSES: Record<ContentCategory, MockResponse> = {
  'work-experience': {
    content:
      "I've worked across several roles where I've built and scaled production systems. My most recent experience involved leading a team to rebuild a core platform service that handled 10M+ requests/day. I focused on system design, mentoring junior engineers, and establishing engineering best practices. Want me to dive deeper into any particular role?",
    followUps: [
      'Tell me about your leadership experience',
      'What was your biggest technical challenge?',
      'How do you handle cross-team collaboration?',
    ],
  },
  projects: {
    content:
      "I love building things! My side projects range from AI-powered tools to developer utilities. This very site is one of them — an AI resume that lets you have a conversation with my experience instead of reading a static PDF. I also built a real-time collaboration tool and a CLI for automating deployment workflows.",
    followUps: [
      'Tell me about this AI resume project',
      'What was the most technically complex project?',
      "What's your approach to side projects?",
    ],
  },
  skills: {
    content:
      "My core stack is TypeScript/React/Node.js on the frontend and Python for AI/ML work. I'm deeply experienced with cloud platforms (AWS, GCP), containerization (Docker, Kubernetes), and modern CI/CD pipelines. On the AI side, I work with LLMs, RAG systems, and agent frameworks. I believe in picking the right tool for the job rather than being loyal to one stack.",
    followUps: [
      'How deep is your Kubernetes experience?',
      'Tell me about your AI/ML work',
      'What technologies are you learning?',
    ],
  },
  education: {
    content:
      "My formal education gave me strong fundamentals, but honestly, most of my practical skills came from building things. I'm a continuous learner — I take courses, contribute to open source, and stay current with the latest in AI and distributed systems. The best learning happens when you're solving real problems.",
    followUps: [
      'What certifications do you have?',
      'How do you stay current with technology?',
      "What's the most valuable thing you learned in school?",
    ],
  },
  'honest-section': {
    content:
      "Here's the real talk: I'm still growing in areas like public speaking and estimating project timelines (who isn't?). I work best in environments with high autonomy, clear goals, and a culture that values shipping over perfection. I'm not a good fit for highly bureaucratic environments or roles that are purely maintenance-focused.",
    followUps: [
      'What are your actual weaknesses?',
      'What kind of manager do you work best with?',
      "What's a project that didn't go well?",
    ],
  },
  meta: {
    content:
      "This site is built with Next.js, TypeScript, Tailwind CSS, and Google's Gemini AI. Instead of a static resume, I wanted to create something that lets you explore my experience naturally through conversation. The AI has access to all my content and responds as me — conversationally and honestly. No hallucinations about experience I don't have!",
    followUps: [
      'How does the AI work behind the scenes?',
      'Why not just use a normal resume?',
      'What was the hardest part to build?',
    ],
  },
}

const GENERIC_RESPONSES: readonly MockResponse[] = [
  {
    content:
      "That's a great question! Based on my experience, I can share some specific examples. Would you like me to focus on a particular area — my work experience, projects, or technical skills?",
    followUps: [
      'Focus on work experience',
      'Tell me about your projects',
      'What are your strongest skills?',
    ],
  },
  {
    content:
      "I appreciate you asking that directly. Let me give you an honest answer with real examples from my career. I believe the best way to evaluate a candidate is through specific, concrete stories — not buzzwords.",
    followUps: [
      'Give me a specific example',
      'What would your colleagues say?',
      'How do you measure success?',
    ],
  },
]

export function getMockResponse(
  category: ContentCategory | null,
): MockResponse {
  if (category && MOCK_RESPONSES[category]) {
    return MOCK_RESPONSES[category]
  }
  return GENERIC_RESPONSES[Math.floor(Math.random() * GENERIC_RESPONSES.length)]
}

export const STARTER_PROMPTS = [
  "What's your biggest technical challenge you've solved?",
  'Why should we hire you over other candidates?',
  'What are your actual weaknesses?',
  'Tell me about a project that failed',
  "What's your management style?",
] as const

export const CATEGORIES = [
  { id: 'work-experience' as const, label: 'Work', icon: 'Briefcase' },
  { id: 'projects' as const, label: 'Projects', icon: 'Code' },
  { id: 'skills' as const, label: 'Skills', icon: 'Wrench' },
  { id: 'education' as const, label: 'Education', icon: 'GraduationCap' },
  { id: 'honest-section' as const, label: 'Honest', icon: 'Shield' },
  { id: 'meta' as const, label: 'Meta', icon: 'Info' },
] as const
