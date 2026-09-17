import type { Metadata } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { getPublicSiteContent } from "@/lib/site-content"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" })
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" })

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPublicSiteContent()
  return {
    title: { default: "VireMarca — Sites profissionais por segmento", template: "%s · VireMarca" },
    description: "A VireMarca cria sites profissionais pensados para cada segmento. Uma nova marca construída sobre experiência real em tecnologia.",
    keywords: ["sites profissionais", "criação de sites", "sites por nicho", "VireMarca"],
    authors: [{ name: "VireMarca" }],
    openGraph: { type: "website", locale: "pt_BR", siteName: "VireMarca", title: "VireMarca — Sites profissionais por segmento", description: "Sites profissionais pensados para cada segmento. Design, performance e estrutura que vendem." },
    twitter: { card: "summary_large_image", title: "VireMarca", description: "Sites profissionais por segmento." },
    icons: content.logo1 ? { icon: [{ url: content.logo1 }], apple: [{ url: content.logo1 }] } : undefined,
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const content = await getPublicSiteContent()
  return <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable}`}><body className="min-h-screen flex flex-col antialiased"><Header logo1={content.logo2} /><main className="flex-1">{children}</main><Footer /></body></html>
}
