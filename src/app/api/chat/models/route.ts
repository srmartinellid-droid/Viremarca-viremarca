import { NextResponse } from "next/server"
import { getGroqApiKey } from "@/lib/core-chat/config"
import { listGroqModels } from "@/lib/core-chat/groq"

export async function GET() {
  try {
    return NextResponse.json({ models: await listGroqModels(getGroqApiKey()) })
  } catch (error) {
    console.error("[core-chat-models]", error)
    return NextResponse.json({ error: "Não foi possível carregar os modelos Groq." }, { status: 503 })
  }
}
