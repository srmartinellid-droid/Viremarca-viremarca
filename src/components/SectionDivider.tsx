type Props = { variant?: "light" | "dark" | "sand"; label?: string }

export function SectionDivider({ variant = "light", label }: Props) {
  const tones = {
    light: "bg-white text-vm-ink/35 border-vm-border/70",
    dark: "bg-vm-ink text-white/35 border-white/10",
    sand: "bg-vm-sand text-vm-ink/35 border-vm-border/70",
  }
  return (
    <div className={`relative h-20 overflow-hidden border-y ${tones[variant]}`} aria-hidden={!label}>
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(90deg,transparent_0%,currentColor_18%,transparent_36%,transparent_64%,currentColor_82%,transparent_100%)]" />
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.28em]">
        <span className="h-px w-12 bg-current opacity-40" />
        {label ?? "VireMarca"}
        <span className="h-px w-12 bg-current opacity-40" />
      </div>
    </div>
  )
}
