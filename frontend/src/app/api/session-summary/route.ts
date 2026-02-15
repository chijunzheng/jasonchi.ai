import { NextRequest } from 'next/server'
import { z } from 'zod'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { checkRateLimit } from '@/lib/rate-limit'
import { proxyToBackend } from '@/lib/backend-proxy'

const requestSchema = z.object({
  messages: z
    .array(z.object({ role: z.string(), content: z.string() }))
    .min(3)
    .max(50),
})

const SUMMARY_PROMPT = `Analyze this conversation between a recruiter/visitor and an AI resume assistant for Jason Chi. Generate a structured summary.

Return a JSON object with this EXACT structure (no markdown, no code blocks, just raw JSON):
{
  "summary": "<2-3 sentence overview of the conversation>",
  "keyTopics": ["<topic 1>", "<topic 2>", ...],
  "highlights": ["<highlight 1>", "<highlight 2>", ...],
  "nextSteps": ["<step 1>", "<step 2>", ...]
}

Guidelines:
- keyTopics: 3-5 main subjects discussed
- highlights: 3-5 key takeaways about the candidate that would interest a hiring manager
- nextSteps: 2-3 recommended actions (e.g., schedule interview, review portfolio, discuss specific area)
- Be specific and reference actual content from the conversation`

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
    const proxyResponse = await proxyToBackend('/api/session-summary', body)
    if (proxyResponse) {
      const data = await proxyResponse.json()
      return new Response(JSON.stringify(data), {
        status: proxyResponse.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const ip = getClientIp(request)
    const { allowed } = checkRateLimit(ip)
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Need at least 3 messages.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const conversationText = parsed.data.messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n')

    const client = new GoogleGenerativeAI(apiKey)
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent(
      `${SUMMARY_PROMPT}\n\n=== CONVERSATION ===\n${conversationText}\n\nReturn ONLY the JSON object.`,
    )

    const responseText = result.response.text().trim()
    const jsonText = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    const summary = JSON.parse(jsonText)

    return new Response(JSON.stringify(summary), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to generate summary.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
