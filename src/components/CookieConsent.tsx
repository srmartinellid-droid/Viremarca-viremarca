"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Cookie, Settings, X } from "lucide-react"

export const CONSENT_STORAGE_KEY = "viremarca-consent-v1"

type Consent = { necessary: true; analytics: boolean; savedAt: string }

export function CookieConsent() {
  const [open, setOpen] = useState(false)
  const [preferences, setPreferences] = useState(false)
  const [analytics, setAnalytics] = useState(false)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CONSENT_STORAGE_KEY)
      if (!saved) setOpen(true)
      else {
        const parsed = JSON.parse(saved) as Partial<Consent>
        setAnalytics(Boolean(parsed.analytics))
      }
    } catch {
      setOpen(true)
    }
  }, [])

  const save = (allowAnalytics: boolean) => {
    const consent: Consent = { necessary: true, analytics: allowAnalytics, savedAt: new Date().toISOString() }
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent))
    window.dispatchEvent(new CustomEvent("viremarca-consent-changed"))
    setAnalytics(allowAnalytics)
    setOpen(false)
    setPreferences(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-x-3 bottom-3 z-[100] md:inset-x-auto md:right-5 md:w-[min(440px,calc(100vw-2rem))]">
      <div className="rounded-[1.5rem] border border-vm-border bg-white p-5 shadow-[0_24px_80px_-30px_rgba(0,0,0,0.45)]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-vm-sand p-2 text-vm-coral"><Cookie size={18} /></div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-vm-ink">Privacidade e cookies</h2>
            <p className="mt-1 text-xs leading-relaxed text-vm-muted">
              Usamos cookies e armazenamento local necessários para o funcionamento do site. Com sua permissão, podemos usar recursos de análise para entender como a VireMarca é utilizada. A análise pode coletar a região aproximada da visita (país, estado e cidade) de forma agregada para fins estatísticos, sem armazenar o endereço IP.
            </p>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="rounded-full p-1.5 text-vm-muted hover:bg-vm-bg"><X size={15} /></button>
        </div>

        {preferences && (
          <div className="mt-4 rounded-2xl border border-vm-border bg-vm-bg p-4">
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-xs font-semibold text-vm-ink">Necessários</p><p className="mt-1 text-[11px] text-vm-muted">Sempre ativos para o funcionamento básico.</p></div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-vm-muted">Ativos</span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div><p className="text-xs font-semibold text-vm-ink">Análise</p><p className="mt-1 text-[11px] text-vm-muted">Ajuda a entender navegação e desempenho.</p></div>
              <button type="button" role="switch" aria-checked={analytics} onClick={() => setAnalytics(v => !v)} className={`relative h-6 w-11 rounded-full transition ${analytics ? "bg-vm-coral" : "bg-black/15"}`}>
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${analytics ? "left-6" : "left-1"}`} />
              </button>
            </div>
            <div className="mt-4"><Link href="/privacidade" className="text-[11px] font-semibold text-vm-coral hover:underline">Ler política de privacidade</Link></div>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {!preferences && <button type="button" onClick={() => setPreferences(true)} className="inline-flex items-center justify-center gap-2 rounded-full border border-vm-border px-4 py-2.5 text-xs font-semibold text-vm-ink hover:border-vm-coral"><Settings size={14} />Preferências</button>}
          {preferences ? (
            <><button type="button" onClick={() => save(false)} className="rounded-full border border-vm-border px-4 py-2.5 text-xs font-semibold text-vm-ink">Recusar análise</button><button type="button" onClick={() => save(analytics)} className="rounded-full bg-vm-coral px-4 py-2.5 text-xs font-semibold text-white">Salvar preferências</button></>
          ) : (
            <><button type="button" onClick={() => save(false)} className="rounded-full border border-vm-border px-4 py-2.5 text-xs font-semibold text-vm-ink">Continuar sem análise</button><button type="button" onClick={() => save(true)} className="rounded-full bg-vm-coral px-4 py-2.5 text-xs font-semibold text-white">Aceitar análise</button></>
          )}
        </div>
      </div>
    </div>
  )
}
