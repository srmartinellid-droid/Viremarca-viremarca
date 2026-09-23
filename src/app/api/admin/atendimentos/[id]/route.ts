import { NextRequest, NextResponse } from "next/server"
import { getAdminProfile } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { getGroqApiKey } from "@/lib/core-chat/secrets"
import { groqExtractLead } from "@/lib/core-chat/groq"
import { extractDeterministicLead } from "@/lib/core-chat/lead-extraction"
import { calculateLeadScore } from "@/lib/core-chat/lead-score"

const allowedStatuses = new Set(["novo","em_atendimento","convertido","perdido","arquivado"])

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const profile = await getAdminProfile()
  if (!profile) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  const { id } = await context.params
  const supabase = createAdminClient()
  const { data: conversation, error } = await supabase.from("chat_conversations").select("*").eq("id", id).maybeSingle()
  if (error || !conversation) return NextResponse.json({ error: "Atendimento não encontrado." }, { status: 404 })
  const [{ data: lead }, { data: messages }] = await Promise.all([
    supabase.from("chat_leads").select("*").eq("conversation_id", id).maybeSingle(),
    supabase.from("chat_messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true }),
  ])
  return NextResponse.json({ conversation, lead, messages: messages ?? [] })
}


export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const profile = await getAdminProfile()
  if (!profile) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  const { id } = await context.params
  const supabase = createAdminClient()
  const [{ data: messages, error: messagesError }, { data: existingLead }, { data: conversation }] = await Promise.all([
    supabase.from("chat_messages").select("id,role,content,created_at").eq("conversation_id", id).order("created_at", { ascending: true }),
    supabase.from("chat_leads").select("*").eq("conversation_id", id).maybeSingle(),
    supabase.from("chat_conversations").select("whatsapp_clicked").eq("id", id).maybeSingle(),
  ])
  if (messagesError) return NextResponse.json({ error: messagesError.message }, { status: 500 })
  if (!messages?.length) return NextResponse.json({ error: "Conversa sem mensagens." }, { status: 400 })

  let merged = existingLead || { conversation_id: id, source: "core-chat" }
  for (const [index, message] of messages.entries()) {
    if (message.role !== "user") continue
    const previousAssistant = [...messages.slice(0, index)].reverse().find(item => item.role === "assistant")?.content || ""
    const basic = extractDeterministicLead(message.content, previousAssistant)
    if (basic.name || basic.whatsapp || basic.email) {
      const current: any = {
        ...merged,
        name: basic.name ?? merged.name ?? null,
        whatsapp: basic.whatsapp ?? merged.whatsapp ?? null,
        email: basic.email ?? merged.email ?? null,
        conversation_id: id,
        source: merged.source || "core-chat",
        updated_at: new Date().toISOString(),
        contact: basic.whatsapp ?? merged.whatsapp ?? basic.email ?? merged.email ?? merged.contact ?? null,
      }
      current.lead_score = calculateLeadScore(current, {
        messages: messages.map(message => ({ role: message.role, content: message.content })),
        whatsapp_clicked: Boolean(conversation?.whatsapp_clicked),
      })
      current.lead_score = calculateLeadScore(current, {
      messages: messages.map(message => ({ role: message.role, content: message.content })),
      whatsapp_clicked: Boolean(conversation?.whatsapp_clicked),
    })
    const { error } = await supabase.from("chat_leads").upsert(current, { onConflict: "conversation_id" })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      merged = current
    }
  }

  try {
    const transcript = messages.map(message => ({ role: message.role as "user" | "assistant", content: message.content }))
    const extraction = await groqExtractLead(await getGroqApiKey(), transcript)
    const current: any = {
      ...merged,
      name: extraction.name ?? merged.name ?? null,
      whatsapp: extraction.whatsapp ?? merged.whatsapp ?? null,
      email: extraction.email ?? merged.email ?? null,
      business_name: extraction.business_name ?? merged.business_name ?? null,
      business_segment: extraction.business_segment ?? merged.business_segment ?? null,
      city: extraction.city ?? merged.city ?? null,
      has_website: extraction.has_website ?? merged.has_website ?? null,
      current_site_url: extraction.current_site_url ?? merged.current_site_url ?? null,
      demand_summary: extraction.demand_summary ?? merged.demand_summary ?? null,
      services_interest: extraction.services_interest?.length ? extraction.services_interest : (merged.services_interest ?? null),
      urgency: extraction.urgency ?? merged.urgency ?? null,
      preferred_contact_time: extraction.preferred_contact_time ?? merged.preferred_contact_time ?? null,
      transcript_summary: extraction.summary ?? merged.transcript_summary ?? null,
      updated_at: new Date().toISOString(),
      contact: extraction.whatsapp ?? merged.whatsapp ?? extraction.email ?? merged.email ?? merged.contact ?? null,
      conversation_id: id,
      source: merged.source || "core-chat",
    }
    current.lead_score = calculateLeadScore(current, {
      messages: messages.map(message => ({ role: message.role, content: message.content })),
      whatsapp_clicked: Boolean(conversation?.whatsapp_clicked),
    })
    const { error } = await supabase.from("chat_leads").upsert(current, { onConflict: "conversation_id" })
    if (error) throw error
    merged = current
    await supabase.from("chat_conversations").update({ has_lead: Boolean(current.name || current.whatsapp || current.email || current.demand_summary), summary: current.transcript_summary || current.demand_summary || null, expires_at: current.name || current.whatsapp || current.email ? null : undefined }).eq("id", id)
  } catch (error) {
    console.error("[core-chat reprocess]", error instanceof Error ? error.message : "unknown error")
    if (!(merged.name || merged.whatsapp || merged.email)) return NextResponse.json({ error: "Não foi possível reprocessar a ficha." }, { status: 502 })
  }

  return NextResponse.json({ ok: true, lead: merged })
}
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const profile = await getAdminProfile()
  if (!profile) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  const { id } = await context.params
  const body = await request.json()
  const supabase = createAdminClient()

  if (body.status !== undefined) {
    if (!allowedStatuses.has(body.status)) return NextResponse.json({ error: "Status inválido." }, { status: 400 })
    const { error } = await supabase.from("chat_conversations").update({ status: body.status }).eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (body.admin_notes !== undefined || body.summary !== undefined) {
    const patch: Record<string, unknown> = {}
    if (body.admin_notes !== undefined) patch.admin_notes = typeof body.admin_notes === "string" ? body.admin_notes.slice(0, 10000) : null
    if (body.summary !== undefined) patch.summary = typeof body.summary === "string" ? body.summary.slice(0, 5000) : null
    const { error } = await supabase.from("chat_conversations").update(patch).eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const leadFields = ["name","whatsapp","email","business_name","business_segment","city","has_website","current_site_url","demand_summary","services_interest","urgency","preferred_contact_time","lead_score"]
  const leadPatch: Record<string, unknown> = {}
  for (const field of leadFields) if (field in body) leadPatch[field] = body[field]
  if (Object.keys(leadPatch).length) {
    delete leadPatch.lead_score
    if (leadPatch.services_interest !== undefined && !Array.isArray(leadPatch.services_interest)) leadPatch.services_interest = []
    const [{ data: existing }, { data: conversation }, { data: messages }] = await Promise.all([
      supabase.from("chat_leads").select("*").eq("conversation_id", id).maybeSingle(),
      supabase.from("chat_conversations").select("whatsapp_clicked").eq("id", id).maybeSingle(),
      supabase.from("chat_messages").select("role,content").eq("conversation_id", id).order("created_at", { ascending: true }),
    ])
    const merged: any = { ...(existing || {}), ...leadPatch, conversation_id: id, updated_at: new Date().toISOString(), contact: leadPatch.whatsapp ?? existing?.whatsapp ?? leadPatch.email ?? existing?.email ?? existing?.contact ?? null, source: existing?.source || "core-chat" }
    merged.lead_score = calculateLeadScore(merged, { messages: messages ?? [], whatsapp_clicked: Boolean(conversation?.whatsapp_clicked) })
    const { error } = await supabase.from("chat_leads").upsert(merged, { onConflict: "conversation_id" })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await supabase.from("chat_conversations").update({ has_lead: Boolean(merged.name || merged.whatsapp || merged.email || merged.demand_summary), expires_at: merged.name || merged.whatsapp || merged.email ? null : undefined }).eq("id", id)
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const profile = await getAdminProfile()
  if (!profile) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  const { id } = await context.params
  const supabase = createAdminClient()
  const { error } = await supabase.from("chat_conversations").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
