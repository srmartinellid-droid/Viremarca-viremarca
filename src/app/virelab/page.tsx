import Link from "next/link"

export default function VireLabPage() {
  return (
    <div className="min-h-[70vh] pt-32 pb-24">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 text-center sm:px-6">
        <span className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-vm-coral">
          VireLab
        </span>

        <h1 className="vm-display text-4xl tracking-tight text-vm-ink md:text-5xl">
          Estamos preparando uma nova experiência.
        </h1>

        <p className="mt-5 max-w-xl text-base leading-relaxed text-vm-muted md:text-lg">
          Em breve, você poderá experimentar na prática como funciona um site
          VireMarca, incluindo seu painel administrativo.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex items-center rounded-full bg-vm-coral px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
        >
          Voltar para o site
        </Link>
      </div>
    </div>
  )
}
