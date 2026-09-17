"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, ArrowUpRight, ExternalLink } from "lucide-react"
import type { PortfolioProject } from "@/types"
import { cn } from "@/lib/utils"
import { Reveal } from "@/components/motion/Reveal"
import { useReducedMotion } from "@/hooks/useReducedMotion"

type Props = { projects: PortfolioProject[] }

export function PortfolioShowcase({ projects }: Props) {
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
    <section id="sites" className="relative overflow-hidden bg-white py-24 md:py-32">
      <div className="pointer-events-none absolute right-[-12%] top-[8%] h-[34rem] w-[34rem] rounded-full bg-vm-coral/[0.07] blur-[100px]" aria-hidden />
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-8 border-b border-vm-border pb-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <Reveal>
            <p className="vm-eyebrow mb-4 flex items-center gap-3"><span className="text-vm-ink/30">01</span> Portfólio</p>
            <h2 className="vm-display max-w-xl text-4xl leading-[0.96] md:text-6xl lg:text-[5rem]">Marcas que já ganharam forma na tela.</h2>
          </Reveal>
          <Reveal delay={0.1} className="max-w-xl lg:justify-self-end">
            <p className="text-base leading-relaxed text-vm-muted md:text-lg">Cada projeto nasce de uma mesma engenharia, mas recebe uma direção visual própria. O resultado é um site que pertence ao negócio, não a um template.</p>
            <div className="mt-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-vm-muted"><span className="h-px w-10 bg-vm-coral" />Arraste para explorar</div>
          </Reveal>
        </div>

        <div className="relative mt-12">
          <button type="button" onClick={() => scroll("prev")} disabled={!canPrev} className={cn("absolute left-0 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border bg-white shadow-xl transition-all md:flex md:-left-6", canPrev ? "border-vm-border text-vm-ink hover:border-vm-coral hover:text-vm-coral" : "border-vm-border/50 text-vm-border opacity-70 cursor-not-allowed")} aria-label="Anterior"><ChevronLeft size={19} /></button>
          <button type="button" onClick={() => scroll("next")} disabled={!canNext} className={cn("absolute right-0 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border bg-white shadow-xl transition-all md:flex md:-right-6", canNext ? "border-vm-border text-vm-ink hover:border-vm-coral hover:text-vm-coral" : "border-vm-border/50 text-vm-border opacity-70 cursor-not-allowed")} aria-label="Próximo"><ChevronRight size={19} /></button>

          <div ref={trackRef} className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-6 scrollbar-hide md:gap-7">
            {projects.map((project, i) => {
              const isActive = hovered === project.id
              return (
                <motion.article key={project.id} initial={reduced ? false : { opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-5%" }} transition={{ delay: i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} onMouseEnter={() => setHovered(project.id)} onMouseLeave={() => setHovered(null)} onClick={() => setHovered(project.id)} className={cn("group relative flex-shrink-0 snap-start overflow-hidden rounded-[1.6rem] border transition-all duration-500 w-[min(84vw,520px)] md:w-[520px]", isActive ? "border-vm-coral/45 shadow-[0_28px_80px_-30px_rgba(224,122,95,0.28)]" : "border-vm-border shadow-[0_18px_60px_-45px_rgba(0,0,0,0.35)]")}>
                  <div className="relative aspect-[4/3] overflow-hidden bg-vm-sand">
                    {project.thumbnail ? <Image src={project.thumbnail} alt={project.title} fill sizes="(max-width: 768px) 84vw, 520px" className={cn("object-cover transition-all duration-700", reduced ? "" : "grayscale-[0.15] md:group-hover:scale-[1.045]", isActive ? "scale-[1.025]" : "")} /> : <div className="absolute inset-0 grid place-items-center text-sm text-vm-muted">Preview</div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-vm-ink/70 via-transparent to-transparent" />
                    <div className="absolute left-5 top-5 flex items-center gap-2"><span className="rounded-full border border-white/25 bg-vm-ink/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-md">{project.category}</span>{project.featured && <span className="rounded-full bg-vm-coral px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">Destaque</span>}</div>
                    {project.site_url && <a href={project.site_url} target="_blank" rel="noopener noreferrer" aria-label={`Visitar ${project.title}`} className="absolute bottom-5 right-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-vm-ink shadow-md transition-all md:opacity-0 md:group-hover:opacity-100 hover:scale-105 hover:text-vm-coral"><ExternalLink size={16} /></a>}
                    <div className="absolute bottom-5 left-5 right-20 text-white"><p className="text-2xl font-semibold tracking-tight md:text-3xl">{project.title}</p><p className="mt-1 max-w-sm text-sm leading-relaxed text-white/65">{project.description}</p></div>
                  </div>
                  <div className="flex items-center justify-between gap-4 bg-white px-5 py-4 md:px-6"><span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-vm-muted">Ver projeto</span><Link href={`/portfolio/${project.slug}`} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-vm-border text-vm-ink transition-all group-hover:border-vm-coral group-hover:bg-vm-coral group-hover:text-white" aria-label={`Ver ${project.title}`}><ArrowUpRight size={16} /></Link></div>
                </motion.article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
