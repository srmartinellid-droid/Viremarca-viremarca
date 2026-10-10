import { createAdminClient } from "@/lib/supabase/admin"
import { getNamedSecret, getGroqApiKey } from "@/lib/core-chat/secrets"

export type TLang = "en" | "es"
export const T_LANGS: TLang[] = ["en", "es"]
const LANG_NAME: Record<TLang, string> = { en: "English", es: "Spanish (neutral Latin-American)" }
export const TRANSLATION_SECRET = "translation_api_key"
const MAX_CACHE_ENTRIES = 3000

export type TranslationConfig = { enabled: boolean; endpoint: string; model: string; daily_cap: number }
export const DEFAULT_TRANSLATION_CONFIG: TranslationConfig = { enabled: true, endpoint: "https://api.groq.com/openai/v1", model: "openai/gpt-oss-20b", daily_cap: 1500 }

const CONFIG_KEYS = ["translation_enabled", "translation_endpoint", "translation_model", "translation_daily_cap"]

export async function getTranslationConfig(): Promise<TranslationConfig> {
  const { data } = await createAdminClient().from("site_settings").select("key,value").in("key", CONFIG_KEYS)
  const m = Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]))
  const cap = Number(m.translation_daily_cap)
  return {
    enabled: m.translation_enabled !== "false",
    endpoint: (m.translation_endpoint || DEFAULT_TRANSLATION_CONFIG.endpoint).replace(/\/+$/, ""),
    model: m.translation_model || DEFAULT_TRANSLATION_CONFIG.model,
    daily_cap: Number.isFinite(cap) && cap > 0 ? Math.min(cap, 20000) : DEFAULT_TRANSLATION_CONFIG.daily_cap,
  }
}

export async function saveTranslationConfig(c: Partial<TranslationConfig>) {
  const cur = await getTranslationConfig()
  const n = { ...cur, ...c }
  let endpoint = n.endpoint.trim().replace(/\/+$/, "")
  if (!/^https:\/\/[^\s]+$/i.test(endpoint)) throw new Error("O endpoint precisa começar com https://")
  const rows = [
    { key: "translation_enabled", value: String(n.enabled) },
    { key: "translation_endpoint", value: endpoint },
    { key: "translation_model", value: n.model.trim().slice(0, 160) || DEFAULT_TRANSLATION_CONFIG.model },
    { key: "translation_daily_cap", value: String(Math.max(50, Math.min(20000, Math.round(n.daily_cap)))) },
  ]
  const { error } = await createAdminClient().from("site_settings").upsert(rows, { onConflict: "key" })
  if (error) throw error
  return getTranslationConfig()
}

export async function hasTranslationKey() {
  try { await getNamedSecret(TRANSLATION_SECRET); return "own" as const } catch {}
  try { await getGroqApiKey(); return "groq" as const } catch {}
  return null
}

async function resolveKey() {
  try { return await getNamedSecret(TRANSLATION_SECRET) } catch {}
  return getGroqApiKey()
}

export async function loadCache(lang: TLang): Promise<Record<string, string>> {
  const { data } = await createAdminClient().from("site_settings").select("value").eq("key", "translations_" + lang).maybeSingle()
  if (!data?.value) return {}
  try { const o = JSON.parse(data.value); return o && typeof o === "object" ? o : {} } catch { return {} }
}

async function saveCache(lang: TLang, map: Record<string, string>) {
  const entries = Object.entries(map)
  const trimmed = entries.length > MAX_CACHE_ENTRIES ? Object.fromEntries(entries.slice(entries.length - MAX_CACHE_ENTRIES)) : map
  const { error } = await createAdminClient().from("site_settings").upsert({ key: "translations_" + lang, value: JSON.stringify(trimmed) }, { onConflict: "key" })
  if (error) throw error
}

export async function clearCache() {
  const { error } = await createAdminClient().from("site_settings").delete().in("key", ["translations_en", "translations_es"])
  if (error) throw error
}

async function takeQuota(n: number, cap: number) {
  const db = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await db.from("site_settings").select("value").eq("key", "translation_usage").maybeSingle()
  let used = 0
  try { const u = JSON.parse(data?.value || "{}"); if (u.date === today) used = Number(u.count) || 0 } catch {}
  if (used + n > cap) return false
  await db.from("site_settings").upsert({ key: "translation_usage", value: JSON.stringify({ date: today, count: used + n }) }, { onConflict: "key" })
  return true
}

export async function callModel(cfg: TranslationConfig, apiKey: string, lang: TLang, texts: string[]): Promise<string[]> {
  const system = `You are a professional website translator. Translate each Portuguese (pt-BR) text in the JSON array to ${LANG_NAME[lang]}. Rules: keep the same order and the exact same number of items; keep brand and proper names (VireMarca, Magia Glass, Nascimento Reformas, TSI, WhatsApp, Google, Instagram, Supabase, Vercel), e-mails, URLs, numbers and emojis unchanged; keep leading/trailing spaces and punctuation style; natural marketing tone, concise; if an item needs no translation return it unchanged. Answer ONLY with JSON: {"t":["..."]}.`
  const body: Record<string, unknown> = {
    model: cfg.model,
    messages: [{ role: "system", content: system }, { role: "user", content: JSON.stringify(texts) }],
    temperature: 0.1,
    response_format: { type: "json_object" },
  }
  if (/groq\.com/.test(cfg.endpoint)) { body.reasoning_effort = "low"; body.include_reasoning = false }
  let attempt = 0
  for (;;) {
    const res = await fetch(cfg.endpoint + "/chat/completions", { method: "POST", headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(25000) })
    const payload = await res.json().catch(() => null)
    if (res.ok) {
      const content = payload?.choices?.[0]?.message?.content
      const parsed = JSON.parse(typeof content === "string" ? content : "{}")
      const arr = parsed?.t
      if (!Array.isArray(arr) || arr.length !== texts.length || arr.some((x: unknown) => typeof x !== "string")) throw new Error("Resposta inválida do modelo de tradução.")
      return arr as string[]
    }
    if ((res.status === 429 || res.status >= 500) && attempt < 2) { attempt++; await new Promise(r => setTimeout(r, 1200 * attempt)); continue }
    throw new Error(payload?.error?.message || "Falha ao consultar o modelo de tradução (" + res.status + ").")
  }
}

export type TranslateResult = { translations: Record<string, string>; pending: number; reason?: string }

export async function translateTexts(lang: TLang, texts: string[]): Promise<TranslateResult> {
  const cfg = await getTranslationConfig()
  const cache = await loadCache(lang)
  const out: Record<string, string> = {}
  const missing: string[] = []
  for (const t of new Set(texts)) { if (cache[t] !== undefined) out[t] = cache[t]; else missing.push(t) }
  if (!missing.length) return { translations: out, pending: 0 }
  if (!cfg.enabled) return { translations: out, pending: missing.length, reason: "disabled" }
  let apiKey: string
  try { apiKey = await resolveKey() } catch { return { translations: out, pending: missing.length, reason: "no_key" } }
  if (!(await takeQuota(missing.length, cfg.daily_cap))) return { translations: out, pending: missing.length, reason: "daily_cap" }
  let fresh: Record<string, string> = {}
  try {
    for (let i = 0; i < missing.length; i += 20) {
      const chunk = missing.slice(i, i + 20)
      const res = await callModel(cfg, apiKey, lang, chunk)
      chunk.forEach((src, j) => { fresh[src] = res[j] })
    }
  } catch (e) {
    console.error("[translate] failed", e)
    if (Object.keys(fresh).length === 0) return { translations: out, pending: missing.length, reason: "provider_error" }
  }
  if (Object.keys(fresh).length) {
    const latest = await loadCache(lang)
    await saveCache(lang, { ...latest, ...fresh })
    Object.assign(out, fresh)
  }
  return { translations: out, pending: missing.length - Object.keys(fresh).length }
}
