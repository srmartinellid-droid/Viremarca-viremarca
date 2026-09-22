import type { Metadata } from "next"

export const metadata: Metadata = { title: "Política de Privacidade" }

export default function PrivacidadePage() {
  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-3xl font-semibold text-vm-ink">Política de Privacidade</h1>
        <p className="mt-4 leading-relaxed text-vm-muted">A VireMarca respeita a sua privacidade. Coletamos apenas os dados necessários para responder às suas solicitações de contato, como nome, e-mail, telefone ou WhatsApp e mensagem, quando informados voluntariamente.</p>
        <p className="mt-4 leading-relaxed text-vm-muted">Não armazenamos o endereço IP do visitante, geolocalização precisa ou o user-agent completo.</p>
        <p className="mt-4 leading-relaxed text-vm-muted">Esses dados não são vendidos nem compartilhados com terceiros para fins comerciais. São utilizados para atendimento comercial e eventual proposta, quando aplicável.</p>

        <section className="mt-10 rounded-3xl border border-vm-border bg-white p-6">
          <h2 className="text-xl font-semibold text-vm-ink">Assistente virtual</h2>
          <p className="mt-3 leading-relaxed text-vm-muted">Ao usar o Assistente virtual, registramos as mensagens e os dados que você informar voluntariamente, como nome, WhatsApp, e-mail, negócio, ramo, cidade, site atual, demanda, urgência e melhor horário para contato.</p>
          <p className="mt-3 leading-relaxed text-vm-muted">A finalidade é atendimento comercial: entender sua demanda, registrar o atendimento e permitir que a equipe VireMarca dê continuidade ao contato.</p>
          <p className="mt-3 leading-relaxed text-vm-muted">Conversas sem cadastro de lead são retidas por até 90 dias. Quando há cadastro de lead, a conversa permanece sem expiração automática até a conclusão do atendimento ou um pedido de exclusão.</p>
          <p className="mt-3 leading-relaxed text-vm-muted">O visitante pode pedir a exclusão dos dados pelo WhatsApp (48) 99141-0717 ou pelo e-mail <a href="mailto:viremarca@gmail.com" className="text-vm-coral hover:underline">viremarca@gmail.com</a>.</p>
        </section>

        <p className="mt-6 leading-relaxed text-vm-muted">Em conformidade com a LGPD (Lei nº 13.709/2018), você pode solicitar acesso, correção ou exclusão dos seus dados. Para outras solicitações, use também o e-mail <a href="mailto:contato@viremarca.com.br" className="text-vm-coral hover:underline">contato@viremarca.com.br</a>.</p>
        <p className="mt-8 text-sm text-vm-muted">Última atualização: setembro de 2026.</p>
      </div>
    </div>
  )
}
