'use client'

import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { STARTER_PROMPTS } from '@/lib/mock-responses'

interface StarterPromptsProps {
  readonly onSelect: (prompt: string) => void
  readonly disabled?: boolean
}

export function StarterPrompts({ onSelect, disabled = false }: StarterPromptsProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="text-center">
        <MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold">Ask me anything</h3>
        <p className="text-sm text-muted-foreground">
          Or try one of these to get started
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <Button
            key={prompt}
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onSelect(prompt)}
            disabled={disabled}
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  )
}
