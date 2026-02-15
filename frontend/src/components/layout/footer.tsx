import { Github, Linkedin, Mail } from 'lucide-react'
import { SOCIAL_LINKS, SITE_CONFIG } from '@/lib/constants'

const socialItems = [
  { href: SOCIAL_LINKS.github, icon: Github, label: 'GitHub' },
  { href: SOCIAL_LINKS.linkedin, icon: Linkedin, label: 'LinkedIn' },
  { href: SOCIAL_LINKS.email, icon: Mail, label: 'Email' },
] as const

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between sm:px-6">
        <div className="flex items-center gap-4">
          {socialItems.map(({ href, icon: Icon, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label={label}
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          {SITE_CONFIG.name} — Built with Next.js + Gemini
        </p>
      </div>
    </footer>
  )
}
