"use client"

import { useEffect, useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { motion } from "framer-motion"
import { Reveal } from "@/components/motion/Reveal"
import { TitleBlock } from "@/components/TitleBlock"
import { TrackedAnchor } from "@/components/TrackedAnchor"
import type { CommercialSections } from "@/lib/site-content"
import { useReducedMotion } from "@/hooks/useReducedMotion"

const criteria = [
  { label: "Desempenho", value: 5.8 },
  { label: "Versão mobile", value: 6.0 },
  { label: "Clareza visual", value: 7.5 },
  { label: "Conversão", value: 6.2 },
]
const findings = [
  { tone: "attention", text: "Botão de WhatsApp fora da primeira tela" },
  { tone: "critical", text: "Imagens sem otimização no celular" },
]

function ScoreRing({ reduced }: { reduced: boolean }) {
  const [score, setScore] = useState(reduced ? 6.4 : 0)
  useEffect(() => {
    if (reduced) return
    const started = performance.now()
    const duration = 1200
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration)
      setScore(Number((6.4 * (1 - Math.pow(1 - progress, 3))).toFixed(1)))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [reduced])
  const circumference = 2 * Math.PI * 46
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 112 112" className="h-full w-full -rotate-90" aria-label="Nota geral 6,4 de 10" role="img">
        <circle cx="56" cy="56" r="46" fill="none" stroke="currentColor" strokeWidth="8" className="text-vm-border" />
        <motion.circle cx="56" cy="56" r="46" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-vm-coral" strokeDasharray={circumference} initial={{ strokeDashoffset: reduced ? circumference * 0.36 : circumference }} whileInView={{ strokeDashoffset: circumference * 0.36 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center"><motion.span className="text-3xl font-semibold tracking-tight text-vm-ink">{score.toFixed(1).replace(".", ",")}</motion.span><span className="text-xs text-vm-muted">/ 10</span></div>
    </div>
  )
}

export function CommercialDiagnostic({ data, whatsapp }: { data: CommercialSections["diagnostic"]; whatsapp: string }) {
  const reduced = useReducedMotion()
  const wa = "https://wa.me/" + whatsapp + "?text=" + encodeURIComponent("Olá! Gostaria de solicitar o diagnóstico gratuito do meu site: ")
  return (
    <section id="diagnostico" className="bg-vm-bg py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-7 md:grid-cols-12 md:items-center md:gap-10 lg:px-10">
        <div className="md:col-span-6">
          <Reveal className="max-w-2xl">
            <p className="vm-eyebrow mb-4">{data.eyebrow}</p>
            <TitleBlock style={{ text: data.title, highlight: data.highlight, textColor: "#171717", highlightColor: "#E07A5F", highlightStyle: "color" }} className="!mx-0 !text-left" />
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-vm-muted">{data.subtitle}</p>
          </Reveal>
          <div className="mt-10 max-w-xl">
            {data.items.map((item, index) => <Reveal key={item.title} className="relative flex gap-5 pb-8 last:pb-0">
              {index < data.items.length - 1 && <span className="absolute left-5 top-10 h-[calc(100%-2rem)] w-px bg-vm-border" aria-hidden="true" />}
              <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-vm-coral bg-vm-bg text-xs font-bold text-vm-coral">{String(index + 1).padStart(2, "0")}</span>
              <div className="pt-0.5"><h3 className="text-base font-semibold text-vm-ink">{item.title}</h3><p className="mt-1.5 text-sm leading-relaxed text-vm-muted">{item.desc}</p></div>
            </Reveal>)}
          </div>
          <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <TrackedAnchor href={wa} target="_blank" rel="noopener noreferrer" eventName="diagnostic_request" eventMetadata={{ location: "diagnostic_section" }} eventStatus="production" className="inline-flex items-center justify-center gap-2 rounded-full bg-vm-coral px-7 py-4 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">{data.cta}<ArrowUpRight size={16} /></TrackedAnchor>
            <p className="text-sm text-vm-muted">Ainda não tem site? <a href="#contato" className="font-semibold text-vm-ink hover:text-vm-coral">Fale com a gente</a></p>
          </div>
        </div>
        <div className="md:col-span-6">
          <Reveal className="mx-auto max-w-xl">
            <motion.div whileHover={reduced ? undefined : { rotate: 0 }} initial={{ rotate: -1.5 }} transition={{ duration: 0.35 }} className="rounded-[1.75rem] border border-vm-border bg-white p-6 shadow-[0_20px_55px_rgba(23,23,23,0.10)] md:p-8">
              <div className="flex items-start justify-between gap-4 border-b border-vm-border pb-5">
                <div><p className="text-lg font-semibold text-vm-ink">Relatório de diagnóstico</p><p className="mt-1 text-xs text-vm-muted">VireMarca · leitura de exemplo</p></div>
                <span className="shrink-0 rounded-full border border-vm-border bg-vm-bg px-3 py-1.5 text-[10px] font-semibold text-vm-muted">Exemplo ilustrativo</span>
              </div>
              <div className="flex flex-col items-center gap-7 py-8 sm:flex-row sm:items-center">
                <ScoreRing reduced={reduced} />
                <div className="w-full space-y-4">
                  {criteria.map((item) => <div key={item.label}><div className="mb-1.5 flex items-center justify-between text-xs"><span className="text-vm-muted">{item.label}</span><span className="font-semibold text-vm-ink">{item.value.toFixed(1).replace(".", ",")}</span></div><div className="h-2 overflow-hidden rounded-full bg-vm-border"><motion.div className="h-full origin-left rounded-full bg-vm-coral" initial={{ scaleX: reduced ? item.value / 10 : 0 }} whileInView={{ scaleX: item.value / 10 }} viewport={{ once: true, amount: 0.65 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} /></div></div>)}
                </div>
              </div>
              <div className="space-y-3 border-t border-vm-border pt-5">{findings.map((finding) => <div key={finding.text} className={"border-l-2 pl-4 text-sm leading-relaxed " + (finding.tone === "critical" ? "border-red-500" : "border-amber-400")}>{finding.text}</div>)}</div>
            </motion.div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
