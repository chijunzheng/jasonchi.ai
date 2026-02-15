'use client'

import { useEffect, useState } from 'react'
import { Flame, GitCommit } from 'lucide-react'

interface ContributionData {
  readonly totalContributions: number
  readonly weeks: readonly {
    readonly contributionDays: readonly {
      readonly contributionCount: number
      readonly date: string
    }[]
  }[]
}

function calculateStreak(weeks: ContributionData['weeks']): number {
  const allDays = weeks
    .flatMap((w) => w.contributionDays)
    .sort((a, b) => b.date.localeCompare(a.date))

  let streak = 0
  for (const day of allDays) {
    if (day.contributionCount > 0) streak++
    else break
  }
  return streak
}

export function ProofOfWork() {
  const [data, setData] = useState<ContributionData | null>(null)

  useEffect(() => {
    fetch('/api/github')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
  }, [])

  if (!data) return null

  const recentWeeks = data.weeks.slice(-8)
  const streak = calculateStreak(recentWeeks)
  const cellSize = 8
  const gap = 2
  const totalSize = cellSize + gap

  return (
    <div className="space-y-3 rounded-xl border bg-card/50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Activity</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Flame className="h-3 w-3 text-primary" />
          <span>{streak}d streak</span>
        </div>
      </div>

      <div className="overflow-hidden">
        <svg
          width={recentWeeks.length * totalSize}
          height={7 * totalSize}
          className="mx-auto"
        >
          {recentWeeks.map((week, weekIndex) =>
            week.contributionDays.map((day, dayIndex) => {
              const intensity =
                day.contributionCount === 0
                  ? 'fill-muted'
                  : day.contributionCount <= 3
                    ? 'fill-primary/30'
                    : day.contributionCount <= 7
                      ? 'fill-primary/60'
                      : 'fill-primary'
              return (
                <rect
                  key={day.date}
                  x={weekIndex * totalSize}
                  y={dayIndex * totalSize}
                  width={cellSize}
                  height={cellSize}
                  rx={2}
                  className={intensity}
                />
              )
            }),
          )}
        </svg>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <GitCommit className="h-3 w-3" />
        <span>{data.totalContributions} contributions this year</span>
      </div>
    </div>
  )
}
