import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { saveGroqApiKey, hasGroqApiKey } from "@/lib/core-chat/secrets"

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
    return NextResponse.json({ groq_configured: await hasGroqApiKey() })
  } catch (error) {
    console.error("[assistant-secret] GET failed", error)
    return NextResponse.json({ error: "Não foi possível consultar o estado da chave Groq." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await assertAdmin()) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
    const body = await request.json()
    if (typeof body?.api_key !== "string") return NextResponse.json({ error: "Chave da API Groq ausente." }, { status: 400 })
    await saveGroqApiKey(body.api_key)
    return NextResponse.json({ groq_configured: true })
  } catch (error) {
    console.error("[assistant-secret] POST failed", error)
    return NextResponse.json({ error: "Não foi possível salvar a chave da API Groq." }, { status: 500 })
  }
}
