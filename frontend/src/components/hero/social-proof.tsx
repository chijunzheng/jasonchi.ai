'use client'

import { Badge } from '@/components/ui/badge'

const companies = [
  { label: 'Telus Communications — AI Engineer', query: 'Tell me about your AI Engineer role at Telus' },
  { label: 'Telus Communications — RAN Engineer', query: 'Tell me about your RAN Engineer role at Telus' },
] as const

const recognitions = [
  { label: 'Side project → CTO-backed production mandate', query: 'How did your side project turn into a production mandate?' },
  { label: 'Led 4 engineers from zero AI to production owners', query: 'Tell me about leading and mentoring your team' },
  { label: 'Gemini 3 Hackathon: 75K LOC with agentic workflows', query: 'Tell me about the ShowMe hackathon project' },
  { label: 'MSc thesis: near-SOTA accuracy at 20x lower compute', query: 'Tell me about your Master\'s thesis' },
] as const

interface SocialProofProps {
  readonly onQueryChat?: (query: string) => void
}

export function SocialProof({ onQueryChat }: SocialProofProps) {
  return (
    <div className="hero-surface rounded-2xl p-5 sm:p-6">
      <div className="space-y-3.5 text-center">
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Background & Highlights
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {companies.map(({ label, query }) => (
            <Badge
              key={label}
              asChild
              variant="outline"
              className="hero-subsurface cursor-pointer rounded-full border-primary/15 px-3 py-1.5 text-sm font-semibold transition-colors hover:border-primary/45 hover:bg-accent/80"
            >
              <button type="button" onClick={() => onQueryChat?.(query)}>
                {label}
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {recognitions.map(({ label, query }) => (
            <Badge
              key={label}
              asChild
              variant="secondary"
              className="cursor-pointer rounded-full border border-border/70 bg-muted/65 px-3 py-1 text-xs text-foreground/90 transition-colors hover:border-primary/35 hover:bg-accent/75"
            >
              <button type="button" onClick={() => onQueryChat?.(query)}>
                {label}
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
