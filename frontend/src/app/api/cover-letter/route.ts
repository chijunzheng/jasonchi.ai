import { NextRequest } from 'next/server'
import { z } from 'zod'
import { streamChat } from '@/lib/gemini'
import { buildCoverLetterPrompt } from '@/lib/prompts'
import { getAllContentForPrompt } from '@/lib/content-loader'
import { checkRateLimit } from '@/lib/rate-limit'
import { proxyToBackend } from '@/lib/backend-proxy'

const requestSchema = z.object({
  jobDescription: z.string().min(50).max(10000),
  analysis: z.object({
    strengths: z.array(z.string()),
    gaps: z.array(z.string()),
    angle: z.string(),
  }),
  companyName: z.string().optional(),
  roleTitle: z.string().optional(),
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
    const body = await request.json()

    // Proxy to LangGraph backend if configured
    const proxyResponse = await proxyToBackend('/api/cover-letter', body)
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

    const ip = getClientIp(request)
    const { allowed, remaining } = checkRateLimit(ip)
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait a moment.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': String(remaining),
          },
        },
      )
    }

    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const { jobDescription, analysis } = parsed.data
    const resumeContent = getAllContentForPrompt()

    const coverLetterPrompt = buildCoverLetterPrompt(
      resumeContent,
      jobDescription,
      analysis,
    )

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const messages = [
            { role: 'user' as const, content: 'Write my cover letter.' },
          ]

          for await (const chunk of streamChat(messages, coverLetterPrompt)) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`,
              ),
            )
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`),
          )
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to generate cover letter'
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
      JSON.stringify({ error: 'Failed to generate cover letter.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
