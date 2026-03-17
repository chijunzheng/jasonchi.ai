'use client'

import {
  Briefcase,
  Code,
  Wrench,
  GraduationCap,
  Shield,
  Info,
  PanelLeftClose,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AvatarWithStatus } from '@/components/hero/avatar-with-status'

import { SITE_CONFIG } from '@/lib/constants'
import type { ContentCategory } from '@/types/content'

const ICON_MAP = {
  Briefcase,
  Code,
  Wrench,
  GraduationCap,
  Shield,
  Info,
} as const

const CATEGORIES = [
  { id: 'work-experience' as ContentCategory, label: 'Work Experience', icon: 'Briefcase' },
  { id: 'projects' as ContentCategory, label: 'Projects', icon: 'Code' },
  { id: 'skills' as ContentCategory, label: 'Skills', icon: 'Wrench' },
  { id: 'education' as ContentCategory, label: 'Education', icon: 'GraduationCap' },
  { id: 'honest-section' as ContentCategory, label: 'Honest Section', icon: 'Shield' },
  { id: 'meta' as ContentCategory, label: 'About This Site', icon: 'Info' },
] as const

interface ChatSidebarProps {
  readonly activeCategory: ContentCategory | null
  readonly onSelectCategory: (category: ContentCategory) => void
  readonly disabled?: boolean
  readonly isOpen: boolean
  readonly onClose: () => void
}

export function ChatSidebar({
  activeCategory,
  onSelectCategory,
  disabled = false,
  isOpen,
  onClose,
}: ChatSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-sidebar transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0`}
      >
        {/* Profile header */}
        <div className="flex h-14 items-center gap-3 border-b px-4">
          <AvatarWithStatus size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{SITE_CONFIG.name}</p>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden"
            onClick={onClose}
          >
            <PanelLeftClose className="h-4 w-4" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>

        {/* Category navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Topics
          </p>
          {CATEGORIES.map(({ id, label, icon }) => {
            const Icon = ICON_MAP[icon as keyof typeof ICON_MAP]
            const isActive = activeCategory === id

            return (
              <button
                key={id}
                onClick={() => onSelectCategory(id)}
                disabled={disabled}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                } disabled:pointer-events-none disabled:opacity-50`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            )
          })}
        </nav>


      </aside>
    </>
  )
}
