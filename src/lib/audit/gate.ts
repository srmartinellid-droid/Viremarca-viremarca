import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Trava de lead: o resumo e o PDF da auditoria só são liberados quando a conversa (ou outra conversa
 * do mesmo visitante) já tem NOME e WHATSAPP. Aplicada no servidor, não depende do modelo de IA.
 */
export type LeadGate = { name: boolean; whatsapp: boolean; complete: boolean; missing: string[] }

export async function leadGate(conversationId: string | null | undefined): Promise<LeadGate> {
  const empty: LeadGate = { name: false, whatsapp: false, complete: false, missing: ["nome", "WhatsApp"] }
  if (!conversationId) return empty
  try {
    const db = createAdminClient()
    const ids = new Set<string>([conversationId])
    const { data: conv } = await db.from("chat_conversations").select("visitor_id").eq("id", conversationId).maybeSingle()
    if (conv?.visitor_id) {
      const { data: others } = await db.from("chat_conversations").select("id").eq("visitor_id", conv.visitor_id).limit(30)
      for (const row of others ?? []) ids.add(row.id as string)
    }
    const { data: leads } = await db.from("chat_leads").select("name,whatsapp").in("conversation_id", [...ids])
    const name = (leads ?? []).some(l => typeof l.name === "string" && l.name.trim().length >= 2)
    const whatsapp = (leads ?? []).some(l => typeof l.whatsapp === "string" && l.whatsapp.replace(/\D/g, "").length >= 10)
    const missing = [...(name ? [] : ["nome"]), ...(whatsapp ? [] : ["WhatsApp"])]
    return { name, whatsapp, complete: name && whatsapp, missing }
  } catch (error) {
    console.error("[lead gate]", error instanceof Error ? error.message : error)
    return empty
  }
}

export function askLeadSentence(missing: string[]) {
  const what = missing.length === 2 ? "seu nome e seu WhatsApp" : missing[0] === "nome" ? "seu nome" : "seu WhatsApp"
  return `Para liberar o relatório, me diz ${what}.`
}

export function lockedAuditMessage(host: string, missing: string[]) {
  return `A análise de ${host} está pronta! Para liberar o resumo e o relatório em PDF, preciso de uma coisa em troca: ${missing.length === 2 ? "seu nome e seu WhatsApp" : missing[0] === "nome" ? "seu nome" : "seu WhatsApp"}. A equipe usa o contato para te explicar o plano de correção.`
}
