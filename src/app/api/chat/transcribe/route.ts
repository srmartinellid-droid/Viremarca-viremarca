import { NextRequest, NextResponse } from "next/server"
import { getGroqApiKey } from "@/lib/core-chat/secrets"
import { transcribeGroq } from "@/lib/core-chat/groq"

const ALLOWED = new Set(["audio/webm","audio/wav","audio/x-wav","audio/mpeg","audio/mp4","audio/m4a","audio/ogg"])

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File)) return NextResponse.json({ error: "Arquivo de áudio ausente." }, { status: 400 })
    if (!ALLOWED.has(file.type) && !/\.(webm|wav|mp3|m4a|ogg)$/i.test(file.name)) return NextResponse.json({ error: "Formato de áudio não suportado." }, { status: 415 })
    if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: "Áudio muito grande." }, { status: 413 })
    return NextResponse.json({ text: await transcribeGroq(await getGroqApiKey(), file) })
  } catch {
    return NextResponse.json({ error: "Não foi possível transcrever o áudio." }, { status: 500 })
  }
}
