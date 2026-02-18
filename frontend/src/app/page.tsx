'use client'

import { useState } from 'react'
import { ChatSection } from '@/components/chat/chat-section'
import type { JdContext, JDAnalysis } from '@/types/jd-analysis'

export default function Home() {
  const [jdContext, setJdContext] = useState<JdContext | null>(null)
  const handleAnalysisComplete = (jobDescription: string, analysis: JDAnalysis) => {
    setJdContext({ jobDescription, analysis })
  }

  return (
    <div className="h-dvh overflow-hidden">
      <ChatSection
        jdContext={jdContext}
        onClearJdContext={() => setJdContext(null)}
        onAnalysisComplete={handleAnalysisComplete}
      />
    </div>
  )
}
