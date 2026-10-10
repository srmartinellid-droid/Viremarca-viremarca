"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import type { PortfolioProject } from "@/types"
import type { TitleStyle } from "@/lib/visual-defaults"
import { cn } from "@/lib/utils"
import { Reveal } from "@/components/motion/Reveal"
import { TitleBlock } from "@/components/TitleBlock"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { trackEvent } from "@/lib/track-event"

type Props = { projects: PortfolioProject[]; titleStyle?: TitleStyle }

const isReal = (project: PortfolioProject) => project.description.startsWith("Projeto real ·")

export function PortfolioShowcase({ projects, titleStyle }: Props) {
  const reduced = useReducedMotion()
  // Projetos reais primeiro; a ordem original é preservada dentro de cada grupo.
  const ordered = [...projects.filter(isReal), ...projects.filter(p => !isReal(p))]

  return (
    <section id="sites" className="py-20 md:py-24 bg-white relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-vm-border to-transparent" />
      <div className="mx-auto max-w-7xl px-5 sm:px-7 lg:px-10">
        <Reveal className="max-w-3xl mb-10">
          <p className="vm-eyebrow mb-3">Portfólio</p>
          <TitleBlock style={titleStyle || { text: "Veja a VireMarca em ação", highlight: "VireMarca em ação", textColor: "#171717", highlightColor: "#E07A5F", highlightStyle: "color", fontWeight: 600 }} className="!mx-0" />
          <p className="mt-3 text-vm-muted max-w-2xl leading-relaxed">Projetos e demonstrações desenvolvidos pela VireMarca para diferentes negócios, necessidades e experiências digitais.</p>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {ordered.map((project, i) => {
            const real = isReal(project)
            return (
              <motion.article
                key={project.id}
                initial={reduced ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-5%" }}
                transition={{ delay: Math.min(i, 5) * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="group relative"
              >
                <Link
                  href={`/portfolio/${project.slug}`}
                  onClick={() => void trackEvent("portfolio_view", { location: "portfolio_card" }, "production")}
                  aria-label={`Ver ${project.title}`}
                  className={cn("block overflow-hidden rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-vm-coral/40 hover:shadow-[0_20px_50px_-20px_rgba(224,122,95,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-vm-coral", real ? "border-vm-border shadow-sm" : "border-vm-border/70")}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-vm-sand">
                    {project.thumbnail ? <Image src={project.thumbnail} alt={project.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className={cn("object-cover transition-transform duration-700", reduced ? "" : "group-hover:scale-[1.03]", real ? "" : "saturate-[0.85]")} /> : <div className="absolute inset-0 flex items-center justify-center text-vm-muted text-sm">Preview</div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-vm-ink/35 via-transparent to-transparent" />
                    <div className="absolute top-4 left-4"><span className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-[11px] font-medium text-vm-ink tracking-wide">{project.category}</span></div>
                    {real
                      ? <div className="absolute top-4 right-4 rounded-full bg-vm-coral px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">Projeto real</div>
                      : <div className="absolute top-4 right-4 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-vm-muted backdrop-blur-sm">Demonstração</div>}
                  </div>
                  <div className="flex items-start justify-between gap-3 p-5 md:p-6">
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-vm-ink transition-colors group-hover:text-vm-coral">{project.title}</h3>
                      <p className="mt-2 text-sm text-vm-muted leading-relaxed line-clamp-2">{project.description}</p>
                    </div>
                    <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-vm-border transition-all group-hover:border-vm-coral group-hover:bg-vm-coral group-hover:text-white"><ArrowUpRight size={16} /></span>
                  </div>
                </Link>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
