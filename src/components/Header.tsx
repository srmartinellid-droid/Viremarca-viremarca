"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Menu, X, Contrast } from "lucide-react"
import { cn } from "@/lib/utils"
import { MagneticButton } from "@/components/motion/MagneticButton"

const nav = [
  { href: "/", label: "Início" },
  { href: "/#sites", label: "Sites" },
  { href: "/#como-fazemos", label: "Método" },
  { href: "/#quem-somos", label: "Quem somos" },
  { href: "/virelab", label: "VireLab" },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mono, setMono] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18)
    window.addEventListener("scroll", onScroll, { passive: true })
    const saved = window.localStorage.getItem("viremarca-mono") === "1"
    setMono(saved)
    document.documentElement.classList.toggle("vire-mono", saved)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  const toggleMono = () => {
    const next = !mono
    setMono(next)
    document.documentElement.classList.toggle("vire-mono", next)
    window.localStorage.setItem("viremarca-mono", next ? "1" : "0")
  }

  return (
    <header className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-500", scrolled ? "bg-white/92 backdrop-blur-2xl border-b border-vm-border/80 shadow-[0_10px_40px_-30px_rgba(0,0,0,0.2)]" : "bg-white/78 backdrop-blur-md")}>
      <div className="mx-auto max-w-7xl px-5 sm:px-7 lg:px-10">
        <div className={cn("flex items-center justify-between transition-all duration-500", scrolled ? "h-[5rem]" : "h-[6.5rem]")}>
          <Link href="/" className="flex items-center shrink-0" aria-label="VireMarca, início">
            <Image src="/logo-wordmark.png" alt="VireMarca" width={360} height={92} className={cn("w-auto object-contain transition-all duration-500", scrolled ? "h-[3.05rem]" : "h-[3.6rem]")} priority />
          </Link>

          <nav className="hidden md:flex items-center gap-7 lg:gap-9">
            {nav.map((item) => <Link key={item.href} href={item.href} className="text-[13px] lg:text-sm font-medium text-vm-muted hover:text-vm-ink transition-colors duration-200 relative after:absolute after:left-0 after:-bottom-2 after:h-px after:w-0 after:bg-vm-coral after:transition-all after:duration-300 hover:after:w-full">{item.label}</Link>)}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button type="button" onClick={toggleMono} aria-pressed={mono} title={mono ? "Voltar às cores" : "Modo preto e branco"} className={cn("inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all", mono ? "border-vm-ink bg-vm-ink text-white" : "border-vm-border bg-white text-vm-muted hover:border-vm-ink hover:text-vm-ink")}><Contrast size={17} /></button>
            <MagneticButton href="/#contato" variant="primary" className="!px-6 !py-3 text-sm">Quero criar meu site</MagneticButton>
          </div>

          <button type="button" className="md:hidden p-2 text-vm-ink" onClick={() => setOpen(!open)} aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open}>{open ? <X size={23} /> : <Menu size={23} />}</button>
        </div>
      </div>

      <div className={cn("md:hidden fixed inset-x-0 top-[6.5rem] bottom-0 bg-white transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]", open ? "translate-x-0" : "translate-x-full pointer-events-none")}>
        <nav className="flex flex-col px-6 py-8 gap-1">
          {nav.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3.5 text-lg font-medium text-vm-ink hover:bg-vm-sand transition-colors">{item.label}</Link>)}
          <button type="button" onClick={toggleMono} className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-vm-border px-6 py-3.5 text-sm font-semibold text-vm-ink"><Contrast size={16} />{mono ? "Voltar às cores" : "Preto e branco"}</button>
          <Link href="/#contato" onClick={() => setOpen(false)} className="mt-3 inline-flex items-center justify-center rounded-full bg-vm-coral px-6 py-3.5 text-sm font-semibold text-white">Quero criar meu site</Link>
        </nav>
      </div>
    </header>
  )
}