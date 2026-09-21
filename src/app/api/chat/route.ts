import { NextRequest, NextResponse } from "next/server"
import { SupabaseAssistantConfigRepository } from "@/lib/core-chat/config"
import { getGroqApiKey } from "@/lib/core-chat/secrets"
import { buildSystemPrompt, extractLead, hasCommercialIntent } from "@/lib/core-chat/prompt"
import { checkRateLimit } from "@/lib/core-chat/rate-limit"
import { chooseGroqModel, groqChat } from "@/lib/core-chat/groq"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
  const limit = checkRateLimit("chat:" + ip)
  if (!limit.allowed) return NextResponse.json({ error: "Limite de mensagens atingido. Tente novamente em alguns minutos." }, { status: 429 })

  try {
    const body = await request.json()
    const message = typeof body?.message === "string" ? body.message.trim() : ""
    const history = Array.isArray(body?.history)
      ? body.history.filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string").slice(-8)
      : []
    if (!message || message.length > 4000) return NextResponse.json({ error: "Mensagem inválida." }, { status: 400 })

    const config = await new SupabaseAssistantConfigRepository().get()
    if (!config.enabled) return NextResponse.json({ error: "Assistente indisponível.", fallback_whatsapp: config.fallback_whatsapp }, { status: 503 })
    const selectedModel = config.model || "auto"

    const lead = extractLead(message)
    const commercial = hasCommercialIntent(message)
    const userMessage = commercial && !lead.contact
      ? message + "\n\nHá intenção comercial. Conduza naturalmente a captura de nome e contato."
      : message
    const answer = await groqChat(await getGroqApiKey(), selectedModel === "auto" ? chooseGroqModel(message, history) : selectedModel, [
      { role: "system", content: buildSystemPrompt(config) },
      ...history,
      { role: "user", content: userMessage },
    ])

    if (lead.contact) await saveLead({
      name: lead.name || "Não informado",
      contact: lead.contact,
      transcript: [message, answer].join("\n"),
      source: "core-chat",
    })

    return NextResponse.json({
      message: answer,
      commercial_intent: commercial,
      lead_captured: Boolean(lead.contact),
      fallback_whatsapp: config.fallback_whatsapp,
    })
  } catch (error) {
    console.error("[core-chat]", error instanceof Error ? error.message : "unknown error")
    return NextResponse.json({ error: "Não foi possível responder agora. Fale conosco pelo WhatsApp." }, { status: 500 })
  }
}

async function saveLead(lead: { name: string; contact: string; transcript: string; source: string }) {
  const supabase = createAdminClient()
  const { error } = await supabase.from("chat_leads").insert({
    name: lead.name,
    contact: lead.contact,
    transcript_summary: lead.transcript.slice(0, 4000),
    source: lead.source,
  })
  if (error) throw error
}
