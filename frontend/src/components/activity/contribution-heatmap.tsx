'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ContributionDay {
  readonly contributionCount: number
  readonly date: string
}

interface ContributionWeek {
  readonly contributionDays: readonly ContributionDay[]
}

interface ContributionData {
  readonly totalContributions: number
  readonly weeks: readonly ContributionWeek[]
}

function getIntensityClass(count: number): string {
  if (count === 0) return 'fill-muted'
  if (count <= 3) return 'fill-green-200 dark:fill-green-900'
  if (count <= 7) return 'fill-green-400 dark:fill-green-700'
  return 'fill-green-600 dark:fill-green-500'
}

function calculateStreak(weeks: readonly ContributionWeek[]): number {
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

function getLastCommitDate(weeks: readonly ContributionWeek[]): string {
  const allDays = weeks
    .flatMap((w) => w.contributionDays)
    .sort((a, b) => b.date.localeCompare(a.date))

  const lastActive = allDays.find((d) => d.contributionCount > 0)
  if (!lastActive) return 'No recent activity'

  const date = new Date(lastActive.date)
  const now = new Date()
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ContributionHeatmap() {
  const [data, setData] = useState<ContributionData | null>(null)

  useEffect(() => {
    fetch('/api/github')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ totalContributions: 0, weeks: [] }))
  }, [])

  if (!data) return null

  const recentWeeks = data.weeks.slice(-12)
  const streak = calculateStreak(recentWeeks)
  const lastCommit = getLastCommitDate(recentWeeks)
  const cellSize = 12
  const gap = 2
  const totalSize = cellSize + gap

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto">
          <svg
            width={recentWeeks.length * totalSize}
            height={7 * totalSize}
            className="mx-auto"
          >
            {recentWeeks.map((week, weekIndex) =>
              week.contributionDays.map((day, dayIndex) => (
                <rect
                  key={day.date}
                  x={weekIndex * totalSize}
                  y={dayIndex * totalSize}
                  width={cellSize}
                  height={cellSize}
                  rx={2}
                  className={`${getIntensityClass(day.contributionCount)} transition-colors`}
                >
                  <title>
                    {day.date}: {day.contributionCount} contributions
                  </title>
                </rect>
              )),
            )}
          </svg>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{streak} day streak</span>
          <span>Last commit: {lastCommit}</span>
          <span>{data.totalContributions} this year</span>
        </div>
      </CardContent>
    </Card>
  )
}
