'use client'

import { Button } from '@/components/ui/button'

interface FollowUpChipsProps {
  readonly chips: readonly string[]
  readonly onSelect: (chip: string) => void
  readonly disabled?: boolean
}

export function FollowUpChips({
  chips,
  onSelect,
  disabled = false,
}: FollowUpChipsProps) {
  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 pl-2">
      {chips.map((chip) => (
        <Button
          key={chip}
          variant="outline"
          size="sm"
          className="h-auto whitespace-normal py-1.5 text-xs"
          onClick={() => onSelect(chip)}
          disabled={disabled}
        >
          {chip}
        </Button>
      ))}
    </div>
  )
}
