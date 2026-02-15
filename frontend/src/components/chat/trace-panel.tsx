'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Cpu,
  Clock,
  Coins,
  Zap,
  Search,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import type { TraceData, TraceStep } from '@/lib/sse-client'

interface TracePanelProps {
  readonly trace: TraceData
}

function ConfidenceGauge({ score }: { readonly score: number }) {
  const percentage = Math.round(score * 100)
  const color =
    score > 0.7
      ? 'bg-green-500'
      : score > 0.4
        ? 'bg-yellow-500'
        : 'bg-red-500'

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="tabular-nums">{percentage}%</span>
    </div>
  )
}

function SourceBadges({
  sources,
}: {
  readonly sources: readonly string[]
}) {
  if (sources.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1">
      {sources.map((source) => (
        <span
          key={source}
          className="rounded-full bg-accent/10 px-2 py-0.5 text-accent-foreground"
        >
          {source}
        </span>
      ))}
    </div>
  )
}

function PipelineVisualization({
  steps,
}: {
  readonly steps: readonly TraceStep[]
}) {
  const pipelineNodes = ['assess', 'retrieve', 'evaluate_and_answer']
  const activeNodes = new Set(steps.map((s) => s.node))

  // Check for fast path
  const isFastPath = steps.some(
    (s) =>
      s.node === 'qa' &&
      s.retrievalDecision?.startsWith('fast path'),
  )

  if (isFastPath) {
    return (
      <div className="flex items-center gap-1 font-mono text-muted-foreground">
        <Zap className="h-3 w-3 text-yellow-500" />
        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">
          fast path
        </span>
        <span className="text-muted-foreground/50">&rarr;</span>
        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">
          answer
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 font-mono text-muted-foreground">
      <Zap className="h-3 w-3 shrink-0" />
      {pipelineNodes.map((node, i) => {
        const isActive = activeNodes.has(node)
        // Also check for corrective retrieval
        const hasCorrective =
          node === 'retrieve' && activeNodes.has('corrective_retrieve')

        return (
          <span key={node} className="flex items-center gap-1">
            {i > 0 && (
              <span className="text-muted-foreground/50">&rarr;</span>
            )}
            <span
              className={`rounded px-1.5 py-0.5 ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground/40'
              }`}
            >
              {node.replace('_and_', '+')}
            </span>
            {hasCorrective && (
              <>
                <span className="text-muted-foreground/50">&rarr;</span>
                <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-yellow-600 dark:text-yellow-400">
                  corrective
                </span>
              </>
            )}
          </span>
        )
      })}
    </div>
  )
}

function StepDetail({ step }: { readonly step: TraceStep }) {
  return (
    <div className="rounded border bg-background/50 p-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">{step.node}</span>
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {Math.round(step.latencyMs)}ms
          </span>
          {step.tokensUsed > 0 && (
            <span>{step.tokensUsed.toLocaleString()} tokens</span>
          )}
        </div>
      </div>

      {step.reasoning && (
        <p className="text-muted-foreground">{step.reasoning}</p>
      )}

      {/* Confidence gauge */}
      {step.confidenceScore !== undefined && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Confidence:</span>
          <ConfidenceGauge score={step.confidenceScore} />
        </div>
      )}

      {/* Retrieval decision */}
      {step.retrievalDecision && (
        <div className="flex items-center gap-1.5">
          {step.retrievalDecision.startsWith('skipped') ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <Search className="h-3 w-3 text-blue-500" />
          )}
          <span className="text-muted-foreground">
            {step.retrievalDecision}
          </span>
        </div>
      )}

      {/* Quality check */}
      {step.qualityCheck && (
        <div className="flex items-center gap-1.5">
          {step.qualityCheck === 'sufficient' ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <AlertCircle className="h-3 w-3 text-yellow-500" />
          )}
          <span className="text-muted-foreground">{step.qualityCheck}</span>
        </div>
      )}

      {/* Tool calls */}
      {step.toolCalls.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {step.toolCalls.map((tool, j) => (
            <span
              key={`${tool}-${j}`}
              className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-primary"
            >
              {tool}
            </span>
          ))}
        </div>
      )}

      {/* Source badges */}
      {step.sourcesUsed && step.sourcesUsed.length > 0 && (
        <SourceBadges sources={step.sourcesUsed} />
      )}
    </div>
  )
}

export function TracePanel({ trace }: TracePanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!trace.steps.length) return null

  return (
    <div className="mt-1">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        aria-expanded={isOpen}
        aria-controls="trace-details"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <Cpu className="h-3 w-3" />
        <span>Show reasoning</span>
        <span className="text-muted-foreground/60">
          ({trace.steps.length} steps, {Math.round(trace.totalLatencyMs)}ms)
        </span>
      </button>

      {isOpen && (
        <div
          id="trace-details"
          className="mt-2 space-y-2 rounded-md border bg-muted/20 p-3 text-xs"
        >
          {/* Pipeline visualization */}
          <PipelineVisualization steps={trace.steps} />

          {/* Step details */}
          {trace.steps.map((step, i) => (
            <StepDetail key={`${step.node}-${i}`} step={step} />
          ))}

          {/* Summary footer */}
          <div className="flex items-center justify-between border-t pt-2 text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {Math.round(trace.totalLatencyMs)}ms total
              </span>
              <span>{trace.totalTokens.toLocaleString()} tokens</span>
            </div>
            <span className="flex items-center gap-1">
              <Coins className="h-3 w-3" />
              ~${trace.estimatedCost.toFixed(4)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
