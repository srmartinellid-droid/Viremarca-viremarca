import { NextRequest, NextResponse } from "next/server"
import { getAdminProfile } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const profile = await getAdminProfile()
  if (!profile) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("chat_kb_suggestions").select("*").order("created_at", { ascending: false }).limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

export async function PATCH(request: NextRequest) {
  const profile = await getAdminProfile()
  if (!profile) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  const body = await request.json()
  if (typeof body.id !== "string") return NextResponse.json({ error: "Sugestão inválida." }, { status: 400 })
  const supabase = createAdminClient()
  if (body.action === "approve") {
    const { error } = await supabase.rpc("append_approved_chat_kb_suggestion", { p_id: body.id })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (body.action === "discard") {
    const { error } = await supabase.from("chat_kb_suggestions").update({ status: "descartada" }).eq("id", body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (body.action === "edit") {
    const patch = {
      question: typeof body.question === "string" ? body.question.slice(0, 1000) : "",
      suggested_answer: typeof body.suggested_answer === "string" ? body.suggested_answer.slice(0, 4000) : "",
    }
    if (!patch.question || !patch.suggested_answer) return NextResponse.json({ error: "Pergunta e resposta são obrigatórias." }, { status: 400 })
    const { error } = await supabase.from("chat_kb_suggestions").update(patch).eq("id", body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else return NextResponse.json({ error: "Ação inválida." }, { status: 400 })
  return NextResponse.json({ ok: true })
}
