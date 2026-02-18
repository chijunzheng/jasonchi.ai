'use client'

import { FileSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JDAnalyzerModal } from '@/components/jd-analyzer/jd-analyzer-modal'

export function JDAnalyzerCTA() {
  return (
    <div className="mx-auto max-w-md rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10 p-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <FileSearch className="h-6 w-6 text-primary" />
        <div>
          <p className="font-semibold">Have a job description?</p>
          <p className="text-sm text-muted-foreground">
            Paste it in and I&apos;ll show you exactly how I match
          </p>
        </div>
        <JDAnalyzerModal>
          <Button>Analyze a Job Description</Button>
        </JDAnalyzerModal>
      </div>
    </div>
  )
}
