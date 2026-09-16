"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-400",
        scrolled
          ? "bg-white/85 backdrop-blur-xl border-b border-vm-border/80 shadow-[0_1px_0_0_rgba(0,0,0,0.03)]"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between md:h-[4.25rem]">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/logo-wordmark.png"
              alt="VireMarca"
              width={140}
              height={36}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-vm-muted hover:text-vm-ink transition-colors duration-200 relative after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-vm-coral after:transition-all after:duration-300 hover:after:w-full"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <MagneticButton href="/#contato" variant="primary" className="!px-5 !py-2.5 text-sm">
              Quero criar meu site
            </MagneticButton>
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-vm-ink"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "md:hidden fixed inset-x-0 top-16 bottom-0 bg-white transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-x-0" : "translate-x-full pointer-events-none"
        )}
      >
        <nav className="flex flex-col px-6 py-8 gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3.5 text-lg font-medium text-vm-ink hover:bg-vm-sand transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/#contato"
            onClick={() => setOpen(false)}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-vm-coral px-6 py-3.5 text-sm font-semibold text-white"
          >
            Quero criar meu site
          </Link>
        </nav>
      </div>
    </header>
  )
}
