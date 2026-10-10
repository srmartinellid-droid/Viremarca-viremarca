const SOCIAL = /(^|\.)(instagram|facebook|fb|wa|whatsapp|tiktok|linktr|youtube|youtu|twitter|x|linkedin|t|telegram)\.(com|me|ee|be|co)$/i
const TLD = "com\\.br|net\\.br|org\\.br|com|net|org|br|io|app|dev|co|info|biz|me|shop|store|online|site|tech|digital|pt|ar|cl"

// Extrai o primeiro endereço de site da mensagem (ignora e-mail, redes sociais e links de WhatsApp).
export function extractSiteUrl(text: string): string | null {
  // Com http(s):// explícito vale qualquer TLD (ex.: .page, .xyz); sem protocolo, só os TLDs conhecidos.
  const re = new RegExp(`(?:https?:\\/\\/(?:[a-z0-9-]+\\.)+[a-z]{2,24}|(?:[a-z0-9-]+\\.)+(?:${TLD}))(?:\\/[^\\s<>"')]*)?`, "gi")
  for (const m of text.matchAll(re)) {
    const raw = m[0]
    const before = text[(m.index ?? 0) - 1]
    if (before === "@" || before === ".") continue
    const cleaned = raw.replace(/[.,;:!?]+$/, "")
    const withProto = /^https?:\/\//i.test(cleaned) ? cleaned : "https://" + cleaned
    try {
      const u = new URL(withProto)
      if (SOCIAL.test(u.hostname)) continue
      return u.toString()
    } catch { continue }
  }
  return null
}
