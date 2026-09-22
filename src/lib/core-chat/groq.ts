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
    body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 350 }),
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
        {
          role: "system",
          content: "Extraia dados comerciais da conversa. Não invente. Se um campo não aparecer, retorne null. Responda apenas no schema JSON.",
        },
        ...transcript,
      ],
      temperature: 0,
      max_tokens: 700,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "viremarca_lead",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: { type: ["string", "null"] },
              whatsapp: { type: ["string", "null"] },
              email: { type: ["string", "null"] },
              business_name: { type: ["string", "null"] },
              business_segment: { type: ["string", "null"] },
              city: { type: ["string", "null"] },
              has_website: { type: ["boolean", "null"] },
              current_site_url: { type: ["string", "null"] },
              demand_summary: { type: ["string", "null"] },
              services_interest: { type: ["array", "null"], items: { type: "string" } },
              urgency: { type: ["string", "null"] },
              preferred_contact_time: { type: ["string", "null"] },
              summary: { type: ["string", "null"] },
              lead_score: { type: ["integer", "null"], minimum: 0, maximum: 100 },
            },
            required: ["name","whatsapp","email","business_name","business_segment","city","has_website","current_site_url","demand_summary","services_interest","urgency","preferred_contact_time","summary","lead_score"],
          },
        },
      },
      reasoning_format: "hidden",
    }),
    cache: "no-store",
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.error?.message || "Falha na extração estruturada.")
  const content = parseGroqResponse(payload)
  return JSON.parse(content) as {
    name: string | null; whatsapp: string | null; email: string | null; business_name: string | null;
    business_segment: string | null; city: string | null; has_website: boolean | null; current_site_url: string | null;
    demand_summary: string | null; services_interest: string[] | null; urgency: string | null;
    preferred_contact_time: string | null; summary: string | null; lead_score: number | null;
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
          content: "Analise conversas comerciais recentes. Identifique somente perguntas do visitante que parecem ter recebido uma resposta insuficiente, vaga, ou que exigiria confirmação. Crie no máximo 5 sugestões úteis para a base de conhecimento. Não invente fatos. Se não houver oportunidade clara, retorne lista vazia.",
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
