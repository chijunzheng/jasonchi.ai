import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

// ---------------------------------------------------------------------------
// Constants (mirrored from src/lib/constants.ts — build script runs outside
// Next.js so path aliases like @/ don't resolve)
// ---------------------------------------------------------------------------
const CONTACT = {
  name: 'Jason Chi',
  role: 'AI Engineer',
  location: 'Markham, Ontario',
  email: 'chijunzheng@gmail.com',
  linkedin: 'linkedin.com/in/jasoncjz',
  github: 'github.com/chijunzheng',
} as const

// ---------------------------------------------------------------------------
// Content directory
// ---------------------------------------------------------------------------
const CONTENT_DIR = path.resolve(__dirname, '../src/content')
const OUTPUT_PATH = path.resolve(__dirname, '../public/resume.pdf')

// ---------------------------------------------------------------------------
// PDF layout constants
// ---------------------------------------------------------------------------
const PAGE = {
  margin: 40,
  width: 612,   // US Letter
  height: 792,
} as const

const FONT = {
  header: 'Helvetica-Bold',
  subheader: 'Helvetica-Bold',
  body: 'Helvetica',
  bodyItalic: 'Helvetica-Oblique',
} as const

const SIZE = {
  name: 18,
  contactInfo: 8.5,
  sectionTitle: 11,
  jobTitle: 10,
  body: 9,
  bullet: 9,
  skillCategory: 9,
} as const

const COLOR = {
  black: '#000000',
  darkGray: '#333333',
  medGray: '#555555',
  accent: '#1a5276',
  rule: '#cccccc',
} as const

// ---------------------------------------------------------------------------
// Text sanitization — Helvetica only supports WinAnsi encoding, so Unicode
// chars like − (U+2212), – (U+2013), — (U+2014) must be replaced
// ---------------------------------------------------------------------------
function sanitize(text: string): string {
  return text
    .replace(/\u2212/g, '-')   // Unicode minus → hyphen-minus
    .replace(/\u2013/g, '-')   // en-dash → hyphen
    .replace(/\u2014/g, ' - ') // em-dash → spaced hyphen
    .replace(/\u2018/g, "'")   // left single quote
    .replace(/\u2019/g, "'")   // right single quote
    .replace(/\u201C/g, '"')   // left double quote
    .replace(/\u201D/g, '"')   // right double quote
    .replace(/\u2026/g, '...') // ellipsis
    .replace(/\u00D7/g, 'x')  // multiplication sign
}

// ---------------------------------------------------------------------------
// Markdown parsing helpers
// ---------------------------------------------------------------------------
function readContent(filename: string): string {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), 'utf-8')
  const { content } = matter(raw)
  return content
}

interface WorkEntry {
  title: string
  company: string
  dates: string
  bullets: string[]
}

function parseWorkExperience(md: string): WorkEntry[] {
  const entries: WorkEntry[] = []
  const sections = md.split(/^## /m).filter(Boolean)

  for (const section of sections) {
    const lines = section.split('\n')
    const heading = lines[0].trim()

    // Parse "AI Engineer at Telus Communications [2024 – Present]"
    const match = heading.match(/^(.+?)\s+at\s+(.+?)\s*\[(.+?)\]/)
    if (!match) continue

    const [, title, company, dates] = match

    // Extract bullets from "The Result" or fall back to "The Role"
    let sectionIdx = lines.findIndex(l => l.trim().startsWith('### The Result'))
    if (sectionIdx === -1) {
      sectionIdx = lines.findIndex(l => l.trim().startsWith('### The Role'))
    }
    if (sectionIdx === -1) continue

    const bullets: string[] = []
    for (let i = sectionIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.startsWith('### ') || line.startsWith('## ')) break
      if (line.startsWith('- ')) {
        bullets.push(sanitize(line.replace(/^- /, '').replace(/\*\*/g, '')))
      }
    }

    entries.push({ title: sanitize(title), company: sanitize(company), dates: sanitize(dates), bullets })
  }

  return entries
}

interface ProjectEntry {
  name: string
  bullets: string[]
}

function parseProjects(md: string): ProjectEntry[] {
  const entries: ProjectEntry[] = []
  const sections = md.split(/^## /m).filter(Boolean)

  // Only include top 3 projects: ShowMe, jasonchi.ai, CSI-SandGlassNet
  const targetProjects = ['ShowMe', 'jasonchi.ai', 'CSI-SandGlassNet']

  for (const section of sections) {
    const lines = section.split('\n')
    const heading = lines[0].trim()

    const isTarget = targetProjects.some(p => heading.includes(p))
    if (!isTarget) continue

    // Extract "The Result" bullets
    const resultIdx = lines.findIndex(l => l.trim().startsWith('### The Result'))
    if (resultIdx === -1) continue

    const bullets: string[] = []
    for (let i = resultIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.startsWith('### ') || line.startsWith('## ')) break
      if (line.startsWith('- ')) {
        bullets.push(sanitize(line.replace(/^- /, '').replace(/\*\*/g, '')))
      }
    }

    entries.push({ name: sanitize(heading), bullets })
  }

  return entries
}

interface SkillGroup {
  category: string
  items: string[]
}

function parseSkills(md: string): SkillGroup[] {
  const groups: SkillGroup[] = []
  const sections = md.split(/^## /m).filter(Boolean)

  for (const section of sections) {
    const lines = section.split('\n')
    const category = lines[0].trim()

    // Skip soft skills for resume
    if (category === 'Soft Skills') continue

    const items: string[] = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.startsWith('### ')) continue
      if (line.startsWith('- **')) {
        const labelMatch = line.match(/^- \*\*(.+?)\*\*/)
        if (labelMatch) items.push(labelMatch[1].replace(/:$/, ''))
      } else if (line.length > 0 && !line.startsWith('#')) {
        const skillLine = line.replace(/^- /, '')
        items.push(...skillLine.split(',').map(s => s.trim()).filter(Boolean))
      }
    }

    if (items.length > 0) {
      groups.push({ category, items: items.map(sanitize) })
    }
  }

  return groups
}

interface EducationEntry {
  degree: string
  school: string
  dates: string
  detail?: string
}

function parseEducation(md: string): EducationEntry[] {
  const entries: EducationEntry[] = []
  const sections = md.split(/^## /m).filter(Boolean)

  for (const section of sections) {
    const lines = section.split('\n')
    const heading = lines[0].trim()

    // "Master of Computer Science at Liverpool John Moores University [2022-2024]"
    const degreeMatch = heading.match(/^(.+?)\s+at\s+(.+?)\s*\[(.+?)\]/)
    if (degreeMatch) {
      const [, degree, school, dates] = degreeMatch

      const resultIdx = lines.findIndex(l => l.trim().startsWith('### The Result'))
      let detail: string | undefined
      if (resultIdx !== -1) {
        for (let i = resultIdx + 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (line.startsWith('- ')) {
            detail = sanitize(line.replace(/^- /, '').replace(/\*\*/g, ''))
            break
          }
        }
      }

      entries.push({
        degree: sanitize(degree),
        school: sanitize(school),
        dates: sanitize(dates),
        detail,
      })
      continue
    }

    // "Bachelor of Science in Electrical Engineering..."
    const bscMatch = heading.match(
      /^(.+?(?:Engineering|Science|Arts).*?)\s+at\s+(.+?)\s*\[(.+?)\]/
    )
    if (bscMatch) {
      entries.push({
        degree: sanitize(bscMatch[1]),
        school: sanitize(bscMatch[2]),
        dates: sanitize(bscMatch[3]),
      })
      continue
    }

    // Certifications section
    if (heading.includes('Certification')) {
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        const certMatch = line.match(/^### (.+?)\s*—\s*(.+?)\s*\[(.+?)\]/)
        if (certMatch) {
          entries.push({
            degree: sanitize(certMatch[1]),
            school: sanitize(certMatch[2]),
            dates: sanitize(certMatch[3]),
          })
        }
      }
    }
  }

  return entries
}

// ---------------------------------------------------------------------------
// PDF rendering
// ---------------------------------------------------------------------------
function renderPdf(
  work: WorkEntry[],
  projects: ProjectEntry[],
  skills: SkillGroup[],
  education: EducationEntry[]
): void {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: {
      top: PAGE.margin,
      bottom: PAGE.margin,
      left: PAGE.margin,
      right: PAGE.margin,
    },
  })

  const stream = fs.createWriteStream(OUTPUT_PATH)
  doc.pipe(stream)

  const contentWidth = PAGE.width - PAGE.margin * 2
  const bottomLimit = PAGE.height - PAGE.margin

  // ── Page-break helper ───────────────────────────────────
  function ensureSpace(needed: number): void {
    if (doc.y + needed > bottomLimit) {
      doc.addPage()
    }
  }

  // ── Header ──────────────────────────────────────────────
  doc
    .font(FONT.header)
    .fontSize(SIZE.name)
    .fillColor(COLOR.black)
    .text(CONTACT.name, { align: 'center' })

  doc
    .font(FONT.body)
    .fontSize(SIZE.contactInfo)
    .fillColor(COLOR.medGray)
    .text(
      `${CONTACT.role}  |  ${CONTACT.location}  |  ${CONTACT.email}  |  ${CONTACT.linkedin}  |  ${CONTACT.github}`,
      { align: 'center' }
    )

  doc.moveDown(0.4)

  // ── Section header helper ───────────────────────────────
  function sectionHeader(title: string): void {
    ensureSpace(30)
    doc.moveDown(0.2)
    doc
      .font(FONT.header)
      .fontSize(SIZE.sectionTitle)
      .fillColor(COLOR.accent)
      .text(title.toUpperCase())

    const y = doc.y + 1
    doc
      .moveTo(PAGE.margin, y)
      .lineTo(PAGE.width - PAGE.margin, y)
      .strokeColor(COLOR.rule)
      .lineWidth(0.5)
      .stroke()

    doc.moveDown(0.25)
  }

  // ── Title + right-aligned date on the same line ─────────
  function titleWithDate(
    titleText: string,
    dateText: string,
    titleFont = FONT.subheader,
    titleSize = SIZE.jobTitle
  ): void {
    ensureSpace(20)

    const startY = doc.y

    // Measure date width to reserve space
    doc.font(FONT.bodyItalic).fontSize(SIZE.body)
    const dateWidth = doc.widthOfString(dateText)

    // Render title with constrained width (leave room for date)
    const titleWidth = contentWidth - dateWidth - 15
    doc
      .font(titleFont)
      .fontSize(titleSize)
      .fillColor(COLOR.black)
      .text(titleText, PAGE.margin, startY, { width: titleWidth })

    const titleEndY = doc.y

    // Render date right-aligned at the same starting Y
    doc
      .font(FONT.bodyItalic)
      .fontSize(SIZE.body)
      .fillColor(COLOR.medGray)
      .text(dateText, PAGE.margin, startY, {
        width: contentWidth,
        align: 'right',
      })

    // Advance Y past whichever was taller
    doc.y = Math.max(titleEndY, doc.y)
    doc.x = PAGE.margin
  }

  // ── Bullet point helper ─────────────────────────────────
  function bulletPoint(text: string, indent = 10): void {
    const bulletX = PAGE.margin + indent
    const textX = bulletX + 8
    const textWidth = contentWidth - indent - 8

    ensureSpace(SIZE.bullet + 4)

    doc
      .font(FONT.body)
      .fontSize(SIZE.bullet)
      .fillColor(COLOR.darkGray)

    const startY = doc.y
    doc.text(text, textX, startY, { width: textWidth })
    const endY = doc.y

    // Bullet dot aligned with first line
    const bulletY = startY + SIZE.bullet * 0.35
    doc.circle(bulletX + 2, bulletY, 1.5).fill(COLOR.medGray)

    doc.y = endY
    doc.x = PAGE.margin
  }

  // ── Work Experience ─────────────────────────────────────
  sectionHeader('Work Experience')

  for (const entry of work) {
    titleWithDate(`${entry.title} - ${entry.company}`, entry.dates)
    doc.moveDown(0.1)

    const maxBullets = entry.title.includes('AI Engineer') ? 5 : 3
    for (const bullet of entry.bullets.slice(0, maxBullets)) {
      bulletPoint(bullet)
    }

    doc.moveDown(0.25)
  }

  // ── Projects ────────────────────────────────────────────
  sectionHeader('Projects')

  for (const project of projects) {
    ensureSpace(30)
    doc
      .font(FONT.subheader)
      .fontSize(SIZE.jobTitle)
      .fillColor(COLOR.black)
      .text(project.name)

    doc.moveDown(0.1)

    for (const bullet of project.bullets.slice(0, 3)) {
      bulletPoint(bullet)
    }

    doc.moveDown(0.25)
  }

  // ── Technical Skills ────────────────────────────────────
  sectionHeader('Technical Skills')

  for (const group of skills) {
    ensureSpace(20)
    doc
      .font(FONT.subheader)
      .fontSize(SIZE.skillCategory)
      .fillColor(COLOR.black)
      .text(`${group.category}: `, { continued: true })
      .font(FONT.body)
      .fillColor(COLOR.darkGray)
      .text(group.items.join(', '))

    doc.moveDown(0.1)
  }

  // ── Education ───────────────────────────────────────────
  sectionHeader('Education')

  for (const entry of education) {
    titleWithDate(`${entry.degree} - ${entry.school}`, entry.dates)

    if (entry.detail) {
      doc.moveDown(0.1)
      bulletPoint(entry.detail)
    }

    doc.moveDown(0.15)
  }

  // ── Finalize ────────────────────────────────────────────
  doc.end()

  stream.on('finish', () => {
    const stats = fs.statSync(OUTPUT_PATH)
    const sizeKB = Math.round(stats.size / 1024)
    console.log(`Resume PDF generated: ${OUTPUT_PATH} (${sizeKB} KB)`)
  })
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main(): void {
  console.log('Generating resume PDF...')

  const work = parseWorkExperience(readContent('work-experience.md'))
  const projects = parseProjects(readContent('projects.md'))
  const skills = parseSkills(readContent('skills.md'))
  const education = parseEducation(readContent('education.md'))

  console.log(
    `  Parsed: ${work.length} work entries, ${projects.length} projects, ` +
      `${skills.length} skill groups, ${education.length} education entries`
  )

  renderPdf(work, projects, skills, education)
}

main()
