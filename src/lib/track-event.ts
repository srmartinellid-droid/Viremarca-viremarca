"use client"

import { createClientOptional } from "@/lib/supabase/client"

export const CONSENT_STORAGE_KEY = "viremarca-consent-v1"
const LANDING_SOURCE_SESSION_KEY = "viremarca-landing-source-v1"
const REGION_SESSION_KEY = "viremarca-region-v1"
export type EventStatus = "production" | "lab"
type EventMetadata = Record<string, string | number | boolean | null>

function hasAnalyticsConsent() {
  if (typeof window === "undefined") return false
  try { const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY); if (!raw) return false; const parsed = JSON.parse(raw) as { analytics?: boolean }; return parsed.analytics === true } catch { return false }
}

function getDeviceType(): "mobile" | "desktop" {
  if (typeof window === "undefined") return "desktop"
  return window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop"
}

export async function trackEvent(eventName: string, metadata?: EventMetadata, status: EventStatus = "production") {
  if (!hasAnalyticsConsent()) return
  const supabase = createClientOptional(); if (!supabase) return
  const page = window.location.pathname.slice(0, 500)
  const eventMetadata = { ...(metadata ?? {}), device_type: getDeviceType() }
  const { error } = await supabase.from("site_events").insert({
    event_name: eventName.slice(0, 120),
    page,
    metadata: eventMetadata,
    status,
  })
  if (error) console.warn("[VireMarca analytics]", error.message)
}

export async function trackLandingSourceOncePerSession() {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return
  if (window.sessionStorage.getItem(LANDING_SOURCE_SESSION_KEY)) return
  const params = new URLSearchParams(window.location.search)
  const metadata = {
    location: "landing",
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    referrer: document.referrer || null,
  }
  window.sessionStorage.setItem(LANDING_SOURCE_SESSION_KEY, "1")
  await trackEvent("traffic_source_landing", metadata, "lab")
}

export async function trackRegionOncePerSession() {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return
  if (window.sessionStorage.getItem(REGION_SESSION_KEY)) return
  window.sessionStorage.setItem(REGION_SESSION_KEY, "1")
  try {
    const response = await fetch("/api/analytics/region", { method: "GET", cache: "no-store", headers: { Accept: "application/json" } })
    if (!response.ok) return
    const region = await response.json() as Record<string, string>
    const metadata: EventMetadata = {}
    for (const key of ["country", "region", "city"] as const) {
      if (typeof region[key] === "string" && region[key]) metadata[key] = region[key]
    }
    if (Object.keys(metadata).length === 0) return
    await trackEvent("session_region", metadata, "lab")
  } catch {
    // Região é opcional e não deve afetar o funcionamento do site.
  }
}
