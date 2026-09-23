export type LeadForScore = {
  whatsapp?: string | null
  name?: string | null
  demand_summary?: string | null
  business_segment?: string | null
  business_name?: string | null
  urgency?: string | null
}

export type ConversationForScore = {
  whatsapp_clicked?: boolean | null
  messages?: Array<{ role?: string; content?: string } | string> | null
}

const COMMERCIAL_QUESTION = /\b(?:quanto custa|qual(?:\s+é|\s+e)?\s+o\s+preço|qual(?:\s+é|\s+e)?\s+o\s+valor|preço|preco|valor|quanto fica|prazo|quanto tempo|em quanto tempo|quando fica pronto|contratar|contratação|contratacao|quero contratar|como contrato)\b/i

export function calculateLeadScore(lead: LeadForScore, conversation: ConversationForScore = {}) {
  let score = 0
  if (lead.whatsapp?.trim()) score += 30
  if (lead.name?.trim()) score += 10
  if (lead.demand_summary?.trim()) score += 20
  if (lead.business_segment?.trim() || lead.business_name?.trim()) score += 10

  const messages = conversation.messages ?? []
  const visitorAskedCommercialQuestion = messages.some(message => {
    const role = typeof message === "string" ? "user" : message.role
    const content = typeof message === "string" ? message : message.content
    return role === "user" && typeof content === "string" && COMMERCIAL_QUESTION.test(content)
  })
  if (visitorAskedCommercialQuestion) score += 15
  if (lead.urgency?.trim()) score += 10
  if (conversation.whatsapp_clicked) score += 5

  return Math.min(100, score)
}
