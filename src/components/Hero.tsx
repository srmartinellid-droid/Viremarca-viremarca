"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { MagneticButton } from "@/components/motion/MagneticButton"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { Spotlight } from "@/components/motion/Spotlight"
import type { PortfolioProject } from "@/types"
import type { PublicSiteContent } from "@/lib/site-content"

const ease = [0.22, 1, 0.36, 1] as const
const CARD_INTERVALS = [6500, 8000, 9100] as const

type Props = { content: PublicSiteContent; featuredProjects: PortfolioProject[] }

export function Hero({ content, featuredProjects }: Props) {
  const reduced = useReducedMotion()
  const projects = useMemo(() => featuredProjects.length ? featuredProjects : [], [featuredProjects])
  const [cardIndexes, setCardIndexes] = useState<number[]>(() =>
    projects.length ? Array.from({ length: Math.min(3, projects.length) }, (_, index) => index) : [],
  )

  useEffect(() => {
    if (!projects.length) {
      setCardIndexes([])
      return
    }

    const cardCount = Math.min(3, projects.length)
    setCardIndexes((current) => {
      if (current.length === cardCount && current.every((index) => index >= 0 && index < projects.length)) return current
      return Array.from({ length: cardCount }, (_, index) => index)
    })
  }, [projects.length])

  useEffect(() => {
    if (reduced || projects.length < 2 || cardIndexes.length < 3) return

    const timers = CARD_INTERVALS.map((interval, cardIndex) =>
      window.setInterval(() => {
        setCardIndexes((current) => {
          if (current.length < 3) return current

          const occupied = new Set(current.filter((_, index) => index !== cardIndex))
          const currentIndex = current[cardIndex]

          for (let step = 1; step <= projects.length; step += 1) {
            const nextIndex = (currentIndex + step) % projects.length
            if (!occupied.has(nextIndex)) {
              const next = [...current]
              next[cardIndex] = nextIndex
              return next
            }
          }

          return current
        })
      }, interval),
    )

    return () => timers.forEach((timer) => window.clearInterval(timer))
  }, [cardIndexes.length, projects.length, reduced])

  const cards = cardIndexes.map((projectIndex) => projects[projectIndex]).filter(Boolean)
  const intensity = content.heroAccentIntensity / 100

  return (
    <section className="relative min-h-[84vh] flex items-center pt-28 pb-12 md:pt-32 md:pb-16 overflow-hidden">
      <div className="absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 vm-grid-bg opacity-35" />
        <div className="absolute top-[-12%] right-[-8%] w-[48vw] h-[48vw] max-w-[680px] max-h-[680px] rounded-full bg-vm-coral/[0.08] blur-[110px]" />
        <div className="absolute bottom-[-20%] left-[-8%] w-[42vw] h-[42vw] max-w-[560px] max-h-[560px] rounded-full bg-vm-sand blur-[90px]" />
      </div>

      <Spotlight className="mx-auto w-full max-w-7xl px-5 sm:px-7 lg:px-10" size={620} intensity={0.08}>
        <div className="grid lg:grid-cols-[0.86fr_1.14fr] gap-10 xl:gap-14 items-center">
          <div className="max-w-2xl relative z-10">
            <motion.p initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05, ease }} className="vm-eyebrow mb-5">
              Sites profissionais por segmento
            </motion.p>

            <motion.h1 initial={reduced ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.12, ease }} className="vm-display text-[2.85rem] sm:text-5xl md:text-[3.7rem] lg:text-[4rem] xl:text-[4.25rem] leading-[1.01] tracking-[-0.045em] text-vm-ink">
              {content.heroTitle}{" "}
              <span style={{ color: `color-mix(in srgb, var(--color-vm-coral) ${Math.round(intensity * 100)}%, var(--color-vm-ink))` }}>{content.heroAccent}</span>
            </motion.h1>

            <motion.p initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25, ease }} className="mt-6 text-base md:text-lg text-vm-muted leading-relaxed max-w-xl">
              {content.heroSubtitle}
            </motion.p>

            <motion.div initial={reduced ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.38, ease }} className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <MagneticButton href="/#sites" variant="primary">Conheça nossos sites<ArrowRight size={16} /></MagneticButton>
              <MagneticButton href="/virelab" variant="secondary">Experimentar VireLab<ArrowUpRight size={16} /></MagneticButton>
            </motion.div>

            <motion.div initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.55, ease }} className="mt-8 flex items-center gap-4 text-xs text-vm-muted">
              <span className="h-px w-10 bg-vm-coral" />
              <span>Uma base. Muitos segmentos. Uma identidade para cada marca.</span>
            </motion.div>
          </div>

          <motion.div initial={reduced ? false : { opacity: 0, x: 30, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.16, ease }} className="relative min-h-[430px] sm:min-h-[500px] lg:min-h-[540px]">
            <div className="absolute inset-0 rounded-[2.25rem] bg-vm-ink/[0.018] border border-vm-border/70" />

            {cards.map((project, index) => project && (
              <motion.a
                key={`hero-card-${index}`}
                href={`/portfolio/${project.slug}`}
                animate={reduced ? undefined : { y: [0, index === 1 ? 9 : -7, 0], rotate: [0, index === 1 ? -0.35 : 0.25, 0] }}
                transition={{ duration: 7 + index, repeat: Infinity, ease: "easeInOut", delay: index * 0.35 }}
                className={index === 0
                  ? "absolute top-[5%] left-[2%] w-[77%] overflow-hidden rounded-[1.45rem] border border-white bg-white shadow-[0_35px_90px_-35px_rgba(0,0,0,0.35)]"
                  : index === 1
                    ? "absolute right-[1%] top-[24%] w-[51%] overflow-hidden rounded-[1.35rem] border border-white bg-white shadow-[0_30px_80px_-35px_rgba(0,0,0,0.4)]"
                    : "absolute left-[6%] bottom-[4%] w-[48%] overflow-hidden rounded-[1.25rem] border border-white bg-white shadow-[0_25px_70px_-30px_rgba(0,0,0,0.35)]"
                }
              >
                <div className="flex h-8 items-center gap-1.5 border-b border-vm-border bg-white px-4"><span className="h-2 w-2 rounded-full bg-vm-coral/70" /><span className="h-2 w-2 rounded-full bg-vm-border" /><span className="h-2 w-2 rounded-full bg-vm-border" /></div>
                <div className="relative aspect-[16/10] overflow-hidden bg-vm-sand">
                  <AnimatePresence initial={false} mode="sync">
                    <motion.div
                      key={project.id}
                      initial={reduced ? false : { opacity: 0, scale: 1.035, x: 18 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={reduced ? undefined : { opacity: 0, scale: 0.985, x: -18 }}
                      transition={{ duration: 0.8 + index * 0.18, delay: index * 0.14, ease }}
                      className="absolute inset-0"
                    >
                      <Image src={project.thumbnail || "/portfolio/magia-glass.jpg"} alt={project.title} fill sizes="(max-width: 1024px) 55vw, 520px" className="object-cover" priority={index === 0} />
                      <div className="absolute inset-0 bg-gradient-to-t from-vm-ink/60 via-transparent to-transparent" />
                      <motion.div
                        initial={reduced ? false : { opacity: 0, y: index === 1 ? 10 : 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 + index * 0.12, delay: 0.12 + index * 0.12, ease }}
                        className="absolute left-4 bottom-4 text-white"
                      >
                        <p className="text-[9px] uppercase tracking-[0.18em] text-white/70">{project.category}</p>
                        <p className="mt-1 text-lg font-semibold tracking-tight">{project.title}</p>
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </Spotlight>
    </section>
  )
}
