"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Layout, User, Layers, Target, Image as ImageIcon, Settings, ArrowUpRight, X } from "lucide-react"
import { Reveal, RevealStagger, revealItem } from "@/components/motion/Reveal"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import type { DeliverItem } from "@/lib/site-content"

const icons = [Layout, User, Layers, Target, ImageIcon, Settings]

export function Delivers({ items }: { items: DeliverItem[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const reduced = useReducedMotion()

  return (
    <section className="py-20 md:py-24 bg-vm-bg relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-vm-border to-transparent" />
      <div className="mx-auto max-w-7xl px-5 sm:px-7 lg:px-10">
        <Reveal className="max-w-3xl mb-11">
          <p className="vm-eyebrow mb-4">O que entregamos</p>
          <h2 className="vm-display text-4xl md:text-5xl lg:text-[3.6rem] leading-[1.02] text-vm-ink tracking-[-0.035em]">
            Não entregamos páginas.<br /><span className="text-vm-coral">Construímos presença.</span>
          </h2>
          <p className="mt-5 text-lg text-vm-muted leading-relaxed max-w-2xl">Cada projeto recebe direção visual, conteúdo e estrutura próprios para o objetivo do negócio.</p>
        </Reveal>

        <RevealStagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const Icon = icons[i % icons.length]
            const isOpen = open === i
            return (
              <motion.article key={`${item.title}-${i}`} variants={reduced ? undefined : revealItem} className={cn("group relative overflow-hidden rounded-[1.5rem] border bg-white transition-all duration-400", isOpen ? "border-vm-coral/50 shadow-[0_25px_60px_-30px_rgba(224,122,95,0.35)]" : "border-vm-border hover:border-vm-coral/35")}>
                <div className="relative aspect-[16/9] overflow-hidden bg-vm-sand">
                  <Image src={item.image || "/portfolio/magia-glass.jpg"} alt={item.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-vm-ink/70 via-transparent to-transparent" />
                  <span className="absolute left-5 bottom-4 text-[10px] font-semibold tracking-[0.18em] uppercase text-white/75">0{i + 1}</span>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-vm-coral/10 text-vm-coral"><Icon size={18} /></div>
                    <button type="button" onClick={() => setOpen(isOpen ? null : i)} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-vm-coral hover:text-vm-coral-deep" aria-expanded={isOpen}>
                      {isOpen ? "Fechar" : "Ver abordagem"}
                      {isOpen ? <X size={14} /> : <ArrowUpRight size={14} />}
                    </button>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight text-vm-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-vm-muted">{item.desc}</p>
                  <AnimatePresence initial={false}>
                    {isOpen && <motion.div initial={reduced ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reduced ? undefined : { height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                      <div className="mt-5 rounded-2xl bg-vm-bg p-4 text-sm leading-relaxed text-vm-muted border border-vm-border">{item.details || "Conteúdo desta abordagem ainda não foi configurado."}</div>
                    </motion.div>}
                  </AnimatePresence>
                </div>
              </motion.article>
            )
          })}
        </RevealStagger>
      </div>
    </section>
  )
}
