"use client"

import { AnimatePresence, motion } from "framer-motion"
import type { DividerStyle } from "@/lib/site-content"

export function SectionDivider({ config }: { config: DividerStyle }) {
  const image = config.images?.length ? config.images[0] : ""
  return (
    <>
      <style>{`@media (max-width: 1023px) {
        section div[aria-label="Projetos em destaque"][class~="lg:hidden"] {
          position: relative !important;
          display: block !important;
          min-height: 310px !important;
          margin-left: -1.25rem !important;
          margin-right: -1.25rem !important;
          padding-left: 1.25rem !important;
          padding-right: 1.25rem !important;
          padding-bottom: 0 !important;
        }
        section div[aria-label="Projetos em destaque"][class~="lg:hidden"] > a {
          position: absolute !important;
          margin: 0 !important;
        }
        section div[aria-label="Projetos em destaque"][class~="lg:hidden"] > a:nth-child(1) {
          top: 0 !important; right: 8% !important; z-index: 30 !important; width: 76% !important;
        }
        section div[aria-label="Projetos em destaque"][class~="lg:hidden"] > a:nth-child(2) {
          top: 31% !important; right: 1% !important; z-index: 40 !important; width: 54% !important;
        }
        section div[aria-label="Projetos em destaque"][class~="lg:hidden"] > a:nth-child(3) {
          bottom: 0 !important; left: 6% !important; z-index: 50 !important; width: 55% !important;
        }
      }`}</style>
      <div className="relative h-24 overflow-hidden border-y border-black/10 md:h-28" style={{ backgroundColor: config.backgroundColor }} aria-label={config.label}>
        <AnimatePresence initial={false} mode="sync">{image && config.mode === "image" && <motion.div key={image} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: config.scale / 100 }} transition={{ duration: 1.1 }} className="absolute inset-[-3%] bg-cover" style={{ backgroundImage: `url(${image})`, backgroundPosition: config.position }} />}</AnimatePresence>
        {image && config.mode === "image" && <div className="absolute inset-0" style={{ backgroundColor: "#171717", opacity: Math.max(0, Math.min(100, config.overlay)) / 100 }} />}
        <div className="absolute inset-0 flex items-center justify-center"><div className="flex items-center gap-4 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.28em] md:text-[10px]" style={{ color: config.textColor }}><span className="h-px w-12 bg-current opacity-50" />{config.label}<span className="h-px w-12 bg-current opacity-50" /></div></div>
      </div>
    </>
  )
}
