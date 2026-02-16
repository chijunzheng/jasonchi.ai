'use client'

import { Lightbulb, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { JDAnalysis } from '@/types/jd-analysis'
import { MatchScore } from './match-score'
import { StrengthsList } from './strengths-list'
import { GapsList } from './gaps-list'

interface AnalysisResultsProps {
  readonly analysis: JDAnalysis
  readonly onDiscussInChat: () => void
}

export function AnalysisResults({
  analysis,
  onDiscussInChat,
}: AnalysisResultsProps) {
  return (
    <div className="space-y-6">
      {/* Score */}
      <MatchScore score={analysis.matchScore} level={analysis.matchLevel} />

      <Separator />

      {/* Strengths + Gaps */}
      <div className="grid gap-6 sm:grid-cols-2">
        <StrengthsList strengths={analysis.strengths} />
        <GapsList gaps={analysis.gaps} />
      </div>

      <Separator />

      {/* Positioning Angle */}
      <Card>
        <CardContent className="flex items-start gap-3 p-4">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">Positioning Strategy</p>
            <p className="text-sm text-muted-foreground">{analysis.angle}</p>
          </div>
        </CardContent>
      </Card>

      {/* Interview Questions */}
      {analysis.interviewQuestions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Prepare for These Questions</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {analysis.interviewQuestions.map((q) => (
              <li key={q} className="pl-4 before:absolute before:left-0 before:content-['•'] relative">
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Separator />

      {/* CTA */}
      <Button onClick={onDiscussInChat} className="w-full">
        <MessageSquare className="mr-2 h-4 w-4" />
        Discuss in Chat
      </Button>
    </div>
  )
}
