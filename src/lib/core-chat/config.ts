export type AssistantConfig = {
  enabled: boolean
  assistant_name: string
  model: string
  knowledge_base: string
  fallback_whatsapp: string
  secret_reference: string
  /** Horário (ISO) da última gravação da base no banco; usado para detectar painel desatualizado. */
  knowledge_base_updated_at?: string | null
}

export type AssistantConfigRepository = {
  get(options?: { admin?: boolean }): Promise<AssistantConfig>
  save(config: Partial<AssistantConfig>, options?: SaveOptions): Promise<AssistantConfig>
}

export type SaveOptions = {
  /** `knowledge_base_updated_at` que o painel tinha ao carregar. Se o banco já mudou, a gravação é recusada. */
  expectedKnowledgeBaseUpdatedAt?: string | null
}

/** Limite da base de conhecimento. Acima disso a gravação é recusada com erro (nunca cortada em silêncio). */
export const KNOWLEDGE_BASE_MAX_CHARS = 60000

export class KnowledgeBaseTooLongError extends Error {
  constructor(public readonly length: number) {
    super(`A base de conhecimento tem ${length.toLocaleString("pt-BR")} caracteres e o limite é ${KNOWLEDGE_BASE_MAX_CHARS.toLocaleString("pt-BR")}. Nada foi salvo.`)
    this.name = "KnowledgeBaseTooLongError"
  }
}

export class StaleKnowledgeBaseError extends Error {
  constructor(public readonly currentUpdatedAt: string | null) {
    super("A base de conhecimento foi alterada em outro lugar (outra aba ou aprovação de sugestão) depois que esta página abriu. Nada foi salvo: recarregue o painel para ver a versão atual e refaça a edição.")
    this.name = "StaleKnowledgeBaseError"
  }
}

export class KnowledgeBaseNotPersistedError extends Error {
  constructor() {
    super("O banco não confirmou a gravação da base de conhecimento (o valor lido depois de salvar é diferente do enviado).")
    this.name = "KnowledgeBaseNotPersistedError"
  }
}

async function adminClient() {
  const { createAdminClient } = await import("@/lib/supabase/admin")
  return createAdminClient()
}

const DEFAULT_CONFIG: AssistantConfig = {
  enabled: false,
  assistant_name: "Assistente VireMarca",
  model: "auto",
  knowledge_base: "",
  fallback_whatsapp: "",
  secret_reference: "assistant_secrets.groq_api_key",
}

const CONFIG_KEYS = [
  "assistant_enabled", "assistant_name", "assistant_model", "assistant_knowledge_base",
  "assistant_fallback_whatsapp", "whatsapp",
]

function bool(value: string | undefined) {
  return value === "true" || value === "1" || value === "on"
}

type Row = { key: string; value: string; updated_at?: string | null }

function normalize(rows: Row[] | null | undefined): AssistantConfig {
  const map = Object.fromEntries((rows ?? []).map(row => [row.key, row.value]))
  const kbRow = (rows ?? []).find(row => row.key === "assistant_knowledge_base")
  return {
    enabled: bool(map.assistant_enabled),
    assistant_name: map.assistant_name || DEFAULT_CONFIG.assistant_name,
    model: map.assistant_model || DEFAULT_CONFIG.model,
    knowledge_base: map.assistant_knowledge_base || DEFAULT_CONFIG.knowledge_base,
    fallback_whatsapp: map.assistant_fallback_whatsapp || map.whatsapp || DEFAULT_CONFIG.fallback_whatsapp,
    secret_reference: DEFAULT_CONFIG.secret_reference,
    knowledge_base_updated_at: kbRow?.updated_at ?? null,
  }
}

export class SupabaseAssistantConfigRepository implements AssistantConfigRepository {
  /** Leitura pública (chat). `admin: true` lê com a chave de serviço, para o painel ver exatamente o que está no banco. */
  async get(options: { admin?: boolean } = {}) {
    const supabase = options.admin ? await adminClient() : await (async () => { const { createClient } = await import("@/lib/supabase/server"); return createClient() })()
    const { data, error } = await supabase.from("site_settings").select("key,value,updated_at").in("key", CONFIG_KEYS)
    if (error) throw error
    return normalize(data as Row[] | null)
  }

  /**
   * Grava SOMENTE as chaves enviadas em `config`. Chaves ausentes não são tocadas,
   * para que salvar o nome do assistente nunca regrave a base com um valor antigo.
   */
  async save(config: Partial<AssistantConfig>, options: SaveOptions = {}) {
    // A autorização (admin logado) já foi verificada na rota. A gravação usa a chave de serviço
    // para não depender de a função de permissão do banco (admin/editor) reconhecer o mesmo papel do painel (admin/owner).
    const supabase = await adminClient()
    const now = new Date().toISOString()
    const rows: Array<{ key: string; value: string; updated_at: string }> = []
    const push = (key: string, value: string | undefined) => { if (value !== undefined) rows.push({ key, value, updated_at: now }) }

    if (config.knowledge_base !== undefined) {
      if (config.knowledge_base.length > KNOWLEDGE_BASE_MAX_CHARS) throw new KnowledgeBaseTooLongError(config.knowledge_base.length)
      if (options.expectedKnowledgeBaseUpdatedAt !== undefined) {
        const { data, error } = await supabase.from("site_settings").select("updated_at,value").eq("key", "assistant_knowledge_base").maybeSingle()
        if (error) throw error
        const current = data?.updated_at ?? null
        const sameText = (data?.value ?? "") === config.knowledge_base
        if (current !== (options.expectedKnowledgeBaseUpdatedAt ?? null) && !sameText) throw new StaleKnowledgeBaseError(current)
      }
    }

    if (config.enabled !== undefined) push("assistant_enabled", String(config.enabled))
    push("assistant_name", config.assistant_name)
    push("assistant_model", config.model)
    push("assistant_knowledge_base", config.knowledge_base)
    push("assistant_fallback_whatsapp", config.fallback_whatsapp)
    if (rows.length === 0) return this.get({ admin: true })

    const { data: written, error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" }).select("key")
    if (error) throw error
    if (!written || written.length !== rows.length) throw new KnowledgeBaseNotPersistedError()

    // Relê do banco: o que volta é o que está gravado, não o que foi enviado.
    const saved = await this.get({ admin: true })
    if (config.knowledge_base !== undefined && saved.knowledge_base !== config.knowledge_base) throw new KnowledgeBaseNotPersistedError()
    return saved
  }
}
