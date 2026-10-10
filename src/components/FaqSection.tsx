import { Reveal } from "@/components/motion/Reveal"

export type FaqItem = { q: string; a: string }

export const DEFAULT_FAQ: FaqItem[] = [
  { q: "O site fica realmente meu?", a: "Cada site é uma instalação própria, com repositório, banco de dados e painel só dele. O domínio (.com.br) é registrado no seu nome, com o seu CPF ou CNPJ: você é o titular e pode levá-lo para onde quiser. Os demais detalhes de titularidade são alinhados com você antes de começar." },
  { q: "Consigo editar o conteúdo sozinho?", a: "Sim. O site tem um painel para você atualizar textos, imagens e informações sem depender de ninguém." },
  { q: "Vocês atendem fora de Florianópolis?", a: "Estamos em Florianópolis, SC, mas o trabalho é feito de forma online, com contato direto por WhatsApp." },
  { q: "Como funciona o diagnóstico gratuito?", a: "Fazemos uma avaliação técnica e visual do seu site atual, com nota por critério e um plano claro do que corrigir." },
  { q: "O atendimento com IA substitui a minha equipe?", a: "Não. Ele responde dúvidas com base nas informações do seu negócio e encaminha para o seu WhatsApp quando precisa de você." },
]

export function FaqSection({ items = DEFAULT_FAQ }: { items?: FaqItem[] }) {
  if (!items.length) return null
  return (
    <section id="perguntas" className="relative bg-white py-20 md:py-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-7 lg:px-10">
        <Reveal className="mb-10"><p className="vm-eyebrow mb-3">Perguntas frequentes</p><h2 className="text-3xl font-semibold tracking-tight text-vm-ink md:text-4xl">O que costumam nos perguntar</h2></Reveal>
        <div className="divide-y divide-vm-border rounded-2xl border border-vm-border">
          {items.map((item) => (
            <details key={item.q} className="group px-5 py-4 md:px-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-vm-ink [&::-webkit-details-marker]:hidden">{item.q}<span aria-hidden className="text-xl leading-none text-vm-coral transition-transform group-open:rotate-45">+</span></summary>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-vm-muted md:text-base">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
