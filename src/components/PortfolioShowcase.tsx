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

type Props = {
  projects: PortfolioProject[]
}

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
    const amount = el.clientWidth * 0.82
    el.scrollBy({ left: dir === "next" ? amount : -amount, behavior: "smooth" })
  }

  return (
    <section id="sites" className="py-24 md:py-32 bg-white relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-vm-border to-transparent" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8 mb-14">
          <Reveal>
            <p className="vm-eyebrow mb-3">Portfólio</p>
            <h2 className="vm-display text-3xl md:text-4xl lg:text-[2.75rem] text-vm-ink">
              Veja a VireMarca em ação
            </h2>
            <p className="mt-4 text-vm-muted max-w-lg leading-relaxed">
              Sites reais, construídos com a mesma base tecnológica e uma identidade própria para cada negócio.
            </p>
          </Reveal>

          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scroll("prev")}
              disabled={!canPrev}
              className={cn(
                "inline-flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-300",
                canPrev
                  ? "border-vm-border bg-white text-vm-ink hover:border-vm-coral hover:text-vm-coral"
                  : "border-vm-border/50 bg-vm-bg text-vm-border cursor-not-allowed"
              )}
              aria-label="Anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => scroll("next")}
              disabled={!canNext}
              className={cn(
                "inline-flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-300",
                canNext
                  ? "border-vm-border bg-white text-vm-ink hover:border-vm-coral hover:text-vm-coral"
                  : "border-vm-border/50 bg-vm-bg text-vm-border cursor-not-allowed"
              )}
              aria-label="Próximo"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="flex gap-5 md:gap-7 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-6 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {projects.map((project, i) => {
            const isActive = hovered === project.id
            return (
              <motion.article
                key={project.id}
                initial={reduced ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-5%" }}
                transition={{ delay: i * 0.08, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                onMouseEnter={() => setHovered(project.id)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  "group relative flex-shrink-0 w-[min(85vw,340px)] md:w-[380px] snap-start",
                  "rounded-2xl overflow-hidden border transition-all duration-500",
                  isActive
                    ? "border-vm-coral/40 shadow-[0_20px_50px_-20px_rgba(224,122,95,0.25)]"
                    : "border-vm-border shadow-sm"
                )}
              >
                {/* Image — grayscale → color + depth */}
                <div className="relative aspect-[4/3] overflow-hidden bg-vm-sand">
                  {project.thumbnail ? (
                    <Image
                      src={project.thumbnail}
                      alt={project.title}
                      fill
                      sizes="(max-width: 768px) 85vw, 380px"
                      className={cn(
                        "object-cover transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        reduced
                          ? ""
                          : "grayscale brightness-[0.9] group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-[1.06]"
                      )}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-vm-muted text-sm">
                      Preview
                    </div>
                  )}

                  {/* Overlay gradient */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-t from-vm-ink/50 via-transparent to-transparent transition-opacity duration-500",
                      isActive ? "opacity-80" : "opacity-40"
                    )}
                  />

                  {/* Category badge */}
                  <div className="absolute top-4 left-4">
                    <span className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-[11px] font-medium text-vm-ink tracking-wide">
                      {project.category}
                    </span>
                  </div>

                  {/* External link hint */}
                  {project.site_url && (
                    <div
                      className={cn(
                        "absolute top-4 right-4 transition-all duration-400",
                        isActive ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
                      )}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-vm-ink shadow-md">
                        <ExternalLink size={14} />
                      </span>
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="p-5 md:p-6 bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-vm-ink group-hover:text-vm-coral transition-colors duration-300">
                        {project.title}
                      </h3>
                      <p className="mt-2 text-sm text-vm-muted leading-relaxed line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                    <Link
                      href={`/portfolio/${project.slug}`}
                      className={cn(
                        "shrink-0 flex h-10 w-10 items-center justify-center rounded-full border border-vm-border transition-all duration-300",
                        "group-hover:border-vm-coral group-hover:bg-vm-coral group-hover:text-white"
                      )}
                      aria-label={`Ver ${project.title}`}
                    >
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
