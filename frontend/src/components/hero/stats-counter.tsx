'use client'

import { useCountUp } from '@/hooks/use-count-up'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { STATS } from '@/lib/constants'

export function StatsCounter() {
  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.3 })

  return (
    <div ref={ref} className="grid grid-cols-3 gap-4">
      {STATS.map((stat) => (
        <StatItem
          key={stat.label}
          label={stat.label}
          end={stat.value}
          suffix={stat.suffix}
          shouldAnimate={isIntersecting}
        />
      ))}
    </div>
  )
}

function StatItem({
  label,
  end,
  suffix,
  shouldAnimate,
}: {
  readonly label: string
  readonly end: number
  readonly suffix: string
  readonly shouldAnimate: boolean
}) {
  const value = useCountUp(end, shouldAnimate)

  return (
    <div className="text-center">
      <p className="bg-gradient-to-br from-accent-gradient-from to-accent-gradient-to bg-clip-text font-mono text-3xl font-bold tabular-nums text-transparent sm:text-4xl">
        {value}
        {suffix}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
