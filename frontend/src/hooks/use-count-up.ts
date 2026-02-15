'use client'

import { useEffect, useState } from 'react'

export function useCountUp(
  end: number,
  shouldStart: boolean,
  duration: number = 1500,
) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!shouldStart) return

    let startTime: number | null = null
    let animationFrame: number

    function animate(timestamp: number) {
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out cubic for natural deceleration
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * end))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, shouldStart, duration])

  return value
}
