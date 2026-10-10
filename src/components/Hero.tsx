"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion as useFramerReducedMotion, useScroll, useTransform } from "framer-motion"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { WhatsAppIcon } from "@/components/WhatsAppIcon"
import { MagneticButton } from "@/components/motion/MagneticButton"
import { TitleBlock } from "@/components/TitleBlock"
import { TrackedAnchor } from "@/components/TrackedAnchor"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import type { PortfolioProject } from "@/types"
import type { PublicSiteContent } from "@/lib/site-content"
import { trackEvent } from "@/lib/track-event"

const ease = [0.22, 1, 0.36, 1] as const
const DECK_INTERVAL = 5500
const HERO_IMAGE_INTERVAL = 6500

type Props = { content: PublicSiteContent; featuredProjects: PortfolioProject[] }

export function Hero({ content, featuredProjects }: Props) {
  const reduced = useReducedMotion()
  const framerReduced = useFramerReducedMotion()
  const projects = useMemo(() => featuredProjects.length ? featuredProjects : [], [featuredProjects])
  const desktopImages = useMemo(() => content.heroBackgroundImages?.length ? content.heroBackgroundImages : [content.heroImage || cardsFallback(projects)], [content.heroBackgroundImages, content.heroImage, projects])
  const mobileImages = useMemo(() => content.heroMobileBackgroundImages?.length ? content.heroMobileBackgroundImages : desktopImages, [content.heroMobileBackgroundImages, desktopImages])
  const [backgroundIndex, setBackgroundIndex] = useState(0)
  const { scrollY } = useScroll()
  const baseScale = content.heroBackgroundScale / 100
  const bgY = useTransform(scrollY, [0, 700], [0, 72])
  const bgScale = useTransform(scrollY, [0, 700], [baseScale, baseScale + 0.055])
  const contentY = useTransform(scrollY, [0, 650], [0, -28])
  const heroStyle = content.titleStyles?.hero ?? { text: `${content.heroTitle} ${content.heroAccent}`, highlight: content.heroAccent, textColor: "#FFFFFF", highlightColor: "#E07A5F", highlightStyle: "color" as const, align: "left" as const }

  useEffect(() => {
    if (reduced || desktopImages.length < 2) return
    const timer = window.setInterval(() => setBackgroundIndex((current) => (current + 1) % desktopImages.length), HERO_IMAGE_INTERVAL)
    return () => window.clearInterval(timer)
  }, [desktopImages.length, reduced])

  useEffect(() => {
    setBackgroundIndex(0)
  }, [desktopImages.length, mobileImages.length])

  const deck = projects.slice(0, 3)
  const overlay = content.heroOverlayIntensity / 100
  const bgPosition = content.heroBackgroundPosition || "center center"
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
        <div className="w-full">
        <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
          <div className="relative z-40 max-w-3xl">
            <motion.p initial={reduced ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05, ease }} className="mb-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-vm-coral"><span className="h-px w-8 bg-vm-coral" />Estúdio de sites · Florianópolis, SC</motion.p>
            <motion.div initial={reduced ? false : { opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.12, ease }}>
              <TitleBlock style={heroStyle} size="display" as="h1" animated={false} highlightRule className="max-w-3xl !mx-0 !text-left" />
            </motion.div>
            <motion.p initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.28, ease }} className="mt-6 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">{content.heroSubtitle}</motion.p>
            <motion.div initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4, ease }} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"><TrackedAnchor href={`https://wa.me/${content.contact.whatsapp}?text=${encodeURIComponent("Olá! Quero criar um site com a VireMarca.")}`} target="_blank" rel="noopener noreferrer" eventName="contact_started" eventMetadata={{ location: "hero_whatsapp" }} eventStatus="production" contactContext="hero" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-vm-coral px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-vm-coral-deep"><WhatsAppIcon size={18} />Falar no WhatsApp</TrackedAnchor><MagneticButton href="/#diagnostico" variant="secondary" className="whitespace-nowrap">Diagnóstico gratuito do seu site<ArrowRight size={16} /></MagneticButton></motion.div>
          </div>

          <HeroDeck projects={deck} reduced={reduced} />
        </div>
            <motion.div initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.7 }} className="mt-12 flex w-full items-start gap-3 border-t border-white/10 pt-6 text-xs text-white/55"><ul className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4"><li><span className="block text-[13px] font-semibold text-white/85">Contato direto no WhatsApp</span><span className="mt-0.5 block text-xs text-white/50">Conte o seu caso e receba retorno</span></li><li><span className="block text-[13px] font-semibold text-white/85">Painel para você editar tudo</span><span className="mt-0.5 block text-xs text-white/50">Textos e imagens, sem depender de ninguém</span></li><li><span className="block text-[13px] font-semibold text-white/85">Banco de dados só seu</span><span className="mt-0.5 block text-xs text-white/50">Cada cliente tem o seu, isolado dos demais</span></li><li><span className="block text-[13px] font-semibold text-white/85">Diagnóstico técnico gratuito</span><span className="mt-0.5 block text-xs text-white/50">Nota por critério do seu site atual</span></li></ul></motion.div>
        </div>
      </motion.div>
    </section>
  )
}

function cardsFallback(projects: PortfolioProject[]) {
  return projects[0]?.thumbnail || "/portfolio/magia-glass.jpg"
}

function HeroDeck({ projects, reduced }: { projects: PortfolioProject[]; reduced: boolean }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = projects.length

  useEffect(() => {
    if (reduced || paused || count < 2) return
    const timer = window.setInterval(() => setActive((current) => (current + 1) % count), DECK_INTERVAL)
    return () => window.clearInterval(timer)
  }, [count, paused, reduced])

  if (!count) return null

  // Pilha: o card ativo fica na frente; os demais ficam atrás, deslocados, menores e mais apagados.
  const layer = (rel: number): { z: number; opacity: number; dim: number; transform: string; shadow: string } => {
    if (rel === 0) return { z: 30, opacity: 1, dim: 1, transform: "translate(0%, 15%) rotate(-1deg) scale(1)", shadow: "0 30px 60px rgba(0,0,0,0.55)" }
    if (rel === 1) return { z: 20, opacity: 1, dim: 0.62, transform: "translate(20%, 0%) rotate(3deg) scale(0.9)", shadow: "0 20px 40px rgba(0,0,0,0.4)" }
    if (rel === 2) return { z: 10, opacity: 1, dim: 0.42, transform: "translate(-7.5%, -2.5%) rotate(-3deg) scale(0.86)", shadow: "0 20px 40px rgba(0,0,0,0.35)" }
    return { z: 0, opacity: 0, dim: 0.3, transform: "translate(0%, 0%) scale(0.8)", shadow: "none" }
  }

  return (
    <div className="relative z-30 mx-auto w-full max-w-[560px] lg:mx-0 lg:justify-self-end" aria-label="Projetos da VireMarca" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="relative aspect-[4/3] w-full">
        {projects.map((project, index) => {
          const rel = (index - active + count) % count
          const l = layer(rel)
          const front = rel === 0
          const real = project.description.startsWith("Projeto real")
          return (
            <a
              key={project.id}
              href={`/portfolio/${project.slug}`}
              tabIndex={front ? 0 : -1}
              aria-hidden={rel > 2 ? true : undefined}
              onClick={(event) => {
                if (!front) { event.preventDefault(); setActive(index); return }
                void trackEvent("portfolio_view", { location: "hero", project: project.title }, "production")
              }}
              className="group absolute left-[4%] top-[4%] block w-[72%] overflow-hidden rounded-[14px] bg-vm-ink"
              style={{ zIndex: l.z, opacity: l.opacity, transform: l.transform, boxShadow: l.shadow, filter: `brightness(${l.dim})`, transition: reduced ? "none" : "transform 700ms ease, opacity 700ms ease, filter 700ms ease", pointerEvents: rel > 2 ? "none" : "auto" }}
            >
              <div className="flex h-7 items-center gap-1.5 bg-[#2A2D33] px-3">
                <span className="h-2 w-2 rounded-full bg-[#E5584B]" /><span className="h-2 w-2 rounded-full bg-[#E8B63B]" /><span className="h-2 w-2 rounded-full bg-[#4BB866]" />
                <span className="ml-2 flex h-[18px] flex-1 items-center truncate rounded-full bg-[#1B1D22] px-2.5 text-[10px] text-[#9CA1A8]">{project.title} · {real ? "projeto real" : "modelo · demonstração"}</span>
              </div>
              <div className="relative aspect-[16/10] overflow-hidden bg-black">
                <Image src={project.thumbnail || "/portfolio/magia-glass.jpg"} alt={project.title} fill sizes="(min-width: 1024px) 400px, 72vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className={`absolute inset-x-4 bottom-3 text-white transition-opacity duration-500 ${front ? "opacity-100" : "opacity-0"}`}><p className="text-[9px] uppercase tracking-[0.2em] text-white/65">{project.category}</p><p className="mt-0.5 text-lg font-semibold tracking-tight">{project.title}</p></div>
              </div>
            </a>
          )
        })}
      </div>
      {count > 1 && (
        <div className="mt-1 flex justify-center">
          {projects.map((project, index) => (
            <button key={project.id} type="button" onClick={() => setActive(index)} aria-label={`Mostrar ${project.title}`} aria-current={index === active ? "true" : undefined} className="flex h-11 w-11 items-center justify-center">
              <span className={`block h-2 rounded-full transition-all duration-300 ${index === active ? "w-[26px] bg-vm-coral" : "w-2 bg-[#4A4E55]"}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
