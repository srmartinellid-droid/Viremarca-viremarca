import { createClientOptional } from "@/lib/supabase/server"
import { DEMO_CONTENT } from "@/lib/demo-data"
import { DEFAULT_TITLE_STYLES, type TitleStyle } from "@/lib/visual-defaults"

export type ProcessItem = { step: string; title: string; desc: string; image: string }
export type DeliverItem = { title: string; desc: string; image: string; details: string }
export type DividerStyle = { label: string; mode: "color" | "image"; backgroundColor: string; textColor: string; overlay: number; images: string[]; position: string; scale: number }
export type PublicSiteContent = { heroTitle: string; heroAccent: string; heroSubtitle: string; heroAccentIntensity: number; heroImage: string; heroMobileImage: string; heroBackgroundImages: string[]; heroMobileBackgroundImages: string[]; heroOverlayIntensity: number; heroBackgroundPosition: string; heroBackgroundScale: number; heroCardsMotion: number; logo1: string; logo2: string; titleStyles: Record<string, TitleStyle>; dividerStyles: Record<string, DividerStyle>; aboutTitle: string; aboutBody: string; process: ProcessItem[]; delivers: DeliverItem[]; contact: { whatsapp: string; email: string; instagram: string }; commercial: CommercialSections }

export type PillarItem = { title: string; desc: string }
export type SolutionItem = { title: string; desc: string }
export type DiagnosticItem = { title: string; desc: string }
export type CommercialSections = {
  pillars: { eyebrow: string; title: string; highlight: string; subtitle: string; items: PillarItem[]; note: string }
  solutions: { eyebrow: string; title: string; highlight: string; subtitle: string; items: SolutionItem[]; examples: string[]; note: string; cta: string }
  diagnostic: { eyebrow: string; title: string; highlight: string; items: DiagnosticItem[]; cta: string; note: string }
}
\nconst fallbackProcess: ProcessItem[] = DEMO_CONTENT.process.map((item, index) => ({ ...item, image: ["/portfolio/magia-glass.jpg", "/portfolio/odonto.jpg", "/portfolio/imoveis.jpg", "/portfolio/advocacia.jpg"][index] }))
const fallbackDelivers: DeliverItem[] = DEMO_CONTENT.delivers.map((item, index) => ({ ...item, image: ["/portfolio/magia-glass.jpg", "/portfolio/odonto.jpg", "/portfolio/imoveis.jpg", "/portfolio/advocacia.jpg", "/portfolio/odonto.jpg", "/portfolio/magia-glass.jpg"][index], details: "Conteúdo, estrutura e direção visual definidos para o objetivo do projeto." }))

const fallbackCommercial: CommercialSections = {
  pillars: { eyebrow: "Como ajudamos", title: "Três frentes. Uma presença coerente.", highlight: "Uma presença coerente.", subtitle: "Seu negócio aparece para o cliente em vários lugares. Cuidamos de cada um deles com a mesma identidade.", items: [
    { title: "Site profissional", desc: "Seu site próprio, com painel para atualizar conteúdo, estrutura para ser encontrado e contato direto por WhatsApp." },
    { title: "Google Meu Negócio", desc: "Perfil configurado e organizado para apresentar seu negócio nas buscas e no mapa da sua região, com informações, fotos e horários corretos." },
    { title: "Arte e conteúdo", desc: "Peças visuais para redes sociais, promoções e materiais impressos, alinhadas à identidade da sua marca." },
  ], note: "Contrate uma frente ou as três, conforme o momento do seu negócio." },
  solutions: { eyebrow: "Soluções inteligentes", title: "Seu site atendendo, mesmo quando você não pode.", highlight: "mesmo quando você não pode.", subtitle: "Recursos que vão além da vitrine e colocam o site para trabalhar no dia a dia do seu negócio.", items: [
    { title: "Atendimento com IA", desc: "Um assistente no seu site que responde dúvidas a qualquer hora, com base nas informações do seu negócio: serviços, horários, políticas e perguntas frequentes. Quando necessário, encaminha o cliente para o seu WhatsApp." },
    { title: "Agendamentos e reservas", desc: "O cliente consulta opções e envia o pedido de horário ou reserva direto pelo site, sem esperar alguém responder." },
    { title: "Integração com o seu sistema", desc: "Conectamos o site ao sistema que você já usa (PDV, agenda ou sistema de reservas) para consultar disponibilidade, produtos ou informações atualizadas." },
  ], examples: ["Pousadas e hotéis: dúvidas e pedidos de reserva a qualquer hora", "Clínicas: pré-agendamento fora do horário comercial", "Comércio: consulta de produtos e disponibilidade"], note: "Cada solução é avaliada conforme o seu negócio e os sistemas que você já utiliza.", cta: "Conversar sobre o meu negócio" },
  diagnostic: { eyebrow: "Diagnóstico técnico gratuito", title: "Seu site já existe. A pergunta é: ele está te vendendo ou te custando clientes?", highlight: "te vendendo ou te custando clientes?", items: [
    { title: "Auditoria completa", desc: "Analisamos desempenho, versão mobile, clareza visual, organização das informações e experiência de quem visita, com nota de 0 a 10 em cada critério." },
    { title: "Relatório objetivo", desc: "Você recebe um documento visual mostrando o que funciona, o que não funciona e como isso afeta a credibilidade e os contatos gerados." },
    { title: "Caminho claro", desc: "Com base no diagnóstico, apresentamos um plano de correção, sem enrolação e sem jargão técnico." },
  ], cta: "Solicitar avaliação do meu site", note: "Ainda não tem site? Fale com a gente" },
}
\nconst fallbackDividers: Record<string, DividerStyle> = { projects: { label: "Projetos em destaque", mode: "color", backgroundColor: "#171717", textColor: "#FFFFFF", overlay: 45, images: [], position: "center center", scale: 100 }, method: { label: "Método · Direção · Resultado", mode: "color", backgroundColor: "#F5F0E8", textColor: "#171717", overlay: 35, images: [], position: "center center", scale: 100 }, presence: { label: "Uma marca que ganha presença", mode: "color", backgroundColor: "#171717", textColor: "#FFFFFF", overlay: 45, images: [], position: "center center", scale: 100 } }

export async function getPublicSiteContent(): Promise<PublicSiteContent> {
  const fallbackImages = ["/portfolio/magia-glass.jpg"]
  const fallback: PublicSiteContent = { heroTitle: "Seu negócio merece uma", heroAccent: "presença digital à altura.", heroSubtitle: DEMO_CONTENT.heroSubtitle, heroAccentIntensity: 100, heroImage: fallbackImages[0], heroMobileImage: "", heroBackgroundImages: fallbackImages, heroMobileBackgroundImages: [], heroOverlayIntensity: 58, heroBackgroundPosition: "center center", heroBackgroundScale: 103, heroCardsMotion: 100, logo1: "/logo-vm.png", logo2: "/logo-wordmark.png", titleStyles: DEFAULT_TITLE_STYLES, dividerStyles: fallbackDividers, aboutTitle: DEMO_CONTENT.aboutTitle, aboutBody: DEMO_CONTENT.aboutBody, process: fallbackProcess, delivers: fallbackDelivers, commercial: fallbackCommercial, contact: { ...DEMO_CONTENT.contact } }
  try {
    const supabase = await createClientOptional(); if (!supabase) return fallback
    const [{ data: content }, { data: settings }] = await Promise.all([supabase.from("site_content").select("key,value"), supabase.from("site_settings").select("key,value")])
    const values = Object.fromEntries((content ?? []).map(row => [row.key, row.value])), config = Object.fromEntries((settings ?? []).map(row => [row.key, row.value]))
    let process = fallback.process, delivers = fallback.delivers\n    const commercial = { ...fallback.commercial, pillars: parseJsonObject(values.pillars_json, fallback.commercial.pillars), solutions: parseJsonObject(values.solutions_json, fallback.commercial.solutions), diagnostic: parseJsonObject(values.diagnostic_json, fallback.commercial.diagnostic) }
    try { if (values.process_json) process = JSON.parse(values.process_json); if (values.delivers_json) delivers = JSON.parse(values.delivers_json) } catch { process = fallback.process; delivers = fallback.delivers }
    const parseImages = (value: string | undefined, fallbackValue: string[]): string[] => { if (!value) return fallbackValue; try { const parsed: unknown = JSON.parse(value); if (Array.isArray(parsed)) { const images = parsed.filter((item): item is string => typeof item === "string" && !!item.trim()); if (images.length) return images } } catch { if (value.trim()) return [value.trim()] } return fallbackValue }
    const heroBackgroundImages = parseImages(config.hero_background_images, config.hero_image ? [config.hero_image] : fallback.heroBackgroundImages), heroMobileBackgroundImages = parseImages(config.hero_mobile_background_images, config.hero_mobile_image ? [config.hero_mobile_image] : fallback.heroMobileBackgroundImages)
    return { heroTitle: values.hero_title || fallback.heroTitle, heroAccent: values.hero_accent || fallback.heroAccent, heroSubtitle: values.hero_subtitle || fallback.heroSubtitle, heroAccentIntensity: Math.min(100, Math.max(0, Number(config.hero_accent_intensity || fallback.heroAccentIntensity))), heroImage: config.hero_image || heroBackgroundImages[0] || fallback.heroImage, heroMobileImage: config.hero_mobile_image || heroMobileBackgroundImages[0] || fallback.heroMobileImage, heroBackgroundImages, heroMobileBackgroundImages, heroOverlayIntensity: Math.min(100, Math.max(0, Number(config.hero_overlay_intensity ?? fallback.heroOverlayIntensity))), heroBackgroundPosition: config.hero_background_position || fallback.heroBackgroundPosition, heroBackgroundScale: Math.min(120, Math.max(100, Number(config.hero_background_scale ?? fallback.heroBackgroundScale))), heroCardsMotion: Math.min(100, Math.max(0, Number(config.hero_cards_motion ?? fallback.heroCardsMotion))), logo1: config.logo1 ?? fallback.logo1, logo2: config.logo2 ?? fallback.logo2, titleStyles: { ...DEFAULT_TITLE_STYLES, ...parseJsonObject<Record<string, TitleStyle>>(config.title_styles, {}) }, dividerStyles: { ...fallbackDividers, ...parseJsonObject<Record<string, DividerStyle>>(config.divider_styles, {}) }, aboutTitle: values.about_title || fallback.aboutTitle, aboutBody: values.about_body || fallback.aboutBody, process, delivers, commercial, contact: { whatsapp: config.whatsapp || fallback.contact.whatsapp, email: config.email || fallback.contact.email, instagram: config.instagram || fallback.contact.instagram } }
  } catch { return fallback }
}
