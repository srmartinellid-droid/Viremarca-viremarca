"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { DEMO_CONTENT } from "@/lib/demo-data"
import { Reveal } from "@/components/motion/Reveal"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"

export function Process() {
  const [active, setActive] = useState(0)
  const reduced = useReducedMotion()
  const steps = DEMO_CONTENT.process

  return (
    <section id="como-fazemos" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 vm-grid-bg opacity-40" aria-hidden />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-2xl mb-16">
          <p className="vm-eyebrow mb-3">Método</p>
          <h2 className="vm-display text-3xl md:text-4xl lg:text-[2.75rem] text-vm-ink">
            Como trabalhamos
          </h2>
          <p className="mt-4 text-vm-muted leading-relaxed">
            Um processo claro, sem surpresas — da conversa inicial ao site no ar e evoluindo.
          </p>
        </Reveal>

        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 items-start">
          {/* Step selectors — morphing active state */}
          <div className="space-y-3">
            {steps.map((item, i) => {
              const isOpen = active === i
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setActive(i)}
                  onMouseEnter={() => !reduced && setActive(i)}
                  className={cn(
                    "w-full text-left rounded-2xl border p-5 md:p-6 transition-all duration-400",
                    isOpen
                      ? "border-vm-coral/40 bg-white shadow-[0_12px_40px_-16px_rgba(224,122,95,0.2)]"
                      : "border-vm-border bg-white/60 hover:border-vm-border hover:bg-white"
                  )}
                  aria-expanded={isOpen}
                >
                  <div className="flex items-baseline gap-4">
                    <span
                      className={cn(
                        "text-2xl font-semibold tracking-tight transition-colors duration-300",
                        isOpen ? "text-vm-coral" : "text-vm-border"
                      )}
                    >
                      {item.step}
                    </span>
                    <div className="flex-1">
                      <h3
                        className={cn(
                          "text-base md:text-lg font-semibold transition-colors duration-300",
                          isOpen ? "text-vm-ink" : "text-vm-muted"
                        )}
                      >
                        {item.title}
                      </h3>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.p
                            key="desc"
                            initial={reduced ? false : { height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={reduced ? undefined : { height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="mt-2 text-sm text-vm-muted leading-relaxed overflow-hidden"
                          >
                            {item.desc}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Sticky visual panel */}
          <div className="lg:sticky lg:top-28">
            <div className="relative rounded-3xl border border-vm-border bg-vm-charcoal overflow-hidden min-h-[320px] md:min-h-[400px] p-8 md:p-10 flex flex-col justify-between">
              <div className="absolute inset-0 opacity-30" aria-hidden>
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-vm-coral blur-[100px]" />
              </div>

              <div className="relative z-10">
                <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-white/40 mb-6">
                  Etapa {steps[active].step}
                </p>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={reduced ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0, y: -12 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-white leading-snug">
                      {steps[active].title}
                    </h3>
                    <p className="mt-4 text-white/60 leading-relaxed max-w-md">
                      {steps[active].desc}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Progress dots */}
              <div className="relative z-10 flex gap-2 mt-10">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActive(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-400",
                      i === active ? "w-8 bg-vm-coral" : "w-1.5 bg-white/25 hover:bg-white/40"
                    )}
                    aria-label={`Ir para etapa ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
