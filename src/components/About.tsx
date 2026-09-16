"use client"

import { DEMO_CONTENT } from "@/lib/demo-data"
import { Reveal } from "@/components/motion/Reveal"

export function About() {
  const paragraphs = DEMO_CONTENT.aboutBody.split("\n\n").filter(Boolean)

  return (
    <section id="quem-somos" className="py-24 md:py-32 bg-vm-sand/50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[40%] h-full opacity-40 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-l from-vm-coral/[0.06] to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 items-start">
          <Reveal>
            <p className="vm-eyebrow mb-4">Quem somos</p>
            <h2 className="vm-display text-3xl md:text-4xl lg:text-[2.75rem] text-vm-ink leading-[1.12]">
              {DEMO_CONTENT.aboutTitle}
            </h2>
          </Reveal>

          <Reveal delay={0.12} className="space-y-6">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-vm-muted leading-relaxed text-base md:text-lg">
                {p}
              </p>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
