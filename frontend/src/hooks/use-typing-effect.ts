'use client'

import { useCallback, useEffect, useState } from 'react'

export function useTypingEffect(text: string, speed: number = 18) {
  const [displayText, setDisplayText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!text) return

    setDisplayText('')
    setIsComplete(false)

    let index = 0
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1))
        index++
      } else {
        setIsComplete(true)
        clearInterval(interval)
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed])

  const skip = useCallback(() => {
    setDisplayText(text)
    setIsComplete(true)
  }, [text])

  return { displayText, isComplete, skip }
}
