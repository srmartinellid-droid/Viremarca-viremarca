"use client"

import { useEffect, useRef, useState } from "react"
import { Globe } from "lucide-react"
import { LANGS, useLang, type Lang } from "@/lib/i18n"

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])
  return (
    <div ref={ref} className={`relative ${className}`} data-no-translate>
      <button type="button" onClick={() => setOpen(v => !v)} aria-haspopup="listbox" aria-expanded={open} aria-label="Idioma / Language" className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/20 px-3 text-xs font-semibold uppercase text-white/85 transition hover:border-white/50 hover:text-white">
        <Globe size={15} />{lang.toUpperCase()}
      </button>
      {open && (
        <ul role="listbox" className="absolute right-0 top-full z-[70] mt-2 w-36 overflow-hidden rounded-2xl border border-vm-border bg-white py-1 shadow-xl">
          {LANGS.map(l => (
            <li key={l.code}>
              <button type="button" role="option" aria-selected={lang === l.code} onClick={() => { setLang(l.code as Lang); setOpen(false) }} className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-vm-sand ${lang === l.code ? "font-semibold text-vm-coral" : "text-vm-ink"}`}>
                {l.label}<span className="text-[10px] uppercase text-vm-muted">{l.code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
