import Link from "next/link"
import Image from "next/image"
import { getPublicSiteContent } from "@/lib/site-content"
import { TrackedAnchor } from "@/components/TrackedAnchor"

export async function Footer() {
  const year = new Date().getFullYear()
  const content = await getPublicSiteContent()
  const logo = content.logo2 || "/logo-wordmark.png"
  return (
    <footer className="border-t border-vm-border bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 md:py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Image src={logo} alt="VireMarca" width={180} height={48} className="h-9 w-auto object-contain mb-5" unoptimized={Boolean(content.logo2)} />
            <p className="text-sm text-vm-muted max-w-sm leading-relaxed">
              Sites profissionais, pensados para cada negócio. Uma base tecnológica sólida e uma identidade própria para cada marca.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold tracking-wider uppercase text-vm-ink mb-4">Navegação</h4>
            <ul className="space-y-2.5 text-sm text-vm-muted">
              <li><Link href="/" className="hover:text-vm-coral transition-colors">Início</Link></li>
              <li><Link href="/#sites" className="hover:text-vm-coral transition-colors">Sites</Link></li>
              <li><Link href="/#como-fazemos" className="hover:text-vm-coral transition-colors">Método</Link></li>
              <li><Link href="/virelab" className="hover:text-vm-coral transition-colors">VireLab</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold tracking-wider uppercase text-vm-ink mb-4">Contato</h4>
            <ul className="space-y-2.5 text-sm text-vm-muted">
              <li><TrackedAnchor href={`https://wa.me/${content.contact.whatsapp}`} eventName="whatsapp_click" eventMetadata={{ location: "footer" }} target="_blank" rel="noopener noreferrer" className="hover:text-vm-coral transition-colors">WhatsApp</TrackedAnchor></li>
              <li><TrackedAnchor href={`mailto:${content.contact.email}`} eventName="email_click" eventMetadata={{ location: "footer" }} className="hover:text-vm-coral transition-colors">{content.contact.email}</TrackedAnchor></li>
              <li><TrackedAnchor href={`https://instagram.com/${content.contact.instagram}`} eventName="instagram_click" eventMetadata={{ location: "footer" }} target="_blank" rel="noopener noreferrer" className="hover:text-vm-coral transition-colors">@{content.contact.instagram}</TrackedAnchor></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-vm-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-vm-muted">
          <p>© {year} VireMarca. Todos os direitos reservados.</p>
          <div className="flex gap-6"><Link href="/privacidade" className="hover:text-vm-ink transition-colors">Política de Privacidade</Link></div>
        </div>
      </div>
    </footer>
  )
}
