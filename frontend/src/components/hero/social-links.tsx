import { Github, Linkedin, Mail } from 'lucide-react'
import { SOCIAL_LINKS } from '@/lib/constants'

const socialItems = [
  { href: SOCIAL_LINKS.github, icon: Github, label: 'GitHub' },
  { href: SOCIAL_LINKS.linkedin, icon: Linkedin, label: 'LinkedIn' },
  { href: SOCIAL_LINKS.email, icon: Mail, label: 'Email' },
] as const

interface SocialLinksProps {
  readonly variant?: 'primary' | 'default'
}

export function SocialLinks({ variant = 'default' }: SocialLinksProps) {
  const isPrimary = variant === 'primary'

  return (
    <div className="flex items-center justify-center gap-4">
      {socialItems.map(({ href, icon: Icon, label }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={
            isPrimary
              ? 'flex items-center gap-1.5 rounded-full p-2 text-foreground/60 transition-colors hover:bg-muted hover:text-primary'
              : 'rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
          }
          aria-label={label}
        >
          <Icon className={isPrimary ? 'h-[18px] w-[18px]' : 'h-5 w-5'} />
          {isPrimary && (
            <span className="hidden text-xs font-medium sm:inline">{label}</span>
          )}
        </a>
      ))}
    </div>
  )
}
