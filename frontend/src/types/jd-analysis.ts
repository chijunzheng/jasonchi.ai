import { z } from 'zod'

export const JDAnalysisSchema = z.object({
  matchScore: z.number().min(0).max(100),
  matchLevel: z.enum([
    'Strong Match',
    'Good Match',
    'Partial Match',
    'Weak Match',
  ]),
  strengths: z.array(z.string()).min(2).max(6),
  gaps: z.array(z.string()).max(4),
  angle: z.string(),
  interviewQuestions: z.array(z.string()).min(2).max(6),
})

export type JDAnalysis = z.infer<typeof JDAnalysisSchema>

export interface JdContext {
  readonly jobDescription: string
  readonly analysis: JDAnalysis
}
