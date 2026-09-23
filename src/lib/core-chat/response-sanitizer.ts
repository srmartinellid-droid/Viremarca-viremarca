const OFFICIAL_FALLBACK_WHATSAPP = "5548991410717"

function digits(value: string) {
  return value.replace(/\D/g, "")
}

function normalizedDigits(value: string) {
  return digits(value)
}

function canonicalBrazilPhone(value: string) {
  const valueDigits = normalizedDigits(value)
  return valueDigits.startsWith("55") && valueDigits.length >= 12 ? valueDigits.slice(2) : valueDigits
}

function officialUrl(value: string) {
  const official = normalizedDigits(value) || OFFICIAL_FALLBACK_WHATSAPP
  return "https://wa.me/" + official
}

function phoneInUrl(url: string) {
  const wa = url.match(/^https?:\/\/(?:www\.)?wa\.me\/([^\s"'<>?#]+)/i)
  if (wa?.[1]) return digits(wa[1])
  const api = url.match(/^https?:\/\/(?:www\.)?api\.whatsapp\.com\/send\?[^\s"'<>]*?phone=([^&\s"'<>]+)/i)
  return api?.[1] ? digits(api[1]) : ""
}

export function sanitizeAssistantResponse(answer: string, officialWhatsapp: string, visitorPhones: string[] = []) {
  const official = normalizedDigits(officialWhatsapp) || OFFICIAL_FALLBACK_WHATSAPP
  const urlPattern = /https?:\/\/(?:www\.)?(?:wa\.me\/[^\s"'<>]+|api\.whatsapp\.com\/send\?[^\s"'<>]+)/gi
  let sanitized = answer.replace(urlPattern, url => {
    const trailing = url.match(/[.,;:!?)]*$/)?.[0] || ""
    const core = trailing ? url.slice(0, -trailing.length) : url
    const phone = phoneInUrl(core)
    return (phone === official ? core : officialUrl(official)) + trailing
  })

  const visitorNumbers = visitorPhones.map(canonicalBrazilPhone).filter(value => value.length >= 10)
  if (!visitorNumbers.length) return sanitized

  const contextPattern = /\b(?:fale|falar|clique|chame|ligue)\b[^.!?\n]{0,100}/gi
  const phonePattern = /(?:\+?55[\s.-]*)?(?:\(?[1-9][0-9]\)?[\s.-]*)?(?:9[0-9]{4}|[2-5][0-9]{3})[\s.-]*[0-9]{4}/g

  sanitized = sanitized.replace(contextPattern, segment =>
    segment.replace(phonePattern, phone => {
      const candidate = canonicalBrazilPhone(phone)
      return visitorNumbers.includes(candidate) ? official : phone
    }),
  )

  return sanitized
}
