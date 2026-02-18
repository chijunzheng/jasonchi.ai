import { NextRequest } from 'next/server'
import { z } from 'zod'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getAllContentForPrompt } from '@/lib/content-loader'
import { checkRateLimit } from '@/lib/rate-limit'
import { getBackendUrl } from '@/lib/backend-proxy'
import { JDAnalysisSchema } from '@/types/jd-analysis'

const requestSchema = z.object({
  jobDescription: z.string().min(50).max(10000),
})

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024
const SUPPORTED_UPLOAD_EXTENSIONS = new Set(['pdf', 'docx', 'txt', 'md'])
const LOCAL_EXTRACTABLE_EXTENSIONS = new Set(['txt', 'md'])

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

function getFileExtension(filename: string): string {
  const pieces = filename.toLowerCase().split('.')
  return pieces.length > 1 ? pieces.at(-1)! : ''
}

function validateUpload(file: File): string | null {
  const extension = getFileExtension(file.name)
  if (!SUPPORTED_UPLOAD_EXTENSIONS.has(extension)) {
    return 'Unsupported file type. Please upload a PDF, DOCX, TXT, or MD file.'
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return 'File is too large. Please upload a file smaller than 5MB.'
  }

  return null
}

async function parseRequestInput(request: NextRequest): Promise<{
  jobDescription: string
  file: File | null
}> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const rawDescription = formData.get('jobDescription')
    const rawFile = formData.get('file')
    return {
      jobDescription: typeof rawDescription === 'string' ? rawDescription.trim() : '',
      file: rawFile instanceof File ? rawFile : null,
    }
  }

  const body = await request.json()
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    throw new Error('invalid-job-description')
  }

  return { jobDescription: parsed.data.jobDescription.trim(), file: null }
}

async function extractTextForLocalFallback(file: File): Promise<string> {
  const extension = getFileExtension(file.name)
  if (!LOCAL_EXTRACTABLE_EXTENSIONS.has(extension)) {
    throw new Error('local-unsupported-file-type')
  }
  return (await file.text()).trim()
}

export async function POST(request: NextRequest) {
  try {
    let parsedInput: { jobDescription: string; file: File | null }
    try {
      parsedInput = await parseRequestInput(request)
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Please provide a valid job description (at least 50 characters).',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const { jobDescription: rawDescription, file } = parsedInput

    if (file) {
      const uploadError = validateUpload(file)
      if (uploadError) {
        return new Response(
          JSON.stringify({ error: uploadError }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        )
      }
    }

    // Proxy to LangGraph backend if configured
    const backendUrl = getBackendUrl()
    if (backendUrl) {
      const backendRequest =
        file != null
          ? (() => {
              const formData = new FormData()
              if (rawDescription) formData.set('jobDescription', rawDescription)
              formData.set('file', file)
              return fetch(`${backendUrl}/api/analyze-jd`, {
                method: 'POST',
                body: formData,
              })
            })()
          : fetch(`${backendUrl}/api/analyze-jd`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jobDescription: rawDescription }),
            })

      const proxyResponse = await backendRequest
      const data = await proxyResponse.json().catch(() => ({
        error: 'Analysis failed. Please try again.',
      }))
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

    let jobDescription = rawDescription
    if ((!jobDescription || jobDescription.length < 50) && file) {
      try {
        jobDescription = await extractTextForLocalFallback(file)
      } catch {
        return new Response(
          JSON.stringify({
            error:
              'PDF/DOCX uploads require backend extraction. Configure BACKEND_URL to enable these formats.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        )
      }
    }

    if (jobDescription.trim().length < 50) {
      return new Response(
        JSON.stringify({
          error: 'Please provide a valid job description (at least 50 characters after extraction).',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }
    const resumeContent = getAllContentForPrompt()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const client = new GoogleGenerativeAI(apiKey)
    const model = client.getGenerativeModel({ model: 'gemini-3-flash-preview' })

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

    return new Response(JSON.stringify({
      ...analysis,
      _jobDescription: jobDescription,
    }), {
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
