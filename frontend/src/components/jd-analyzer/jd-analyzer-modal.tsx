'use client'

import { type FormEvent, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import type { JDAnalysis } from '@/types/jd-analysis'
import { AnalysisResults } from './analysis-results'
import { CoverLetterOutput } from './cover-letter-output'

interface JDAnalyzerModalProps {
  readonly children: React.ReactNode
  readonly onAnalysisComplete?: (jobDescription: string, analysis: JDAnalysis) => void
}

type ModalState = 'input' | 'analyzing' | 'results' | 'cover-letter' | 'error'

export function JDAnalyzerModal({ children, onAnalysisComplete }: JDAnalyzerModalProps) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<ModalState>('input')
  const [jdText, setJdText] = useState('')
  const [analysis, setAnalysis] = useState<JDAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async (e: FormEvent) => {
    e.preventDefault()
    if (jdText.trim().length < 50) {
      setError('Please paste a job description (at least 50 characters)')
      return
    }

    setState('analyzing')
    setError(null)

    try {
      const response = await fetch('/api/analyze-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jdText }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.error ?? 'Analysis failed')
      }

      const data = await response.json()

      if (onAnalysisComplete) {
        onAnalysisComplete(jdText, data)
        handleReset()
        setOpen(false)
      } else {
        setAnalysis(data)
        setState('results')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }

  const handleGenerateCoverLetter = () => {
    setState('cover-letter')
  }

  const handleDiscussInChat = () => {
    if (analysis) {
      onAnalysisComplete?.(jdText, analysis)
    }
    setOpen(false)
  }

  const handleReset = () => {
    setState('input')
    setAnalysis(null)
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) handleReset()
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {state === 'cover-letter' ? 'Cover Letter' : 'JD Analyzer'}
          </DialogTitle>
          <DialogDescription>
            {state === 'input' &&
              'Paste a job description to see how well it matches'}
            {state === 'analyzing' && 'Analyzing your match...'}
            {state === 'results' && 'Here\'s your match analysis'}
            {state === 'cover-letter' && 'Tailored to the job description'}
            {state === 'error' && 'Something went wrong'}
          </DialogDescription>
        </DialogHeader>

        {(state === 'input' || state === 'error') && (
          <form onSubmit={handleAnalyze} className="space-y-4">
            <Textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the full job description here..."
              className="min-h-[200px] max-h-[50vh] resize-none [field-sizing:fixed]"
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full">
              Analyze Match
            </Button>
          </form>
        )}

        {state === 'analyzing' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Comparing your experience against the JD...
            </p>
          </div>
        )}

        {state === 'results' && analysis && (
          <AnalysisResults
            analysis={analysis}
            onGenerateCoverLetter={handleGenerateCoverLetter}
            onDiscussInChat={handleDiscussInChat}
          />
        )}

        {state === 'cover-letter' && analysis && (
          <CoverLetterOutput
            jobDescription={jdText}
            analysis={analysis}
            onBack={() => setState('results')}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
