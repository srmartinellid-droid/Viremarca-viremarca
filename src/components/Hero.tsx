"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion as useFramerReducedMotion, useScroll, useTransform } from "framer-motion"
import Image from "next/image"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { MagneticButton } from "@/components/motion/MagneticButton"
import { renderTitleParts } from "@/components/TitleBlock"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import type { PortfolioProject } from "@/types"
import type { PublicSiteContent } from "@/lib/site-content"

const ease = [0.22, 1, 0.36, 1] as const
const CARD_INTERVALS = [6500, 8000, 9100] as const
const HERO_IMAGE_INTERVAL = 6500

type Props = { content: PublicSiteContent; featuredProjects: PortfolioProject[] }

export function Hero({ content, featuredProjects }: Props) {
  const reduced = useReducedMotion()
  const framerReduced = useFramerReducedMotion()
  const projects = useMemo(() => featuredProjects.length ? featuredProjects : [], [featuredProjects])
  const [cardIndexes, setCardIndexes] = useState<number[]>(() => projects.length ? Array.from({ length: Math.min(3, projects.length) }, (_, index) => index) : [])
  const desktopImages = useMemo(() => content.heroBackgroundImages?.length ? content.heroBackgroundImages : [content.heroImage || cardsFallback(projects)], [content.heroBackgroundImages, content.heroImage, projects])
  const mobileImages = useMemo(() => content.heroMobileBackgroundImages?.length ? content.heroMobileBackgroundImages : desktopImages, [content.heroMobileBackgroundImages, desktopImages])
  const [backgroundIndex, setBackgroundIndex] = useState(0)
  const { scrollY } = useScroll()
  const baseScale = content.heroBackgroundScale / 100
  const bgY = useTransform(scrollY, [0, 700], [0, 72])
  const bgScale = useTransform(scrollY, [0, 700], [baseScale, baseScale + 0.055])
  const contentY = useTransform(scrollY, [0, 650], [0, -28])
  const heroStyle = content.titleStyles?.hero ?? { text: `${content.heroTitle} ${content.heroAccent}`, highlight: content.heroAccent, textColor: "#FFFFFF", highlightColor: "#E07A5F", highlightStyle: "color" as const, align: "left" as const }
  const heroParts = renderTitleParts(heroStyle)
  const heroHighlightClass = heroStyle.highlightStyle === "italic" ? "italic" : heroStyle.highlightStyle === "underline" ? "underline decoration-[0.08em] underline-offset-[0.14em]" : heroStyle.highlightStyle === "marker" ? "rounded-[0.12em] px-[0.08em]" : ""

  useEffect(() => {
    if (!projects.length) return setCardIndexes([])
    const cardCount = Math.min(3, projects.length)
    setCardIndexes((current) => current.length === cardCount && current.every((index) => index >= 0 && index < projects.length) ? current : Array.from({ length: cardCount }, (_, index) => index))
  }, [projects.length])

  useEffect(() => {
    if (reduced || desktopImages.length < 2) return
    const timer = window.setInterval(() => setBackgroundIndex((current) => (current + 1) % desktopImages.length), HERO_IMAGE_INTERVAL)
    return () => window.clearInterval(timer)
  }, [desktopImages.length, reduced])

  useEffect(() => {
    setBackgroundIndex(0)
  }, [desktopImages.length, mobileImages.length])

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
  const overlay = content.heroOverlayIntensity / 100
  const bgPosition = content.heroBackgroundPosition || "center center"
  const motionAmount = content.heroCardsMotion / 100
  const desktopImage = desktopImages[backgroundIndex % desktopImages.length] || "/portfolio/magia-glass.jpg"
  const mobileImage = mobileImages[backgroundIndex % mobileImages.length] || desktopImage

  return (
    <section className="relative min-h-[92svh] overflow-hidden bg-vm-ink text-white">
      <motion.div className="absolute inset-[-5%]" style={{ y: framerReduced || reduced ? 0 : bgY, scale: framerReduced || reduced ? baseScale : bgScale }} aria-hidden>
        <AnimatePresence initial={false} mode="sync">
          <motion.div key={desktopImage} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduced ? undefined : { opacity: 0 }} transition={{ duration: 1.25, ease }} className="absolute inset-0">
            <picture className="absolute inset-0 block">
              <source media="(max-width: 767px)" srcSet={mobileImage} />
              <Image src={desktopImage} alt="" fill priority sizes="100vw" className="object-cover" style={{ objectPosition: bgPosition }} />
            </picture>
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-vm-ink" style={{ opacity: 0.3 + overlay * 0.44 }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_42%,rgba(224,122,95,0.32),transparent_29%),linear-gradient(90deg,rgba(20,20,20,0.96)_0%,rgba(20,20,20,0.72)_34%,rgba(20,20,20,0.22)_70%,rgba(20,20,20,0.5)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-vm-ink via-transparent to-vm-ink/35" />
        <div className="absolute inset-0 vm-noise opacity-60" />
      </motion.div>

      <div className="absolute inset-0 opacity-[0.14]" aria-hidden><div className="absolute inset-0 vm-grid-bg [filter:invert(1)]" /></div>

      <motion.div style={{ y: framerReduced || reduced ? 0 : contentY }} className="relative z-10 mx-auto flex min-h-[92svh] max-w-[1400px] items-center px-5 pb-16 pt-28 sm:px-8 lg:px-12">
        <div className="grid w-full gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-5 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="relative z-40 max-w-3xl">
            <motion.p initial={reduced ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05, ease }} className="mb-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-vm-coral"><span className="h-px w-8 bg-vm-coral" />Sites profissionais por segmento</motion.p>
            <motion.h1 initial={reduced ? false : { opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.12, ease }} className="vm-display max-w-3xl text-pretty text-[2.55rem] leading-[1.01] tracking-[-0.045em] sm:text-5xl md:text-[3.35rem] lg:text-[3.65rem] xl:text-[3.9rem]" style={{ color: heroStyle.textColor || "#FFFFFF" }}>
              {heroParts.before}{heroParts.highlighted && <span className={`relative inline-block font-semibold drop-shadow-[0_10px_32px_rgba(224,122,95,0.18)] ${heroHighlightClass}`} style={{ color: heroStyle.highlightColor || heroStyle.textColor || "#FFFFFF", backgroundColor: heroStyle.highlightStyle === "marker" ? `${heroStyle.highlightColor || "#E07A5F"}20` : undefined }}>{heroParts.highlighted}<motion.span initial={reduced ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.85, delay: 0.68, ease }} className="absolute left-0 right-[18%] -bottom-2 h-1 origin-left rounded-full bg-vm-coral/70" /></span>}{heroParts.after}
            </motion.h1>
            <motion.p initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.28, ease }} className="mt-6 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">{content.heroSubtitle}</motion.p>
            <motion.div initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4, ease }} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"><MagneticButton href="/#sites" variant="primary">Conheça nossos sites<ArrowRight size={16} /></MagneticButton><MagneticButton href="/virelab" variant="secondary">Experimentar VireLab<ArrowUpRight size={16} /></MagneticButton></motion.div>
            <motion.div initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.7 }} className="mt-8 flex max-w-xl items-center gap-3 text-xs text-white/45"><span className="h-px w-10 bg-white/25" />Uma base. Muitos segmentos. Uma identidade para cada marca.</motion.div>
          </div>

          <div className="relative hidden min-h-[600px] lg:block" aria-label="Projetos em destaque">
            <div className="pointer-events-none absolute right-[8%] top-[7%] h-2 w-2 rounded-full bg-vm-coral shadow-[0_0_28px_rgba(224,122,95,0.9)]" aria-hidden />
            {cards.map((project, index) => project && <HeroCard key={`hero-card-${index}`} project={project} index={index} reduced={reduced} motionAmount={motionAmount} />)}
          </div>

          <div className="-mx-5 flex flex-col gap-5 px-5 pb-4 lg:hidden" aria-label="Projetos em destaque">
            {cards.map((project, index) => project && <HeroCard key={`hero-mobile-card-${index}`} project={project} index={index} reduced={reduced} motionAmount={motionAmount} mobile />)}
          </div>
        </div>
      </motion.div>
    </section>
  )
}

function cardsFallback(projects: PortfolioProject[]) {
  return projects[0]?.thumbnail || "/portfolio/magia-glass.jpg"
}

function HeroCard({ project, index, reduced, motionAmount, mobile = false }: { project: PortfolioProject; index: number; reduced: boolean; motionAmount: number; mobile?: boolean }) {
  const [displayedProject, setDisplayedProject] = useState(project)
  useEffect(() => {
    if (displayedProject.thumbnail === project.thumbnail) return
    setDisplayedProject(project)
  }, [project, displayedProject.thumbnail])
  const image = displayedProject.thumbnail || "/portfolio/magia-glass.jpg"

  if (mobile) return <motion.a href={`/portfolio/${project.slug}`} initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1, ease }} className="group relative w-full overflow-hidden rounded-[1.25rem] border border-white/70 bg-white shadow-[0_28px_70px_-35px_rgba(0,0,0,0.8)]"><div className="flex h-7 items-center gap-1.5 border-b border-black/10 bg-white px-3"><span className="h-1.5 w-1.5 rounded-full bg-vm-coral/75" /><span className="h-1.5 w-1.5 rounded-full bg-black/10" /><span className="h-1.5 w-1.5 rounded-full bg-black/10" /></div><div className="relative aspect-[16/10] overflow-hidden bg-black"><AnimatePresence initial={false} mode="sync"><motion.div key={image} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduced ? undefined : { opacity: 0 }} transition={{ duration: 1.15, ease }} className="absolute inset-0 z-10"><Image src={image} alt={displayedProject.title} fill sizes="(max-width: 767px) 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" /></motion.div></AnimatePresence><div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" /><div className="absolute bottom-4 left-4 text-white"><p className="text-[9px] uppercase tracking-[0.2em] text-white/60">{displayedProject.category}</p><p className="mt-1 text-lg font-semibold">{displayedProject.title}</p></div></div></motion.a>

  const positions = [
    "absolute right-[8%] top-[8%] z-30 w-[68%]",
    "absolute right-[-1%] top-[42%] z-40 w-[46%]",
    "absolute left-[8%] bottom-[5%] z-50 w-[47%]",
  ]

  return <motion.a href={`/portfolio/${project.slug}`} initial={reduced ? false : { opacity: 0, y: 32, scale: 0.94, rotate: index === 1 ? 2.4 : index === 2 ? -2.2 : -1.2 }} animate={reduced ? undefined : { opacity: 1, y: [0, (index === 1 ? 9 : -7) * motionAmount, 0], rotate: [index === 1 ? 2.4 : index === 2 ? -2.2 : -1.2, index === 1 ? 1.7 : index === 2 ? -1.5 : -0.5, index === 1 ? 2.4 : index === 2 ? -2.2 : -1.2], scale: 1 }} transition={{ opacity: { duration: 0.7, delay: 0.28 + index * 0.12, ease }, scale: { duration: 0.7, delay: 0.28 + index * 0.12, ease }, y: { duration: 7 + index, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 }, rotate: { duration: 7 + index, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 } }} className={`${positions[index] ?? positions[0]} group overflow-hidden rounded-[1.55rem] border border-white/75 bg-white shadow-[0_40px_100px_-45px_rgba(0,0,0,0.88)] transition-shadow duration-500 hover:shadow-[0_48px_110px_-42px_rgba(0,0,0,0.95)]`}>
    <div className="flex h-8 items-center gap-1.5 border-b border-black/10 bg-white px-4"><span className="h-2 w-2 rounded-full bg-vm-coral/75" /><span className="h-2 w-2 rounded-full bg-black/10" /><span className="h-2 w-2 rounded-full bg-black/10" /><span className="ml-auto text-[8px] font-medium uppercase tracking-[0.18em] text-black/30">VireMarca</span></div>
    <div className="relative aspect-[16/10] overflow-hidden bg-black"><AnimatePresence initial={false} mode="sync"><motion.div key={image} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduced ? undefined : { opacity: 0 }} transition={{ duration: 1.15, ease }} className="absolute inset-0 z-10"><Image src={image} alt={displayedProject.title} fill sizes="(min-width: 1024px) 48vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" /></motion.div></AnimatePresence><div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" /><div className="absolute inset-x-5 bottom-5 text-white"><p className="text-[9px] uppercase tracking-[0.22em] text-white/60">{displayedProject.category}</p><p className="mt-1 text-xl font-semibold tracking-tight">{displayedProject.title}</p></div></div>
  </motion.a>
}