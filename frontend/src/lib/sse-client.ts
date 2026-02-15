export interface SSEEvent {
  readonly type: 'text' | 'followUps' | 'trace' | 'eval' | 'done' | 'error'
  readonly content?: string | readonly string[] | TraceData | EvalComparisonData
}

export interface TraceStep {
  readonly node: string
  readonly reasoning: string
  readonly toolCalls: readonly string[]
  readonly latencyMs: number
  readonly tokensUsed: number
  // Reflective retrieval fields
  readonly retrievalDecision?: string
  readonly retrievalMethod?: string
  readonly sourcesUsed?: readonly string[]
  readonly confidenceScore?: number
  readonly qualityCheck?: string
}

export interface TraceData {
  readonly steps: readonly TraceStep[]
  readonly totalTokens: number
  readonly totalLatencyMs: number
  readonly estimatedCost: number
}

export interface EvalStrategyMetrics {
  readonly answer: string
  readonly faithfulness: number
  readonly contextPrecision: number
  readonly answerRelevance: number
  readonly tokensUsed: number
  readonly latencyMs: number
  readonly propositionsMatched: number | null
  readonly sourcesUsed: readonly string[]
}

export interface EvalComparisonData {
  readonly reflective: EvalStrategyMetrics
  readonly naive: EvalStrategyMetrics
  readonly improvement: Readonly<Record<string, string>>
  readonly verdict: string
}

export async function* streamSSE(
  url: string,
  body: object,
): AsyncGenerator<SSEEvent> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    throw new Error(
      errorBody?.error ?? `Request failed with status ${response.status}`,
    )
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      // Keep the last potentially incomplete line in the buffer
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue

        const data = trimmed.slice(6)
        try {
          const event = JSON.parse(data) as SSEEvent
          yield event
        } catch {
          // Skip malformed events
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim().startsWith('data: ')) {
      try {
        const event = JSON.parse(buffer.trim().slice(6)) as SSEEvent
        yield event
      } catch {
        // Skip
      }
    }
  } finally {
    reader.releaseLock()
  }
}
