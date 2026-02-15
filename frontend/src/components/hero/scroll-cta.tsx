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
      className="gradient-button gradient-glow mx-auto flex items-center gap-2 rounded-full px-6 py-3 text-base font-medium transition-all"
      aria-label="Go to chat section"
    >
      <MessageCircle className="h-5 w-5" />
      Ask me anything
      <ChevronDown className="h-4 w-4 animate-bounce" />
    </button>
  )
}
