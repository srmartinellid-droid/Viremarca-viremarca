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
    <section id="como-fazemos" className="relative overflow-hidden py-20 md:py-28 bg-vm-ink text-white">
      <div className="absolute inset-0 opacity-20" aria-hidden><div className="absolute inset-0 vm-grid-bg [filter:invert(1)]" /><div className="absolute -right-40 top-[-20%] h-[32rem] w-[32rem] rounded-full bg-vm-coral/25 blur-[110px]" /></div>
      <div className="absolute left-0 top-0 h-1 w-32 bg-vm-coral" aria-hidden />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative">
        <Reveal className="max-w-2xl mb-11">
          <p className="vm-eyebrow mb-3">Método</p>
          <h2 className="vm-display text-3xl md:text-4xl lg:text-[2.75rem] text-white">Como trabalhamos</h2>
          <p className="mt-3 text-white/60 leading-relaxed">Um processo claro, sem surpresas, da conversa inicial ao site no ar e evoluindo.</p>
        </Reveal>

        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-7 lg:gap-10 items-start">
          <div className="space-y-2.5">
            {steps.map((item, i) => {
              const isOpen = active === i
              return (
                <button key={`${item.step}-${item.title}`} type="button" onClick={() => setActive(i)} onMouseEnter={() => !reduced && setActive(i)} className={cn("group w-full text-left rounded-2xl border p-4 md:p-5 transition-all duration-300", isOpen ? "border-vm-coral/70 bg-white text-vm-ink shadow-[0_18px_55px_-22px_rgba(224,122,95,0.5)]" : "border-white/10 bg-white/[0.045] text-white hover:bg-white/[0.08]")} aria-expanded={isOpen}>
                  <div className="flex items-baseline gap-4">
                    <span className={cn("text-xl font-semibold tracking-tight tabular-nums", isOpen ? "text-vm-coral" : "text-white/25")}>{item.step}</span>
                    <div className="flex-1">
                      <h3 className={cn("text-base md:text-lg font-semibold", isOpen ? "text-vm-ink" : "text-white/80")}>{item.title}</h3>
                      <AnimatePresence initial={false}>
                        {isOpen && <motion.p initial={reduced ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reduced ? undefined : { height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="mt-2 text-sm text-vm-muted leading-relaxed overflow-hidden">{item.desc}</motion.p>}
                      </AnimatePresence>
                    </div>
                    <span className={cn("h-2 w-2 rounded-full transition-transform", isOpen ? "bg-vm-coral scale-125" : "bg-white/20")} />
                  </div>
                </button>
              )
            })}
          </div>

          <div className="lg:sticky lg:top-28">
            <div className="relative rounded-[2rem] overflow-hidden min-h-[320px] md:min-h-[390px] border border-white/10 bg-vm-charcoal shadow-[0_35px_100px_-50px_rgba(0,0,0,0.7)]">
              {current.image && <Image src={current.image} alt={current.title} fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover opacity-75" />}
              <div className="absolute inset-0 bg-gradient-to-t from-vm-ink via-vm-ink/35 to-vm-ink/10" />
              <div className="absolute inset-0 bg-vm-coral/10 mix-blend-screen" />
              <div className="relative z-10 min-h-[320px] md:min-h-[390px] p-7 md:p-9 flex flex-col justify-between">
                <div className="flex items-start justify-between gap-5">
                  <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-white/50">Etapa {current.step}</p>
                  <span className="text-[5rem] md:text-[7rem] font-semibold leading-none tracking-[-0.08em] text-white/10">{current.step}</span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={active} initial={reduced ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
                    <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-white leading-snug">{current.title}</h3>
                    <p className="mt-3 text-white/65 leading-relaxed max-w-md">{current.desc}</p>
                  </motion.div>
                </AnimatePresence>
                <div className="flex gap-2 mt-8">
                  {steps.map((_, i) => <button key={i} type="button" onClick={() => setActive(i)} className={cn("h-1.5 rounded-full transition-all", i === active ? "w-10 bg-vm-coral" : "w-1.5 bg-white/30 hover:bg-white/50")} aria-label={`Ir para etapa ${i + 1}`} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative mx-auto mt-16 h-12 max-w-6xl overflow-hidden" aria-hidden><div className="absolute inset-x-[-5%] bottom-[-36px] h-16 rounded-[50%] bg-vm-bg" /></div>
    </section>
  )
}
