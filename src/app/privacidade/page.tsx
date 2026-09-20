import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Política de Privacidade",
}

export default function PrivacidadePage() {
  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-3xl font-semibold text-vm-ink">Política de Privacidade</h1>
        <p className="text-vm-muted mt-4 leading-relaxed">
          A VireMarca respeita a sua privacidade. Coletamos apenas os dados necessários para
          responder às suas solicitações de contato (nome, e-mail, telefone ou WhatsApp e mensagem).
        </p>
        <p className="text-vm-muted mt-4 leading-relaxed">
          Com sua permissão para análise, podemos coletar a região aproximada da visita (país, estado
          e cidade) de forma agregada para fins estatísticos. Não armazenamos o endereço IP do visitante.
        </p>
        <p className="text-vm-muted mt-4 leading-relaxed">
          Esses dados não são vendidos nem compartilhados com terceiros para fins comerciais.
          São utilizados exclusivamente para atendimento e eventual proposta comercial.
        </p>
        <p className="text-vm-muted mt-4 leading-relaxed">
          Em conformidade com a LGPD (Lei nº 13.709/2018), você pode solicitar acesso, correção
          ou exclusão dos seus dados entrando em contato pelo e-mail{" "}
          <a href="mailto:contato@viremarca.com.br" className="text-vm-coral hover:underline">
            contato@viremarca.com.br
          </a>
          .
        </p>
        <p className="text-sm text-vm-muted mt-8">Última atualização: setembro de 2026.</p>
      </div>
    </div>
  )
}
