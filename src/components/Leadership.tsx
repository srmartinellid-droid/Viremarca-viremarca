import { Reveal } from "@/components/motion/Reveal"

const steps = [
  { title: "Conversa e direção", text: "Você explica o negócio ao Daniel e ele define o caminho." },
  { title: "Produção com agentes de IA", text: "Os agentes analisam, montam e ajustam o site." },
  { title: "Validação e publicação", text: "Daniel valida e o site vai ao ar, com o painel na sua mão." },
]

export function Leadership() {
  return (
    <section id="quem-dirige" className="bg-white py-20 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-7 lg:grid-cols-2 lg:gap-16 lg:px-10">
        <Reveal>
          <p className="vm-eyebrow mb-3">Quem dirige</p>
          <h2 className="text-3xl font-semibold tracking-tight text-vm-ink md:text-4xl">Direção humana. Execução com agentes de IA.</h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-vm-muted md:text-lg">A VireMarca é dirigida por Daniel, que tem mais de 20 anos de experiência em tecnologia, com redes, firewall e serviços de TI. A produção dos sites conta com agentes de IA para análise, roteirização e ajustes, sob a direção e a validação dele.</p>
          <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-vm-ink">Você fala com uma pessoa. Quem responde pelo resultado é ela.</p>
        </Reveal>
        <Reveal delay={0.1}>
          <ol className="space-y-6">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-5 rounded-2xl border border-vm-border bg-vm-sand/60 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-vm-coral text-sm font-bold text-vm-coral">{index + 1}</span>
                <div><h3 className="text-base font-semibold text-vm-ink">{step.title}</h3><p className="mt-1 text-sm leading-relaxed text-vm-muted">{step.text}</p></div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  )
}
