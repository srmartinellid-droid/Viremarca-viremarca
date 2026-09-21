import { NextRequest, NextResponse } from "next/server"
import { SupabaseAssistantConfigRepository } from "@/lib/core-chat/config"
import { hasGroqApiKey } from "@/lib/core-chat/secrets"
import { createClient } from "@/lib/supabase/server"

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  return data?.role === "admin" || data?.role === "owner"
}

export async function GET() {
  try {
    if (!await assertAdmin()) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
    const config = await new SupabaseAssistantConfigRepository().get()
    return NextResponse.json({ ...config, groq_configured: await hasGroqApiKey() })
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar a configuração." }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!await assertAdmin()) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
    const body = await request.json()
    const config = await new SupabaseAssistantConfigRepository().save({
      enabled: Boolean(body.enabled),
      assistant_name: typeof body.assistant_name === "string" ? body.assistant_name.slice(0, 120) : undefined,
      model: typeof body.model === "string" ? body.model.slice(0, 160) : undefined,
      knowledge_base: typeof body.knowledge_base === "string" ? body.knowledge_base.slice(0, 20000) : undefined,
      fallback_whatsapp: typeof body.fallback_whatsapp === "string" ? body.fallback_whatsapp.slice(0, 40) : undefined,
    })
    return NextResponse.json({ ...config, groq_configured: await hasGroqApiKey() })
  } catch {
    return NextResponse.json({ error: "Não foi possível salvar a configuração." }, { status: 500 })
  }
}
