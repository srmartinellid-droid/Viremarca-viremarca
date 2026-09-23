export type GroqChatMessage = { role: "system" | "user" | "assistant"; content: string }

const GROQ_BASE = "https://api.groq.com/openai/v1"

export const AUTO_MODEL = "auto"
export const COST_EFFICIENT_MODEL = "openai/gpt-oss-20b"
export const HIGH_CAPABILITY_MODEL = "openai/gpt-oss-120b"

export function chooseGroqModel(message: string, history: GroqChatMessage[] = []) {
  const text = [message, ...history.map(item => item.content)].join(" ").toLowerCase()
  const complex = text.length > 1800 ||
    /\b(contrato|jurídic|juridic|cláusula|clausula|código|codigo|programa|programação|programacao|api|integração|integracao|arquitetura|estratégia|estrategia|comparar|comparação|comparacao|analisar|análise|analise|técnico|tecnico|detalhado|detalhar|problema|erro|bug)\b/i.test(text)
  return complex ? HIGH_CAPABILITY_MODEL : COST_EFFICIENT_MODEL
}

export function parseGroqResponse(payload: any) {
  const content = payload?.choices?.[0]?.message?.content
  if (typeof content !== "string" || !content.trim()) throw new Error("Resposta inválida da Groq.")
  return content.trim()
}

export async function groqChat(apiKey: string, model: string, messages: GroqChatMessage[]) {
  const response = await fetch(GROQ_BASE + "/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, temperature: 0.3, max_completion_tokens: 240, reasoning_effort: "low", include_reasoning: false }),
    cache: "no-store",
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.error?.message || "Falha ao consultar a Groq.")
  return parseGroqResponse(payload)
}

export async function groqExtractLead(apiKey: string, transcript: GroqChatMessage[]) {
  const response = await fetch(GROQ_BASE + "/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: COST_EFFICIENT_MODEL,
      messages: [
        { role: "system", content: "Extraia dados comerciais da conversa. Não invente. Se um campo não aparecer, retorne null. Responda somente JSON válido com os campos solicitados." },
        ...transcript,
      ],
      temperature: 0,
      max_completion_tokens: 450,
      reasoning_effort: "low",
      include_reasoning: false,
      response_format: { type: "json_object" },
    }),
    cache: "no-store",
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.error?.message || "Falha na extração estruturada.")
  const content = JSON.parse(parseGroqResponse(payload))
  return {
    name: typeof content.name === "string" ? content.name : null,
    whatsapp: typeof content.whatsapp === "string" ? content.whatsapp : null,
    email: typeof content.email === "string" ? content.email : null,
    business_name: typeof content.business_name === "string" ? content.business_name : null,
    business_segment: typeof content.business_segment === "string" ? content.business_segment : null,
    city: typeof content.city === "string" ? content.city : null,
    has_website: typeof content.has_website === "boolean" ? content.has_website : null,
    current_site_url: typeof content.current_site_url === "string" ? content.current_site_url : null,
    demand_summary: typeof content.demand_summary === "string" ? content.demand_summary : null,
    services_interest: Array.isArray(content.services_interest) ? content.services_interest.filter((item: unknown): item is string => typeof item === "string") : null,
    urgency: typeof content.urgency === "string" ? content.urgency : null,
    preferred_contact_time: typeof content.preferred_contact_time === "string" ? content.preferred_contact_time : null,
    summary: typeof content.summary === "string" ? content.summary : null,
    lead_score: typeof content.lead_score === "number" ? Math.max(0, Math.min(100, Math.round(content.lead_score))) : null,
  }
}

export async function groqAnalyzeConversations(apiKey: string, transcript: GroqChatMessage[]) {
  const response = await fetch(GROQ_BASE + "/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: COST_EFFICIENT_MODEL,
      messages: [
        {
          role: "system",
          content: "Analise conversas comerciais recentes. Identifique somente perguntas do visitante que parecem ter recebido uma resposta insuficiente, vaga, ou que exigiria confirmação. Crie no máximo 5 sugestões úteis para a base de conhecimento. Não invente fatos. O campo source_conversation_id deve ser exatamente o ID da conversa que contém a pergunta. Se não houver oportunidade clara, retorne lista vazia.",
        },
        ...transcript,
      ],
      temperature: 0,
      max_tokens: 900,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "viremarca_kb_suggestions",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    source_conversation_id: { type: "string" },
                    question: { type: "string" },
                    suggested_answer: { type: "string" },
                  },
                  required: ["source_conversation_id", "question", "suggested_answer"],
                },
              },
            },
            required: ["suggestions"],
          },
        },
      },
      reasoning_format: "hidden",
    }),
    cache: "no-store",
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.error?.message || "Falha ao analisar conversas.")
  return JSON.parse(parseGroqResponse(payload)) as { suggestions: Array<{ source_conversation_id: string; question: string; suggested_answer: string }> }
}

export async function listGroqModels(apiKey: string) {
  const response = await fetch(GROQ_BASE + "/models", { headers: { Authorization: "Bearer " + apiKey }, next: { revalidate: 300 } })
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.error?.message || "Não foi possível consultar os modelos Groq.")
  const ids = Array.isArray(payload?.data) ? payload.data.filter((item: any) => typeof item?.id === "string" && item.active !== false).map((item: any) => item.id) : []
  return [
    { id: AUTO_MODEL, label: "Automático · custo inteligente" },
    ...ids.filter((id: string) => [COST_EFFICIENT_MODEL, HIGH_CAPABILITY_MODEL].includes(id)).map((id: string) => ({
      id, label: id === COST_EFFICIENT_MODEL ? "GPT-OSS 20B · econômico" : "GPT-OSS 120B · maior capacidade",
    })),
  ]
}

export async function transcribeGroq(apiKey: string, file: File) {
  const form = new FormData()
  form.append("file", file, file.name || "audio.webm")
  form.append("model", "whisper-large-v3-turbo")
  form.append("response_format", "json")
  const response = await fetch(GROQ_BASE + "/audio/transcriptions", { method: "POST", headers: { Authorization: "Bearer " + apiKey }, body: form })
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.error?.message || "Falha ao transcrever o áudio.")
  if (typeof payload?.text !== "string") throw new Error("Transcrição inválida.")
  return payload.text.trim()
}
