import { MapPin, Calendar, Shield, Target } from 'lucide-react'
import { QUICK_FACTS } from '@/lib/constants'

const ICON_MAP = { MapPin, Calendar, Shield, Target } as const

export function QuickFacts() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {QUICK_FACTS.map((fact) => {
        const Icon = ICON_MAP[fact.icon as keyof typeof ICON_MAP]
        return (
          <div key={fact.id} className="rounded-lg border bg-card/50 p-3 text-center">
            <Icon className="mx-auto mb-1.5 h-4 w-4 text-primary" />
            <p className="text-xs font-medium text-muted-foreground">{fact.label}</p>
            <p className="mt-0.5 text-sm font-semibold">{fact.value}</p>
          </div>
        )
      })}
    </div>
  )
}
