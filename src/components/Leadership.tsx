import { Reveal } from "@/components/motion/Reveal"

export function Leadership() {
  return (
    <section id="quem-dirige" className="bg-white py-20 md:py-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-7 lg:px-10">
        <Reveal>
          <p className="vm-eyebrow mb-3">Quem dirige</p>
          <h2 className="text-3xl font-semibold tracking-tight text-vm-ink md:text-4xl">Direção humana, execução com apoio de IA.</h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-vm-muted md:text-lg">A VireMarca é dirigida por Daniel, com mais de 20 anos de experiência em tecnologia: redes, firewall e serviços de TI. A produção dos sites conta com agentes de inteligência artificial trabalhando sob a direção dele.</p>
        </Reveal>
      </div>
    </section>
  )
}
