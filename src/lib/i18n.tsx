"use client"

// i18n leve: dicionário PT -> EN/ES (i18n-dict.ts) aplicado aos nós de texto do DOM.
// Português é o padrão e o fallback; textos sem entrada (ex.: conteúdo editado no /admin) ficam em PT.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { DICT } from "@/lib/i18n-dict"

export type Lang = "pt" | "en" | "es"
export const LANGS: { code: Lang; label: string }[] = [
  { code: "pt", label: "Português" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
]
const STORAGE_KEY = "vm-lang"
const HTML_LANG: Record<Lang, string> = { pt: "pt-BR", en: "en", es: "es" }

type Ctx = { lang: Lang; setLang: (l: Lang) => void; tr: (pt: string) => string }
const LangContext = createContext<Ctx>({ lang: "pt", setLang: () => {}, tr: s => s })

function lookup(text: string, lang: Lang): string | null {
  if (lang === "pt") return null
  const idx = lang === "en" ? 0 : 1
  const exact = DICT[text]
  if (exact) return exact[idx]
  const trimmed = text.trim()
  const hit = DICT[trimmed]
  if (!hit) return null
  const start = text.indexOf(trimmed)
  return text.slice(0, start) + hit[idx] + text.slice(start + trimmed.length)
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt")

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved === "en" || saved === "es" || saved === "pt") setLangState(saved)
    } catch {}
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { window.localStorage.setItem(STORAGE_KEY, l) } catch {}
  }, [])

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang]
    const originals = new WeakMap<Text, { orig: string; applied: string }>()
    const skip = (el: Element | null) => !el || !!el.closest("script,style,textarea,[data-no-translate]")

    const apply = (node: Text) => {
      if (skip(node.parentElement)) return
      const rec = originals.get(node)
      if (rec && node.data === rec.applied) {
        const next = lookup(rec.orig, lang) ?? rec.orig
        if (next !== node.data) { node.data = next; rec.applied = next }
        return
      }
      const orig = node.data
      if (!orig.trim()) return
      const next = lookup(orig, lang) ?? orig
      originals.set(node, { orig, applied: next })
      if (next !== orig) node.data = next
    }
    const walk = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) return apply(root as Text)
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      let n: Node | null
      while ((n = w.nextNode())) apply(n as Text)
    }

    walk(document.body)
    if (lang === "pt") return // sem observer: nós voltaram ao original
    const obs = new MutationObserver(muts => {
      obs.disconnect()
      for (const m of muts) {
        if (m.type === "characterData") walk(m.target)
        else m.addedNodes.forEach(n => walk(n))
      }
      obs.observe(document.body, { childList: true, characterData: true, subtree: true })
    })
    obs.observe(document.body, { childList: true, characterData: true, subtree: true })
    return () => obs.disconnect()
  }, [lang])

  const tr = useCallback((pt: string) => lookup(pt, lang) ?? pt, [lang])
  const value = useMemo(() => ({ lang, setLang, tr }), [lang, setLang, tr])
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)
