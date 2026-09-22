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
    let targetId = conversationId
    if (!targetId) {
      const { data: latest } = await supabase.from("chat_conversations").select("id").eq("visitor_id", visitorId).order("last_message_at", { ascending: false }).limit(1).maybeSingle()
      targetId = latest?.id || ""
    }
    if (!targetId) return NextResponse.json({ ok: true })
    const { error } = await supabase.from("chat_conversations").update(patch).eq("id", targetId).eq("visitor_id", visitorId)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Não foi possível registrar o evento." }, { status: 500 })
  }
}
