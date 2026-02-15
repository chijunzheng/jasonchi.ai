import { CheckCircle } from 'lucide-react'

interface StrengthsListProps {
  readonly strengths: readonly string[]
}

export function StrengthsList({ strengths }: StrengthsListProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Strengths</h3>
      <ul className="space-y-1.5">
        {strengths.map((strength) => (
          <li key={strength} className="flex items-start gap-2 text-sm">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
            <span>{strength}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
