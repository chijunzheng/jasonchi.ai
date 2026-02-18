'use client'

import type { JDAnalysis } from '@/types/jd-analysis'
import { ProfileOverview } from './profile-overview'

interface ChatEmptyStateProps {
  readonly onSelect: (prompt: string) => void
  readonly onAnalysisComplete?: (jobDescription: string, analysis: JDAnalysis) => void
  readonly disabled?: boolean
}

export function ChatEmptyState({
  onSelect,
  onAnalysisComplete,
  disabled = false,
}: ChatEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-start p-4 pb-8 sm:p-6">
      <ProfileOverview
        onQueryChat={disabled ? undefined : onSelect}
        onAnalysisComplete={onAnalysisComplete}
      />
    </div>
  )
}
