'use client'

import { useCallback, useState } from 'react'
import { Check, Copy, FileText, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import type { ChatMessage } from '@/types/chat'

interface SessionSummaryData {
  readonly summary: string
  readonly keyTopics: readonly string[]
  readonly highlights: readonly string[]
  readonly nextSteps: readonly string[]
}

interface SessionSummaryProps {
  readonly messages: readonly ChatMessage[]
}

export function SessionSummary({ messages }: SessionSummaryProps) {
  const [data, setData] = useState<SessionSummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const { copied, copy } = useCopyToClipboard()

  const messageCount = messages.filter((m) => m.role === 'user').length
  const canGenerate = messageCount >= 3

  const generateSummary = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/session-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) throw new Error('Failed to generate')

      const result = await response.json()
      setData(result)
      setIsVisible(true)
    } catch {
      // Silently fail — summary is nice-to-have
    } finally {
      setIsLoading(false)
    }
  }, [messages])

  const formatMarkdown = (): string => {
    if (!data) return ''
    return `# Session Summary

${data.summary}

## Key Topics
${data.keyTopics.map((t) => `- ${t}`).join('\n')}

## Highlights
${data.highlights.map((h) => `- ${h}`).join('\n')}

## Recommended Next Steps
${data.nextSteps.map((s) => `- ${s}`).join('\n')}`
  }

  const handleEmail = () => {
    const subject = encodeURIComponent('Jason Chi — Candidate Summary')
    const body = encodeURIComponent(formatMarkdown())
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  if (!canGenerate) return null

  return (
    <div className="mt-4">
      {!isVisible && (
        <Button
          variant="outline"
          size="sm"
          onClick={generateSummary}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          Generate Session Summary
        </Button>
      )}

      {isVisible && data && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Session Summary
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => copy(formatMarkdown())}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleEmail}
                >
                  <Mail className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">{data.summary}</p>

            <div className="flex flex-wrap gap-1">
              {data.keyTopics.map((topic) => (
                <Badge key={topic} variant="secondary" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>

            <div>
              <p className="mb-1 font-medium">Key Highlights</p>
              <ul className="space-y-0.5 text-muted-foreground">
                {data.highlights.map((h) => (
                  <li key={h}>• {h}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-1 font-medium">Next Steps</p>
              <ul className="space-y-0.5 text-muted-foreground">
                {data.nextSteps.map((s) => (
                  <li key={s}>• {s}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
