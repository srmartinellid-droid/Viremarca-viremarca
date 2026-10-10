import { NextRequest, NextResponse, after } from "next/server"
import { SupabaseAssistantConfigRepository } from "@/lib/core-chat/config"
import { getGroqApiKey } from "@/lib/core-chat/secrets"
import { buildSystemPrompt, hasCommercialIntent } from "@/lib/core-chat/prompt"
import { checkRateLimit } from "@/lib/core-chat/rate-limit"
import { chooseGroqModel, groqChat, groqExtractLead } from "@/lib/core-chat/groq"
import { extractDeterministicLead } from "@/lib/core-chat/lead-extraction"
import { sanitizeAssistantResponse } from "@/lib/core-chat/response-sanitizer"
import { calculateLeadScore } from "@/lib/core-chat/lead-score"
import { createAdminClient } from "@/lib/supabase/admin"
import { getNamedSecret } from "@/lib/core-chat/secrets"
import { getTranslationConfig, TRANSLATION_SECRET } from "@/lib/translation/engine"
import { extractSiteUrl } from "@/lib/audit/url"
import { leadGate, askLeadSentence } from "@/lib/audit/gate"
import { unlockPendingAudits, pendingAudits } from "@/lib/audit/run"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function clean(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0, max) : "" }
function validUuid(value: unknown) { return typeof value === "string" && UUID.test(value) }
function normalizeDevice(value: unknown) { return value === "mobile" || value === "tablet" || value === "desktop" ? value : "unknown" }
function logAuxiliary(scope: string, error: unknown) {
  // Erros do Supabase são objetos simples (message/code/details/hint), não Error: registrar o conteúdo real.
  const e = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown } | null
  const text = error instanceof Error ? error.message : e && typeof e === "object" ? [e.message, e.code && "code=" + e.code, e.details, e.hint].filter(Boolean).join(" | ") || "unknown error" : "unknown error"
  console.error("[core-chat " + scope + "]", text)
}

export async function GET(request: NextRequest) {
  const visitorId = request.nextUrl.searchParams.get("visitor_id") || ""
  const conversationId = request.nextUrl.searchParams.get("conversation_id") || ""
  if (!validUuid(visitorId) || !validUuid(conversationId)) return NextResponse.json({ messages: [] })
  try {
    const supabase: any = createAdminClient()
    const { data: conversation } = await supabase.from("chat_conversations").select("id").eq("id", conversationId).eq("visitor_id", visitorId).maybeSingle()
    if (!conversation) return NextResponse.json({ messages: [] })
    const { data, error } = await supabase.from("chat_messages").select("role,content,created_at").eq("conversation_id", conversationId).order("created_at", { ascending: true }).limit(100)
    if (error) throw error
    return NextResponse.json({ messages: data ?? [], conversation_id: conversationId })
  } catch (error) {
    logAuxiliary("history", error)
    return NextResponse.json({ messages: [], conversation_id: conversationId })
  }
}

export async function POST(request: NextRequest) {
  const t0 = Date.now()
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
    let supabase: any = null
    try { supabase = createAdminClient() } catch (error) { logAuxiliary("persistence", error) }

    const conversationId = validUuid(conversationIdInput) ? conversationIdInput : crypto.randomUUID()
    let conversation: any = {
      id: conversationId,
      visitor_id: visitorId,
      page_path: pagePath || null,
      device_type: deviceType,
      message_count: 0,
      has_lead: false,
      consent_at: null,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      last_message_at: new Date().toISOString(),
    }

    if (supabase) {
      try {
        if (validUuid(conversationIdInput)) {
          const { data, error } = await supabase.from("chat_conversations").select("*").eq("id", conversationIdInput).eq("visitor_id", visitorId).maybeSingle()
          if (error) throw error
          if (data) conversation = data
        }
        if (!conversation || !conversation.id) throw new Error("Conversa indisponível.")
        if (!conversation.started_at) {
          const { data, error } = await supabase.from("chat_conversations").insert({
            id: conversationId,
            visitor_id: visitorId,
            page_path: pagePath || null,
            utm_source: clean(utm.source, 200) || null,
            utm_medium: clean(utm.medium, 200) || null,
            utm_campaign: clean(utm.campaign, 200) || null,
            device_type: deviceType,
            expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          }).select("*").single()
          if (error) throw error
          conversation = data
        } else if (!conversation.page_path && pagePath) {
          const { error } = await supabase.from("chat_conversations").update({ page_path: pagePath, device_type: deviceType }).eq("id", conversation.id)
          if (error) logAuxiliary("persistence", error)
        }
      } catch (error) {
        logAuxiliary("persistence", error)
        conversation = { ...conversation, id: conversationId }
      }
    }

    const now = new Date().toISOString()
    if (supabase) {
      try {
        const { error } = await supabase.from("chat_messages").insert({ conversation_id: conversation.id, role: "user", content: message, created_at: now })
        if (error) throw error
      } catch (error) {
        logAuxiliary("persistence", error)
      }
    }

    const auditUrl = extractSiteUrl(message)
    if (auditUrl) {
      const host = new URL(auditUrl).hostname.replace(/^www\./, "")
      // Nome/telefone/e-mail enviados junto com o link também contam (antes eram perdidos e o bot pedia de novo).
      if (supabase) {
        try {
          const textWithoutUrl = message.replace(/(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/\S*)?/gi, " ").replace(/\s+/g, " ").trim()
          const full = extractDeterministicLead(message, "")
          const found = { ...full, name: extractDeterministicLead(textWithoutUrl, "").name }
          if (found.name || found.whatsapp || found.email) {
            await upsertLead(supabase, conversation.id, { ...found, current_site_url: auditUrl, has_website: true }, { messages: [{ role: "user", content: message }], whatsapp_clicked: Boolean(conversation.whatsapp_clicked) })
          }
        } catch (error) { logAuxiliary("persistence", error) }
      }
      const gate = await leadGate(conversation.id)
      const reply = `Vou auditar ${host} agora: experiência do visitante, SEO, velocidade, celular e segurança. Leva cerca de 1 minuto. ` + (gate.complete ? "No fim você baixa o relatório em PDF aqui mesmo." : `O relatório em PDF é liberado em troca do contato: enquanto eu analiso, ${askLeadSentence(gate.missing).replace("Para liberar o relatório, me diz", "me diz")}`)
      if (supabase) {
        try {
          await supabase.from("chat_messages").insert({ conversation_id: conversation.id, role: "assistant", content: reply, model: "audit" })
          await supabase.from("chat_conversations").update({ last_message_at: new Date().toISOString(), message_count: Number(conversation.message_count || 0) + 2, consent_at: conversation.consent_at || now }).eq("id", conversation.id)
        } catch (error) { logAuxiliary("persistence", error) }
      }
      return NextResponse.json({ message: reply, conversation_id: conversation.id, visitor_id: visitorId, audit_url: auditUrl, commercial_intent: false, lead_captured: false })
    }

    const [historyRows, visitorContext, config, existingLeadRow] = await Promise.all([
      (async () => {
        if (!supabase) return null
        try {
          const { data, error } = await supabase.from("chat_messages").select("role,content").eq("conversation_id", conversation.id).order("created_at", { ascending: false }).limit(12)
          if (error) throw error
          return (data ?? []).reverse()
        } catch (error) { logAuxiliary("persistence", error); return null }
      })(),
      (async () => {
        if (!supabase) return null
        try {
          const { data: previousConversations } = await supabase.from("chat_conversations").select("id,last_message_at").eq("visitor_id", visitorId).neq("id", conversation.id).order("last_message_at", { ascending: false }).limit(5)
          if (!previousConversations?.length) return null
          const ids = previousConversations.map((row: any) => row.id)
          const { data: previousLeads } = await supabase.from("chat_leads").select("name,demand_summary,conversation_id").in("conversation_id", ids).not("name", "is", null).limit(5)
          const lead = previousLeads?.[0]
          const source = previousConversations.find((row: any) => row.id === lead?.conversation_id)
          return lead?.name && source ? { name: lead.name, demand: lead.demand_summary || null, lastContact: new Date(source.last_message_at).toLocaleDateString("pt-BR") } : null
        } catch (error) { logAuxiliary("persistence", error); return null }
      })(),
      (async () => {
        try { return await new SupabaseAssistantConfigRepository().get() } catch (error) {
          logAuxiliary("config", error)
          return { enabled: true, assistant_name: "Assistente VireMarca", model: "auto", knowledge_base: "", fallback_whatsapp: "", secret_reference: "assistant_secrets.groq_api_key" } as any
        }
      })(),
      (async () => {
        if (!supabase) return null
        try { const { data } = await supabase.from("chat_leads").select("whatsapp").eq("conversation_id", conversation.id).maybeSingle(); return data } catch (error) { logAuxiliary("persistence", error); return null }
      })(),
    ])
    let history: any[] = historyRows && historyRows.length ? historyRows : [{ role: "user", content: message }]
    if (!config.enabled) return NextResponse.json({ error: "Assistente indisponível.", fallback_whatsapp: config.fallback_whatsapp }, { status: 503 })

    const selectedModel = config.model || "auto"
    const model = selectedModel === "auto" ? chooseGroqModel(message, history) : selectedModel
    const fallbackAnswer = config.fallback_whatsapp
      ? "Posso adiantar seu atendimento por aqui. Se preferir, fale diretamente com a equipe no WhatsApp."
      : "Posso adiantar seu atendimento por aqui. Vou registrar sua mensagem para a equipe VireMarca."

    const previousAssistantMessage = [...history].reverse().find(item => item.role === "assistant")?.content || ""
    const currentDeterministicLead = extractDeterministicLead(message, previousAssistantMessage)
    const knownVisitorPhones = currentDeterministicLead.whatsapp ? [currentDeterministicLead.whatsapp] : []
    if (existingLeadRow?.whatsapp) knownVisitorPhones.push(existingLeadRow.whatsapp)
    const officialWhatsapp = config.fallback_whatsapp || "5548991410717"
    let answer = fallbackAnswer
    const chatMessages = [{ role: "system", content: buildSystemPrompt(config, visitorContext) }, ...history]
    let answered = false
    try {
      answer = await groqChat(await getGroqApiKey(), model, chatMessages)
      answered = true
    } catch (error) {
      logAuxiliary("groq", error)
      // Segunda chave (a da tradução, quando também é Groq): o chat não pode ficar mudo por causa de uma chave só.
      try {
        const cfg = await getTranslationConfig()
        if (/groq\.com/.test(cfg.endpoint)) {
          answer = await groqChat(await getNamedSecret(TRANSLATION_SECRET), model, chatMessages)
          answered = true
        }
      } catch (fallbackError) { logAuxiliary("groq-fallback", fallbackError) }
    }
    if (!answered) {
      // Sem IA disponível, o chat continua cobrando o contato em vez de repetir uma frase morta.
      const gateNow = await leadGate(conversation.id)
      answer = gateNow.complete
        ? "Anotado! Estou com uma instabilidade para responder agora, mas a equipe da VireMarca já vê sua mensagem e te chama no WhatsApp."
        : `Posso adiantar seu atendimento por aqui. ${askLeadSentence(gateNow.missing).replace("Para liberar o relatório, me diz", "Me diz")} Assim a equipe te chama já sabendo do seu caso.`
    }
    answer = sanitizeAssistantResponse(answer, officialWhatsapp, knownVisitorPhones)

    if (supabase) {
      try {
        const { error } = await supabase.from("chat_messages").insert({ conversation_id: conversation.id, role: "assistant", content: answer, model })
        if (error) throw error
      } catch (error) {
        logAuxiliary("persistence", error)
      }
    }

    const messageCount = Number(conversation.message_count || 0) + 2
    if (supabase) {
      try {
        const { error } = await supabase.from("chat_conversations").update({
          last_message_at: new Date().toISOString(),
          message_count: messageCount,
          consent_at: conversation.consent_at || now,
          expires_at: conversation.has_lead ? null : conversation.expires_at,
        }).eq("id", conversation.id)
        if (error) throw error
      } catch (error) {
        logAuxiliary("persistence", error)
      }
    }

    let deterministicLead: any = null
    let userMessages: string[] = [message]
    if (supabase) {
      try {
        const { data: allUsers, error } = await supabase.from("chat_messages").select("content").eq("conversation_id", conversation.id).eq("role", "user").order("created_at", { ascending: true })
        if (error) throw error
        userMessages = (allUsers ?? []).map((row: any) => row.content).filter((value: any): value is string => typeof value === "string")
      } catch (error) {
        logAuxiliary("persistence", error)
      }

      try {
        deterministicLead = currentDeterministicLead
        const hasBasicData = Boolean(deterministicLead.name || deterministicLead.whatsapp || deterministicLead.email)
        if (hasBasicData) {
          const merged = await upsertLead(supabase, conversation.id, deterministicLead, {
            messages: userMessages.map(content => ({ role: "user", content })),
            whatsapp_clicked: Boolean(conversation.whatsapp_clicked),
          })
          await supabase.from("chat_conversations").update({ has_lead: true, expires_at: null }).eq("id", conversation.id)
          deterministicLead = merged
        }
      } catch (error) {
        logAuxiliary("deterministic-extraction", error)
      }
    }

    const commercialIntent = userMessages.some(text => hasCommercialIntent(text))
    const basicDataPresent = Boolean(deterministicLead?.name || deterministicLead?.whatsapp || deterministicLead?.email)
    const userMessageCount = userMessages.length || Math.max(1, Math.ceil(Number(conversation.message_count || 0) / 2))
    const shouldRunLLM = Boolean(supabase && (commercialIntent || basicDataPresent || userMessageCount % 4 === 0))
    const hasLead = Boolean(basicDataPresent)
    // A extração por IA (lenta) roda DEPOIS que a resposta já foi enviada ao visitante.
    if (supabase) {
      const sb = supabase
      const conversationRef = conversation
      after(async () => {
        let extraction: any = null
        if (shouldRunLLM) {
          try {
            const { data: extractionRows, error } = await sb.from("chat_messages").select("role,content").eq("conversation_id", conversationRef.id).order("created_at", { ascending: true }).limit(24)
            if (error) throw error
            const raw = await groqExtractLead(await getGroqApiKey(), (extractionRows ?? []).map((row: any) => ({ role: row.role, content: row.content })))
            extraction = await upsertLead(sb, conversationRef.id, raw, {
              messages: userMessages.map(content => ({ role: "user", content })),
              whatsapp_clicked: Boolean(conversationRef.whatsapp_clicked),
            })
          } catch (error) {
            logAuxiliary("extraction", error)
          }
        }
        const lead = extraction || deterministicLead
        const leadFound = Boolean(lead && (lead.name || lead.whatsapp || lead.email || lead.business_name || lead.business_segment || lead.city || lead.demand_summary || lead.current_site_url))
        if (leadFound) {
          try {
            const { error } = await sb.from("chat_conversations").update({ has_lead: true, summary: lead.summary || lead.demand_summary || null, expires_at: null }).eq("id", conversationRef.id)
            if (error) throw error
          } catch (error) {
            logAuxiliary("persistence", error)
          }
        }
      })
    }

    // Trava de lead: libera auditorias travadas assim que há nome + WhatsApp; antes disso, cobra o que falta.
    let auditUnlock: { message: string } | null = null
    let replyText = answer
    if (supabase) {
      try {
        auditUnlock = await unlockPendingAudits(conversation.id)
        if (!auditUnlock && (await pendingAudits(conversation.id)).length) {
          const gate = await leadGate(conversation.id)
          if (!gate.complete) replyText = `${answer}\n\n${askLeadSentence(gate.missing)}`
        }
      } catch (error) {
        logAuxiliary("audit-gate", error)
      }
    }

    console.log("[core-chat timing] total_ms=" + (Date.now() - t0) + " model=" + model)
    return NextResponse.json({
      message: replyText,
      audit_unlock: auditUnlock?.message ?? null,
      conversation_id: conversation.id,
      visitor_id: visitorId,
      commercial_intent: hasCommercialIntent(message),
      lead_captured: hasLead,
      fallback_whatsapp: config.fallback_whatsapp,
    })
  } catch (error) {
    logAuxiliary("request", error)
    return NextResponse.json({ error: "Não foi possível responder agora. Fale conosco pelo WhatsApp." }, { status: 500 })
  }
}

async function upsertLead(
  supabase: any,
  conversationId: string,
  extraction: any,
  scoreConversation: { messages: Array<{ role: string; content: string }>; whatsapp_clicked?: boolean | null },
) {
  const { data: existing } = await supabase.from("chat_leads").select("*").eq("conversation_id", conversationId).maybeSingle()
  const merged: any = {
    name: extraction.name ?? existing?.name ?? null,
    whatsapp: extraction.whatsapp ?? existing?.whatsapp ?? null,
    email: extraction.email ?? existing?.email ?? null,
    business_name: extraction.business_name ?? existing?.business_name ?? null,
    business_segment: extraction.business_segment ?? existing?.business_segment ?? null,
    city: extraction.city ?? existing?.city ?? null,
    has_website: extraction.has_website ?? existing?.has_website ?? null,
    current_site_url: extraction.current_site_url ?? existing?.current_site_url ?? null,
    demand_summary: extraction.demand_summary ?? existing?.demand_summary ?? null,
    services_interest: extraction.services_interest?.length ? extraction.services_interest : (existing?.services_interest ?? null),
    urgency: extraction.urgency ?? existing?.urgency ?? null,
    preferred_contact_time: extraction.preferred_contact_time ?? existing?.preferred_contact_time ?? null,
    updated_at: new Date().toISOString(),
    contact: extraction.whatsapp ?? existing?.whatsapp ?? extraction.email ?? existing?.email ?? null,
    transcript_summary: extraction.summary ?? existing?.transcript_summary ?? null,
    source: "core-chat",
    conversation_id: conversationId,
  }
  merged.lead_score = calculateLeadScore(merged, scoreConversation)
  const { error } = await supabase.from("chat_leads").upsert(merged, { onConflict: "conversation_id" })
  if (error) throw error
  return merged
}
