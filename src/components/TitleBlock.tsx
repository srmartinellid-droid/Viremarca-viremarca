"use client"

import React from "react"
import { Reveal } from "@/components/motion/Reveal"
import { DEFAULT_TITLE_STYLES, type TitleStyle } from "@/lib/visual-defaults"
export type { TitleStyle } from "@/lib/visual-defaults"
export { DEFAULT_TITLE_STYLES }

export function renderTitleParts(style: TitleStyle) {
  const text = style.text || "", highlight = style.highlight || ""
  if (!highlight) return { before: text, highlighted: "", after: "" }
  const index = text.indexOf(highlight)
  if (index >= 0) return { before: text.slice(0, index), highlighted: highlight, after: text.slice(index + highlight.length) }
  const lowerText = text.toLocaleLowerCase("pt-BR"), lowerHighlight = highlight.toLocaleLowerCase("pt-BR")
  const insensitiveIndex = lowerText.indexOf(lowerHighlight)
  if (insensitiveIndex >= 0) return { before: text.slice(0, insensitiveIndex), highlighted: text.slice(insensitiveIndex, insensitiveIndex + highlight.length), after: text.slice(insensitiveIndex + highlight.length) }
  return { before: text, highlighted: "", after: "" }
}

export function TitleBlock({ style, className = "", size = "h2", as = "h2", animated = true, highlightRule = false }: { style: TitleStyle; className?: string; size?: "display" | "h2" | "h3"; as?: "h1" | "h2" | "h3"; animated?: boolean; highlightRule?: boolean }) {
  const parts = renderTitleParts(style), align = style.align === "center" ? "text-center mx-auto" : "text-left"
  const highlightClass = style.highlightStyle === "italic" ? "italic" : style.highlightStyle === "underline" ? "underline decoration-[0.08em] underline-offset-[0.14em]" : style.highlightStyle === "marker" ? "rounded-[0.12em] px-[0.08em]" : ""
  const highlightedClass = parts.highlighted ? "relative inline-block" : ""
  const titleClass = size === "display" ? "text-display" : size === "h3" ? "text-h3" : "text-h2"
  const content = React.createElement(as, { className: "vm-display " + titleClass + " text-pretty " + className, style: { color: style.textColor || "inherit", fontWeight: style.fontWeight || 600 } },
    parts.before,
    parts.highlighted && React.createElement("span", { className: highlightedClass + " " + highlightClass, style: { color: style.highlightColor || style.textColor || "inherit", backgroundColor: style.highlightStyle === "marker" ? (style.highlightColor || "#E07A5F") + "20" : undefined } },
      parts.highlighted,
      highlightRule && React.createElement("span", { className: "absolute left-0 right-[18%] -bottom-2 h-1 origin-left rounded-full bg-vm-coral/70", "aria-hidden": true })
    ),
    parts.after
  )
  return animated ? <Reveal className={align}>{content}</Reveal> : content
}
