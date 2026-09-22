import { NextRequest, NextResponse } from "next/server"
import { getAdminProfile } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { getGroqApiKey } from "@/lib/core-chat/secrets"
import { groqAnalyzeConversations } from "@/lib/core-chat/groq"

function redact(text: string) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[e-mail]")
    .replace(/(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-.\s]?\d{4}/g, "[telefone]")
}

export async function POST(_request: NextRequest) {
  const profile = await getAdminProfile()
  if (!profile) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  const supabase = createAdminClient()
  const { data: conversations, error } = await supabase.from("chat_conversations").select("id,last_message_at").gte("last_message_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).order("last_message_at", { ascending: false }).limit(30)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const blocks: string[] = []
  for (const conversation of conversations ?? []) {
    const { data: messages } = await supabase.from("chat_messages").select("role,content").eq("conversation_id", conversation.id).order("created_at", { ascending: true }).limit(30)
    if (!messages?.length) continue
    blocks.push("CONVERSA " + conversation.id + "\n" + messages.map(m => m.role.toUpperCase() + ": " + redact(m.content)).join("\n"))
  }
  if (!blocks.length) return NextResponse.json({ created: 0 })
  try {
    const result = await groqAnalyzeConversations(await getGroqApiKey(), [{ role: "user", content: blocks.join("\n\n").slice(0, 30000) }])
    let created = 0
    for (const suggestion of result.suggestions.slice(0, 5)) {
      if (!suggestion.question.trim() || !suggestion.suggested_answer.trim()) continue
      const { error: insertError } = await supabase.from("chat_kb_suggestions").insert({
        question: suggestion.question.slice(0, 1000),
        suggested_answer: suggestion.suggested_answer.slice(0, 4000),
        source_conversation_id: conversations?.[0]?.id || null,
      })
      if (!insertError) created += 1
    }
    return NextResponse.json({ created })
  } catch (error) {
    console.error("[chat analyze]", error instanceof Error ? error.message : "unknown error")
    return NextResponse.json({ error: "Não foi possível analisar as conversas." }, { status: 500 })
  }
}
