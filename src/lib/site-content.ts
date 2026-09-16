import { createClientOptional } from "@/lib/supabase/server"
import { DEMO_CONTENT } from "@/lib/demo-data"

export type ProcessItem = { step: string; title: string; desc: string; image: string }
export type DeliverItem = { title: string; desc: string; image: string; details: string }

export type PublicSiteContent = {
  heroTitle: string
  heroAccent: string
  heroSubtitle: string
  heroAccentIntensity: number
  heroImage: string
  heroMobileImage: string
  heroOverlayIntensity: number
  logo2: string
  aboutTitle: string
  aboutBody: string
  process: ProcessItem[]
  delivers: DeliverItem[]
  contact: { whatsapp: string; email: string; instagram: string }
}

const fallbackProcess: ProcessItem[] = DEMO_CONTENT.process.map((item, index) => ({
  ...item,
  image: ["/portfolio/magia-glass.jpg", "/portfolio/odonto.jpg", "/portfolio/imoveis.jpg", "/portfolio/advocacia.jpg"][index],
}))

const fallbackDelivers: DeliverItem[] = DEMO_CONTENT.delivers.map((item, index) => ({
  ...item,
  image: ["/portfolio/magia-glass.jpg", "/portfolio/odonto.jpg", "/portfolio/imoveis.jpg", "/portfolio/advocacia.jpg", "/portfolio/odonto.jpg", "/portfolio/magia-glass.jpg"][index],
  details: "Conteúdo, estrutura e direção visual definidos para o objetivo do projeto.",
}))

export async function getPublicSiteContent(): Promise<PublicSiteContent> {
  const fallback: PublicSiteContent = {
    heroTitle: "Seu negócio merece uma",
    heroAccent: "presença digital à altura.",
    heroSubtitle: DEMO_CONTENT.heroSubtitle,
    heroAccentIntensity: 100,
    heroImage: "/portfolio/magia-glass.jpg",
    heroMobileImage: "",
    heroOverlayIntensity: 58,
    logo2: "",
    aboutTitle: DEMO_CONTENT.aboutTitle,
    aboutBody: DEMO_CONTENT.aboutBody,
    process: fallbackProcess,
    delivers: fallbackDelivers,
    contact: { ...DEMO_CONTENT.contact },
  }

  try {
    const supabase = await createClientOptional()
    if (!supabase) return fallback
    const [{ data: content }, { data: settings }] = await Promise.all([
      supabase.from("site_content").select("key,value"),
      supabase.from("site_settings").select("key,value"),
    ])
    const values = Object.fromEntries((content ?? []).map((row) => [row.key, row.value]))
    const config = Object.fromEntries((settings ?? []).map((row) => [row.key, row.value]))

    let process = fallback.process
    let delivers = fallback.delivers
    try {
      if (values.process_json) process = JSON.parse(values.process_json)
      if (values.delivers_json) delivers = JSON.parse(values.delivers_json)
    } catch {
      process = fallback.process
      delivers = fallback.delivers
    }

    return {
      heroTitle: values.hero_title || fallback.heroTitle,
      heroAccent: values.hero_accent || fallback.heroAccent,
      heroSubtitle: values.hero_subtitle || fallback.heroSubtitle,
      heroAccentIntensity: Math.min(100, Math.max(0, Number(config.hero_accent_intensity || fallback.heroAccentIntensity))),
      heroImage: config.hero_image || fallback.heroImage,
      heroMobileImage: config.hero_mobile_image || fallback.heroMobileImage,
      heroOverlayIntensity: Math.min(100, Math.max(0, Number(config.hero_overlay_intensity ?? fallback.heroOverlayIntensity))),
      logo2: config.logo2 || fallback.logo2,
      aboutTitle: values.about_title || fallback.aboutTitle,
      aboutBody: values.about_body || fallback.aboutBody,
      process,
      delivers,
      contact: {
        whatsapp: config.whatsapp || fallback.contact.whatsapp,
        email: config.email || fallback.contact.email,
        instagram: config.instagram || fallback.contact.instagram,
      },
    }
  } catch {
    return fallback
  }
}
