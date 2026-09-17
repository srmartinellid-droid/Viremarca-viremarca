"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion, useReducedMotion as useFramerReducedMotion, useScroll, useTransform } from "framer-motion"
import Image from "next/image"
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react"
import { MagneticButton } from "@/components/motion/MagneticButton"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import type { PortfolioProject } from "@/types"
import type { PublicSiteContent } from "@/lib/site-content"

const ease = [0.22, 1, 0.36, 1] as const
const CARD_INTERVALS = [6500, 8000, 9100] as const

type Props = { content: PublicSiteContent; featuredProjects: PortfolioProject[] }

export function Hero({ content, featuredProjects }: Props) {
  const reduced = useReducedMotion()
  const framerReduced = useFramerReducedMotion()
  const projects = useMemo(() => featuredProjects.length ? featuredProjects : [], [featuredProjects])
  const [cardIndexes, setCardIndexes] = useState<number[]>(() => projects.length ? Array.from({ length: Math.min(3, projects.length) }, (_, index) => index) : [])
  const { scrollY } = useScroll()
  const bgY = useTransform(scrollY, [0, 700], [0, 70])
  const bgScale = useTransform(scrollY, [0, 700], [1.03, 1.09])
  const contentY = useTransform(scrollY, [0, 650], [0, -34])

  useEffect(() => {
    if (!projects.length) return setCardIndexes([])
    const cardCount = Math.min(3, projects.length)
    setCardIndexes((current) => current.length === cardCount && current.every((index) => index >= 0 && index < projects.length) ? current : Array.from({ length: cardCount }, (_, index) => index))
  }, [projects.length])

  useEffect(() => {
    if (reduced || projects.length < 2 || cardIndexes.length < 3) return
    const timers = CARD_INTERVALS.map((interval, cardIndex) => window.setInterval(() => {
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
    }, interval))
    return () => timers.forEach((timer) => window.clearInterval(timer))
  }, [cardIndexes.length, projects.length, reduced])

  const cards = cardIndexes.map((projectIndex) => projects[projectIndex]).filter(Boolean)
  const intensity = content.heroAccentIntensity / 100
  const overlay = content.heroOverlayIntensity / 100
  const heroImage = content.heroImage || cards[0]?.thumbnail || "/portfolio/magia-glass.jpg"
  const heroMobileImage = content.heroMobileImage || heroImage
  const bgPosition = content.heroBackgroundPosition || "center center"
  const motionAmount = content.heroCardsMotion / 100

  return (
    <section className="relative min-h-[92svh] overflow-hidden bg-vm-ink text-white">
      <motion.div className="absolute inset-0" style={{ y: framerReduced || reduced ? 0 : bgY, scale: framerReduced || reduced ? 1.03 : bgScale }} aria-hidden>
        <picture className="absolute inset-0 block">
          <source media="(max-width: 767px)" srcSet={heroMobileImage} />
          <Image src={heroImage} alt="" fill priority sizes="100vw" className="object-cover" style={{ objectPosition: bgPosition }} />
        </picture>
        <div className="absolute inset-0 bg-vm-ink/60" style={{ opacity: 0.34 + overlay * 0.4 }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_42%,rgba(224,122,95,0.28),transparent_30%),linear-gradient(90deg,rgba(26,26,26,0.94)_0%,rgba(26,26,26,0.68)_38%,rgba(26,26,26,0.18)_72%,rgba(26,26,26,0.5)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-vm-ink via-transparent to-vm-ink/35" />
        <div className="absolute inset-0 vm-noise opacity-60" />
      </motion.div>

      <div className="absolute inset-0 opacity-20" aria-hidden>
        <div className="absolute inset-0 vm-grid-bg [filter:invert(1)]" />
      </div>

      <motion.div style={{ y: framerReduced || reduced ? 0 : contentY }} className="relative z-10 mx-auto flex min-h-[92svh] max-w-[1400px] items-center px-5 pb-20 pt-32 sm:px-8 lg:px-12">
        <div className="grid w-full gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-8 xl:grid-cols-[0.86fr_1.14fr]">
          <div className="relative z-20 max-w-3xl">
            <motion.p initial={reduced ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05, ease }} className="mb-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-vm-coral">
              <span className="h-px w-8 bg-vm-coral" />Sites profissionais por segmento
            </motion.p>
            <motion.h1 initial={reduced ? false : { opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.12, ease }} className="vm-display max-w-3xl text-[3.15rem] leading-[0.94] tracking-[-0.055em] text-white sm:text-6xl md:text-[4.8rem] lg:text-[4.8rem] xl:text-[5.65rem]">
              {content.heroTitle}{" "}
              <span className="relative inline-block" style={{ color: `color-mix(in srgb, var(--color-vm-coral) ${Math.round(intensity * 100)}%, white)` }}>
                {content.heroAccent}
                <motion.span initial={reduced ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.9, delay: 0.75, ease }} className="absolute left-0 right-[14%] -bottom-3 h-1 origin-left rounded-full bg-vm-coral/70" />
              </span>
            </motion.h1>
            <motion.p initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.28, ease }} className="mt-7 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
              {content.heroSubtitle}
            </motion.p>
            <motion.div initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4, ease }} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <MagneticButton href="/#sites" variant="primary">Conheça nossos sites<ArrowRight size={16} /></MagneticButton>
              <MagneticButton href="/virelab" variant="secondary">Experimentar VireLab<ArrowUpRight size={16} /></MagneticButton>
            </motion.div>
            <motion.div initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.7 }} className="mt-8 flex max-w-xl items-center gap-3 text-xs text-white/45">
              <span className="h-px w-10 bg-white/25" />
              Uma base. Muitos segmentos. Uma identidade para cada marca.
            </motion.div>
          </div>

          <div className="relative hidden min-h-[560px] lg:block" aria-label="Projetos em destaque">
            <motion.div initial={reduced ? false : { opacity: 0, scale: 0.96, x: 28 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.18, ease }} className="absolute inset-0">
              <div className="absolute right-[2%] top-[3%] h-[88%] w-[74%] rounded-[2.2rem] border border-white/20 bg-white/[0.06] shadow-[0_50px_140px_-60px_rgba(0,0,0,0.8)] backdrop-blur-[2px]" />
            </motion.div>

            {cards.map((project, index) => project && (
              <motion.a
                key={`hero-card-${index}`}
                href={`/portfolio/${project.slug}`}
                initial={reduced ? false : { opacity: 0, y: 30, scale: 0.94, rotate: index === 1 ? 2 : index === 2 ? -2 : -1 }}
                animate={reduced ? undefined : { opacity: 1, y: [0, (index === 1 ? 10 : -7) * motionAmount, 0], rotate: [index === 1 ? 2 : index === 2 ? -2 : -1, index === 1 ? 1.4 : index === 2 ? -1.4 : -0.4, index === 1 ? 2 : index === 2 ? -2 : -1], scale: 1 }}
                transition={{ opacity: { duration: 0.7, delay: 0.28 + index * 0.12, ease }, scale: { duration: 0.7, delay: 0.28 + index * 0.12, ease }, y: { duration: 7 + index, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 }, rotate: { duration: 7 + index, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 } }}
                className={cnCard(index)}
              >
                <div className="flex h-8 items-center gap-1.5 border-b border-black/10 bg-white px-4"><span className="h-2 w-2 rounded-full bg-vm-coral/75" /><span className="h-2 w-2 rounded-full bg-black/10" /><span className="h-2 w-2 rounded-full bg-black/10" /><span className="ml-auto text-[8px] font-medium uppercase tracking-[0.18em] text-black/30">VireMarca</span></div>
                <div className="relative aspect-[16/10] overflow-hidden bg-vm-sand">
                  <AnimatePresence initial={false} mode="sync">
                    <motion.div key={project.id} initial={reduced ? false : { opacity: 0, scale: 1.04, x: 18 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={reduced ? undefined : { opacity: 0, scale: 0.985, x: -18 }} transition={{ duration: 0.75 + index * 0.16, delay: index * 0.12, ease }} className="absolute inset-0">
                      <Image src={project.thumbnail || "/portfolio/magia-glass.jpg"} alt={project.title} fill sizes="(max-width: 1024px) 45vw, 520px" className="object-cover" priority={index === 0} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 text-white">
                        <p className="text-[9px] uppercase tracking-[0.2em] text-white/60">{project.category}</p>
                        <p className="mt-1 text-lg font-semibold tracking-tight">{project.title}</p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-vm-ink/55 backdrop-blur-xl" aria-hidden>
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40 sm:px-8 lg:px-12">
          <span>Design · Performance · Conversão</span>
          <span className="hidden sm:inline-flex items-center gap-2"><ArrowDown size={13} /> Role para explorar</span>
          <span>VireMarca®</span>
        </div>
      </div>
    </section>
  )
}

function cnCard(index: number) {
  return index === 0
    ? "absolute right-[9%] top-[8%] z-10 w-[70%] overflow-hidden rounded-[1.55rem] border border-white/70 bg-white shadow-[0_40px_100px_-45px_rgba(0,0,0,0.8)]"
    : index === 1
      ? "absolute right-[-1%] top-[37%] z-20 w-[49%] overflow-hidden rounded-[1.35rem] border border-white/70 bg-white shadow-[0_35px_90px_-45px_rgba(0,0,0,0.8)]"
      : "absolute left-[9%] bottom-[4%] z-30 w-[48%] overflow-hidden rounded-[1.3rem] border border-white/70 bg-white shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)]"
}
