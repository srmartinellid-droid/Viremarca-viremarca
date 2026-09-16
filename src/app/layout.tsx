import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "VireMarca — Sites profissionais por segmento",
    template: "%s · VireMarca",
  },
  description:
    "A VireMarca cria sites profissionais pensados para cada segmento. Uma nova marca construída sobre experiência real em tecnologia.",
  keywords: ["sites profissionais", "criação de sites", "sites por nicho", "VireMarca"],
  authors: [{ name: "VireMarca" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "VireMarca",
    title: "VireMarca — Sites profissionais por segmento",
    description:
      "Sites profissionais pensados para cada segmento. Design, performance e estrutura que vendem.",
  },
  twitter: {
    card: "summary_large_image",
    title: "VireMarca",
    description: "Sites profissionais por segmento.",
  },
  icons: {
    icon: "/favicon-32.png",
    apple: "/logo-vm.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen flex flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
