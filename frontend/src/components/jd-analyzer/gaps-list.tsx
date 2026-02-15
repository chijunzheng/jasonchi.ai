import { AlertTriangle } from 'lucide-react'

interface GapsListProps {
  readonly gaps: readonly string[]
}

export function GapsList({ gaps }: GapsListProps) {
  if (gaps.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Areas to Address</h3>
      <ul className="space-y-1.5">
        {gaps.map((gap) => (
          <li key={gap} className="flex items-start gap-2 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <span>{gap}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
