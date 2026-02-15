'use client'

import Link from 'next/link'
import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SITE_CONFIG } from '@/lib/constants'
import { trackEvent } from '@/lib/analytics'
import { ThemeToggle } from './theme-toggle'

export function Header() {
  const handleDownload = () => {
    trackEvent('resume_downloaded', { source: 'header' })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-mono text-sm font-semibold tracking-tight"
        >
          {SITE_CONFIG.name}
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" asChild>
            <a href="/resume.pdf" download onClick={handleDownload}>
              <FileDown className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Resume</span>
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}
