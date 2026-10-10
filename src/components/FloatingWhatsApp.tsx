"use client"

import { usePathname } from "next/navigation"
import { WhatsAppIcon } from "@/components/WhatsAppIcon"
import { TrackedAnchor } from "@/components/TrackedAnchor"

export function FloatingWhatsApp({ whatsapp }: { whatsapp: string }) {
  const pathname = usePathname()
  if (!whatsapp || pathname?.startsWith("/admin")) return null
  return (
    <TrackedAnchor
      href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Olá! Quero criar um site com a VireMarca.")}`}
      target="_blank"
      rel="noopener noreferrer"
      eventName="whatsapp_click"
      eventMetadata={{ location: "floating" }}
      eventStatus="production"
      contactContext="other"
      aria-label="Falar com a VireMarca no WhatsApp"
      className="fixed bottom-5 right-24 z-[89] flex h-14 w-14 items-center justify-center rounded-full bg-[#1FA463] text-white shadow-lg transition-transform hover:scale-105"
    >
      <WhatsAppIcon size={26} />
    </TrackedAnchor>
  )
}
