export const SITE_CONFIG = {
  name: 'Jason Chi',
  title: 'Jason.AI — Interactive AI Resume',
  description:
    'An AI-powered interactive resume that lets you explore my experience through conversation. Ask anything about my work, skills, or projects.',
  url: 'https://jasonchi.ai',
  ogImage: '/og.png',
} as const

export const SOCIAL_LINKS = {
  github: 'https://github.com/chijunzheng',
  linkedin: 'https://www.linkedin.com/in/jasoncjz',
  email: 'mailto:chijunzheng@gmail.com',
} as const

export const NAV_ITEMS = [
  { label: 'Chat', href: '#chat' },
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
] as const

export const STATS = [
  { label: 'Engineers Served', value: 400, suffix: '+' },
  { label: 'Teams Impacted', value: 12, suffix: '' },
  { label: 'Tech Stacks', value: 15, suffix: '+' },
] as const

export const QUICK_FACTS = [
  { id: 'location', icon: 'MapPin', label: 'Location', value: 'Markham, Ontario' },
  { id: 'availability', icon: 'Calendar', label: 'Status', value: 'Open to opportunities' },
  { id: 'workAuth', icon: 'Shield', label: 'US Work Eligibility', value: 'TN-visa eligible' },
  { id: 'targetRoles', icon: 'Target', label: 'Target Roles', value: 'AI Engineer, Data Engineer, AI Software Developer' },
] as const

export const HERO_TITLE = 'Jason Chi' as const
export const TARGET_ROLES = ['AI Engineer', 'Data Engineer', 'AI Software Developer'] as const

export const TLDR = `I started as a telecom engineer with no formal AI background and taught myself ML/GenAI by solving real engineering pain points across technical docs, network config files, and complex management systems. What began as an after-hours project became a production AI agent at Telus because it earned stakeholder trust and delivered clear business value. I built it using an AI-native engineering workflow I designed: plan docs with explicit feature dependencies, parallel implementation through Claude Code, Codex, and Cursor agents, multi-agent code reviews, and automated commits to keep delivery disciplined. I apply this same approach consistently across projects, including shipping a full-stack hackathon app in two weeks and building a personal AI assistant/second-brain I can interact with anywhere. I look forward to bringing this same learning velocity, adaptability, and execution rigor to drive broader organizational impact.` as const

export const CONTENT_CATEGORIES = [
  'work-experience',
  'projects',
  'skills',
  'education',
  'honest-section',
  'meta',
] as const

export const CHAT_CONFIG = {
  maxMessages: 50,
  streamingEnabled: true,
  model: 'gemini-3-flash-preview',
} as const
