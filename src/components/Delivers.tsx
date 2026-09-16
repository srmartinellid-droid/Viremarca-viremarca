"use client"

import { DEMO_CONTENT } from "@/lib/demo-data"
import { Reveal, RevealStagger, revealItem } from "@/components/motion/Reveal"
import { motion } from "framer-motion"
import { Layout, User, Layers, Target, Image as ImageIcon, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"

const icons = [Layout, User, Layers, Target, ImageIcon, Settings]

/** Bento-style asymmetric delivers section */
export function Delivers() {
  const reduced = useReducedMotion()
  const items = DEMO_CONTENT.delivers

  // Visual weights for bento: first item large, others varied
  const spans = [
    "sm:col-span-2 sm:row-span-2",
    "sm:col-span-1",
    "sm:col-span-1",
    "sm:col-span-1",
    "sm:col-span-1",
    "sm:col-span-2",
  ]

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-2xl mb-14">
          <p className="vm-eyebrow mb-3">O que entregamos</p>
          <h2 className="vm-display text-3xl md:text-4xl lg:text-[2.75rem] text-vm-ink">
            Uma base sólida.
            <br />
            Uma identidade própria.
          </h2>
          <p className="mt-4 text-vm-muted leading-relaxed">
            Arquitetura de templates por nicho — não é site genérico, é estrutura pensada para o seu segmento.
          </p>
        </Reveal>

        <RevealStagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
          {items.map((item, i) => {
            const Icon = icons[i % icons.length]
            const isFeature = i === 0

            return (
              <motion.div
                key={item.title}
                variants={reduced ? undefined : revealItem}
                className={cn(
                  "group relative rounded-2xl border border-vm-border bg-vm-bg/40 p-6 md:p-7",
                  "transition-all duration-400 hover:bg-white hover:border-vm-coral/30",
                  "hover:shadow-[0_16px_40px_-20px_rgba(224,122,95,0.18)]",
                  spans[i]
                )}
              >
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-300",
                    "bg-vm-coral/10 text-vm-coral group-hover:bg-vm-coral group-hover:text-white"
                  )}
                >
                  <Icon size={isFeature ? 20 : 18} />
                </div>
                <h3
                  className={cn(
                    "mt-5 font-semibold text-vm-ink tracking-tight",
                    isFeature ? "text-xl md:text-2xl" : "text-base md:text-lg"
                  )}
                >
                  {item.title}
                </h3>
                <p
                  className={cn(
                    "mt-2 text-vm-muted leading-relaxed",
                    isFeature ? "text-base max-w-sm" : "text-sm"
                  )}
                >
                  {item.desc}
                </p>

                {isFeature && (
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                    <span className="text-[10px] tracking-[0.15em] uppercase text-vm-coral font-medium">
                      Core
                    </span>
                  </div>
                )}
              </motion.div>
            )
          })}
        </RevealStagger>
      </div>
    </section>
  )
}
