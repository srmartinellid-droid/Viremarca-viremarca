export const EVENT_LABELS: Record<string, string> = {
  whatsapp_click: "Clique no WhatsApp",
  email_click: "Clique no e-mail",
  instagram_click: "Clique no Instagram",
  contact_started: "Início de contato",
  virelab_click: "Clique no VireLab",
  portfolio_view: "Visualização de projeto",
  portfolio_external_click: "Acesso ao site do projeto",
  hero_project_click: "Visualização de projeto (via hero)",
  process_step_interaction: "Interação com etapa do processo",
  deliver_details_open: "Abertura de abordagem",
  traffic_source_landing: "Origem da visita",
  session_region: "Região da sessão",
  contact_cta_context: "Origem do CTA de contato",
}
export const LOCATION_LABELS: Record<string, string> = {
  cta: "botão de chamada",
  footer: "rodapé",
  portfolio_card: "card de projeto",
  portfolio_detail: "página do projeto",
  contact_cta: "seção de contato",
  contact_section: "seção de contato",
  hero: "hero",
  other: "outro ponto de contato",
  landing: "página de entrada",
  process: "processo",
  deliver: "entregas",
}
const COUNTRY_LABELS: Record<string, string> = {
  BR: "Brasil",
  AR: "Argentina",
  CL: "Chile",
  CO: "Colômbia",
  MX: "México",
  US: "Estados Unidos",
  PT: "Portugal",
}
export function eventLabel(name: string) { return EVENT_LABELS[name] ?? "Evento registrado" }
export function formatEventContext(metadata: Record<string, unknown> | null) {
  if (!metadata) return ""
  const parts: string[] = []
  const device = metadata.device_type === "mobile" ? "📱 Mobile" : metadata.device_type === "desktop" ? "🖥️ Desktop" : ""
  if (device) parts.push(device)
  const location = typeof metadata.location === "string" ? LOCATION_LABELS[metadata.location] ?? metadata.location : ""
  if (location) parts.push(`via ${location}`)
  if (typeof metadata.project === "string") parts.push(metadata.project)
  if (typeof metadata.step === "string" || typeof metadata.step === "number") parts.push(`etapa ${metadata.step}`)
  if (typeof metadata.utm_source === "string" && metadata.utm_source) parts.push(`origem ${metadata.utm_source}`)
  if (typeof metadata.utm_medium === "string" && metadata.utm_medium) parts.push(`mídia ${metadata.utm_medium}`)
  if (typeof metadata.utm_campaign === "string" && metadata.utm_campaign) parts.push(`campanha ${metadata.utm_campaign}`)
  if (typeof metadata.referrer === "string" && metadata.referrer) {
    try { parts.push(`referência ${new URL(metadata.referrer).hostname}`) } catch { parts.push("referência externa") }
  }
  const country = typeof metadata.country === "string" ? COUNTRY_LABELS[metadata.country.toUpperCase()] ?? metadata.country : ""
  const region = typeof metadata.region === "string" ? metadata.region : ""
  const city = typeof metadata.city === "string" ? metadata.city : ""
  if (country || region || city) {
    const place = [city, region, country].filter(Boolean).join(", ")
    parts.push(`Origem: ${place}`)
  }
  return parts.join(" · ")
}
