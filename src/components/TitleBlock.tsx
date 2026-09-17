"use client"

import { motion } from "framer-motion"
import { Reveal } from "@/components/motion/Reveal"
import type { TitleStyle } from "@/lib/visual-defaults"

export type { TitleStyle } from "@/lib/visual-defaults"

export function renderTitleParts(style: TitleStyle) {
  const text = style.text || "", highlight = style.highlight || ""
  if (!highlight || !text.includes(highlight)) return { before: text, highlighted: "", after: "" }
  const index = text.indexOf(highlight)
  return { before: text.slice(0, index), highlighted: highlight, after: text.slice(index + highlight.length) }
}

export function TitleBlock({ style, className = "", size = "default" }: { style: TitleStyle; className?: string; size?: "default" | "large" }) {
  const parts = renderTitleParts(style)
  const align = style.align === "center" ? "text-center mx-auto" : "text-left"
  const highlightClass = style.highlightStyle === "italic" ? "italic" : style.highlightStyle === "underline" ? "underline decoration-[0.08em] underline-offset-[0.14em]" : style.highlightStyle === "marker" ? "rounded-[0.12em] px-[0.08em]" : ""
  return <Reveal className={`${align} ${className}`}><motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 0.65 }} className={`vm-display text-pretty leading-[1.04] tracking-[-0.045em] ${size === "large" ? "text-4xl md:text-5xl lg:text-[3.6rem]" : "text-3xl md:text-4xl lg:text-[2.75rem]"}`} style={{ color: style.textColor || "inherit" }}>{parts.before}{parts.highlighted && <span className={highlightClass} style={{ color: style.highlightColor || style.textColor || "inherit", backgroundColor: style.highlightStyle === "marker" ? `${style.highlightColor || "#E07A5F"}20` : undefined }}>{parts.highlighted}</span>}{parts.after}</motion.h2></Reveal>
}
