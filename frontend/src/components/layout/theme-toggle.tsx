'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Avoid next-themes hydration mismatch.
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const isDark = theme === 'dark'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? (
            <Sun className="h-4 w-4 transition-transform duration-200" />
          ) : (
            <Moon className="h-4 w-4 transition-transform duration-200" />
          )}
          <span className="sr-only">
            Switch to {isDark ? 'light' : 'dark'} mode
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Switch to {isDark ? 'light' : 'dark'} mode</p>
      </TooltipContent>
    </Tooltip>
  )
}
