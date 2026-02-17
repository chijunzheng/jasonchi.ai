'use client'

import { MessageCircle, ChevronDown } from 'lucide-react'

interface ScrollCTAProps {
  readonly onClick?: () => void
}

export function ScrollCTA({ onClick }: ScrollCTAProps) {
  return (
    <button
      onClick={() => {
        if (onClick) {
          onClick()
        } else {
          document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })
        }
      }}
      className="group gradient-button gradient-glow mx-auto flex cursor-pointer items-center gap-2 rounded-full px-7 py-3 text-base font-semibold tracking-tight transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label="Go to chat section"
    >
      <MessageCircle className="h-[18px] w-[18px]" />
      Ask me anything
      <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" />
    </button>
  )
}
