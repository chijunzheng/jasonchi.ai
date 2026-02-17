'use client'

import { useCountUp } from '@/hooks/use-count-up'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { STATS } from '@/lib/constants'

export function StatsCounter() {
  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.3 })

  return (
    <div ref={ref} className="grid w-full grid-cols-3 gap-3 sm:gap-4">
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
    <div className="hero-subsurface rounded-xl p-3 text-center">
      <p className="font-heading text-3xl font-semibold tabular-nums text-primary sm:text-4xl">
        {value}
        {suffix}
      </p>
      <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  )
}
