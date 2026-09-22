"use client"
import { Building2, MapPin, Palette } from "lucide-react"
import { Reveal, RevealStagger, revealItem } from "@/components/motion/Reveal"
import { motion } from "framer-motion"
import { TitleBlock } from "@/components/TitleBlock"
import type { CommercialSections } from "@/lib/site-content"
import { useReducedMotion } from "@/hooks/useReducedMotion"
const icons=[Building2,MapPin,Palette]
export function CommercialPillars({data}:{data:CommercialSections["pillars"]}){const reduced=useReducedMotion();return <section id="frentes" className="bg-vm-bg py-20 md:py-24"><div className="mx-auto max-w-7xl px-5 sm:px-7 lg:px-10"><Reveal className="mb-11 max-w-3xl"><p className="vm-eyebrow mb-4">{data.eyebrow}</p><TitleBlock style={{text:data.title,highlight:data.highlight,textColor:"#171717",highlightColor:"#E07A5F",highlightStyle:"color"}} className="!mx-0 !text-left"/><p className="mt-5 max-w-2xl text-lg leading-relaxed text-vm-muted">{data.subtitle}</p></Reveal><RevealStagger className="grid gap-4 md:grid-cols-3">{data.items.map((item,i)=>{const Icon=icons[i]||Building2;return <motion.article key={item.title} variants={reduced?undefined:revealItem} className="rounded-[1.5rem] border border-vm-border bg-white p-7"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-vm-coral/10 text-vm-coral"><Icon size={20}/></div><h3 className="mt-6 text-xl font-semibold text-vm-ink">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-vm-muted">{item.desc}</p></motion.article>})}</RevealStagger><p className="mt-6 text-sm text-vm-muted">{data.note}</p></div></section>}
