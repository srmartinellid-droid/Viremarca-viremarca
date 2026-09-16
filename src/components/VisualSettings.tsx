"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, ImagePlus, Save, Upload } from "lucide-react"
import { createClientOptional } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const defaults: Record<string, string> = {
  hero_image: "",
  hero_mobile_image: "",
  hero_overlay_intensity: "58",
  logo2: "",
}

export function VisualSettings() {
  const [settings, setSettings] = useState(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = createClientOptional()
    if (!supabase) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = "/admin/login"; return }
    const { data } = await supabase.from("site_settings").select("key,value").in("key", Object.keys(defaults))
    const next = { ...defaults }
    for (const row of data ?? []) next[row.key as keyof typeof defaults] = row.value
    setSettings(next)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const upload = async (key: "hero_image" | "hero_mobile_image" | "logo2", file: File) => {
    const supabase = createClientOptional()
    if (!supabase) return
    if (!file.type.startsWith("image/")) return setNotice("Escolha um arquivo de imagem.")
    if (file.size > 10 * 1024 * 1024) return setNotice("A imagem deve ter no máximo 10 MB.")
    setUploading(key)
    setNotice(null)
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
      const path = `identity/${key}-${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from("site-media").upload(path, file, { contentType: file.type, upsert: false })
      if (error) throw error
      const url = supabase.storage.from("site-media").getPublicUrl(path).data.publicUrl
      setSettings((current) => ({ ...current, [key]: url }))
      setNotice("Imagem carregada. Clique em salvar para publicar a alteração.")
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível carregar a imagem.")
    } finally { setUploading(null) }
  }

  const save = async () => {
    const supabase = createClientOptional()
    if (!supabase) return
    setSaving(true)
    const rows = Object.entries(settings).map(([key, value]) => ({ key, value }))
    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" })
    setSaving(false)
    setNotice(error ? error.message : "Identidade visual salva. O site já pode consumir as novas configurações.")
  }

  const set = (key: string, value: string) => setSettings((current) => ({ ...current, [key]: value }))

  if (loading) return <div className="min-h-screen bg-vm-bg p-8 text-sm text-vm-muted">Carregando identidade visual…</div>

  return (
    <main className="min-h-screen bg-vm-bg">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-vm-muted hover:text-vm-ink"><ArrowLeft size={14} />Admin</Link>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-vm-ink md:text-4xl">Identidade visual</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-vm-muted">Controle da imagem principal da hero, versão mobile, intensidade do overlay e Logo 2. Tudo persistido no Supabase.</p>
          </div>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-vm-coral px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-vm-coral/20 disabled:opacity-60"><Save size={16} />{saving ? "Salvando…" : "Salvar alterações"}</button>
        </div>

        {notice && <div className="mt-6 flex items-center gap-3 rounded-2xl border border-vm-coral/20 bg-white px-4 py-3 text-sm text-vm-ink"><CheckCircle2 size={17} className="text-vm-coral" />{notice}</div>}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[2rem] border border-vm-border bg-white p-6 md:p-8">
            <div className="flex items-center gap-3"><div className="rounded-2xl bg-vm-sand p-3 text-vm-coral"><ImagePlus size={20} /></div><div><h2 className="font-semibold text-vm-ink">Hero</h2><p className="text-xs text-vm-muted">A imagem pública que sustenta a composição principal.</p></div></div>
            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <AssetCard label="Imagem desktop" value={settings.hero_image} busy={uploading === "hero_image"} onUpload={(file) => upload("hero_image", file)} />
              <AssetCard label="Imagem mobile" value={settings.hero_mobile_image} busy={uploading === "hero_mobile_image"} onUpload={(file) => upload("hero_mobile_image", file)} />
            </div>
            <label className="mt-7 block"><div className="flex items-center justify-between gap-4"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-vm-muted">Intensidade do overlay</span><span className="rounded-full bg-vm-sand px-3 py-1 text-xs font-semibold text-vm-ink">{settings.hero_overlay_intensity}%</span></div><input type="range" min="0" max="100" value={settings.hero_overlay_intensity} onChange={(e) => set("hero_overlay_intensity", e.target.value)} className="mt-4 w-full accent-[var(--color-vm-coral)]" /><div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-vm-muted"><span>Imagem livre</span><span>Mais contraste</span></div></label>
          </section>

          <section className="rounded-[2rem] border border-vm-border bg-white p-6 md:p-8">
            <div className="flex items-center gap-3"><div className="rounded-2xl bg-vm-sand p-3 text-vm-coral"><Upload size={20} /></div><div><h2 className="font-semibold text-vm-ink">Logo 2</h2><p className="text-xs text-vm-muted">Versão alternativa da marca, usada no rodapé quando configurada.</p></div></div>
            <div className="mt-7"><AssetCard label="Logo 2 / transparente" value={settings.logo2} busy={uploading === "logo2"} onUpload={(file) => upload("logo2", file)} compact /></div>
            <div className="mt-6 rounded-2xl bg-vm-sand p-4 text-xs leading-relaxed text-vm-muted">A imagem não é embutida no código. O caminho fica registrado em <code>site_settings</code>, então futuras trocas não exigem novo deploy.</div>
          </section>
        </div>
      </div>
    </main>
  )
}

function AssetCard({ label, value, busy, compact = false, onUpload }: { label: string; value: string; busy: boolean; compact?: boolean; onUpload: (file: File) => void }) {
  return <div className={cn("rounded-2xl border border-vm-border bg-vm-bg p-3", compact && "max-w-xl")}>
    <div className={cn("relative overflow-hidden rounded-xl bg-vm-sand", compact ? "h-40" : "aspect-[16/10]")}>
      {value ? <Image src={value} alt={label} fill sizes="(max-width: 768px) 100vw, 480px" className="object-contain p-5" unoptimized /> : <div className="absolute inset-0 grid place-items-center text-xs text-vm-muted">Nenhuma imagem configurada</div>}
    </div>
    <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs font-semibold text-vm-ink">{label}</span><label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-vm-border bg-white px-3 py-2 text-[11px] font-semibold text-vm-ink hover:border-vm-coral"><Upload size={13} />{busy ? "Enviando…" : "Trocar"}<input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(e) => { const file = e.target.files?.[0]; if (file) onUpload(file); e.currentTarget.value = "" }} /></label></div>
  </div>
}
