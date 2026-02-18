'use client'

import { type ChangeEvent, type DragEvent, type FormEvent, useRef, useState } from 'react'
import { FileText, Loader2, UploadCloud, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import type { JDAnalysis } from '@/types/jd-analysis'
import { AnalysisResults } from './analysis-results'

interface JDAnalyzerModalProps {
  readonly children: React.ReactNode
  readonly onAnalysisComplete?: (jobDescription: string, analysis: JDAnalysis) => void
}

type ModalState = 'input' | 'analyzing' | 'results' | 'error'
type JDAnalysisResponse = JDAnalysis & { _jobDescription?: string }

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024
const ACCEPTED_EXTENSIONS = new Set(['pdf', 'docx', 'txt', 'md'])
const ACCEPTED_FILE_TYPES = '.pdf,.docx,.txt,.md'

function getFileExtension(filename: string): string {
  const parts = filename.toLowerCase().split('.')
  return parts.length > 1 ? parts.at(-1)! : ''
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function validateUploadedFile(file: File): string | null {
  const extension = getFileExtension(file.name)
  if (!ACCEPTED_EXTENSIONS.has(extension)) {
    return 'Unsupported file type. Use PDF, DOCX, TXT, or MD.'
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return 'File is too large. Please upload a file smaller than 5MB.'
  }

  return null
}

export function JDAnalyzerModal({ children, onAnalysisComplete }: JDAnalyzerModalProps) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<ModalState>('input')
  const [jdText, setJdText] = useState('')
  const [resolvedJdText, setResolvedJdText] = useState('')
  const [jdFile, setJdFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [analysis, setAnalysis] = useState<JDAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const setFile = (file: File | null) => {
    if (!file) {
      setJdFile(null)
      setError(null)
      return
    }

    const validationError = validateUploadedFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setJdFile(file)
    setError(null)
  }

  const handleBrowseFiles = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null
    setFile(selectedFile)
    e.target.value = ''
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    setFile(e.dataTransfer.files?.[0] ?? null)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleAnalyze = async (e: FormEvent) => {
    e.preventDefault()
    const jobDescription = jdText.trim()
    if (jobDescription.length < 50 && !jdFile) {
      setError('Paste a job description or upload a file (at least 50 characters after extraction).')
      return
    }

    setState('analyzing')
    setError(null)

    try {
      let response: Response
      if (jdFile) {
        const payload = new FormData()
        payload.set('file', jdFile)
        if (jobDescription) payload.set('jobDescription', jobDescription)
        response = await fetch('/api/analyze-jd', {
          method: 'POST',
          body: payload,
        })
      } else {
        response = await fetch('/api/analyze-jd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobDescription }),
        })
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.error ?? 'Analysis failed')
      }

      const data = (await response.json()) as JDAnalysisResponse
      setAnalysis(data)
      const extractedDescription = typeof data._jobDescription === 'string'
        ? data._jobDescription.trim()
        : ''
      const finalDescription = extractedDescription || jobDescription
      setResolvedJdText(finalDescription)
      if (extractedDescription && !jobDescription) {
        setJdText(extractedDescription)
      }
      setState('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }

  const handleDiscussInChat = () => {
    const finalDescription = (resolvedJdText || jdText).trim()
    if (analysis && finalDescription) {
      onAnalysisComplete?.(finalDescription, analysis)
    }
    setOpen(false)
  }

  const handleReset = () => {
    setState('input')
    setAnalysis(null)
    setError(null)
    setResolvedJdText('')
    setJdFile(null)
    setIsDragging(false)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) handleReset()
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Job Description Analyzer</DialogTitle>
          <DialogDescription>
            {state === 'input' &&
              'Paste a JD or upload a file to get an instant match analysis.'}
            {state === 'analyzing' && 'Analyzing your match...'}
            {state === 'results' && 'Here\'s your match analysis'}
            {state === 'error' && 'Something went wrong'}
          </DialogDescription>
        </DialogHeader>

        {(state === 'input' || state === 'error') && (
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={() => setIsDragging(true)}
              onDragLeave={() => setIsDragging(false)}
              className={[
                'rounded-lg border border-dashed p-4 transition-colors',
                isDragging
                  ? 'border-primary bg-primary/10'
                  : 'border-border/80 bg-muted/30',
              ].join(' ')}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md border border-primary/40 bg-primary/10 p-2 text-primary">
                    <UploadCloud className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Drag and drop a JD file</p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOCX, TXT, or MD up to 5MB.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBrowseFiles}
                >
                  Browse files
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                className="hidden"
                onChange={handleFileInputChange}
              />
              {jdFile && (
                <div className="mt-3 flex items-center justify-between rounded-md border bg-background/80 px-3 py-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate text-sm">{jdFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(jdFile.size)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setFile(null)}
                    aria-label="Remove uploaded file"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Or Paste Job Description Text
              </p>
              <Textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the full job description here..."
                className="min-h-[200px] max-h-[50vh] resize-none [field-sizing:fixed]"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Tip: If both a file and pasted text are provided, the pasted text is used when it has enough detail.
            </p>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full">
              Analyze Job Description
            </Button>
          </form>
        )}

        {state === 'analyzing' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Comparing your experience against the JD...
            </p>
          </div>
        )}

        {state === 'results' && analysis && (
          <AnalysisResults
            analysis={analysis}
            onDiscussInChat={handleDiscussInChat}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
