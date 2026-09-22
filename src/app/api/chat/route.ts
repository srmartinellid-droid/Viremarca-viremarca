import { NextRequest, NextResponse } from "next/server"
import { SupabaseAssistantConfigRepository } from "@/lib/core-chat/config"
import { getGroqApiKey } from "@/lib/core-chat/secrets"
import { buildSystemPrompt, hasCommercialIntent } from "@/lib/core-chat/prompt"
import { checkRateLimit } from "@/lib/core-chat/rate-limit"
import { chooseGroqModel, groqChat, groqExtractLead } from "@/lib/core-chat/groq"
import { createAdminClient } from "@/lib/supabase/admin"

type ChatMessage = { role: "user" | "assistant"; content: string }
type LeadExtraction = Awaited<ReturnType<typeof groqExtractLead>>
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function clean(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0, max) : "" }
function validUuid(value: unknown) { return typeof value === "string" && UUID.test(value) }
function normalizeDevice(value: unknown) { return value === "mobile" || value === "tablet" || value === "desktop" ? value : "unknown" }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const visitorId = clean(body?.visitor_id, 80)
    const message = clean(body?.message, 2000)
    if (!validUuid(visitorId) || !message) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
    const limit = checkRateLimit("chat:" + visitorId)
    if (!limit.allowed) return NextResponse.json({ error: "Limite de mensagens atingido. Tente novamente em alguns minutos." }, { status: 429 })

    const conversationIdInput = clean(body?.conversation_id, 80)
    const pagePath = clean(body?.page_path, 500)
    const utm = body?.utm && typeof body.utm === "object" ? body.utm : {}
    const deviceType = normalizeDevice(body?.device_type)
    const supabase = createAdminClient()
    let conversation: any = null

    if (validUuid(conversationIdInput)) {
      const { data, error } = await supabase.from("chat_conversations").select("*").eq("id", conversationIdInput).eq("visitor_id", visitorId).maybeSingle()
      if (error) throw error
      conversation = data
    }
    if (!conversation) {
      const { data, error } = await supabase.from("chat_conversations").insert({
        visitor_id: visitorId, page_path: pagePath || null,
        utm_source: clean(utm.source, 200) || null, utm_medium: clean(utm.medium, 200) || null,
        utm_campaign: clean(utm.campaign, 200) || null, device_type: deviceType,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      }).select("*").single()
      if (error) throw error
      conversation = data
    } else if (!conversation.page_path && pagePath) {
      await supabase.from("chat_conversations").update({ page_path: pagePath, device_type: deviceType }).eq("id", conversation.id)
    }

    const now = new Date().toISOString()
    const { error: userMessageError } = await supabase.from("chat_messages").insert({ conversation_id: conversation.id, role: "user", content: message, created_at: now })
    if (userMessageError) throw userMessageError

    const { data: historyRows, error: historyError } = await supabase.from("chat_messages").select("role,content").eq("conversation_id", conversation.id).order("created_at", { ascending: false }).limit(12)
    if (historyError) throw historyError
    const history = ((historyRows ?? []).reverse() as ChatMessage[])

    let visitorContext: { name: string; demand: string | null; lastContact: string } | null = null
    const { data: previousConversations } = await supabase.from("chat_conversations").select("id,last_message_at").eq("visitor_id", visitorId).neq("id", conversation.id).order("last_message_at", { ascending: false }).limit(5)
    if (previousConversations?.length) {
      const ids = previousConversations.map(row => row.id)
      const { data: previousLeads } = await supabase.from("chat_leads").select("name,demand_summary,conversation_id").in("conversation_id", ids).not("name", "is", null).limit(5)
      const lead = previousLeads?.[0]
      const source = previousConversations.find(row => row.id === lead?.conversation_id)
      if (lead?.name && source) visitorContext = { name: lead.name, demand: lead.demand_summary || null, lastContact: new Date(source.last_message_at).toLocaleDateString("pt-BR") }
    }

    const config = await new SupabaseAssistantConfigRepository().get()
    if (!config.enabled) return NextResponse.json({ error: "Assistente indisponível.", fallback_whatsapp: config.fallback_whatsapp }, { status: 503 })
    const selectedModel = config.model || "auto"
    const model = selectedModel === "auto" ? chooseGroqModel(message, history) : selectedModel
    const answer = await groqChat(await getGroqApiKey(), model, [{ role: "system", content: buildSystemPrompt(config, visitorContext) }, ...history])

    const { error: answerError } = await supabase.from("chat_messages").insert({ conversation_id: conversation.id, role: "assistant", content: answer, model })
    if (answerError) throw answerError

    const messageCount = Number(conversation.message_count || 0) + 2
    await supabase.from("chat_conversations").update({
      last_message_at: new Date().toISOString(), message_count: messageCount, consent_at: conversation.consent_at || now,
      expires_at: conversation.has_lead ? null : conversation.expires_at,
    }).eq("id", conversation.id)

    let extraction: LeadExtraction | null = null
    try {
      const { data: extractionRows } = await supabase.from("chat_messages").select("role,content").eq("conversation_id", conversation.id).order("created_at", { ascending: false }).limit(12)
      extraction = await groqExtractLead(await getGroqApiKey(), ((extractionRows ?? []).reverse() as ChatMessage[]))
      await upsertLead(supabase, conversation.id, extraction)
    } catch (error) {
      console.error("[core-chat extraction]", error instanceof Error ? error.message : "unknown error")
    }

    const hasLead = Boolean(extraction && (extraction.name || extraction.whatsapp || extraction.email || extraction.business_name || extraction.business_segment || extraction.city || extraction.demand_summary || extraction.current_site_url))
    if (hasLead || extraction) {
      await supabase.from("chat_conversations").update({
        has_lead: hasLead, summary: extraction?.summary || extraction?.demand_summary || null,
        expires_at: hasLead ? null : conversation.expires_at,
      }).eq("id", conversation.id)
    }

    return NextResponse.json({ message: answer, conversation_id: conversation.id, visitor_id: visitorId, commercial_intent: hasCommercialIntent(message), lead_captured: hasLead, fallback_whatsapp: config.fallback_whatsapp })
  } catch (error) {
    console.error("[core-chat]", error instanceof Error ? error.message : "unknown error")
    return NextResponse.json({ error: "Não foi possível responder agora. Fale conosco pelo WhatsApp." }, { status: 500 })
  }
}

async function upsertLead(supabase: ReturnType<typeof createAdminClient>, conversationId: string, extraction: LeadExtraction) {
  const { data: existing } = await supabase.from("chat_leads").select("*").eq("conversation_id", conversationId).maybeSingle()
  const merged = {
    name: extraction.name ?? existing?.name ?? null,
    whatsapp: extraction.whatsapp ?? existing?.whatsapp ?? null, email: extraction.email ?? existing?.email ?? null,
    business_name: extraction.business_name ?? existing?.business_name ?? null, business_segment: extraction.business_segment ?? existing?.business_segment ?? null,
    city: extraction.city ?? existing?.city ?? null, has_website: extraction.has_website ?? existing?.has_website ?? null,
    current_site_url: extraction.current_site_url ?? existing?.current_site_url ?? null, demand_summary: extraction.demand_summary ?? existing?.demand_summary ?? null,
    services_interest: extraction.services_interest?.length ? extraction.services_interest : (existing?.services_interest ?? null),
    urgency: extraction.urgency ?? existing?.urgency ?? null, preferred_contact_time: extraction.preferred_contact_time ?? existing?.preferred_contact_time ?? null,
    lead_score: typeof extraction.lead_score === "number" ? Math.max(0, Math.min(100, extraction.lead_score)) : (existing?.lead_score ?? null),
    updated_at: new Date().toISOString(), contact: extraction.whatsapp ?? existing?.whatsapp ?? extraction.email ?? existing?.email ?? null,
    transcript_summary: extraction.summary ?? existing?.transcript_summary ?? null, source: "core-chat", conversation_id: conversationId,
  }
  const { error } = await supabase.from("chat_leads").upsert(merged, { onConflict: "conversation_id" })
  if (error) throw error
}
