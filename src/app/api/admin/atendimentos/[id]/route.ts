import { NextRequest, NextResponse } from "next/server"
import { getAdminProfile } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

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
    if (leadPatch.lead_score !== undefined && leadPatch.lead_score !== null) leadPatch.lead_score = Math.max(0, Math.min(100, Number(leadPatch.lead_score)))
    if (leadPatch.services_interest !== undefined && !Array.isArray(leadPatch.services_interest)) leadPatch.services_interest = []
    const { data: existing } = await supabase.from("chat_leads").select("*").eq("conversation_id", id).maybeSingle()
    const merged = { ...(existing || {}), ...leadPatch, conversation_id: id, updated_at: new Date().toISOString(), contact: leadPatch.whatsapp ?? existing?.whatsapp ?? leadPatch.email ?? existing?.email ?? existing?.contact ?? null, source: existing?.source || "core-chat" }
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
