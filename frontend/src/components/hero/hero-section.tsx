import { Badge } from '@/components/ui/badge'
import { HERO_TITLE } from '@/lib/constants'
import { AvatarWithStatus } from './avatar-with-status'
import { StatsCounter } from './stats-counter'
import { QuickFacts } from './quick-facts'
import { HeroCtaButtons } from './hero-cta-buttons'
import { TargetRoles } from './target-roles'
import { TldrCard } from './tldr-card'
import { SocialProof } from './social-proof'
import { SocialLinks } from './social-links'
import { ScrollCTA } from './scroll-cta'
import type { JDAnalysis } from '@/types/jd-analysis'

interface HeroSectionProps {
  readonly onEnterChat?: () => void
  readonly onQueryChat?: (query: string) => void
  readonly onAnalysisComplete?: (jobDescription: string, analysis: JDAnalysis) => void
}

export function HeroSection({ onEnterChat, onQueryChat, onAnalysisComplete }: HeroSectionProps) {
  return (
    <div className="relative h-full">
      <section className="h-full overflow-y-auto bg-grid-pattern px-4 pb-36 pt-8 sm:px-6 sm:pb-40 sm:pt-10">
        <div className="mx-auto max-w-3xl space-y-5">
          {/* Main hero card */}
          <div className="hero-surface rounded-[2rem] p-5 sm:p-7">
            <div className="flex flex-col items-center space-y-5 text-center">
              {/* Avatar */}
              <AvatarWithStatus size="lg" />

              {/* Status pill */}
              <Badge
                variant="outline"
                className="hero-subsurface gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm"
              >
                <span className="status-dot inline-block h-2 w-2 rounded-full bg-success" />
                Available for hire
              </Badge>

              {/* Name */}
              <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
                {HERO_TITLE}
              </h1>

              {/* Target Roles */}
              <TargetRoles />

              {/* Stats */}
              <StatsCounter />

              {/* CTAs */}
              <HeroCtaButtons onAnalysisComplete={onAnalysisComplete} />

              {/* Quick Facts */}
              <QuickFacts />

              {/* Social Links */}
              <SocialLinks variant="primary" />
            </div>
          </div>

          {/* TL;DR */}
          <TldrCard />

          {/* Social Proof */}
          <SocialProof onQueryChat={onQueryChat} />
        </div>
      </section>

      {/* Pinned CTA at bottom with gradient fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-background via-background/85 to-transparent pb-6 pt-14">
        <div className="pointer-events-auto">
          <ScrollCTA onClick={onEnterChat} />
        </div>
      </div>
    </div>
  )
}
