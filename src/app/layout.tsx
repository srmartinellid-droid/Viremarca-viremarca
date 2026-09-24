import type { Metadata } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { getPublicSiteContent } from "@/lib/site-content"
import { CookieConsent } from "@/components/CookieConsent"
import { AnalyticsGate } from "@/components/AnalyticsGate"
import { CoreChat } from "@/components/core-chat/CoreChat"
import { SupabaseAssistantConfigRepository } from "@/lib/core-chat/config"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" })
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" })

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPublicSiteContent()
  return {
    metadataBase: new URL("https://www.viremarca.com.br"),
    title: { default: "VireMarca — Sites profissionais para o seu negócio", template: "%s · VireMarca" },
    description: "A VireMarca constrói sites profissionais, pensados para cada negócio, unindo design estratégico, tecnologia e estrutura sob medida.",
    keywords: ["sites profissionais", "criação de sites", "site para empresas", "site profissional", "VireMarca"],
    authors: [{ name: "VireMarca" }],
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: "VireMarca",
      url: "https://www.viremarca.com.br",
      title: "VireMarca — Sites profissionais para o seu negócio",
      description: "Sites profissionais, pensados para cada negócio, com design estratégico, tecnologia e estrutura sob medida.",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "VireMarca" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "VireMarca",
      description: "Sites profissionais, pensados para cada negócio.",
      images: ["/og-image.png"],
    },
    icons: content.logo1 ? { icon: [{ url: content.logo1 }], apple: [{ url: content.logo1 }] } : undefined,
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const content = await getPublicSiteContent()
  return <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable}`}><body className="min-h-screen flex flex-col antialiased"><Header logo1={content.logo2} /><main className="flex-1">{children}</main><Footer /><CookieConsent /><AnalyticsGate /><CoreChat config={await getChatConfig()} /></body></html>
}


async function getChatConfig() {
  try {
    const config = await new SupabaseAssistantConfigRepository().get()
    return { enabled: config.enabled, assistant_name: config.assistant_name, fallback_whatsapp: config.fallback_whatsapp }
  } catch {
    return { enabled: false, assistant_name: "Assistente VireMarca", fallback_whatsapp: "" }
  }
}
