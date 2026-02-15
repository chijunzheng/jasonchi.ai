import { NextRequest } from 'next/server'
import { z } from 'zod'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getAllContentForPrompt } from '@/lib/content-loader'
import { checkRateLimit } from '@/lib/rate-limit'
import { proxyToBackend } from '@/lib/backend-proxy'
import { JDAnalysisSchema } from '@/types/jd-analysis'

const requestSchema = z.object({
  jobDescription: z.string().min(50).max(10000),
})

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

const ANALYZE_PROMPT = `You are an expert recruiter and career coach. Analyze how well this candidate's resume matches the given job description.

Return your analysis as a JSON object with this EXACT structure (no markdown, no code blocks, just raw JSON):
{
  "matchScore": <number 0-100>,
  "matchLevel": "<Strong Match|Good Match|Partial Match|Weak Match>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "gaps": ["<gap 1>", ...],
  "angle": "<recommended positioning strategy>",
  "interviewQuestions": ["<question 1>", "<question 2>", ...]
}

Guidelines:
- matchScore should be realistic: 60-85% typical range. Never 100%, rarely below 30%.
- strengths: 3-5 items showing direct alignment between resume and JD requirements
- gaps: 1-3 items where the JD requires something not clearly demonstrated. Frame constructively.
- angle: A specific strategy for how the candidate should position themselves (1-2 sentences)
- interviewQuestions: 3-5 questions the candidate should prepare for based on gaps and the role

Be specific, reference actual requirements from the JD and actual experience from the resume.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Proxy to LangGraph backend if configured
    const proxyResponse = await proxyToBackend('/api/analyze-jd', body)
    if (proxyResponse) {
      const data = await proxyResponse.json()
      return new Response(JSON.stringify(data), {
        status: proxyResponse.status,
        headers: { 'Content-Type': 'application/json' },
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
        JSON.stringify({
          error: 'Please provide a valid job description (at least 50 characters).',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const { jobDescription } = parsed.data
    const resumeContent = getAllContentForPrompt()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const client = new GoogleGenerativeAI(apiKey)
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `${ANALYZE_PROMPT}

=== RESUME CONTENT ===
${resumeContent}

=== JOB DESCRIPTION ===
${jobDescription}

Return ONLY the JSON object, nothing else.`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text().trim()

    // Strip markdown code blocks if present
    const jsonText = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    const analysis = JDAnalysisSchema.parse(JSON.parse(jsonText))

    return new Response(JSON.stringify(analysis), {
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(remaining),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'AI produced an unexpected response format. Please try again.',
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ error: 'Analysis failed. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
