import { NextRequest } from 'next/server'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'

const leadSchema = z.object({
  role: z.string().min(2).max(200),
  email: z.string().email(),
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
    const ip = getClientIp(request)
    const { allowed } = checkRateLimit(ip)
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const body = await request.json()
    const parsed = leadSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Please provide a valid role and email.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const { role, email } = parsed.data

    // MVP: Log the lead. Replace with email notification or webhook in production.
    console.info(`[LEAD] Role: ${role}, Email: ${email}, IP: ${ip}, Time: ${new Date().toISOString()}`)

    return new Response(
      JSON.stringify({ success: true, message: "Thanks! I'll be in touch." }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to submit. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
