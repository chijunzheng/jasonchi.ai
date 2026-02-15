import type { JDAnalysis } from '@/types/jd-analysis'

export function formatAnalysisMessage(analysis: JDAnalysis): string {
  const lines: string[] = [
    `**JD Analysis — ${analysis.matchLevel} (${analysis.matchScore}%)**`,
    '',
    '**Why Jason Is a Strong Fit**',
    ...analysis.strengths.map((s) => `- ${s}`),
  ]

  if (analysis.gaps.length > 0) {
    lines.push('', '**Areas to Explore in Conversation**')
    lines.push(...analysis.gaps.map((g) => `- ${g}`))
  }

  lines.push('', '**How Jason Would Position Himself**', analysis.angle)

  return lines.join('\n')
}

export function getAnalysisFollowUps(
  analysis: JDAnalysis,
): readonly string[] {
  return [...analysis.interviewQuestions]
}
