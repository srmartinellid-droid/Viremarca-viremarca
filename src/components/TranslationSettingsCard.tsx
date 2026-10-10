"use client"

import { useCallback, useEffect, useState } from "react"
import { Save } from "lucide-react"

type Cfg = { enabled: boolean; endpoint: string; model: string; daily_cap: number }
const inputCls = "w-full rounded-xl border border-vm-border bg-white px-4 py-3 text-sm text-vm-ink outline-none focus:border-vm-coral"
const labelCls = "mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-vm-muted"

export function TranslationSettingsCard() {
  const [cfg, setCfg] = useState<Cfg>({ enabled: true, endpoint: "https://api.groq.com/openai/v1", model: "openai/gpt-oss-20b", daily_cap: 1500 })
  const [keySource, setKeySource] = useState<"own" | "groq" | null>(null)
  const [newKey, setNewKey] = useState("")
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null)
  const [busy, setBusy] = useState("")

  const call = useCallback(async (method: "GET" | "PUT" | "POST", body?: unknown) => {
    const r = await fetch("/api/admin/translation", { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
    const j = await r.json().catch(() => ({}))
    if (!r.ok || j.ok === false) throw new Error(j.error || "Falha na operação.")
    return j
  }, [])

  const apply = (j: { config?: Cfg; key_source?: "own" | "groq" | null }) => { if (j.config) setCfg(j.config); if ("key_source" in j) setKeySource(j.key_source ?? null) }
  useEffect(() => { call("GET").then(apply).catch(() => setMsg({ kind: "err", text: "Não foi possível carregar a configuração de tradução." })) }, [call])

  const run = async (name: string, fn: () => Promise<string | void>) => {
    setBusy(name); setMsg(null)
    try { const t = await fn(); if (t) setMsg({ kind: "ok", text: t }) } catch (e) { setMsg({ kind: "err", text: e instanceof Error ? e.message : "Erro." }) } finally { setBusy("") }
  }

  const preTranslate = () => run("warm", async () => {
    const paths = ["/", "/privacidade"]
    try { const sm = await fetch("/sitemap.xml").then(r => r.text()); for (const m of sm.matchAll(/<loc>([^<]+)<\/loc>/g)) { try { const p = new URL(m[1]).pathname; if (!paths.includes(p)) paths.push(p) } catch {} } } catch {}
    const texts = new Set<string>()
    for (const p of paths.slice(0, 30)) {
      try {
        const html = await fetch(p).then(r => r.text())
        const doc = new DOMParser().parseFromString(html, "text/html")
        doc.querySelectorAll("script,style,noscript,textarea,[data-no-translate]").forEach(n => n.remove())
        const w = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT)
        let n: Node | null
        while ((n = w.nextNode())) { const t = (n.textContent || "").trim(); if (t.length > 1 && t.length <= 1200 && /\p{L}{2}/u.test(t) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) texts.add(t) }
      } catch {}
    }
    const list = [...texts]
    let done = 0
    for (const lang of ["en", "es"]) {
      for (let i = 0; i < list.length; i += 40) {
        const r = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang, texts: list.slice(i, i + 40) }) })
        const j = await r.json().catch(() => ({}))
        if (j.reason === "no_key") throw new Error("Nenhuma chave de IA configurada.")
        if (j.reason === "daily_cap") throw new Error("Limite diário de traduções atingido. Aumente o limite e tente de novo.")
        if (j.reason === "provider_error") throw new Error("O provedor de IA não respondeu. Use “Testar tradução” para ver o erro.")
        if (j.reason === "disabled") throw new Error("A tradução automática está desativada.")
        done += Object.keys(j.translations ?? {}).length
      }
    }
    return `Pré-tradução concluída: ${list.length} textos encontrados em ${paths.length} páginas (${done} traduções prontas em EN/ES).`
  })

  return (
    <section className="space-y-6 rounded-3xl border border-vm-border bg-white p-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-vm-coral">Idiomas</p>
        <h3 className="mt-2 text-lg font-semibold text-vm-ink">Tradução automática (EN / ES)</h3>
        <p className="mt-1 text-sm text-vm-muted">Todo texto que você editar no painel é traduzido sozinho quando alguém troca de idioma, e o resultado fica guardado para não traduzir de novo. Se você editar o texto, a tradução é refeita.</p>
      </div>
      <label className="flex items-center gap-3 rounded-xl border border-vm-border p-4">
        <input type="checkbox" checked={cfg.enabled} onChange={e => setCfg(c => ({ ...c, enabled: e.target.checked }))} className="accent-vm-coral" />
        <span><strong className="block text-sm text-vm-ink">Tradução automática ativa</strong><small className="text-xs text-vm-muted">Desligada, o site usa só o dicionário fixo e o que já foi traduzido.</small></span>
      </label>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block md:col-span-2"><span className={labelCls}>Endpoint da API (compatível com OpenAI)</span><input value={cfg.endpoint} onChange={e => setCfg(c => ({ ...c, endpoint: e.target.value }))} className={inputCls} placeholder="https://api.groq.com/openai/v1" /></label>
        <label className="block"><span className={labelCls}>Modelo</span><input value={cfg.model} onChange={e => setCfg(c => ({ ...c, model: e.target.value }))} className={inputCls} placeholder="openai/gpt-oss-20b" /></label>
        <label className="block"><span className={labelCls}>Limite diário de textos</span><input type="number" min={50} max={20000} value={cfg.daily_cap} onChange={e => setCfg(c => ({ ...c, daily_cap: Number(e.target.value) }))} className={inputCls} /></label>
      </div>
      <div className="space-y-3 rounded-2xl border border-vm-border bg-vm-bg p-4">
        <div>
          <p className="text-xs font-semibold text-vm-ink">Chave da API de tradução</p>
          <p className="mt-1 text-sm text-vm-muted">{keySource === "own" ? "•••••••• chave própria configurada" : keySource === "groq" ? "usando a mesma chave Groq do assistente" : "nenhuma chave configurada"}</p>
          <p className="mt-1 text-[11px] text-vm-muted">Deixe em branco para usar a chave Groq do assistente. Se informar outra, ela é cifrada e nunca volta ao navegador.</p>
        </div>
        <div className="flex gap-2">
          <input type="password" autoComplete="new-password" value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="Chave própria (opcional)" className="min-w-0 flex-1 rounded-xl border border-vm-border bg-white px-4 py-3 text-sm text-vm-ink outline-none focus:border-vm-coral" />
          <button type="button" disabled={!newKey.trim() || !!busy} onClick={() => run("key", async () => { apply(await call("POST", { action: "save_key", api_key: newKey })); setNewKey(""); return "Chave salva." })} className="rounded-xl bg-vm-ink px-4 py-3 text-xs font-semibold text-white disabled:opacity-50">Salvar chave</button>
          {keySource === "own" && <button type="button" disabled={!!busy} onClick={() => run("key", async () => { apply(await call("POST", { action: "remove_key" })); return "Chave própria removida; voltou a usar a chave Groq." })} className="rounded-xl border border-vm-border px-4 py-3 text-xs font-semibold text-vm-ink disabled:opacity-50">Remover</button>}
        </div>
      </div>
      {msg && <p role="status" className={`rounded-xl px-4 py-3 text-sm ${msg.kind === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" disabled={!!busy} onClick={() => run("test", async () => { const j = await call("POST", { action: "test" }); return `Funcionou em ${j.ms} ms. EN: “${j.en}” · ES: “${j.es}”` })} className="rounded-full border border-vm-border px-5 py-3 text-sm font-semibold text-vm-ink disabled:opacity-50">{busy === "test" ? "Testando…" : "Testar tradução"}</button>
        <button type="button" disabled={!!busy} onClick={() => void preTranslate()} className="rounded-full border border-vm-border px-5 py-3 text-sm font-semibold text-vm-ink disabled:opacity-50">{busy === "warm" ? "Traduzindo o site…" : "Pré-traduzir o site"}</button>
        <button type="button" disabled={!!busy} onClick={() => run("clear", async () => { await call("POST", { action: "clear_cache" }); return "Traduções guardadas apagadas. Elas serão refeitas conforme o uso." })} className="rounded-full border border-vm-border px-5 py-3 text-sm font-semibold text-vm-ink disabled:opacity-50">Limpar traduções</button>
        <button type="button" disabled={!!busy} onClick={() => run("save", async () => { apply(await call("PUT", cfg)); return "Configuração de tradução salva." })} className="inline-flex items-center gap-2 rounded-full bg-vm-coral px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"><Save size={16} />{busy === "save" ? "Salvando…" : "Salvar tradução"}</button>
      </div>
    </section>
  )
}
