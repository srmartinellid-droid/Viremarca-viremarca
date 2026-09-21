import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { SupabaseAssistantConfigRepository } from "@/lib/core-chat/config"
import { hasGroqApiKey } from "@/lib/core-chat/secrets"

async function assertAdmin() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) throw new Error("Supabase não está configurado no servidor.")

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server route: cookies can be refreshed by middleware.
        }
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (error) throw error
  return data?.role === "admin" || data?.role === "owner"
}

export async function GET() {
  try {
    if (!await assertAdmin()) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
    const config = await new SupabaseAssistantConfigRepository().get()
    return NextResponse.json({ ...config, groq_configured: await hasGroqApiKey() })
  } catch (error) {
    console.error("[assistant-config] GET failed", error)
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
  } catch (error) {
    console.error("[assistant-config] PUT failed", error)
    return NextResponse.json({ error: "Não foi possível salvar a configuração." }, { status: 500 })
  }
}
