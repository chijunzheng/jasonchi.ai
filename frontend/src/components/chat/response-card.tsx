'use client'

import { Card, CardContent } from '@/components/ui/card'
import { MarkdownRenderer } from './markdown-renderer'

interface ResponseCardProps {
  readonly content: string
  readonly isStreaming: boolean
}

export function ResponseCard({ content, isStreaming }: ResponseCardProps) {
  return (
    <Card className="cursor-default">
      <CardContent className="p-4 text-sm leading-relaxed">
        <MarkdownRenderer content={content} />
        {isStreaming && (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-foreground align-text-bottom" />
        )}
      </CardContent>
    </Card>
  )
}
