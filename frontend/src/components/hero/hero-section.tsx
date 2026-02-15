import { Badge } from '@/components/ui/badge'
import { HERO_TITLE, HERO_TAGLINE } from '@/lib/constants'
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
  readonly onAnalysisComplete?: (jobDescription: string, analysis: JDAnalysis) => void
}

export function HeroSection({ onEnterChat, onAnalysisComplete }: HeroSectionProps) {
  return (
    <div className="relative h-full">
      <section className="h-full overflow-hidden bg-grid-pattern px-4 pb-24 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Main hero card */}
          <div className="rounded-3xl border bg-card/80 p-6 shadow-sm backdrop-blur-sm sm:p-8">
            <div className="flex flex-col items-center space-y-6 text-center">
              {/* Avatar */}
              <AvatarWithStatus size="lg" />

              {/* Status pill */}
              <Badge variant="outline" className="gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="status-dot inline-block h-2 w-2 rounded-full bg-success" />
                Available for hire
              </Badge>

              {/* Name + Title + Tagline */}
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  {HERO_TITLE}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {HERO_TAGLINE}
                </p>
              </div>

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
          <SocialProof />
        </div>
      </section>

      {/* Pinned CTA at bottom with gradient fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-background via-background/80 to-transparent pb-6 pt-12">
        <div className="pointer-events-auto">
          <ScrollCTA onClick={onEnterChat} />
        </div>
      </div>
    </div>
  )
}
