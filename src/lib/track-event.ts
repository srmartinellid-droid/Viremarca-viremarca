"use client"

import { createClientOptional } from "@/lib/supabase/client"

export const CONSENT_STORAGE_KEY = "viremarca-consent-v1"
const LANDING_SOURCE_SESSION_KEY = "viremarca-landing-source-v1"
export type EventStatus = "production" | "lab"
type EventMetadata = Record<string, string | number | boolean | null>

function hasAnalyticsConsent() {
  if (typeof window === "undefined") return false
  try { const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY); if (!raw) return false; const parsed = JSON.parse(raw) as { analytics?: boolean }; return parsed.analytics === true } catch { return false }
}

export async function trackEvent(eventName: string, metadata?: EventMetadata, status: EventStatus = "production") {
  if (!hasAnalyticsConsent()) return
  const supabase = createClientOptional(); if (!supabase) return
  const page = window.location.pathname.slice(0, 500)
  const { error } = await supabase.from("site_events").insert({
    event_name: eventName.slice(0, 120),
    page,
    metadata: metadata ?? null,
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
