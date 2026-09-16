import { createClientOptional } from "@/lib/supabase/server"
import { DEMO_CONTENT } from "@/lib/demo-data"

export type PublicSiteContent = {
  heroTitle: string
  heroSubtitle: string
  aboutTitle: string
  aboutBody: string
  contact: {
    whatsapp: string
    email: string
    instagram: string
  }
}

export async function getPublicSiteContent(): Promise<PublicSiteContent> {
  const fallback: PublicSiteContent = {
    heroTitle: DEMO_CONTENT.heroTitle,
    heroSubtitle: DEMO_CONTENT.heroSubtitle,
    aboutTitle: DEMO_CONTENT.aboutTitle,
    aboutBody: DEMO_CONTENT.aboutBody,
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

    return {
      heroTitle: values.hero_title || fallback.heroTitle,
      heroSubtitle: values.hero_subtitle || fallback.heroSubtitle,
      aboutTitle: values.about_title || fallback.aboutTitle,
      aboutBody: values.about_body || fallback.aboutBody,
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
