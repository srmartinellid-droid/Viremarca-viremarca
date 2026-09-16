"use client"

import { MessageCircle, Mail, ArrowUpRight } from "lucide-react"
import { Reveal } from "@/components/motion/Reveal"
import { MagneticButton } from "@/components/motion/MagneticButton"
import { Spotlight } from "@/components/motion/Spotlight"

type Props = { contact: { whatsapp: string; email: string; instagram: string } }

export function ContactCTA({ contact }: Props) {
  const wa = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent("Olá! Quero criar um site com a VireMarca.")}`

  return (
    <section id="contato" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <Spotlight className="relative overflow-hidden rounded-[1.75rem] bg-vm-charcoal px-8 py-16 md:px-16 md:py-24" size={600} intensity={0.14}>
            <div className="absolute inset-0 -z-0 opacity-25 pointer-events-none" aria-hidden><div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-vm-coral blur-[120px]" /><div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full bg-vm-coral-soft blur-[80px]" /></div>
            <div className="relative z-10 text-center max-w-2xl mx-auto">
              <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-vm-coral mb-5">Próximo passo</p>
              <h2 className="vm-display text-3xl md:text-4xl lg:text-[2.75rem] text-white leading-[1.12]">Pronto para virar a marca do seu negócio?</h2>
              <p className="mt-5 text-white/60 leading-relaxed text-lg">Conte um pouco sobre o seu segmento. Respondemos rápido e sem compromisso.</p>
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                <MagneticButton href={wa} variant="primary" className="min-w-[200px]"><MessageCircle size={18} />Falar no WhatsApp</MagneticButton>
                <a href={`mailto:${contact.email}`} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors duration-300 min-w-[200px]"><Mail size={18} />Enviar e-mail</a>
              </div>
              <div className="mt-10"><a href="/virelab" className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-vm-coral transition-colors">Ou explore o VireLab primeiro<ArrowUpRight size={14} /></a></div>
            </div>
          </Spotlight>
        </Reveal>
      </div>
    </section>
  )
}
