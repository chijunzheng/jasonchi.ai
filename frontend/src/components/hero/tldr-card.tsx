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
    <div className="hero-surface rounded-2xl p-5 sm:p-6">
      <div className="mx-auto max-w-[68ch] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Executive Summary
          </p>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hero-subsurface h-7 w-7 shrink-0 rounded-full text-muted-foreground transition-colors hover:text-primary"
                onClick={() => copy(TLDR)}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
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
        <p className="text-[15px] leading-7 text-foreground/92 sm:text-base">{TLDR}</p>
      </div>
    </div>
  )
}
