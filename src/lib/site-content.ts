import { createClientOptional } from "@/lib/supabase/server"
import { DEMO_CONTENT } from "@/lib/demo-data"
import { DEFAULT_TITLE_STYLES, type TitleStyle } from "@/lib/visual-defaults"

export type ProcessItem = { step: string; title: string; desc: string; image: string }
export type DeliverItem = { title: string; desc: string; image: string; details: string }
export type DividerStyle = { label: string; mode: "color" | "image"; backgroundColor: string; textColor: string; overlay: number; images: string[]; position: string; scale: number }
export type PublicSiteContent = { heroTitle: string; heroAccent: string; heroSubtitle: string; heroAccentIntensity: number; heroImage: string; heroMobileImage: string; heroBackgroundImages: string[]; heroMobileBackgroundImages: string[]; heroOverlayIntensity: number; heroBackgroundPosition: string; heroBackgroundScale: number; heroCardsMotion: number; logo1: string; logo2: string; titleStyles: Record<string, TitleStyle>; dividerStyles: Record<string, DividerStyle>; aboutTitle: string; aboutBody: string; process: ProcessItem[]; delivers: DeliverItem[]; contact: { whatsapp: string; email: string; instagram: string }; commercial: CommercialSections }

export type PillarItem = { title: string; desc: string }
export type SolutionItem = { title: string; desc: string }
export type ConversationMessage = { from: "client" | "assistant"; text: string }
export type ConversationDemo = { label: string; messages: ConversationMessage[] }
export type DiagnosticItem = { title: string; desc: string }
export type CommercialSections = {
  pillars: { eyebrow: string; title: string; highlight: string; subtitle: string; items: PillarItem[]; note: string }
  solutions: { eyebrow: string; title: string; highlight: string; subtitle: string; items: SolutionItem[]; examples: string[]; note: string; cta: string; demos: ConversationDemo[] }
  diagnostic: { eyebrow: string; title: string; highlight: string; subtitle: string; items: DiagnosticItem[]; cta: string; note: string }
}

const fallbackProcess: ProcessItem[] = DEMO_CONTENT.process.map((item, index) => ({ ...item, image: ["/portfolio/magia-glass.jpg", "/portfolio/odonto.jpg", "/portfolio/imoveis.jpg", "/portfolio/advocacia.jpg"][index] }))
const fallbackDelivers: DeliverItem[] = DEMO_CONTENT.delivers.map((item, index) => ({ ...item, image: ["/portfolio/magia-glass.jpg", "/portfolio/odonto.jpg", "/portfolio/imoveis.jpg", "/portfolio/advocacia.jpg", "/portfolio/odonto.jpg", "/portfolio/magia-glass.jpg"][index], details: "Conteúdo, estrutura e direção visual definidos para o objetivo do projeto." }))

const fallbackCommercial: CommercialSections = {
  pillars: { eyebrow: "Como ajudamos", title: "Três frentes. Uma presença coerente.", highlight: "Uma presença coerente.", subtitle: "Seu negócio aparece para o cliente em vários lugares. Cuidamos de cada um deles com a mesma identidade.", items: [
    { title: "Site profissional", desc: "Seu site próprio, com painel para atualizar conteúdo, estrutura para ser encontrado e contato direto por WhatsApp." },
    { title: "Google Meu Negócio", desc: "Perfil configurado e organizado para apresentar seu negócio nas buscas e no mapa da sua região, com informações, fotos e horários corretos." },
    { title: "Arte e conteúdo", desc: "Peças visuais para redes sociais, promoções e materiais impressos, alinhadas à identidade da sua marca." },
  ], note: "Contrate uma frente ou as três, conforme o momento do seu negócio." },
  solutions: { eyebrow: "Soluções inteligentes", title: "Seu site atende. Mesmo quando você não pode.", highlight: "Mesmo quando você não pode.", subtitle: "Recursos que transformam o site de vitrine em parte da operação do seu negócio.", items: [
    { title: "Atendimento com IA", desc: "Responde dúvidas a qualquer hora, com base nas informações do seu negócio, e encaminha para o seu WhatsApp quando precisa de você." },
    { title: "Agendamentos e reservas", desc: "O cliente envia o pedido de horário ou reserva direto pelo site, sem esperar alguém responder." },
    { title: "Integração com o seu sistema", desc: "Conectamos o site ao PDV, à agenda ou ao sistema de reservas que você já usa." },
  ], examples: [], note: "Cada solução é avaliada conforme o seu negócio e os sistemas que você já utiliza.", cta: "Conversar sobre o meu negócio", demos: [
    { label: "Pousada", messages: [
      { from: "client", text: "Oi! Vocês têm quarto para casal no próximo feriado?" },
      { from: "assistant", text: "Olá! Temos opções para casal nessas datas. Quer que eu registre seu pedido de reserva? A equipe confirma pela manhã." },
      { from: "client", text: "Quero sim!" },
      { from: "assistant", text: "Perfeito. Só preciso do seu nome e WhatsApp." },
    ] },
    { label: "Clínica", messages: [
      { from: "client", text: "Vocês atendem aos sábados?" },
      { from: "assistant", text: "Atendemos aos sábados pela manhã. Posso registrar um pré-agendamento para você?" },
      { from: "client", text: "Pode ser às 9h?" },
      { from: "assistant", text: "Anotado! A recepção confirma o horário com você." },
    ] },
    { label: "Comércio", messages: [
      { from: "client", text: "Tem esse modelo no tamanho 42?" },
      { from: "assistant", text: "Vou verificar a disponibilidade para você." },
      { from: "assistant", text: "Temos o 42 disponível. Quer que eu envie o link para falar com um vendedor?" },
    ] },
  ] },
  diagnostic: { eyebrow: "Diagnóstico gratuito", title: "Seu site está vendendo, ou custando clientes?", highlight: "ou custando clientes?", subtitle: "Uma avaliação técnica e visual do seu site atual, com nota por critério e um plano claro do que corrigir.", items: [
    { title: "Auditoria", desc: "Desempenho, versão mobile, clareza visual e experiência de quem visita, com nota de 0 a 10." },
    { title: "Relatório", desc: "Um documento visual com o que funciona, o que não funciona e o impacto nos seus contatos." },
    { title: "Caminho", desc: "Um plano de correção objetivo, sem jargão técnico." },
  ], cta: "Solicitar meu diagnóstico", note: "Ainda não tem site? Fale com a gente" },
}

const fallbackDividers: Record<string, DividerStyle> = { solutions: { label: "Atendimento · Agenda · Integração", mode: "color", backgroundColor: "#171717", textColor: "#FFFFFF", overlay: 45, images: [], position: "center center", scale: 100 }, diagnostic: { label: "Diagnóstico · Relatório · Plano", mode: "color", backgroundColor: "#F5F0E8", textColor: "#171717", overlay: 35, images: [], position: "center center", scale: 100 }, projects: { label: "Projetos em destaque", mode: "color", backgroundColor: "#171717", textColor: "#FFFFFF", overlay: 45, images: [], position: "center center", scale: 100 }, method: { label: "Método · Direção · Resultado", mode: "color", backgroundColor: "#F5F0E8", textColor: "#171717", overlay: 35, images: [], position: "center center", scale: 100 }, presence: { label: "Uma marca que ganha presença", mode: "color", backgroundColor: "#171717", textColor: "#FFFFFF", overlay: 45, images: [], position: "center center", scale: 100 } }

export async function getPublicSiteContent(): Promise<PublicSiteContent> {
  const fallbackImages = ["/portfolio/magia-glass.jpg"]
  const fallback: PublicSiteContent = { heroTitle: "Seu negócio merece uma", heroAccent: "presença digital à altura.", heroSubtitle: DEMO_CONTENT.heroSubtitle, heroAccentIntensity: 100, heroImage: fallbackImages[0], heroMobileImage: "", heroBackgroundImages: fallbackImages, heroMobileBackgroundImages: [], heroOverlayIntensity: 58, heroBackgroundPosition: "center center", heroBackgroundScale: 103, heroCardsMotion: 100, logo1: "/logo-vm.png", logo2: "/logo-wordmark.png", titleStyles: DEFAULT_TITLE_STYLES, dividerStyles: fallbackDividers, aboutTitle: DEMO_CONTENT.aboutTitle, aboutBody: DEMO_CONTENT.aboutBody, process: fallbackProcess, delivers: fallbackDelivers, commercial: fallbackCommercial, contact: { ...DEMO_CONTENT.contact } }
  try {
    const supabase = await createClientOptional(); if (!supabase) return fallback
    const [{ data: content }, { data: settings }] = await Promise.all([supabase.from("site_content").select("key,value"), supabase.from("site_settings").select("key,value")])
    const values = Object.fromEntries((content ?? []).map(row => [row.key, row.value])), config = Object.fromEntries((settings ?? []).map(row => [row.key, row.value]))
    let process = fallback.process, delivers = fallback.delivers
    const parseJsonObject = <T,>(value: string | undefined, fallbackValue: T): T => { try { return value ? JSON.parse(value) as T : fallbackValue } catch { return fallbackValue } }
    const storedSolutions = parseJsonObject<Partial<CommercialSections["solutions"]>>(values.solutions_json, {})
    const commercial = { ...fallback.commercial, pillars: { ...fallback.commercial.pillars, ...parseJsonObject(values.pillars_json, {}) }, solutions: { ...fallback.commercial.solutions, ...storedSolutions, demos: Array.isArray(storedSolutions.demos) ? storedSolutions.demos : fallback.commercial.solutions.demos }, diagnostic: { ...fallback.commercial.diagnostic, ...parseJsonObject(values.diagnostic_json, {}) } }
    try { if (values.process_json) process = JSON.parse(values.process_json); if (values.delivers_json) delivers = JSON.parse(values.delivers_json) } catch { process = fallback.process; delivers = fallback.delivers }
    const parseImages = (value: string | undefined, fallbackValue: string[]): string[] => { if (!value) return fallbackValue; try { const parsed: unknown = JSON.parse(value); if (Array.isArray(parsed)) { const images = parsed.filter((item): item is string => typeof item === "string" && !!item.trim()); if (images.length) return images } } catch { if (value.trim()) return [value.trim()] } return fallbackValue }
    const heroBackgroundImages = parseImages(config.hero_background_images, config.hero_image ? [config.hero_image] : fallback.heroBackgroundImages), heroMobileBackgroundImages = parseImages(config.hero_mobile_background_images, config.hero_mobile_image ? [config.hero_mobile_image] : fallback.heroMobileBackgroundImages)
    return { heroTitle: values.hero_title || fallback.heroTitle, heroAccent: values.hero_accent || fallback.heroAccent, heroSubtitle: values.hero_subtitle || fallback.heroSubtitle, heroAccentIntensity: Math.min(100, Math.max(0, Number(config.hero_accent_intensity || fallback.heroAccentIntensity))), heroImage: config.hero_image || heroBackgroundImages[0] || fallback.heroImage, heroMobileImage: config.hero_mobile_image || heroMobileBackgroundImages[0] || fallback.heroMobileImage, heroBackgroundImages, heroMobileBackgroundImages, heroOverlayIntensity: Math.min(100, Math.max(0, Number(config.hero_overlay_intensity ?? fallback.heroOverlayIntensity))), heroBackgroundPosition: config.hero_background_position || fallback.heroBackgroundPosition, heroBackgroundScale: Math.min(120, Math.max(100, Number(config.hero_background_scale ?? fallback.heroBackgroundScale))), heroCardsMotion: Math.min(100, Math.max(0, Number(config.hero_cards_motion ?? fallback.heroCardsMotion))), logo1: config.logo1 ?? fallback.logo1, logo2: config.logo2 ?? fallback.logo2, titleStyles: { ...DEFAULT_TITLE_STYLES, ...parseJsonObject<Record<string, TitleStyle>>(config.title_styles, {}) }, dividerStyles: { ...fallbackDividers, ...parseJsonObject<Record<string, DividerStyle>>(config.divider_styles, {}) }, aboutTitle: values.about_title || fallback.aboutTitle, aboutBody: values.about_body || fallback.aboutBody, process, delivers, commercial, contact: { whatsapp: config.whatsapp || fallback.contact.whatsapp, email: config.email || fallback.contact.email, instagram: config.instagram || fallback.contact.instagram } }
  } catch { return fallback }
}
