"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Reveal } from "@/components/motion/Reveal"
import { TitleBlock, type TitleStyle } from "@/components/TitleBlock"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import type { ProcessItem } from "@/lib/site-content"

export function Process({ items, titleStyle }: { items: ProcessItem[]; titleStyle?: TitleStyle }) {
  const [active, setActive] = useState(0)
  const reduced = useReducedMotion()
  const steps = items.length ? items : []
  const current = steps[Math.min(active, Math.max(steps.length - 1, 0))]
  if (!steps.length) return null
  const title = titleStyle || { text: "Como trabalhamos", highlight: "trabalhamos", textColor: "#FFFFFF", highlightColor: "#E07A5F", highlightStyle: "color" as const }
  return (
    <section id="como-fazemos" className="relative overflow-hidden bg-vm-ink py-20 text-white md:py-28">
      <div className="absolute inset-0 opacity-20" aria-hidden><div className="absolute inset-0 vm-grid-bg [filter:invert(1)]" /><div className="absolute -right-40 top-[-20%] h-[32rem] w-[32rem] rounded-full bg-vm-coral/25 blur-[110px]" /></div>
      <div className="absolute left-0 top-0 h-1 w-32 bg-vm-coral" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mb-11 max-w-2xl"><p className="vm-eyebrow mb-3">Método</p><TitleBlock style={title} className="!mx-0 !text-left" /><p className="mt-3 leading-relaxed text-white/60">Um processo claro, sem surpresas, da conversa inicial ao site no ar e evoluindo.</p></Reveal>
        <div className="grid items-start gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <div className="space-y-2.5">{steps.map((item, i) => { const isOpen = active === i; return <button key={`${item.step}-${item.title}`} type="button" onClick={() => setActive(i)} onMouseEnter={() => !reduced && setActive(i)} className={cn("group w-full rounded-2xl border p-4 text-left transition-all duration-300 md:p-5", isOpen ? "border-vm-coral/70 bg-white text-vm-ink shadow-[0_18px_55px_-22px_rgba(224,122,95,0.5)]" : "border-white/10 bg-white/[0.045] text-white hover:bg-white/[0.08]")} aria-expanded={isOpen}><div className="flex items-baseline gap-4"><span className={cn("text-xl font-semibold tracking-tight tabular-nums", isOpen ? "text-vm-coral" : "text-white/25")}>{item.step}</span><div className="flex-1"><h3 className={cn("text-base font-semibold md:text-lg", isOpen ? "text-vm-ink" : "text-white/80")}>{item.title}</h3><AnimatePresence initial={false}>{isOpen && <motion.p initial={reduced ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reduced ? undefined : { height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="mt-2 overflow-hidden text-sm leading-relaxed text-vm-muted">{item.desc}</motion.p>}</AnimatePresence></div><span className={cn("h-2 w-2 rounded-full transition-transform", isOpen ? "scale-125 bg-vm-coral" : "bg-white/20")} /></div></button> })}</div>
          <div className="lg:sticky lg:top-28"><div className="relative min-h-[320px] overflow-hidden rounded-[2rem] border border-white/10 bg-vm-charcoal shadow-[0_35px_100px_-50px_rgba(0,0,0,0.7)] md:min-h-[390px]">{current.image && <Image src={current.image} alt={current.title} fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover opacity-75" />}<div className="absolute inset-0 bg-gradient-to-t from-vm-ink via-vm-ink/35 to-vm-ink/10" /><div className="absolute inset-0 bg-vm-coral/10 mix-blend-screen" /><div className="relative z-10 flex min-h-[320px] flex-col justify-between p-7 md:min-h-[390px] md:p-9"><div className="flex items-start justify-between gap-5"><p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">Etapa {current.step}</p><span className="text-[5rem] font-semibold leading-none tracking-[-0.08em] text-white/10 md:text-[7rem]">{current.step}</span></div><AnimatePresence mode="wait"><motion.div key={active} initial={reduced ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -10 }} transition={{ duration: 0.35 }}><h3 className="text-2xl font-semibold leading-snug tracking-tight text-white md:text-3xl">{current.title}</h3><p className="mt-3 max-w-md leading-relaxed text-white/65">{current.desc}</p></motion.div></AnimatePresence><div className="mt-8 flex gap-2">{steps.map((_, i) => <button key={i} type="button" onClick={() => setActive(i)} className={cn("h-1.5 rounded-full transition-all", i === active ? "w-10 bg-vm-coral" : "w-1.5 bg-white/30 hover:bg-white/50")} aria-label={`Ir para etapa ${i + 1}`} />)}</div></div></div></div>
        </div>
      </div>
    </section>
  )
}
