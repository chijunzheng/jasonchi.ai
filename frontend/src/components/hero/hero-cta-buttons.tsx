'use client'

import { FileDown, FileSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JDAnalyzerModal } from '@/components/jd-analyzer/jd-analyzer-modal'
import { trackEvent } from '@/lib/analytics'
import type { JDAnalysis } from '@/types/jd-analysis'

interface HeroCtaButtonsProps {
  readonly onAnalysisComplete?: (jobDescription: string, analysis: JDAnalysis) => void
}

export function HeroCtaButtons({ onAnalysisComplete }: HeroCtaButtonsProps) {
  const handleDownload = () => {
    trackEvent('resume_downloaded')
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button asChild className="gradient-button rounded-xl px-6 font-semibold">
        <a href="/resume.pdf" download onClick={handleDownload}>
          <FileDown className="mr-2 h-4 w-4" />
          Download Resume
        </a>
      </Button>
      <JDAnalyzerModal onAnalysisComplete={onAnalysisComplete}>
        <Button
          variant="default"
          className="cursor-pointer rounded-xl bg-primary/85 px-6 font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-px hover:bg-primary hover:shadow-lg focus-visible:ring-primary/70"
        >
          <FileSearch className="mr-2 h-4 w-4" />
          Analyze a JD
        </Button>
      </JDAnalyzerModal>
    </div>
  )
}
