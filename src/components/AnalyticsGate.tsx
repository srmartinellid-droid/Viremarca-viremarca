"use client"

import { useEffect, useState } from "react"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { CONSENT_STORAGE_KEY } from "@/components/CookieConsent"

export function AnalyticsGate() {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    const readConsent = () => { try { const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY); const parsed = raw ? (JSON.parse(raw) as { analytics?: boolean }) : null; setEnabled(parsed?.analytics === true) } catch { setEnabled(false) } }
    readConsent(); window.addEventListener("viremarca-consent-changed", readConsent)
    return () => window.removeEventListener("viremarca-consent-changed", readConsent)
  }, [])
  if (!enabled) return null
  return <><Analytics /><SpeedInsights /></>
}
