"use client"

import { createClientOptional } from "@/lib/supabase/client"

export const CONSENT_STORAGE_KEY = "viremarca-consent-v1"
type EventMetadata = Record<string, string | number | boolean | null>

function hasAnalyticsConsent() {
  if (typeof window === "undefined") return false
  try { const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY); if (!raw) return false; const parsed = JSON.parse(raw) as { analytics?: boolean }; return parsed.analytics === true } catch { return false }
}

export async function trackEvent(eventName: string, metadata?: EventMetadata) {
  if (!hasAnalyticsConsent()) return
  const supabase = createClientOptional(); if (!supabase) return
  const page = window.location.pathname.slice(0, 500)
  const { error } = await supabase.from("site_events").insert({ event_name: eventName.slice(0, 120), page, metadata: metadata ?? null })
  if (error) console.warn("[VireMarca analytics]", error.message)
}
