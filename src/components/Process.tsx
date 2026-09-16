"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Reveal } from "@/components/motion/Reveal"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import type { ProcessItem } from "@/lib/site-content"

export function Process({ items }: { items: ProcessItem[] }) {
  const [active, setActive] = useState(0)
  const reduced = useReducedMotion()
  const steps = items.length ? items : []
  const current = steps[Math.min(active, Math.max(steps.length - 1, 0))]

  if (!steps.length) return null

  return (
    <section id="como-fazemos" className="py-20 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 vm-grid-bg opacity-35" aria-hidden />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-2xl mb-11">
          <p className="vm-eyebrow mb-3">Método</p>
          <h2 className="vm-display text-3xl md:text-4xl lg:text-[2.75rem] text-vm-ink">Como trabalhamos</h2>
          <p className="mt-3 text-vm-muted leading-relaxed">Um processo claro, sem surpresas, da conversa inicial ao site no ar e evoluindo.</p>
        </Reveal>

        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-7 lg:gap-10 items-start">
          <div className="space-y-2.5">
            {steps.map((item, i) => {
              const isOpen = active === i
              return (
                <button key={`${item.step}-${item.title}`} type="button" onClick={() => setActive(i)} onMouseEnter={() => !reduced && setActive(i)} className={cn("w-full text-left rounded-2xl border p-4 md:p-5 transition-all duration-300", isOpen ? "border-vm-coral/40 bg-white shadow-[0_12px_40px_-16px_rgba(224,122,95,0.2)]" : "border-vm-border bg-white/60 hover:bg-white")} aria-expanded={isOpen}>
                  <div className="flex items-baseline gap-4">
                    <span className={cn("text-xl font-semibold tracking-tight", isOpen ? "text-vm-coral" : "text-vm-border")}>{item.step}</span>
                    <div className="flex-1">
                      <h3 className={cn("text-base md:text-lg font-semibold", isOpen ? "text-vm-ink" : "text-vm-muted")}>{item.title}</h3>
                      <AnimatePresence initial={false}>
                        {isOpen && <motion.p initial={reduced ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reduced ? undefined : { height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="mt-2 text-sm text-vm-muted leading-relaxed overflow-hidden">{item.desc}</motion.p>}
                      </AnimatePresence>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="lg:sticky lg:top-28">
            <div className="relative rounded-3xl overflow-hidden min-h-[320px] md:min-h-[390px] border border-vm-border bg-vm-charcoal">
              {current.image && <Image src={current.image} alt={current.title} fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover opacity-70" />}
              <div className="absolute inset-0 bg-gradient-to-t from-vm-ink/95 via-vm-ink/35 to-transparent" />
              <div className="relative z-10 min-h-[320px] md:min-h-[390px] p-7 md:p-9 flex flex-col justify-between">
                <div>
                  <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-white/55 mb-5">Etapa {current.step}</p>
                  <AnimatePresence mode="wait">
                    <motion.div key={active} initial={reduced ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
                      <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-white leading-snug">{current.title}</h3>
                      <p className="mt-3 text-white/65 leading-relaxed max-w-md">{current.desc}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="flex gap-2 mt-8">
                  {steps.map((_, i) => <button key={i} type="button" onClick={() => setActive(i)} className={cn("h-1.5 rounded-full transition-all", i === active ? "w-8 bg-vm-coral" : "w-1.5 bg-white/30 hover:bg-white/50")} aria-label={`Ir para etapa ${i + 1}`} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
