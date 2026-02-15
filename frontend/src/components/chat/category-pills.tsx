'use client'

import {
  Briefcase,
  Code,
  Wrench,
  GraduationCap,
  Shield,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  { id: 'work-experience' as ContentCategory, label: 'Work', icon: 'Briefcase' },
  { id: 'projects' as ContentCategory, label: 'Projects', icon: 'Code' },
  { id: 'skills' as ContentCategory, label: 'Skills', icon: 'Wrench' },
  { id: 'education' as ContentCategory, label: 'Education', icon: 'GraduationCap' },
  { id: 'honest-section' as ContentCategory, label: 'Honest', icon: 'Shield' },
  { id: 'meta' as ContentCategory, label: 'Meta', icon: 'Info' },
] as const

interface CategoryPillsProps {
  readonly activeCategory: ContentCategory | null
  readonly onSelect: (category: ContentCategory) => void
  readonly disabled?: boolean
}

export function CategoryPills({
  activeCategory,
  onSelect,
  disabled = false,
}: CategoryPillsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {CATEGORIES.map(({ id, label, icon }) => {
        const Icon = ICON_MAP[icon as keyof typeof ICON_MAP]
        const isActive = activeCategory === id

        return (
          <Button
            key={id}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => onSelect(id)}
            disabled={disabled}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Button>
        )
      })}
    </div>
  )
}
