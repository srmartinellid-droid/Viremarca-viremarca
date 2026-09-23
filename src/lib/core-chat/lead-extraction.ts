export type DeterministicLead = {
  name: string | null
  whatsapp: string | null
  email: string | null
}

const PHONE = /(?:\+?55[\s.-]*)?(?:\(?[1-9][0-9]\)?[\s.-]*)?(?:9[0-9]{4}|[2-5][0-9]{3})[\s.-]*[0-9]{4}/
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const NAME_PATTERNS = [
  /\bme\s+chamo\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’-]{1,}(?:\s+[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’-]{1,}){0,3})/i,
  /\bmeu\s+nome\s+(?:é|e)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’-]{1,}(?:\s+[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’-]{1,}){0,3})/i,
  /\b(?:sou|sou o|sou a)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’-]{1,}(?:\s+[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’-]{1,}){0,3})/i,
]

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "")
  if (digits.startsWith("55") && digits.length >= 12) return "+" + digits
  return digits
}

function cleanName(value: string) {
  return value.replace(/[.!?,;:]+.*$/, "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean).slice(0, 4).join(" ")
}

function isShortNameAnswer(message: string) {
  const text = message.trim()
  if (text.length < 2 || text.length > 70 || PHONE.test(text) || EMAIL.test(text) || /[?\n]/.test(text)) return false
  const words = text.split(/\s+/).filter(Boolean)
  return words.length <= 4 && words.every(word => /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’-]*$/.test(word))
}

export function extractDeterministicLead(message: string, previousAssistantMessage = ""): DeterministicLead {
  const phoneMatch = message.match(PHONE)
  const emailMatch = message.match(EMAIL)
  let name: string | null = null
  for (const pattern of NAME_PATTERNS) {
    const match = message.match(pattern)
    if (match?.[1]) { name = cleanName(match[1]); break }
  }
  const askedName = /\b(?:qual (?:é|e) o seu nome|seu nome|como (?:posso )?te chamar|como você se chama|como voce se chama)\b/i.test(previousAssistantMessage)
  if (!name && askedName && isShortNameAnswer(message)) name = cleanName(message)
  return { name: name || null, whatsapp: phoneMatch ? normalizePhone(phoneMatch[0]) : null, email: emailMatch ? emailMatch[0].trim().toLowerCase() : null }
}
