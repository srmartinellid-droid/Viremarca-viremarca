import type { Metadata } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { getPublicSiteContent } from "@/lib/site-content"
import { CookieConsent } from "@/components/CookieConsent"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" })
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" })

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPublicSiteContent()
  return {
    title: { default: "VireMarca — Sites profissionais para o seu negócio", template: "%s · VireMarca" },
    description: "A VireMarca constrói sites profissionais, pensados para cada negócio, unindo design estratégico, tecnologia e estrutura sob medida.",
    keywords: ["sites profissionais", "criação de sites", "site para empresas", "site profissional", "VireMarca"],
    authors: [{ name: "VireMarca" }],
    openGraph: { type: "website", locale: "pt_BR", siteName: "VireMarca", title: "VireMarca — Sites profissionais para o seu negócio", description: "Sites profissionais, pensados para cada negócio, com design estratégico, tecnologia e estrutura sob medida." },
    twitter: { card: "summary_large_image", title: "VireMarca", description: "Sites profissionais, pensados para cada negócio." },
    icons: content.logo1 ? { icon: [{ url: content.logo1 }], apple: [{ url: content.logo1 }] } : undefined,
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const content = await getPublicSiteContent()
  return <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable}`}><body className="min-h-screen flex flex-col antialiased"><Header logo1={content.logo2} /><main className="flex-1">{children}</main><Footer /><CookieConsent /></body></html>
}
