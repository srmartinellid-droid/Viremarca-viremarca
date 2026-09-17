"use client"

import { Reveal } from "@/components/motion/Reveal"
import type { PublicSiteContent } from "@/lib/site-content"

type Props = { content: PublicSiteContent }

export function About({ content }: Props) {
  const paragraphs = content.aboutBody.split("\n\n").filter(Boolean)
  return (
    <section id="quem-somos" className="relative overflow-hidden bg-vm-sand py-24 md:py-32">
      <div className="pointer-events-none absolute -right-24 top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 rounded-full bg-vm-coral/[0.09] blur-[110px]" aria-hidden />
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <Reveal>
            <div className="sticky top-28">
              <p className="vm-eyebrow mb-5 flex items-center gap-3"><span className="text-vm-ink/25">02</span> Quem somos</p>
              <h2 className="vm-display max-w-md text-4xl leading-[0.96] tracking-[-0.055em] md:text-6xl lg:text-[5.2rem]">{content.aboutTitle}</h2>
              <div className="mt-10 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-vm-muted"><span className="h-2 w-2 rounded-full bg-vm-coral" />VireMarca®</div>
            </div>
          </Reveal>
          <Reveal delay={0.12} className="relative">
            <div className="mb-10 max-w-2xl border-l-2 border-vm-coral pl-6 md:pl-8">
              <p className="text-xl font-medium leading-relaxed tracking-tight text-vm-ink md:text-3xl">Sites profissionais não precisam parecer iguais. A tecnologia pode ser a mesma. A presença não.</p>
            </div>
            <div className="max-w-2xl space-y-6">
              {paragraphs.map((p, i) => <p key={i} className="text-base leading-[1.8] text-vm-muted md:text-lg">{p}</p>)}
            </div>
            <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-vm-ink/10 bg-vm-ink/10 md:grid-cols-3">
              {["Direção visual", "Engenharia", "Evolução"].map((item) => <div key={item} className="bg-vm-sand p-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-vm-ink/55">{item}</div>)}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
