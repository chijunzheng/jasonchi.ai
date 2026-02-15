'use client'

import { useCountUp } from '@/hooks/use-count-up'

interface MatchScoreProps {
  readonly score: number
  readonly level: string
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-green-500'
  if (score >= 50) return 'text-amber-500'
  return 'text-red-500'
}

function getStrokeColor(score: number): string {
  if (score >= 75) return 'stroke-green-500'
  if (score >= 50) return 'stroke-amber-500'
  return 'stroke-red-500'
}

export function MatchScore({ score, level }: MatchScoreProps) {
  const animatedScore = useCountUp(score, true, 1200)

  const radius = 60
  const circumference = 2 * Math.PI * radius
  const progress = (animatedScore / 100) * circumference
  const offset = circumference - progress

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-36 w-36">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140">
          {/* Background track */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            strokeWidth="8"
            className="stroke-muted"
          />
          {/* Progress arc */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={`transition-all duration-1000 ${getStrokeColor(score)}`}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-mono text-3xl font-bold tabular-nums ${getScoreColor(score)}`}
          >
            {animatedScore}%
          </span>
        </div>
      </div>
      <p className="text-sm font-medium text-muted-foreground">{level}</p>
    </div>
  )
}
