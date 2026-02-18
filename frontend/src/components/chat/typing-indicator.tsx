import { useEffect, useMemo, useState } from 'react'
import { Check } from 'lucide-react'

interface TypingIndicatorProps {
  readonly status?: string | null
}

const BASE_STEPS = [
  'Understand your question',
  'Find the most relevant evidence',
  'Build response outline',
  'Ground claims to context',
  'Finalize concise answer',
] as const

const DRAFT_STEP_COUNT = BASE_STEPS.length - 2

function getBaseStepIndex(status?: string | null): number {
  const value = (status ?? '').toLowerCase()
  if (value.includes('understanding')) return 0
  if (value.includes('searching')) return 1
  if (value.includes('drafting')) return 2
  return 0
}

export function TypingIndicator({ status }: TypingIndicatorProps) {
  const baseStepIndex = getBaseStepIndex(status)
  const [draftSubStep, setDraftSubStep] = useState(0)

  useEffect(() => {
    if (baseStepIndex !== 2) return
    if (draftSubStep >= DRAFT_STEP_COUNT - 1) return

    const timer = setTimeout(() => {
      setDraftSubStep((prev) => Math.min(prev + 1, DRAFT_STEP_COUNT - 1))
    }, 1800)
    return () => clearTimeout(timer)
  }, [baseStepIndex, draftSubStep])

  const activeIndex = useMemo(() => {
    if (baseStepIndex < 2) return baseStepIndex
    return 2 + draftSubStep
  }, [baseStepIndex, draftSubStep])

  return (
    <div className="px-4 py-2">
      <div className="inline-flex flex-col gap-1.5 rounded-xl border bg-card/60 px-3 py-2">
        {BASE_STEPS.map((step, idx) => {
          const isDone = idx < activeIndex
          const isActive = idx === activeIndex
          return (
            <div
              key={step}
              className={`flex items-center gap-2 text-xs transition-opacity duration-300 ${
                isDone ? 'text-muted-foreground/70 line-through' : ''
              } ${isActive ? 'text-foreground' : ''} ${
                !isDone && !isActive ? 'text-muted-foreground/45' : ''
              }`}
            >
              {isDone ? (
                <Check className="h-3.5 w-3.5 text-primary" />
              ) : (
                <span
                  className={`h-2 w-2 rounded-full ${
                    isActive ? 'bg-primary animate-pulse' : 'bg-muted-foreground/35'
                  }`}
                />
              )}
              <span>{step}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
