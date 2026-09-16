"use client"

import { useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Check, ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import {
  type VireLabPreferences,
  DEFAULT_PREFS,
  ATMOSPHERES,
  MOTIONS,
  CARD_STYLES,
  IMAGE_TREATMENTS,
  NAV_STYLES,
  TYPOGRAPHY_STYLES,
  INTERACTIONS,
  formatBriefing,
  type Atmosphere,
  type MotionLevel,
  type CardStyle,
  type ImageTreatment,
  type NavStyle,
  type TypographyStyle,
  type InteractionStyle,
} from "@/lib/virelab-config"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"

type SectionKey =
  | "atmosphere"
  | "motion"
  | "cards"
  | "image"
  | "navigation"
  | "typography"
  | "interaction"

const SECTIONS: { key: SectionKey; label: string; multi?: boolean }[] = [
  { key: "atmosphere", label: "Atmosfera" },
  { key: "motion", label: "Movimento" },
  { key: "cards", label: "Cards", multi: true },
  { key: "image", label: "Imagens" },
  { key: "navigation", label: "Navegação" },
  { key: "typography", label: "Tipografia" },
  { key: "interaction", label: "Interação", multi: true },
]

function OptionChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-medium border transition-all duration-300",
        active
          ? "border-vm-coral bg-vm-coral text-white shadow-sm"
          : "border-vm-border bg-white text-vm-muted hover:border-vm-coral/40 hover:text-vm-ink"
      )}
    >
      {label}
    </button>
  )
}

/** Live preview that reacts to current preferences */
function LivePreview({ prefs }: { prefs: VireLabPreferences }) {
  const isDark = prefs.atmosphere === "Dark"
  const isBold = prefs.atmosphere === "Bold" || prefs.typography === "Bold"
  const isEditorial = prefs.typography === "Editorial" || prefs.atmosphere === "Editorial"
  const motionIntensity =
    prefs.motion === "Subtle"
      ? 0.3
      : prefs.motion === "Smooth"
        ? 0.5
        : prefs.motion === "Dynamic"
          ? 0.75
          : 1

  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden transition-colors duration-500",
        isDark ? "bg-vm-charcoal border-white/10" : "bg-white border-vm-border"
      )}
    >
      {/* Mini nav preview */}
      <div
        className={cn(
          "flex items-center justify-between px-5 py-3 border-b transition-all duration-400",
          isDark ? "border-white/10" : "border-vm-border",
          prefs.navigation === "Floating" && "mx-3 mt-3 rounded-full border shadow-sm",
          prefs.navigation === "Transparent" && "bg-transparent border-transparent"
        )}
      >
        <span
          className={cn(
            "text-xs font-semibold tracking-tight",
            isDark ? "text-white" : "text-vm-ink"
          )}
        >
          viremarca
        </span>
        <div className="flex gap-3">
          {["Sites", "Método"].map((l) => (
            <span
              key={l}
              className={cn("text-[11px]", isDark ? "text-white/50" : "text-vm-muted")}
            >
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* Hero-like preview */}
      <div className="p-6 md:p-8">
        <p
          className={cn(
            "text-[10px] font-medium tracking-[0.15em] uppercase mb-3",
            isDark ? "text-vm-coral" : "text-vm-coral"
          )}
        >
          Preview · {prefs.atmosphere}
        </p>
        <h3
          className={cn(
            "tracking-tight leading-tight transition-all duration-400",
            isBold ? "text-2xl font-bold" : isEditorial ? "text-2xl font-semibold italic" : "text-xl font-semibold",
            isDark ? "text-white" : "text-vm-ink"
          )}
        >
          Seu negócio merece presença digital.
        </h3>
        <p
          className={cn(
            "mt-3 text-sm leading-relaxed max-w-xs",
            isDark ? "text-white/55" : "text-vm-muted"
          )}
        >
          Movimento: {prefs.motion} · Tipografia: {prefs.typography}
        </p>

        {/* Card samples */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {prefs.cards.slice(0, 2).map((style) => (
            <motion.div
              key={style}
              whileHover={
                prefs.interaction.includes("Hover card")
                  ? { y: -4, scale: 1.02 }
                  : undefined
              }
              transition={{ duration: 0.3 * motionIntensity }}
              className={cn(
                "rounded-xl p-4 border transition-all",
                style === "Glass"
                  ? "bg-white/10 backdrop-blur border-white/20"
                  : style === "Editorial"
                    ? "bg-transparent border-l-2 border-l-vm-coral border-t-0 border-r-0 border-b-0 rounded-none pl-3"
                    : isDark
                      ? "bg-white/5 border-white/10"
                      : "bg-vm-bg border-vm-border",
                prefs.image === "Grayscale → Color" && "grayscale hover:grayscale-0"
              )}
            >
              <div
                className={cn(
                  "h-16 rounded-lg mb-3 transition-all duration-500",
                  isDark ? "bg-white/10" : "bg-vm-sand",
                  prefs.image === "Zoom" && "hover:scale-105 origin-center"
                )}
              />
              <p
                className={cn(
                  "text-xs font-medium",
                  isDark ? "text-white/80" : "text-vm-ink"
                )}
              >
                {style} Card
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA sample */}
        <div className="mt-6">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-5 py-2.5 text-xs font-semibold transition-transform",
              "bg-vm-coral text-white",
              prefs.interaction.includes("Magnetic button") && "hover:scale-105"
            )}
          >
            CTA · {prefs.motion}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function VireLabPage() {
  const [prefs, setPrefs] = useState<VireLabPreferences>(DEFAULT_PREFS)
  const [section, setSection] = useState<SectionKey>("atmosphere")
  const [copied, setCopied] = useState(false)
  const reduced = useReducedMotion()

  const options = useMemo(() => {
    switch (section) {
      case "atmosphere":
        return ATMOSPHERES
      case "motion":
        return MOTIONS
      case "cards":
        return CARD_STYLES
      case "image":
        return IMAGE_TREATMENTS
      case "navigation":
        return NAV_STYLES
      case "typography":
        return TYPOGRAPHY_STYLES
      case "interaction":
        return INTERACTIONS
    }
  }, [section])

  const isActive = useCallback(
    (value: string) => {
      const v = prefs[section]
      if (Array.isArray(v)) return v.includes(value as never)
      return v === value
    },
    [prefs, section]
  )

  const toggle = useCallback(
    (value: string) => {
      setPrefs((prev) => {
        const multi = section === "cards" || section === "interaction"
        if (multi) {
          const arr = [...(prev[section] as string[])]
          const idx = arr.indexOf(value)
          if (idx >= 0) {
            if (arr.length === 1) return prev // keep at least one
            arr.splice(idx, 1)
          } else {
            arr.push(value)
          }
          return { ...prev, [section]: arr }
        }
        return { ...prev, [section]: value }
      })
    },
    [section]
  )

  const briefing = useMemo(() => formatBriefing(prefs), [prefs])

  const copyBriefing = async () => {
    try {
      await navigator.clipboard.writeText(briefing)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* fallback ignored */
    }
  }

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-vm-muted hover:text-vm-ink transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-vm-coral/10 text-vm-coral shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="vm-display text-3xl md:text-4xl text-vm-ink">VireLab</h1>
              <p className="mt-2 text-vm-muted max-w-xl leading-relaxed">
                Laboratório visual. Experimente atmosferas, movimento e interações — e gere um briefing estruturado da sua direção estética.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-14 items-start">
          {/* Controls */}
          <div>
            {/* Section tabs */}
            <div className="flex flex-wrap gap-2 mb-8">
              {SECTIONS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSection(s.key)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-300",
                    section === s.key
                      ? "bg-vm-ink text-white"
                      : "bg-vm-bg text-vm-muted hover:text-vm-ink border border-vm-border"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Options */}
            <AnimatePresence mode="wait">
              <motion.div
                key={section}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="flex flex-wrap gap-2.5"
              >
                {options.map((opt) => (
                  <OptionChip
                    key={opt}
                    label={opt}
                    active={isActive(opt)}
                    onClick={() => toggle(opt)}
                  />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Briefing output */}
            <div className="mt-12 rounded-2xl border border-vm-border bg-vm-bg/60 p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-vm-ink tracking-tight">
                  Direção visual gerada
                </h2>
                <button
                  type="button"
                  onClick={copyBriefing}
                  className="inline-flex items-center gap-1.5 rounded-full border border-vm-border bg-white px-3 py-1.5 text-xs font-medium text-vm-muted hover:text-vm-ink hover:border-vm-coral/40 transition-colors"
                >
                  {copied ? <Check size={13} className="text-vm-coral" /> : <Copy size={13} />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
              <pre className="text-xs md:text-sm text-vm-muted font-mono leading-relaxed whitespace-pre-wrap">
                {briefing}
              </pre>
            </div>
          </div>

          {/* Live preview — sticky */}
          <div className="lg:sticky lg:top-28">
            <p className="text-[11px] font-medium tracking-[0.15em] uppercase text-vm-muted mb-3">
              Preview ao vivo
            </p>
            <LivePreview prefs={prefs} />
            <p className="mt-4 text-xs text-vm-muted leading-relaxed">
              As preferências ficam no estado do cliente. Em breve: salvar por projeto, exportar e enviar para o briefing do site.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
