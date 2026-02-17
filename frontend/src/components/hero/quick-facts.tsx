import { MapPin, Calendar, Shield, Target } from 'lucide-react'
import { QUICK_FACTS } from '@/lib/constants'

const ICON_MAP = { MapPin, Calendar, Shield, Target } as const

export function QuickFacts() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {QUICK_FACTS.map((fact) => {
        const Icon = ICON_MAP[fact.icon as keyof typeof ICON_MAP]
        return (
          <div key={fact.id} className="hero-subsurface rounded-xl p-3.5 text-center shadow-sm">
            <Icon className="mx-auto mb-2 h-4 w-4 text-primary" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {fact.label}
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug text-balance">{fact.value}</p>
          </div>
        )
      })}
    </div>
  )
}
