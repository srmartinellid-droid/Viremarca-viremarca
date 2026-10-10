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

// Tradução dinâmica (textos editados no /admin): cache em memória + localStorage + servidor (/api/translate).
const dyn: Record<"en" | "es", Map<string, string>> = { en: new Map(), es: new Map() }
const loaded = new Set<string>()
const failedUntil = new Map<string, number>()
// Guarda o texto original (PT) de cada nó entre trocas de idioma; antes era recriado a cada troca e o PT se perdia.
const originals = new WeakMap<Text, { orig: string; applied: string }>()
const LS = (l: string) => "vm-tr-" + l

function loadLocal(lang: "en" | "es") {
  if (loaded.has("ls" + lang)) return
  loaded.add("ls" + lang)
  try { const o = JSON.parse(window.localStorage.getItem(LS(lang)) || "{}"); for (const k in o) dyn[lang].set(k, o[k]) } catch {}
}
function saveLocal(lang: "en" | "es") {
  try { window.localStorage.setItem(LS(lang), JSON.stringify(Object.fromEntries([...dyn[lang]].slice(-1500)))) } catch {}
}
async function fetchServerCache(lang: "en" | "es") {
  if (loaded.has("srv" + lang)) return false
  loaded.add("srv" + lang)
  try {
    const r = await fetch("/api/translate?lang=" + lang)
    const j = await r.json()
    let added = false
    for (const k in j.translations ?? {}) if (!dyn[lang].has(k)) { dyn[lang].set(k, j.translations[k]); added = true }
    if (added) saveLocal(lang)
    return added
  } catch { loaded.delete("srv" + lang); return false }
}
const eligible = (t: string) => {
  const s = t.trim()
  return s.length > 1 && s.length <= 1200 && /\p{L}{2}/u.test(s) && !/^(https?:\/\/|www\.)/i.test(s) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

function lookup(text: string, lang: Lang): string | null {
  if (lang === "pt") return null
  const idx = lang === "en" ? 0 : 1
  const exact = DICT[text]
  if (exact) return exact[idx]
  const trimmed = text.trim()
  const hit = DICT[trimmed]
  if (hit) {
    const start = text.indexOf(trimmed)
    return text.slice(0, start) + hit[idx] + text.slice(start + trimmed.length)
  }
  const d = dyn[lang].get(trimmed)
  if (d === undefined) return null
  const start = text.indexOf(trimmed)
  return text.slice(0, start) + d + text.slice(start + trimmed.length)
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt")

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved === "en" || saved === "es" || saved === "pt") setLangState(saved)
    } catch {}
  }, [])

  useEffect(() => {
    // aquece o cache dos dois idiomas para a troca ser instantânea
    const run = () => { (["en", "es"] as const).forEach(l => { loadLocal(l); void fetchServerCache(l) }) }
    const w = window as any
    const idle = typeof w.requestIdleCallback === "function"
    const id = idle ? w.requestIdleCallback(run, { timeout: 3000 }) : window.setTimeout(run, 1500)
    return () => { if (idle) w.cancelIdleCallback(id); else window.clearTimeout(id) }
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { window.localStorage.setItem(STORAGE_KEY, l) } catch {}
  }, [])

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang]
    const skip = (el: Element | null) => !el || !!el.closest("script,style,textarea,[data-no-translate]")

    const apply = (node: Text) => {
      if (skip(node.parentElement)) return
      const rec = originals.get(node)
      if (rec && node.data === rec.applied) {
        const found = lookup(rec.orig, lang)
        if (found === null) want(rec.orig)
        const next = found ?? rec.orig
        if (next !== node.data) { node.data = next; rec.applied = next }
        return
      }
      const orig = node.data
      if (!orig.trim()) return
      const found = lookup(orig, lang)
      if (found === null) want(orig)
      const next = found ?? orig
      originals.set(node, { orig, applied: next })
      if (next !== orig) node.data = next
    }
    const walk = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) return apply(root as Text)
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      let n: Node | null
      while ((n = w.nextNode())) apply(n as Text)
    }

    const pending = new Set<string>()
    let timer: number | undefined
    let alive = true
    const flush = async () => {
      timer = undefined
      if (lang === "pt" || !alive || !pending.size) return
      const batch = [...pending].slice(0, 40)
      batch.forEach(t => pending.delete(t))
      try {
        const r = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang, texts: batch }) })
        const j = await r.json()
        let added = false
        for (const k in j.translations ?? {}) { dyn[lang].set(k, j.translations[k]); added = true }
        batch.forEach(t => { if (!(t in (j.translations ?? {}))) failedUntil.set(lang + "|" + t, Date.now() + 5 * 60000) })
        if (added) { saveLocal(lang); if (alive) walk(document.body) }
      } catch { batch.forEach(t => failedUntil.set(lang + "|" + t, Date.now() + 60000)) }
      if (pending.size && alive) timer = window.setTimeout(flush, 120)
    }
    const want = (orig: string) => {
      if (lang === "pt") return
      const t = orig.trim()
      if (!eligible(t) || dyn[lang].has(t) || DICT[t]) return
      if ((failedUntil.get(lang + "|" + t) ?? 0) > Date.now()) return
      pending.add(t)
      if (timer === undefined) timer = window.setTimeout(flush, 150)
    }

    if (lang !== "pt") {
      loadLocal(lang)
      void fetchServerCache(lang).then(added => { if (added && alive) walk(document.body) })
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
    return () => { alive = false; if (timer) window.clearTimeout(timer); obs.disconnect() }
  }, [lang])

  const tr = useCallback((pt: string) => lookup(pt, lang) ?? pt, [lang])
  const value = useMemo(() => ({ lang, setLang, tr }), [lang, setLang, tr])
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)
