export type AssistantConfig = {
  enabled: boolean
  assistant_name: string
  model: string
  knowledge_base: string
  fallback_whatsapp: string
  secret_reference: string
}

export type AssistantConfigRepository = {
  get(): Promise<AssistantConfig>
  save(config: Partial<AssistantConfig>): Promise<AssistantConfig>
}

const DEFAULT_CONFIG: AssistantConfig = {
  enabled: false,
  assistant_name: "Assistente VireMarca",
  model: "",
  knowledge_base: "",
  fallback_whatsapp: "",
  secret_reference: "GROQ_API_KEY",
}

function bool(value: string | undefined) {
  return value === "true" || value === "1" || value === "on"
}

function normalize(rows: Array<{ key: string; value: string }> | null | undefined): AssistantConfig {
  const map = Object.fromEntries((rows ?? []).map(row => [row.key, row.value]))
  return {
    enabled: bool(map.assistant_enabled),
    assistant_name: map.assistant_name || DEFAULT_CONFIG.assistant_name,
    model: map.assistant_model || DEFAULT_CONFIG.model,
    knowledge_base: map.assistant_knowledge_base || DEFAULT_CONFIG.knowledge_base,
    fallback_whatsapp: map.assistant_fallback_whatsapp || map.whatsapp || DEFAULT_CONFIG.fallback_whatsapp,
    secret_reference: DEFAULT_CONFIG.secret_reference,
  }
}

export class SupabaseAssistantConfigRepository implements AssistantConfigRepository {
  async get() {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    const { data, error } = await supabase.from("site_settings").select("key,value").in("key", [
      "assistant_enabled", "assistant_name", "assistant_model", "assistant_knowledge_base",
      "assistant_fallback_whatsapp", "whatsapp", "assistant_groq_configured",
    ])
    if (error) throw error
    return normalize(data as Array<{ key: string; value: string }> | null)
  }

  async save(config: Partial<AssistantConfig>) {
    const current = await this.get()
    const next = { ...current, ...config }
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    const rows = [
      { key: "assistant_enabled", value: String(next.enabled) },
      { key: "assistant_name", value: next.assistant_name },
      { key: "assistant_model", value: next.model },
      { key: "assistant_knowledge_base", value: next.knowledge_base },
      { key: "assistant_fallback_whatsapp", value: next.fallback_whatsapp },
      { key: "assistant_groq_configured", value: String(Boolean(process.env.GROQ_API_KEY)) },
    ]
    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" })
    if (error) throw error
    return next
  }
}

export function getGroqApiKey() {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error("GROQ_API_KEY não configurada no ambiente.")
  return key
}
