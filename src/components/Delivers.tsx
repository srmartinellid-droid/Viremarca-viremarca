"use client"

import Image from "next/image"
import { DEMO_CONTENT } from "@/lib/demo-data"
import { Reveal, RevealStagger, revealItem } from "@/components/motion/Reveal"
import { motion } from "framer-motion"
import { Layout, User, Layers, Target, Image as ImageIcon, Settings, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"

const icons = [Layout, User, Layers, Target, ImageIcon, Settings]
const visuals = [
  "/portfolio/magia-glass.jpg",
  "/portfolio/odonto.jpg",
  "/portfolio/imoveis.jpg",
  "/portfolio/advocacia.jpg",
  "/portfolio/magia-glass.jpg",
  "/portfolio/odonto.jpg",
]

export function Delivers() {
  const reduced = useReducedMotion()
  const items = DEMO_CONTENT.delivers

  return (
    <section className="py-28 md:py-36 bg-vm-bg relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-vm-border to-transparent" />

      <div className="mx-auto max-w-7xl px-5 sm:px-7 lg:px-10">
        <Reveal className="max-w-3xl mb-16">
          <p className="vm-eyebrow mb-4">O que entregamos</p>
          <h2 className="vm-display text-4xl md:text-5xl lg:text-[4rem] leading-[1.02] text-vm-ink tracking-[-0.035em]">
            Não entregamos páginas.
            <br />
            <span className="text-vm-coral">Construímos presença.</span>
          </h2>
          <p className="mt-6 text-lg text-vm-muted leading-relaxed max-w-2xl">
            Cada projeto parte de uma base tecnológica comum e ganha direção visual, conteúdo e estrutura próprios para o segmento.
          </p>
        </Reveal>

        <RevealStagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const Icon = icons[i % icons.length]
            return (
              <motion.article
                key={item.title}
                variants={reduced ? undefined : revealItem}
                className={cn(
                  "group relative min-h-[390px] overflow-hidden rounded-[1.6rem] border border-vm-border bg-white",
                  "transition-all duration-500 hover:-translate-y-1 hover:border-vm-coral/40 hover:shadow-[0_30px_70px_-35px_rgba(224,122,95,0.3)]"
                )}
              >
                <div className="absolute inset-0">
                  <Image
                    src={visuals[i % visuals.length]}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover opacity-0 scale-105 transition-all duration-700 group-hover:opacity-100 group-hover:scale-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-vm-ink/90 via-vm-ink/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </div>

                <div className="relative z-10 flex h-full min-h-[390px] flex-col justify-between p-7 md:p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-vm-coral/10 text-vm-coral transition-all duration-500 group-hover:bg-white/15 group-hover:text-white group-hover:backdrop-blur-md">
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-vm-muted transition-colors group-hover:text-white/65">
                      0{i + 1}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight text-vm-ink transition-colors group-hover:text-white">
                      {item.title}
                    </h3>
                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-vm-muted transition-colors group-hover:text-white/75">
                      {item.desc}
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-vm-coral opacity-0 translate-y-2 transition-all duration-400 group-hover:opacity-100 group-hover:translate-y-0 group-hover:text-white">
                      Ver abordagem
                      <ArrowUpRight size={14} />
                    </div>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </RevealStagger>
      </div>
    </section>
  )
}
