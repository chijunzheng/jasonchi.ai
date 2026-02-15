'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Check, Copy, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { streamSSE } from '@/lib/sse-client'
import type { JDAnalysis } from '@/types/jd-analysis'

interface CoverLetterOutputProps {
  readonly jobDescription: string
  readonly analysis: JDAnalysis
  readonly onBack: () => void
}

export function CoverLetterOutput({
  jobDescription,
  analysis,
  onBack,
}: CoverLetterOutputProps) {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { copied, copy } = useCopyToClipboard()

  const generate = useCallback(async () => {
    setIsLoading(true)
    setContent('')
    setError(null)

    try {
      for await (const event of streamSSE('/api/cover-letter', {
        jobDescription,
        analysis: {
          strengths: [...analysis.strengths],
          gaps: [...analysis.gaps],
          angle: analysis.angle,
        },
      })) {
        switch (event.type) {
          case 'text':
            setContent((prev) => prev + (event.content as string))
            break
          case 'error':
            throw new Error(event.content as string)
          case 'done':
            break
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate')
    } finally {
      setIsLoading(false)
    }
  }, [jobDescription, analysis])

  useEffect(() => {
    generate()
  }, [generate])

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cover-letter.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to Analysis
      </Button>

      {isLoading && !content && (
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Crafting your cover letter...
          </p>
        </div>
      )}

      {error && (
        <div className="space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={generate}>
            Try Again
          </Button>
        </div>
      )}

      {content && (
        <>
          <Card>
            <CardContent className="p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {content}
                {isLoading && (
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-foreground" />
                )}
              </p>
            </CardContent>
          </Card>

          {!isLoading && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copy(content)}
              >
                {copied ? (
                  <Check className="mr-1.5 h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="mr-1.5 h-4 w-4" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-1.5 h-4 w-4" />
                Download .txt
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
