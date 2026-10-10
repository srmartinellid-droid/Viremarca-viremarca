"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { WhatsAppIcon } from "@/components/WhatsAppIcon"
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
  const [filter, setFilter] = useState<"all" | "live" | "models">("all")
  const sorted = [...projects.filter(isReal), ...projects.filter(p => !isReal(p))]
  const ordered = sorted.filter(p => filter === "all" || (filter === "live" ? isReal(p) : !isReal(p)))
  const filters = [{ id: "all", label: "Todos" }, { id: "live", label: "No ar" }, { id: "models", label: "Modelos por segmento" }] as const
  const legacyTitle = !titleStyle || /constru|veja a viremarca/i.test(titleStyle.text)

  return (
    <section id="sites" className="py-20 md:py-24 bg-white relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-vm-border to-transparent" />
      <div className="mx-auto max-w-7xl px-5 sm:px-7 lg:px-10">
        <Reveal className="max-w-3xl mb-10">
          <p className="vm-eyebrow mb-3">Portfólio</p>
          <TitleBlock style={!legacyTitle && titleStyle ? titleStyle : { text: "Uma base. Uma identidade para cada negócio.", highlight: "Uma identidade para cada negócio.", textColor: "#171717", highlightColor: "#E07A5F", highlightStyle: "color", fontWeight: 600 }} className="!mx-0" />
          <p className="mt-3 text-vm-muted max-w-2xl leading-relaxed">Do site que já está no ar ao modelo pronto para o seu segmento: a mesma estrutura sólida, com a cara de cada marca.</p>
          <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar portfólio">{filters.map(f => <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)} className={cn("rounded-full border px-4 py-2 text-sm font-medium transition-colors", filter === f.id ? "border-vm-ink bg-vm-ink text-white" : "border-vm-border bg-white text-vm-muted hover:border-vm-ink hover:text-vm-ink")}>{f.label}</button>)}</div>
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
                      ? <div className="absolute top-4 right-4 rounded-full bg-vm-coral px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">No ar</div>
                      : <div className="absolute top-4 right-4 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-vm-muted backdrop-blur-sm">Modelo · demonstração</div>}
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
        <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-2xl border border-vm-border bg-vm-sand/60 p-6 md:flex-row md:items-center md:p-8">
          <div><p className="text-lg font-semibold text-vm-ink">O próximo pode ser o seu.</p><p className="mt-1 text-sm text-vm-muted">Conte o seu segmento e mostramos como ele ficaria na base VireMarca.</p></div>
          <a href="https://wa.me/5548991410717?text=Ol%C3%A1!%20Quero%20ver%20como%20meu%20segmento%20ficaria%20na%20base%20VireMarca." target="_blank" rel="noopener noreferrer" onClick={() => void trackEvent("contact_started", { location: "portfolio_cta" }, "production")} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-vm-coral px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-vm-coral-deep"><WhatsAppIcon size={18} />Falar no WhatsApp</a>
        </div>
      </div>
    </section>
  )
}
