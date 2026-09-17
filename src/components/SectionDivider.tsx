"use client"

import { AnimatePresence, motion } from "framer-motion"
import type { DividerStyle } from "@/lib/site-content"

export function SectionDivider({ config }: { config: DividerStyle }) {
  const image = config.images?.length ? config.images[0] : ""
  return (
    <div className="relative h-24 overflow-hidden border-y border-black/10 md:h-28" style={{ backgroundColor: config.backgroundColor }} aria-label={config.label}>
      <AnimatePresence initial={false} mode="sync">{image && config.mode === "image" && <motion.div key={image} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: config.scale / 100 }} transition={{ duration: 1.1 }} className="absolute inset-[-3%] bg-cover" style={{ backgroundImage: `url(${image})`, backgroundPosition: config.position }} />}</AnimatePresence>
      {image && config.mode === "image" && <div className="absolute inset-0" style={{ backgroundColor: "#171717", opacity: Math.max(0, Math.min(100, config.overlay)) / 100 }} />}
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(90deg,transparent_0%,#E07A5F_18%,transparent_36%,transparent_64%,#E07A5F_82%,transparent_100%)]" aria-hidden />
      <div className="absolute inset-0 flex items-center justify-center"><div className="flex items-center gap-4 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.28em] md:text-[10px]" style={{ color: config.textColor }}><span className="h-px w-12 bg-current opacity-50" />{config.label}<span className="h-px w-12 bg-current opacity-50" /></div></div>
    </div>
  )
}
