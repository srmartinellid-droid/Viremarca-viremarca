import { NextResponse } from "next/server"
import { getGroqApiKey } from "@/lib/core-chat/secrets"
import { listGroqModels } from "@/lib/core-chat/groq"

export async function GET() {
  try {
    const apiKey = await getGroqApiKey()
    return NextResponse.json({ models: await listGroqModels(apiKey) })
  } catch {
    return NextResponse.json({ error: "Configure a chave da API Groq para carregar os modelos disponíveis." }, { status: 503 })
  }
}
