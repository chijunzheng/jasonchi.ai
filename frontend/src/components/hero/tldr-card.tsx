'use client'

import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { TLDR } from '@/lib/constants'

export function TldrCard() {
  const { copied, copy } = useCopyToClipboard()

  return (
    <div className="rounded-2xl border bg-card/80 p-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            TL;DR
          </p>
          <p className="text-sm leading-relaxed">{TLDR}</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => copy(TLDR)}
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="sr-only">
                {copied ? 'Copied!' : 'Copy to clipboard'}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{copied ? 'Copied!' : 'Copy to clipboard'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
