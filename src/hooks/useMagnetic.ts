"use client"

import { useRef, useCallback } from "react"
import { useReducedMotion } from "./useReducedMotion"

type Options = {
  strength?: number
  radius?: number
}

/** Soft magnetic pull toward cursor within a small radius. Disabled on reduced-motion / touch. */
export function useMagnetic<T extends HTMLElement>(options: Options = {}) {
  const { strength = 0.28, radius = 80 } = options
  const ref = useRef<T>(null)
  const reduced = useReducedMotion()

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current
      if (!el || reduced) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.hypot(dx, dy)
      if (dist > radius) {
        el.style.transform = "translate3d(0,0,0)"
        return
      }
      const pull = (1 - dist / radius) * strength
      el.style.transform = `translate3d(${dx * pull}px, ${dy * pull}px, 0)`
    },
    [reduced, strength, radius]
  )

  const onLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = "translate3d(0,0,0)"
  }, [])

  return { ref, onMouseMove: onMove, onMouseLeave: onLeave }
}
