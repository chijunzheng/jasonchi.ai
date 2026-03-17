'use client'

import { FileSearch, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JDAnalyzerModal } from '@/components/jd-analyzer/jd-analyzer-modal'
import type { JDAnalysis } from '@/types/jd-analysis'

interface HeroCtaButtonsProps {
  readonly onAnalysisComplete?: (jobDescription: string, analysis: JDAnalysis) => void
}

export function HeroCtaButtons({ onAnalysisComplete }: HeroCtaButtonsProps) {
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-3">
      <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        Start Here
      </p>
      <JDAnalyzerModal onAnalysisComplete={onAnalysisComplete}>
        <Button
          variant="default"
          className="h-11 w-full cursor-pointer rounded-xl bg-primary/90 px-6 text-base font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-px hover:bg-primary hover:shadow-lg focus-visible:ring-primary/70 sm:w-auto"
        >
          <FileSearch className="mr-2 h-4 w-4" />
          Analyze a Job Description
        </Button>
      </JDAnalyzerModal>
      <p className="max-w-[64ch] text-sm text-muted-foreground">
        Paste or upload a JD to get role fit, strengths and gaps, and a tailored resume PDF.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="hero-subsurface rounded-full px-3 py-1 text-xs text-foreground/75">
          No sign-in required
        </span>
        <span className="hero-subsurface rounded-full px-3 py-1 text-xs text-foreground/75">
          Upload PDF, DOCX, TXT, or MD
        </span>
      </div>
    </div>
  )
}
