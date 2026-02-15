'use client'

import { useEffect, useState } from 'react'

export interface UTMParams {
  readonly ref: string | null
  readonly utm_source: string | null
  readonly utm_medium: string | null
  readonly utm_campaign: string | null
  readonly utm_content: string | null
  readonly utm_term: string | null
}

const EMPTY_UTM: UTMParams = {
  ref: null,
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
}

export function useUTM(): UTMParams {
  const [params, setParams] = useState<UTMParams>(EMPTY_UTM)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)

    // eslint-disable-next-line react-hooks/set-state-in-effect -- This is the intended client-only hydration pattern.
    setParams({
      ref: searchParams.get('ref'),
      utm_source: searchParams.get('utm_source'),
      utm_medium: searchParams.get('utm_medium'),
      utm_campaign: searchParams.get('utm_campaign'),
      utm_content: searchParams.get('utm_content'),
      utm_term: searchParams.get('utm_term'),
    })
  }, [])

  return params
}
