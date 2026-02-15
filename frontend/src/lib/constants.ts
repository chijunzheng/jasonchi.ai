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
  { label: 'Years Experience', value: 5, suffix: '+' },
  { label: 'Apps Shipped', value: 23, suffix: '' },
  { label: 'Tech Stacks', value: 12, suffix: '' },
] as const

export const QUICK_FACTS = [
  { id: 'location', icon: 'MapPin', label: 'Location', value: 'Markham, Ontario' },
  { id: 'availability', icon: 'Calendar', label: 'Status', value: 'Open to opportunities' },
  { id: 'workAuth', icon: 'Shield', label: 'US Work Eligibility', value: 'TN-visa eligible' },
  { id: 'targetRoles', icon: 'Target', label: 'Target Roles', value: 'AI Engineer, AI Software Developer' },
] as const

export const HERO_TITLE = 'Jason Chi' as const
export const HERO_TAGLINE = 'Building intelligent systems that bridge humans and machines' as const
export const TARGET_ROLES = ['AI Engineer', 'AI Software Developer'] as const

export const TLDR = `TODO: Write your 2-3 sentence elevator pitch here. This is the TL;DR that recruiters will copy-paste to hiring managers. Make it count.` as const

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
  model: 'gemini-2.0-flash',
} as const
