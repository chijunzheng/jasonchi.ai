'use client'

import { MessageSquare, FileSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AvatarWithStatus } from '@/components/hero/avatar-with-status'
import { STARTER_PROMPTS } from '@/lib/mock-responses'

interface ChatEmptyStateProps {
  readonly onSelect: (prompt: string) => void
  readonly disabled?: boolean
}

export function ChatEmptyState({ onSelect, disabled = false }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <AvatarWithStatus size="lg" />
      <div className="text-center">
        <h3 className="text-lg font-semibold">Ask me anything</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Explore my experience, skills, and projects through conversation
        </p>
      </div>
      <div className="flex max-w-md flex-wrap justify-center gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <Button
            key={prompt}
            variant="outline"
            size="sm"
            className="rounded-xl text-xs"
            onClick={() => onSelect(prompt)}
            disabled={disabled}
          >
            <MessageSquare className="mr-1.5 h-3 w-3" />
            {prompt}
          </Button>
        ))}
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <FileSearch className="h-3.5 w-3.5" />
        Have a specific role? Try the JD Analyzer for tailored answers
      </p>
    </div>
  )
}
