import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { saveGroqApiKey, hasGroqApiKey } from "@/lib/core-chat/secrets"

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
    return NextResponse.json({ groq_configured: await hasGroqApiKey() })
  } catch {
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
  } catch {
    return NextResponse.json({ error: "Não foi possível salvar a chave da API Groq." }, { status: 500 })
  }
}
