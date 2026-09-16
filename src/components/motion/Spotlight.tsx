"use client"

import { useRef, useState, useCallback } from "react"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { cn } from "@/lib/utils"

type Props = {
  children: React.ReactNode
  className?: string
  /** radial size in px */
  size?: number
  intensity?: number
}

/** Soft cursor spotlight overlay for a container. */
export function Spotlight({ children, className, size = 420, intensity = 0.12 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const [active, setActive] = useState(false)

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      if (reduced || !ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setPos({ x, y })
    },
    [reduced]
  )

  return (
    <div
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      onMouseMove={onMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      {!reduced && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] transition-opacity duration-500"
          style={{
            opacity: active ? 1 : 0,
            background: `radial-gradient(${size}px circle at ${pos.x}% ${pos.y}%, rgba(224,122,95,${intensity}), transparent 55%)`,
          }}
        />
      )}
      <div className="relative z-[2]">{children}</div>
    </div>
  )
}
