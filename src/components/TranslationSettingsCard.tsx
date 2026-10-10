"use client"

import { useEffect, useState } from "react"

export function TranslationSettingsCard() {
  const [keySource, setKeySource] = useState<"own" | "groq" | null>(null)
  const [newKey, setNewKey] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null)

  const call = async (method: "GET" | "POST", body?: unknown) => {
    const r = await fetch("/api/admin/translation", { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
    const j = await r.json().catch(() => ({}))
    if (!r.ok || j.ok === false) throw new Error(j.error || "Falha na operação.")
    return j
  }
  useEffect(() => { call("GET").then(j => setKeySource(j.key_source ?? null)).catch(() => {}) }, [])

  const save = async () => {
    setBusy(true); setMsg(null)
    try { const j = await call("POST", { action: "save_key", api_key: newKey }); setKeySource(j.key_source ?? null); setNewKey(""); setMsg({ kind: "ok", text: "Chave salva. A tradução já usa essa chave." }) }
    catch (e) { setMsg({ kind: "err", text: e instanceof Error ? e.message : "Erro ao salvar." }) }
    finally { setBusy(false) }
  }

  return (
    <section className="space-y-4 rounded-3xl border border-vm-border bg-white p-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-vm-coral">Idiomas</p>
        <h3 className="mt-2 text-lg font-semibold text-vm-ink">Chave da tradução automática (EN / ES)</h3>
        <p className="mt-1 text-sm text-vm-muted">O site traduz sozinho qualquer texto que você editar, quando o visitante trocar de idioma. Aqui você só informa a chave.</p>
      </div>
      <p className="text-sm text-vm-muted">{keySource === "own" ? "•••••••• chave de tradução configurada" : keySource === "groq" ? "Usando a mesma chave Groq do assistente. Informe outra abaixo se quiser separar." : "Nenhuma chave configurada."}</p>
      <div className="flex gap-2">
        <input type="password" autoComplete="new-password" value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="Cole a chave da API de tradução" className="min-w-0 flex-1 rounded-xl border border-vm-border bg-white px-4 py-3 text-sm text-vm-ink outline-none focus:border-vm-coral" />
        <button type="button" disabled={busy || !newKey.trim()} onClick={() => void save()} className="rounded-xl bg-vm-ink px-4 py-3 text-xs font-semibold text-white disabled:opacity-50">{busy ? "Salvando…" : "Salvar chave"}</button>
      </div>
      {msg && <p role="status" className={`rounded-xl px-4 py-3 text-sm ${msg.kind === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
    </section>
  )
}
