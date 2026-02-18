'use client'

import { Badge } from '@/components/ui/badge'
import { AvatarWithStatus } from '@/components/hero/avatar-with-status'
import { HeroCtaButtons } from '@/components/hero/hero-cta-buttons'
import { QuickFacts } from '@/components/hero/quick-facts'
import { SocialLinks } from '@/components/hero/social-links'
import { SocialProof } from '@/components/hero/social-proof'
import { StatsCounter } from '@/components/hero/stats-counter'
import { TargetRoles } from '@/components/hero/target-roles'
import { HERO_TITLE, TLDR } from '@/lib/constants'
import type { JDAnalysis } from '@/types/jd-analysis'

interface ProfileOverviewProps {
  readonly onQueryChat?: (query: string) => void
  readonly onAnalysisComplete?: (jobDescription: string, analysis: JDAnalysis) => void
  readonly compact?: boolean
}

export function ProfileOverview({
  onQueryChat,
  onAnalysisComplete,
  compact = false,
}: ProfileOverviewProps) {
  return (
    <div className={compact ? 'space-y-4' : 'mx-auto w-full max-w-3xl space-y-5'}>
      <div className="hero-surface rounded-[2rem] p-5 sm:p-7">
        <div className="flex flex-col items-center space-y-5 text-center">
          <AvatarWithStatus size="lg" />

          <Badge
            variant="outline"
            className="hero-subsurface gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm"
          >
            <span className="status-dot inline-block h-2 w-2 rounded-full bg-success" />
            Available for hire
          </Badge>

          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            {HERO_TITLE}
          </h1>

          <TargetRoles />
          <StatsCounter />
          <HeroCtaButtons onAnalysisComplete={onAnalysisComplete} />
          {!compact && <QuickFacts />}
          <SocialLinks variant="primary" />
        </div>
      </div>

      <div className="hero-surface rounded-2xl p-5 sm:p-6">
        <div className="mx-auto max-w-[68ch] space-y-3">
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Executive Summary
          </p>
          <p className="text-[15px] leading-7 text-foreground/92 sm:text-base">{TLDR}</p>
        </div>
      </div>

      {!compact && <SocialProof onQueryChat={onQueryChat} />}
    </div>
  )
}
