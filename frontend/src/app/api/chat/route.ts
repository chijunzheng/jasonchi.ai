import { NextRequest } from 'next/server'
import { z } from 'zod'
import { streamChat, generateFollowUps } from '@/lib/gemini'
import { buildSystemPrompt, buildFollowUpPrompt } from '@/lib/prompts'
import { getAllContentForPrompt, getContentForPrompt } from '@/lib/content-loader'
import { checkRateLimit } from '@/lib/rate-limit'
import { proxyToBackend } from '@/lib/backend-proxy'
import type { ContentCategory } from '@/types/content'

const MAX_HISTORY_MESSAGES = 10

const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      }),
    )
    .max(MAX_HISTORY_MESSAGES)
    .default([]),
  category: z
    .enum([
      'work-experience',
      'projects',
      'skills',
      'education',
      'honest-section',
      'meta',
    ])
    .optional(),
  jobDescription: z.string().max(10000).optional(),
})

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(request: NextRequest) {
  try {
    // Proxy to LangGraph backend if configured
    const body = await request.json()
    const proxyResponse = await proxyToBackend('/api/chat', body)
    if (proxyResponse) {
      return new Response(proxyResponse.body, {
        status: proxyResponse.status,
        headers: {
          'Content-Type': proxyResponse.headers.get('Content-Type') ?? 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    // Rate limiting
    const ip = getClientIp(request)
    const { allowed, remaining } = checkRateLimit(ip)
    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests. Please wait a moment and try again.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': String(remaining),
          },
        },
      )
    }

    // Parse and validate request (body already parsed above for proxy check)
    const parsed = chatRequestSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request. Please provide a valid message.',
          details: parsed.error.flatten(),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const { message, conversationHistory, category, jobDescription } = parsed.data

    // Build context
    const resumeContent = category
      ? getContentForPrompt(category as ContentCategory)
      : getAllContentForPrompt()

    let systemPrompt = buildSystemPrompt(
      resumeContent,
      category as ContentCategory | undefined,
    )

    // Inject JD context when available
    if (jobDescription) {
      systemPrompt += `\n\n## Active Job Description
The visitor shared a job description they're evaluating you for.
Tailor your answers to highlight relevant experience for this role.
Reference specific JD requirements when applicable.
Don't repeat the full JD — just weave relevance into your answers naturally.

Job Description:
${jobDescription}`
    }

    // Prepare messages for Gemini
    const messages = [
      ...conversationHistory.slice(-MAX_HISTORY_MESSAGES),
      { role: 'user' as const, content: message },
    ]

    // Create SSE stream
    const encoder = new TextEncoder()
    let fullResponse = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream the main response
          for await (const chunk of streamChat(messages, systemPrompt)) {
            fullResponse += chunk
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`,
              ),
            )
          }

          // Generate follow-up suggestions (non-blocking)
          const followUpPrompt = buildFollowUpPrompt(fullResponse)
          const followUps = await generateFollowUps(fullResponse, followUpPrompt)

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'followUps', content: followUps })}\n\n`,
            ),
          )

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`),
          )
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'An unexpected error occurred'
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', content: errorMessage })}\n\n`,
            ),
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-RateLimit-Remaining': String(remaining),
      },
    })
  } catch {
    return new Response(
      JSON.stringify({
        error: 'Something went wrong. Please try again.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
