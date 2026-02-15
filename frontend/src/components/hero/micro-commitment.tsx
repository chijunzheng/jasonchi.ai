'use client'

import { type FormEvent, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

export function MicroCommitment() {
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!role.trim() || !email.trim()) return

    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: role.trim(), email: email.trim() }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? 'Submission failed')
      }

      setStatus('success')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <Card className="mx-auto max-w-sm">
        <CardContent className="flex items-center gap-3 p-4 text-center">
          <Check className="h-5 w-5 text-green-500" />
          <p className="text-sm">Thanks! I&apos;ll be in touch soon.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-center text-sm font-medium">
            Interested? Let&apos;s connect.
          </p>
          <Input
            placeholder="What role are you hiring for?"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={status === 'loading'}
          />
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'loading'}
          />
          {errorMessage && (
            <p className="text-xs text-destructive">{errorMessage}</p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={status === 'loading' || !role.trim() || !email.trim()}
          >
            {status === 'loading' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Let&apos;s Talk
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
