'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FloatingThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Avoid next-themes hydration mismatch.
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-[calc(env(safe-area-inset-left)+1rem)] z-50">
        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full shadow-md" disabled>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    )
  }

  const isDark = theme === 'dark'

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-[calc(env(safe-area-inset-left)+1rem)] z-50">
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full bg-background/80 shadow-md backdrop-blur-sm"
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
    </div>
  )
}
