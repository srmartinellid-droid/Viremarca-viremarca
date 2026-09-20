"use client"

import { useEffect, useState } from "react"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { trackLandingSourceOncePerSession } from "@/lib/track-event"
import { CONSENT_STORAGE_KEY } from "@/components/CookieConsent"

export function AnalyticsGate() {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    const sync = () => {
      try {
        const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
        setEnabled(Boolean(raw && JSON.parse(raw)?.analytics === true))
      } catch { setEnabled(false) }
    }
    sync()
    window.addEventListener("viremarca-consent-changed", sync)
    return () => window.removeEventListener("viremarca-consent-changed", sync)
  }, [])
  useEffect(() => { if (enabled) void trackLandingSourceOncePerSession() }, [enabled])
  if (!enabled) return null
  return <><Analytics /><SpeedInsights /></>
}
