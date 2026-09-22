"use client"

import { Bot, CalendarCheck, PlugZap, ArrowUpRight } from "lucide-react"
import { motion } from "framer-motion"
import { Reveal, RevealStagger, revealItem } from "@/components/motion/Reveal"
import { TitleBlock } from "@/components/TitleBlock"
import { TrackedAnchor } from "@/components/TrackedAnchor"
import type { CommercialSections } from "@/lib/site-content"
import { useReducedMotion } from "@/hooks/useReducedMotion"

const icons = [Bot, CalendarCheck, PlugZap]
const bubbleVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (delay: number) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay, ease: "easeOut" } }),
}
const typingVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: (delay: number) => ({ opacity: 1, y: 0, transition: { duration: 0.2, delay, ease: "easeOut" } }),
}

function Conversation({ demo, reduced }: { demo: CommercialSections["solutions"]["demos"][number]; reduced: boolean }) {
  return (
    <div className="space-y-3" aria-live={reduced ? undefined : "polite"}>
      {demo.messages.map((message, index) => {
        const delay = reduced ? 0 : index * 0.6
        const isAssistant = message.from === "assistant"
        return (
          <div key={demo.label + "-" + index} className={"flex " + (isAssistant ? "justify-start" : "justify-end")}>
            {isAssistant ? (
              <div className="max-w-[88%]">
                {!reduced && (
                  <motion.div custom={Math.max(0, delay - 0.25)} variants={typingVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.55 }} className="mb-1 flex w-fit items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/40" aria-label="Assistente digitando">
                    <span>digitando</span><span className="animate-pulse">·</span><span className="animate-pulse [animation-delay:120ms]">·</span><span className="animate-pulse [animation-delay:240ms]">·</span>
                  </motion.div>
                )}
                <motion.div custom={delay} variants={bubbleVariants} initial={reduced ? false : "hidden"} whileInView={reduced ? undefined : "visible"} viewport={{ once: true, amount: 0.55 }} className="rounded-2xl rounded-tl-md bg-vm-coral/90 px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
                  {message.text}
                </motion.div>
              </div>
            ) : (
              <motion.div custom={delay} variants={bubbleVariants} initial={reduced ? false : "hidden"} whileInView={reduced ? undefined : "visible"} viewport={{ once: true, amount: 0.55 }} className="max-w-[82%] rounded-2xl rounded-tr-md bg-white/10 px-4 py-3 text-sm leading-relaxed text-white/90">
                {message.text}
              </motion.div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function CommercialSolutions({ data, whatsapp }: { data: CommercialSections["solutions"]; whatsapp: string }) {
  const reduced = useReducedMotion()
  const wa = "https://wa.me/" + whatsapp + "?text=" + encodeURIComponent("Olá! Quero saber mais sobre atendimento com IA e integrações para o meu negócio.")
  return (
    <section id="solucoes" className="relative overflow-hidden bg-vm-charcoal py-20 text-white md:py-28">
      <div className="pointer-events-none absolute -right-24 top-16 h-72 w-72 rounded-full bg-vm-coral/15 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-28 bottom-0 h-64 w-64 rounded-full bg-vm-coral/10 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 sm:px-7 md:grid-cols-12 md:gap-10 lg:px-10">
        <div className="md:col-span-5">
          <Reveal className="max-w-xl">
            <p className="vm-eyebrow mb-4 text-white/50">{data.eyebrow}</p>
            <TitleBlock style={{ text: data.title, highlight: data.highlight, textColor: "#FFFFFF", highlightColor: "#E07A5F", highlightStyle: "color" }} className="!mx-0 !text-left" />
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/60">{data.subtitle}</p>
          </Reveal>
          <RevealStagger className="mt-9">
            {data.items.map((item, i) => {
              const Icon = icons[i] || Bot
              return (
                <motion.article key={item.title} variants={reduced ? undefined : revealItem} className="border-b border-white/10 py-5 first:pt-0">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-vm-coral"><Icon size={19} /></div>
                    <div><h3 className="text-base font-semibold text-white">{item.title}</h3><p className="mt-1.5 text-sm leading-relaxed text-white/60">{item.desc}</p></div>
                  </div>
                </motion.article>
              )
            })}
          </RevealStagger>
          <p className="mt-6 text-xs leading-relaxed text-white/50">{data.note}</p>
          <TrackedAnchor href={wa} target="_blank" rel="noopener noreferrer" eventName="solutions_interest" eventMetadata={{ location: "solutions_section" }} eventStatus="production" className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-vm-coral px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
            {data.cta}<ArrowUpRight size={16} />
          </TrackedAnchor>
        </div>
        <div className="md:col-span-7">
          <Reveal className="h-full">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur md:p-5">
              <div role="tablist" aria-label="Exemplos de atendimento" className="mb-4 flex gap-2 overflow-x-auto pb-1">
                {data.demos.map((demo, index) => <button key={demo.label} type="button" role="tab" aria-selected={index === 0} aria-controls={"conversation-" + index} className={"shrink-0 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold transition-colors " + (index === 0 ? "bg-vm-coral text-white" : "bg-white/5 text-white/60")} data-demo-index={index}>{demo.label}</button>)}
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/10 p-5 sm:p-6">
                <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-4"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.55)]" /><span className="text-sm font-semibold text-white">Assistente do seu site</span><span className="ml-auto text-xs text-white/40">23:47</span></div>
                <div id="conversation-0" role="tabpanel" aria-label={data.demos[0]?.label || "Pousada"} className="min-h-[290px]"><Conversation demo={data.demos[0]} reduced={reduced} /></div>
                <div className="mt-5 border-t border-white/10 pt-4 text-[11px] text-white/40">Exemplo ilustrativo</div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
