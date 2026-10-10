"use client"

import { useState } from "react"
import { KeyRound } from "lucide-react"
import { changePasswordAction } from "@/app/actions/auth"

const input = "w-full rounded-xl border border-vm-border bg-white px-4 py-3 text-sm text-vm-ink outline-none transition focus:border-vm-coral focus:ring-4 focus:ring-vm-coral/10"

export function ChangePasswordCard() {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  return (
    <section className="rounded-3xl border border-vm-border bg-white p-6 space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-vm-coral">Segurança</p>
        <h3 className="mt-2 text-lg font-semibold text-vm-ink">Alterar senha do painel</h3>
        <p className="mt-1 text-sm text-vm-muted">Mínimo de 12 caracteres. A senha atual é conferida antes de trocar.</p>
      </div>
      <form
        autoComplete="off"
        onSubmit={async (event) => {
          event.preventDefault()
          const form = event.currentTarget
          setBusy(true); setResult(null)
          const response = await changePasswordAction(new FormData(form))
          setResult(response); setBusy(false)
          if (response.ok) form.reset()
        }}
        className="grid gap-4 md:grid-cols-3"
      >
        <label className="block"><span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-vm-muted">Senha atual</span><input name="current" type="password" autoComplete="current-password" required className={input} /></label>
        <label className="block"><span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-vm-muted">Nova senha</span><input name="next" type="password" autoComplete="new-password" minLength={12} required className={input} /></label>
        <label className="block"><span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-vm-muted">Confirmar nova senha</span><input name="confirm" type="password" autoComplete="new-password" minLength={12} required className={input} /></label>
        <div className="md:col-span-3 flex items-center justify-between gap-4">
          <p role="status" className={`text-sm ${result ? (result.ok ? "text-emerald-700" : "text-red-600") : "text-transparent"}`}>{result?.message ?? "."}</p>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-vm-coral px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"><KeyRound size={16} />{busy ? "Alterando…" : "Alterar senha"}</button>
        </div>
      </form>
    </section>
  )
}
