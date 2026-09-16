"use client"

import { motion } from "framer-motion"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { DEMO_CONTENT } from "@/lib/demo-data"
import { MagneticButton } from "@/components/motion/MagneticButton"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { Spotlight } from "@/components/motion/Spotlight"

const ease = [0.22, 1, 0.36, 1] as const

export function Hero() {
  const reduced = useReducedMotion()

  return (
    <section className="relative min-h-[88vh] flex flex-col justify-end pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      {/* Atmosphere layers */}
      <div className="absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 vm-grid-bg opacity-60" />
        <div className="absolute top-[-10%] right-[-8%] w-[55vw] max-w-[640px] h-[55vw] max-h-[640px] rounded-full bg-vm-coral/[0.07] blur-[100px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[45vw] max-w-[480px] h-[45vw] max-h-[480px] rounded-full bg-vm-sand blur-[80px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-gradient-to-b from-transparent via-white/40 to-transparent blur-2xl" />
      </div>

      <Spotlight className="mx-auto w-full max-w-6xl px-4 sm:px-6" size={520} intensity={0.1}>
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-16 items-end">
          {/* Copy column — entrance choreography */}
          <div className="max-w-2xl">
            <motion.p
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05, ease }}
              className="vm-eyebrow mb-5"
            >
              Sites profissionais por segmento
            </motion.p>

            <motion.h1
              initial={reduced ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.12, ease }}
              className="vm-display text-[2.35rem] sm:text-5xl md:text-[3.4rem] lg:text-[3.65rem] text-vm-ink"
            >
              {DEMO_CONTENT.heroTitle}
            </motion.h1>

            <motion.p
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.28, ease }}
              className="mt-6 text-lg md:text-xl text-vm-muted leading-relaxed max-w-xl"
            >
              {DEMO_CONTENT.heroSubtitle}
            </motion.p>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.42, ease }}
              className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              <MagneticButton href="/#sites" variant="primary">
                Conheça nossos sites
                <ArrowRight size={16} />
              </MagneticButton>
              <MagneticButton href="/virelab" variant="secondary">
                Experimentar VireLab
                <ArrowUpRight size={16} />
              </MagneticButton>
            </motion.div>
          </div>

          {/* Visual column — asymmetric composition */}
          <motion.div
            initial={reduced ? false : { opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.25, ease }}
            className="relative hidden lg:block"
          >
            <div className="relative aspect-[4/5] max-h-[520px] rounded-[1.75rem] overflow-hidden border border-vm-border bg-vm-sand/60">
              {/* Abstract brand composition — not a stock photo */}
              <div className="absolute inset-0 flex flex-col justify-between p-7">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-vm-muted">
                    VireMarca · Core
                  </span>
                  <span className="h-2 w-2 rounded-full bg-vm-coral animate-pulse" />
                </div>

                <div className="space-y-4">
                  <div className="h-px w-full bg-vm-border" />
                  <p className="text-2xl font-semibold tracking-tight text-vm-ink leading-snug">
                    Design.
                    <br />
                    Performance.
                    <br />
                    <span className="text-vm-coral">Conversão.</span>
                  </p>
                  <div className="flex gap-2 pt-2">
                    {["Nicho", "Template", "Cliente"].map((label) => (
                      <span
                        key={label}
                        className="rounded-full border border-vm-border bg-white/80 px-3 py-1 text-[11px] font-medium text-vm-muted"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Soft coral accent shape */}
              <div
                className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full opacity-40"
                style={{
                  background:
                    "radial-gradient(circle, var(--color-vm-coral) 0%, transparent 70%)",
                }}
              />
            </div>

            {/* Floating meta card */}
            <motion.div
              initial={reduced ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.6, ease }}
              className="absolute -left-6 bottom-16 rounded-2xl border border-vm-border bg-white/95 backdrop-blur-sm px-4 py-3 shadow-lg shadow-black/[0.04]"
            >
              <p className="text-[10px] font-medium tracking-wider uppercase text-vm-muted mb-1">
                Modelo
              </p>
              <p className="text-sm font-semibold text-vm-ink">Core → Template → Cliente</p>
            </motion.div>
          </motion.div>
        </div>
      </Spotlight>

      {/* Scroll hint */}
      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-vm-muted">Scroll</span>
        <div className="h-8 w-px bg-gradient-to-b from-vm-coral/60 to-transparent" />
      </motion.div>
    </section>
  )
}
