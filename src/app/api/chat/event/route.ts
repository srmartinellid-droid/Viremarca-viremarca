import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const visitorId = typeof body?.visitor_id === "string" ? body.visitor_id : ""
    const conversationId = typeof body?.conversation_id === "string" ? body.conversation_id : ""
    const event = body?.event
    if (!UUID.test(visitorId) || (conversationId && !UUID.test(conversationId))) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
    if (event !== "whatsapp_clicked" && event !== "consent") return NextResponse.json({ error: "Evento inválido." }, { status: 400 })

    const supabase = createAdminClient()
    const patch: Record<string, unknown> = { consent_at: new Date().toISOString() }
    if (event === "whatsapp_clicked") patch.whatsapp_clicked = true
    let query = supabase.from("chat_conversations").update(patch).eq("visitor_id", visitorId)
    if (conversationId) query = query.eq("id", conversationId)
    else query = query.order("last_message_at", { ascending: false }).limit(1)
    const { error } = await query
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Não foi possível registrar o evento." }, { status: 500 })
  }
}
