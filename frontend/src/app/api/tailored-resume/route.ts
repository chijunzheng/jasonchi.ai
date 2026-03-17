import { NextRequest } from 'next/server'
import { z } from 'zod'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getAllContentForPrompt } from '@/lib/content-loader'
import { checkRateLimit } from '@/lib/rate-limit'
import { proxyToBackend } from '@/lib/backend-proxy'
import { buildTailoredResumePrompt } from '@/lib/prompts'

export const runtime = 'nodejs'

const requestSchema = z.object({
  jobDescription: z.string().min(50).max(10000),
  analysis: z.object({
    strengths: z.array(z.string()).default([]),
    gaps: z.array(z.string()).default([]),
    angle: z.string().default(''),
  }),
})

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

function buildFileName(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `jason-chi-tailored-resume-${date}.pdf`
}

function sanitizeText(text: string): string {
  return text
    .replace(/\u2212/g, '-')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, ' - ')
    .replace(/\u2018/g, "'")
    .replace(/\u2019/g, "'")
    .replace(/\u201c/g, '"')
    .replace(/\u201d/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u00d7/g, 'x')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
}

function stripMarkdownSyntax(line: string): string {
  return sanitizeText(
    line
      .replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/^>\s?/, '')
      .trim(),
  )
}

function wrapByWords(text: string, maxChars: number): string[] {
  if (!text) return ['']
  const words = text.split(/\s+/).filter(Boolean)
  if (!words.length) return ['']

  const lines: string[] = []
  let current = words[0]
  for (const word of words.slice(1)) {
    if ((current + ' ' + word).length <= maxChars) {
      current += ` ${word}`
    } else {
      lines.push(current)
      current = word
    }
  }
  lines.push(current)
  return lines
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

type LineFont = 'regular' | 'bold'
type LineAlign = 'left' | 'center'

interface StyledLine {
  readonly text: string
  readonly font: LineFont
  readonly size: number
  readonly indent: number
  readonly gapBefore: number
  readonly lineHeight: number
  readonly align: LineAlign
  readonly drawRuleAfter?: boolean
}

function maxCharsForWidth(size: number, indent: number): number {
  const pageWidth = 612
  const margin = 50
  const usableWidth = pageWidth - margin * 2 - indent
  return Math.max(24, Math.floor(usableWidth / (size * 0.53)))
}

function markdownToStyledLines(markdown: string): StyledLine[] {
  const rawLines = markdown.replace(/\r\n/g, '\n').split('\n')
  const styled: StyledLine[] = []

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim()

    if (!trimmed || trimmed === '---') {
      styled.push({
        text: '',
        font: 'regular',
        size: 10,
        indent: 0,
        gapBefore: 0,
        lineHeight: 7,
        align: 'left',
      })
      continue
    }

    if (trimmed.startsWith('# ')) {
      const title = stripMarkdownSyntax(trimmed.replace(/^#\s+/, '')).toUpperCase()
      styled.push({
        text: title,
        font: 'bold',
        size: 20,
        indent: 0,
        gapBefore: 2,
        lineHeight: 24,
        align: 'center',
        drawRuleAfter: true,
      })
      continue
    }

    if (trimmed.startsWith('## ')) {
      const section = stripMarkdownSyntax(trimmed.replace(/^##\s+/, '')).toUpperCase()
      styled.push({
        text: section,
        font: 'bold',
        size: 12,
        indent: 0,
        gapBefore: 10,
        lineHeight: 16,
        align: 'left',
      })
      continue
    }

    if (trimmed.startsWith('### ')) {
      const subheading = stripMarkdownSyntax(trimmed.replace(/^###\s+/, ''))
      const wrapped = wrapByWords(subheading, maxCharsForWidth(11, 0))
      wrapped.forEach((line, index) => {
        styled.push({
          text: line,
          font: 'bold',
          size: 11,
          indent: 0,
          gapBefore: index === 0 ? 7 : 0,
          lineHeight: 14,
          align: 'left',
        })
      })
      continue
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const bulletText = stripMarkdownSyntax(trimmed.replace(/^[-*]\s+/, ''))
      const wrapped = wrapByWords(
        bulletText,
        maxCharsForWidth(10, 14) - 2,
      )
      wrapped.forEach((line, index) => {
        styled.push({
          text: `${index === 0 ? '- ' : '  '}${line}`,
          font: 'regular',
          size: 10,
          indent: 14,
          gapBefore: index === 0 ? 2 : 0,
          lineHeight: 13,
          align: 'left',
        })
      })
      continue
    }

    const paragraph = stripMarkdownSyntax(trimmed)
    const wrapped = wrapByWords(paragraph, maxCharsForWidth(10, 0))
    wrapped.forEach((line, index) => {
      styled.push({
        text: line,
        font: 'regular',
        size: 10,
        indent: 0,
        gapBefore: index === 0 ? 2 : 0,
        lineHeight: 13,
        align: 'left',
      })
    })
  }

  return styled
}

function buildPdfFromLines(lines: StyledLine[]): Buffer {
  const pageWidth = 612
  const pageHeight = 792
  const margin = 50

  const pages: string[][] = []
  let currentPageOps: string[] = []
  let cursorY = pageHeight - margin

  const startNewPage = () => {
    currentPageOps = ['0 g']
    pages.push(currentPageOps)
    cursorY = pageHeight - margin
  }

  startNewPage()

  for (const line of lines) {
    const requiredHeight = Math.max(line.lineHeight, 6)
    cursorY -= line.gapBefore
    if (cursorY - requiredHeight < margin) {
      startNewPage()
    }

    if (!line.text) {
      cursorY -= requiredHeight
      continue
    }

    const fontRef = line.font === 'bold' ? 'F2' : 'F1'
    const estimatedTextWidth = line.text.length * line.size * 0.5
    const x =
      line.align === 'center'
        ? Math.max(margin, (pageWidth - estimatedTextWidth) / 2)
        : margin + line.indent

    currentPageOps.push('BT')
    currentPageOps.push(`/${fontRef} ${line.size} Tf`)
    currentPageOps.push(`1 0 0 1 ${x.toFixed(2)} ${cursorY.toFixed(2)} Tm`)
    currentPageOps.push(`(${escapePdfText(line.text)}) Tj`)
    currentPageOps.push('ET')

    cursorY -= line.lineHeight

    if (line.drawRuleAfter) {
      const ruleY = cursorY + 4
      currentPageOps.push('0.35 w')
      currentPageOps.push(`${margin} ${ruleY.toFixed(2)} m ${pageWidth - margin} ${ruleY.toFixed(2)} l S`)
      cursorY -= 4
    }
  }

  const objects: string[] = []
  const addObject = (body: string): number => {
    objects.push(body)
    return objects.length
  }

  const regularFontObj = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  const boldFontObj = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')
  const pagesObj = addObject('')
  const pageObjectIds: number[] = []

  for (const pageOps of pages) {
    const stream = pageOps.join('\n')
    const contentObj = addObject(
      `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`,
    )
    const pageObj = addObject(
      `<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${regularFontObj} 0 R /F2 ${boldFontObj} 0 R >> >> /Contents ${contentObj} 0 R >>`,
    )
    pageObjectIds.push(pageObj)
  }

  objects[pagesObj - 1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`
  const catalogObj = addObject(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`)

  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'
  const offsets: number[] = [0]
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'))
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObj} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return Buffer.from(pdf, 'utf8')
}

async function renderResumePdf(markdown: string): Promise<Buffer> {
  const styledLines = markdownToStyledLines(markdown)
  return buildPdfFromLines(styledLines)
}

function createPdfDownloadResponse(
  pdfBuffer: Buffer,
  fileName: string,
  remaining?: number,
): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${fileName}"`,
    'Cache-Control': 'no-store',
  }
  if (typeof remaining === 'number') {
    headers['X-RateLimit-Remaining'] = String(remaining)
  }

  return new Response(new Uint8Array(pdfBuffer), { status: 200, headers })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Proxy to backend if configured.
    let backendFailureMessage: string | null = null
    const proxyResponse = await proxyToBackend('/api/tailored-resume', parsed.data)
    if (proxyResponse) {
      const data = await proxyResponse.json().catch(() => ({
        error: 'Failed to generate tailored resume.',
      }))
      if (proxyResponse.ok) {
        const resumeText =
          typeof data?.resumeText === 'string' ? data.resumeText.trim() : ''
        if (resumeText) {
          const pdfBuffer = await renderResumePdf(resumeText)
          return createPdfDownloadResponse(pdfBuffer, buildFileName())
        }
        backendFailureMessage = 'Backend returned an empty tailored resume.'
      } else {
        const backendError =
          typeof data?.error === 'string' && data.error.trim()
            ? data.error.trim()
            : `Backend request failed (${proxyResponse.status}).`
        const shouldFallback =
          proxyResponse.status === 404 ||
          proxyResponse.status === 405 ||
          proxyResponse.status >= 500
        if (!shouldFallback) {
          return new Response(
            JSON.stringify({ error: backendError }),
            {
              status: proxyResponse.status,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }
        backendFailureMessage = backendError
      }
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

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: backendFailureMessage
            ? `${backendFailureMessage} Frontend fallback is unavailable because GEMINI_API_KEY is not configured.`
            : 'GEMINI_API_KEY is not configured.',
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const { jobDescription, analysis } = parsed.data
    const resumeContent = getAllContentForPrompt()
    const prompt = buildTailoredResumePrompt(
      resumeContent,
      jobDescription,
      analysis,
    )

    const client = new GoogleGenerativeAI(apiKey)
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
    const result = await model.generateContent(prompt)
    const resumeText = result.response.text().trim()

    if (!resumeText) {
      return new Response(
        JSON.stringify({
          error:
            backendFailureMessage ??
            'Failed to generate tailored resume.',
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const pdfBuffer = await renderResumePdf(resumeText)
    return createPdfDownloadResponse(pdfBuffer, buildFileName(), remaining)
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Failed to generate tailored resume.'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
