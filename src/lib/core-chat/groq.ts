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
  const content = payload?.choices?.[0]?.message?.content
  if (typeof content !== "string" || !content.trim()) throw new Error("Resposta inválida da Groq.")
  return content.trim()
}

export async function listGroqModels(apiKey: string) {
  const response = await fetch(GROQ_BASE + "/models", {
    headers: { Authorization: "Bearer " + apiKey },
    next: { revalidate: 300 },
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.error?.message || "Não foi possível consultar os modelos Groq.")
  const ids = Array.isArray(payload?.data)
    ? payload.data.filter((item: any) => typeof item?.id === "string" && item.active !== false).map((item: any) => item.id)
    : []
  return [
    { id: AUTO_MODEL, label: "Automático · custo inteligente" },
    ...ids.filter((id: string) => [COST_EFFICIENT_MODEL, HIGH_CAPABILITY_MODEL].includes(id)).map((id: string) => ({
      id,
      label: id === COST_EFFICIENT_MODEL ? "GPT-OSS 20B · econômico" : "GPT-OSS 120B · maior capacidade",
    })),
  ]
}

export async function transcribeGroq(apiKey: string, file: File) {
  const form = new FormData()
  form.append("file", file, file.name || "audio.webm")
  form.append("model", "whisper-large-v3-turbo")
  form.append("response_format", "json")
  const response = await fetch(GROQ_BASE + "/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey },
    body: form,
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.error?.message || "Falha ao transcrever o áudio.")
  if (typeof payload?.text !== "string") throw new Error("Transcrição inválida.")
  return payload.text.trim()
}
