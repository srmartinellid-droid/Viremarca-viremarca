"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { DEMO_CONTENT } from "@/lib/demo-data"
import { MagneticButton } from "@/components/motion/MagneticButton"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { Spotlight } from "@/components/motion/Spotlight"

const ease = [0.22, 1, 0.36, 1] as const

export function Hero() {
  const reduced = useReducedMotion()

  return (
    <section className="relative min-h-[92vh] flex items-center pt-32 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      <div className="absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 vm-grid-bg opacity-45" />
        <div className="absolute top-[-12%] right-[-8%] w-[55vw] h-[55vw] max-w-[720px] max-h-[720px] rounded-full bg-vm-coral/[0.09] blur-[110px]" />
        <div className="absolute bottom-[-18%] left-[-8%] w-[48vw] h-[48vw] max-w-[600px] max-h-[600px] rounded-full bg-vm-sand blur-[90px]" />
      </div>

      <Spotlight className="mx-auto w-full max-w-7xl px-5 sm:px-7 lg:px-10" size={620} intensity={0.08}>
        <div className="grid lg:grid-cols-[0.88fr_1.12fr] gap-12 xl:gap-20 items-center">
          <div className="max-w-2xl relative z-10">
            <motion.p
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05, ease }}
              className="vm-eyebrow mb-6"
            >
              Sites profissionais por segmento
            </motion.p>

            <motion.h1
              initial={reduced ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.12, ease }}
              className="vm-display text-[3rem] sm:text-6xl md:text-[4.35rem] lg:text-[4.6rem] xl:text-[5rem] leading-[0.98] tracking-[-0.045em] text-vm-ink"
            >
              {DEMO_CONTENT.heroTitle}
            </motion.h1>

            <motion.p
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.28, ease }}
              className="mt-7 text-lg md:text-xl text-vm-muted leading-relaxed max-w-xl"
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

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.62, ease }}
              className="mt-12 flex items-center gap-4 text-xs text-vm-muted"
            >
              <span className="h-px w-10 bg-vm-coral" />
              <span>Uma base. Muitos segmentos. Uma identidade para cada marca.</span>
            </motion.div>
          </div>

          <motion.div
            initial={reduced ? false : { opacity: 0, x: 36, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease }}
            className="relative min-h-[470px] sm:min-h-[560px] lg:min-h-[610px]"
          >
            <div className="absolute inset-0 rounded-[2.5rem] bg-vm-ink/[0.025] border border-vm-border/80" />

            <motion.div
              animate={reduced ? undefined : { y: [0, -8, 0], rotate: [0, 0.25, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[6%] left-[3%] w-[78%] overflow-hidden rounded-[1.5rem] border border-white/80 bg-white shadow-[0_35px_90px_-35px_rgba(0,0,0,0.35)]"
            >
              <div className="flex h-9 items-center gap-1.5 border-b border-vm-border bg-white px-4">
                <span className="h-2 w-2 rounded-full bg-vm-coral/70" />
                <span className="h-2 w-2 rounded-full bg-vm-border" />
                <span className="h-2 w-2 rounded-full bg-vm-border" />
                <span className="ml-3 h-2 w-24 rounded-full bg-vm-sand" />
              </div>
              <div className="relative aspect-[16/10] overflow-hidden bg-vm-sand">
                <Image src="/portfolio/magia-glass.jpg" alt="Projeto Magia Glass" fill sizes="(max-width: 1024px) 75vw, 560px" className="object-cover" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-vm-ink/55 via-transparent to-transparent" />
                <div className="absolute left-5 bottom-5 text-white">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/70">Serviços · Vidraçaria</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight">Magia Glass</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={reduced ? undefined : { y: [0, 10, 0], rotate: [0, -0.4, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              className="absolute right-[2%] top-[25%] w-[52%] overflow-hidden rounded-[1.35rem] border border-white bg-white shadow-[0_30px_80px_-35px_rgba(0,0,0,0.4)]"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-vm-sand">
                <Image src="/portfolio/odonto.jpg" alt="Projeto Clínica Horizonte" fill sizes="(max-width: 1024px) 45vw, 380px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-vm-ink/55 via-transparent to-transparent" />
                <div className="absolute left-4 bottom-4 text-white">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-white/70">Odontologia</p>
                  <p className="mt-1 text-lg font-semibold">Clínica Horizonte</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={reduced ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
              className="absolute left-[7%] bottom-[5%] w-[48%] overflow-hidden rounded-[1.25rem] border border-white bg-white shadow-[0_25px_70px_-30px_rgba(0,0,0,0.35)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-vm-sand">
                <Image src="/portfolio/advocacia.jpg" alt="Projeto Lima & Kowalski Advocacia" fill sizes="(max-width: 1024px) 45vw, 350px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-vm-ink/60 via-transparent to-transparent" />
                <div className="absolute left-4 bottom-4 text-white">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-white/70">Advocacia</p>
                  <p className="mt-1 text-base font-semibold">Lima &amp; Kowalski</p>
                </div>
              </div>
            </motion.div>

            <div className="absolute right-[7%] bottom-[7%] rounded-2xl border border-vm-border bg-white/92 backdrop-blur-xl px-4 py-3 shadow-xl shadow-black/[0.06]">
              <p className="text-[9px] uppercase tracking-[0.18em] text-vm-muted">Sistema VireMarca</p>
              <p className="mt-1 text-sm font-semibold text-vm-ink">Nicho → Design → Conversão</p>
            </div>
          </motion.div>
        </div>
      </Spotlight>

      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.15, duration: 0.6 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-vm-muted">Scroll</span>
        <div className="h-8 w-px bg-gradient-to-b from-vm-coral/60 to-transparent" />
      </motion.div>
    </section>
  )
}
