"use client"

import { MessageCircle, Mail, ArrowUpRight } from "lucide-react"
import { Reveal } from "@/components/motion/Reveal"
import { MagneticButton } from "@/components/motion/MagneticButton"
import { Spotlight } from "@/components/motion/Spotlight"
import { TitleBlock, type TitleStyle } from "@/components/TitleBlock"
import { TrackedAnchor } from "@/components/TrackedAnchor"

type Props = { contact: { whatsapp: string; email: string; instagram: string }; titleStyle?: TitleStyle }
export function ContactCTA({ contact, titleStyle }: Props) {
  const wa = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent("Olá! Quero criar um site com a VireMarca.")}`
  const title = titleStyle || { text: "Pronto para virar a marca do seu negócio?", highlight: "virar a marca", textColor: "#FFFFFF", highlightColor: "#E07A5F", highlightStyle: "color" as const }
  return <section id="contato" className="py-20 md:py-24"><div className="mx-auto max-w-6xl px-4 sm:px-6"><Reveal><Spotlight className="relative overflow-hidden rounded-[1.75rem] bg-vm-charcoal px-8 py-14 md:px-16 md:py-20" size={600} intensity={0.14}><div className="pointer-events-none absolute inset-0 -z-0 opacity-25" aria-hidden><div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-vm-coral blur-[120px]" /><div className="absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-vm-coral-soft blur-[80px]" /></div><div className="relative z-10 mx-auto max-w-2xl text-center"><p className="mb-5 text-[11px] font-medium uppercase tracking-[0.2em] text-vm-coral">Próximo passo</p><TitleBlock style={{ ...title, align: "center" }} /><p className="mt-4 text-lg leading-relaxed text-white/60">Conte um pouco sobre o seu negócio. Respondemos rápido e sem compromisso.</p><div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row"><MagneticButton href={wa} variant="primary" contactContext="contact_section" className="min-w-[200px]"><MessageCircle size={18} />Falar no WhatsApp</MagneticButton><TrackedAnchor href={`mailto:${contact.email}`} eventName="email_click" eventMetadata={{ location: "contact_cta" }} eventStatus="production" contactContext="contact_section" className="inline-flex min-w-[200px] items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"><Mail size={18} />Enviar e-mail</TrackedAnchor></div><div className="mt-8"><TrackedAnchor href="/#diagnostico" eventName="diagnostic_cta_click" eventMetadata={{ location: "contact_cta" }} eventStatus="production" className="inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-vm-coral">Ou peça um diagnóstico gratuito do seu site<ArrowUpRight size={14} /></TrackedAnchor></div></div></Spotlight></Reveal></div></section>
}
