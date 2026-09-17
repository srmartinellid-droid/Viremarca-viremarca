"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, ArrowUpRight, ExternalLink } from "lucide-react"
import type { PortfolioProject } from "@/types"
import type { TitleStyle } from "@/lib/visual-defaults"
import { cn } from "@/lib/utils"
import { Reveal } from "@/components/motion/Reveal"
import { TitleBlock } from "@/components/TitleBlock"
import { useReducedMotion } from "@/hooks/useReducedMotion"

type Props = { projects: PortfolioProject[]; titleStyle?: TitleStyle }

export function PortfolioShowcase({ projects, titleStyle }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)
  const [hovered, setHovered] = useState<string | null>(null)
  const reduced = useReducedMotion()

  const updateButtons = () => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 8)
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    updateButtons()
    el.addEventListener("scroll", updateButtons, { passive: true })
    window.addEventListener("resize", updateButtons)
    return () => {
      el.removeEventListener("scroll", updateButtons)
      window.removeEventListener("resize", updateButtons)
    }
  }, [projects])

  const scroll = (dir: "prev" | "next") => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir === "next" ? el.clientWidth * 0.82 : -el.clientWidth * 0.82, behavior: "smooth" })
  }

  return (
    <section id="sites" className="py-20 md:py-24 bg-white relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-vm-border to-transparent" />
      <div className="mx-auto max-w-7xl px-5 sm:px-7 lg:px-10">
        <Reveal className="max-w-3xl mb-10">
          <p className="vm-eyebrow mb-3">Portfólio</p>
          <TitleBlock style={titleStyle || { text: "Veja a VireMarca em ação", highlight: "VireMarca em ação", textColor: "#171717", highlightColor: "#E07A5F", highlightStyle: "color", fontWeight: 600 }} className="!mx-0" />
          <p className="mt-3 text-vm-muted max-w-lg leading-relaxed">Sites reais, construídos com a mesma base tecnológica e uma identidade própria para cada negócio.</p>
        </Reveal>

        <div className="relative">
          <button type="button" onClick={() => scroll("prev")} disabled={!canPrev} className={cn("absolute z-20 left-0 md:-left-5 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full border bg-white shadow-lg transition-all", canPrev ? "border-vm-border text-vm-ink hover:border-vm-coral hover:text-vm-coral" : "border-vm-border/50 text-vm-border opacity-70 cursor-not-allowed")} aria-label="Anterior"><ChevronLeft size={19} /></button>
          <button type="button" onClick={() => scroll("next")} disabled={!canNext} className={cn("absolute z-20 right-0 md:-right-5 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full border bg-white shadow-lg transition-all", canNext ? "border-vm-border text-vm-ink hover:border-vm-coral hover:text-vm-coral" : "border-vm-border/50 text-vm-border opacity-70 cursor-not-allowed")} aria-label="Próximo"><ChevronRight size={19} /></button>

          <div ref={trackRef} className="flex gap-5 md:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-5 -mx-5 px-5 md:-mx-1 md:px-1">
            {projects.map((project, i) => {
              const isActive = hovered === project.id
              return (
                <motion.article
                  key={project.id}
                  initial={reduced ? false : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-5%" }}
                  transition={{ delay: i * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  onMouseEnter={() => setHovered(project.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setHovered(project.id)}
                  className={cn("group relative flex-shrink-0 w-[min(82vw,350px)] md:w-[360px] snap-start rounded-2xl overflow-hidden border transition-all duration-500", isActive ? "border-vm-coral/40 shadow-[0_20px_50px_-20px_rgba(224,122,95,0.25)]" : "border-vm-border shadow-sm")}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-vm-sand">
                    {project.thumbnail ? <Image src={project.thumbnail} alt={project.title} fill sizes="(max-width: 768px) 82vw, 360px" className={cn("object-cover transition-all duration-700", reduced ? "" : "grayscale brightness-[0.9] md:group-hover:grayscale-0 md:group-hover:brightness-100 md:group-hover:scale-[1.05]", isActive ? "grayscale-0 brightness-100 scale-[1.03]" : "")} /> : <div className="absolute inset-0 flex items-center justify-center text-vm-muted text-sm">Preview</div>}
                    <div className={cn("absolute inset-0 bg-gradient-to-t from-vm-ink/50 via-transparent to-transparent transition-opacity", isActive ? "opacity-80" : "opacity-40")} />
                    <div className="absolute top-4 left-4"><span className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-[11px] font-medium text-vm-ink tracking-wide">{project.category}</span></div>
                    {project.featured && <div className="absolute top-4 right-4 rounded-full bg-vm-coral px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">Destaque</div>}
                    {project.site_url && <a href={project.site_url} target="_blank" rel="noopener noreferrer" aria-label={`Visitar ${project.title}`} className="absolute bottom-4 right-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-vm-ink shadow-md transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-vm-coral hover:scale-105"><ExternalLink size={16} /></a>}
                  </div>
                  <div className="p-5 md:p-6 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div><h3 className="text-lg font-semibold tracking-tight text-vm-ink group-hover:text-vm-coral transition-colors">{project.title}</h3><p className="mt-2 text-sm text-vm-muted leading-relaxed line-clamp-2">{project.description}</p></div>
                      <Link href={`/portfolio/${project.slug}`} className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full border border-vm-border group-hover:border-vm-coral group-hover:bg-vm-coral group-hover:text-white transition-all" aria-label={`Ver ${project.title}`}><ArrowUpRight size={16} /></Link>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
