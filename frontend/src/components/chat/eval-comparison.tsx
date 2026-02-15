'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, BarChart3 } from 'lucide-react'
import type { EvalComparisonData } from '@/lib/sse-client'

interface EvalComparisonProps {
  readonly data: EvalComparisonData
}

function MetricBar({
  label,
  reflective,
  naive,
  delta,
  isToken,
}: {
  readonly label: string
  readonly reflective: number
  readonly naive: number
  readonly delta: string
  readonly isToken?: boolean
}) {
  const maxVal = isToken ? Math.max(reflective, naive) : 1
  const rWidth = maxVal > 0 ? (reflective / maxVal) * 100 : 0
  const nWidth = maxVal > 0 ? (naive / maxVal) * 100 : 0

  const formatValue = (v: number) =>
    isToken ? v.toLocaleString() : v.toFixed(2)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium">{delta}</span>
      </div>
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-right text-muted-foreground">
            Reflective
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${rWidth}%` }}
            />
          </div>
          <span className="w-12 shrink-0 tabular-nums">
            {formatValue(reflective)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-right text-muted-foreground">
            Naive
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-muted-foreground/40"
              style={{ width: `${nWidth}%` }}
            />
          </div>
          <span className="w-12 shrink-0 tabular-nums">
            {formatValue(naive)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function EvalComparison({ data }: EvalComparisonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'metrics' | 'answers'>('metrics')

  return (
    <div className="mt-1">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <BarChart3 className="h-3 w-3" />
        <span>Compare: Reflective vs Naive RAG</span>
        <span className="text-muted-foreground/60">
          ({data.improvement.tokensSaved} tokens saved)
        </span>
      </button>

      {isOpen && (
        <div className="mt-2 rounded-md border bg-muted/20 p-3 text-xs">
          {/* Tab switcher */}
          <div className="mb-3 flex gap-1 rounded-md border bg-background/50 p-0.5">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex-1 rounded px-2 py-1 ${
                activeTab === 'metrics'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Metrics
            </button>
            <button
              onClick={() => setActiveTab('answers')}
              className={`flex-1 rounded px-2 py-1 ${
                activeTab === 'answers'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Answers
            </button>
          </div>

          {activeTab === 'metrics' && (
            <div className="space-y-3">
              <MetricBar
                label="Faithfulness"
                reflective={data.reflective.faithfulness}
                naive={data.naive.faithfulness}
                delta={data.improvement.faithfulness ?? 'N/A'}
              />
              <MetricBar
                label="Context Precision"
                reflective={data.reflective.contextPrecision}
                naive={data.naive.contextPrecision}
                delta={data.improvement.contextPrecision ?? 'N/A'}
              />
              <MetricBar
                label="Answer Relevance"
                reflective={data.reflective.answerRelevance}
                naive={data.naive.answerRelevance}
                delta={data.improvement.answerRelevance ?? 'N/A'}
              />
              <MetricBar
                label="Tokens Used"
                reflective={data.reflective.tokensUsed}
                naive={data.naive.tokensUsed}
                delta={data.improvement.tokensSaved ?? 'N/A'}
                isToken
              />

              {/* Latency comparison */}
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-muted-foreground">Latency</span>
                <div className="flex items-center gap-3 tabular-nums">
                  <span>
                    Reflective: {Math.round(data.reflective.latencyMs)}ms
                  </span>
                  <span className="text-muted-foreground/60">|</span>
                  <span>Naive: {Math.round(data.naive.latencyMs)}ms</span>
                  <span className="text-muted-foreground/60">
                    ({data.improvement.latencyOverhead})
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'answers' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary">
                    Reflective Agentic
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {data.reflective.tokensUsed.toLocaleString()} tokens
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {data.reflective.answer.slice(0, 400)}
                  {data.reflective.answer.length > 400 && '...'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {data.reflective.sourcesUsed.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-primary/10 px-1.5 py-0.5 text-primary"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-muted-foreground">
                    Naive RAG (baseline)
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {data.naive.tokensUsed.toLocaleString()} tokens
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-muted-foreground/70 leading-relaxed">
                  {data.naive.answer.slice(0, 400)}
                  {data.naive.answer.length > 400 && '...'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {data.naive.sourcesUsed.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Verdict */}
          <div className="mt-3 border-t pt-2 text-muted-foreground">
            <span className="font-medium text-foreground">Verdict: </span>
            {data.verdict}
          </div>
        </div>
      )}
    </div>
  )
}
