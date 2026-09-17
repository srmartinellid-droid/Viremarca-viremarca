"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Save, Upload, Trash2 } from "lucide-react"
import { createClientOptional } from "@/lib/supabase/client"
import { DEFAULT_TITLE_STYLES, type TitleStyle } from "@/components/TitleBlock"
import { type DividerStyle } from "@/lib/site-content"

type Settings = { logo1: string; logo2: string; hero_background_images: string; hero_mobile_background_images: string; hero_overlay_intensity: string; hero_background_position: string; hero_background_scale: string; hero_cards_motion: string }
const defaults: Settings = { logo1: "/logo-vm.png", logo2: "/logo-wordmark.png", hero_background_images: "[]", hero_mobile_background_images: "[]", hero_overlay_intensity: "58", hero_background_position: "center center", hero_background_scale: "103", hero_cards_motion: "100" }
const dividerDefaults: Record<string, DividerStyle> = {
  projects: { label: "Projetos em destaque", mode: "color", backgroundColor: "#171717", textColor: "#FFFFFF", overlay: 45, images: [], position: "center center", scale: 100 },
  method: { label: "Método · Direção · Resultado", mode: "color", backgroundColor: "#F5F0E8", textColor: "#171717", overlay: 35, images: [], position: "center center", scale: 100 },
  presence: { label: "Uma marca que ganha presença", mode: "color", backgroundColor: "#171717", textColor: "#FFFFFF", overlay: 45, images: [], position: "center center", scale: 100 },
}
const titleLabels: Record<string, string> = { hero: "Título principal / Hero", portfolio: "Portfólio / Veja a marca em ação", process: "Como trabalhamos", about: "Quem somos", delivers: "O que entregamos", contact: "Chamada final" }

function list(value: string) { try { const parsed = JSON.parse(value || "[]"); return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string" && !!x.trim()) : [] } catch { return value.trim() ? [value.trim()] : [] } }
function object<T>(value: string | undefined, fallback: T): T { try { return value ? JSON.parse(value) as T : fallback } catch { return fallback } }

export function VisualSettingsStudioV2() {
  const [settings, setSettings] = useState(defaults), [titles, setTitles] = useState<Record<string, TitleStyle>>(DEFAULT_TITLE_STYLES), [dividers, setDividers] = useState(dividerDefaults)
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [notice, setNotice] = useState(""), [uploading, setUploading] = useState("")
  const load = useCallback(async () => {
    const supabase = createClientOptional(); if (!supabase) return
    const { data: { user } } = await supabase.auth.getUser(); if (!user) { window.location.href = "/admin/login"; return }
    const { data, error } = await supabase.from("site_settings").select("key,value")
    if (error) { setNotice(error.message); setLoading(false); return }
    const map = Object.fromEntries((data ?? []).map(x => [x.key, x.value]))
    setSettings({ ...defaults, ...Object.fromEntries(Object.keys(defaults).map(k => [k, map[k] ?? defaults[k as keyof Settings]])) } as Settings)
    setTitles({ ...DEFAULT_TITLE_STYLES, ...object<Record<string, TitleStyle>>(map.title_styles, {}) })
    setDividers({ ...dividerDefaults, ...object<Record<string, DividerStyle>>(map.divider_styles, {}) })
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const upload = async (target: "logo1" | "logo2" | "desktop" | "mobile", files: File[]) => {
    const supabase = createClientOptional(); if (!supabase || !files.length) return
    setUploading(target); setNotice("")
    try {
      const urls: string[] = []
      for (const file of files) { if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) throw new Error("Use imagens de até 10 MB."); const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"; const path = `identity/${target}-${crypto.randomUUID()}.${ext}`; const { error } = await supabase.storage.from("site-media").upload(path, file, { contentType: file.type, upsert: false, cacheControl: "31536000" }); if (error) throw error; urls.push(supabase.storage.from("site-media").getPublicUrl(path).data.publicUrl) }
      if (target === "logo1" || target === "logo2") setSettings(s => ({ ...s, [target]: urls[0] || s[target] }))
      else setSettings(s => ({ ...s, [target === "desktop" ? "hero_background_images" : "hero_mobile_background_images"]: JSON.stringify([...list(s[target === "desktop" ? "hero_background_images" : "hero_mobile_background_images"]), ...urls]) }))
    } catch (e) { setNotice(e instanceof Error ? e.message : "Falha no upload.") } finally { setUploading("") }
  }

  const save = async () => {
    const supabase = createClientOptional(); if (!supabase) return
    setSaving(true); setNotice("")
    const rows = [
      { key: "logo1", value: settings.logo1 }, { key: "logo2", value: settings.logo2 },
      { key: "hero_image", value: list(settings.hero_background_images)[0] || "" }, { key: "hero_mobile_image", value: list(settings.hero_mobile_background_images)[0] || "" },
      { key: "hero_background_images", value: settings.hero_background_images }, { key: "hero_mobile_background_images", value: settings.hero_mobile_background_images },
      { key: "hero_overlay_intensity", value: settings.hero_overlay_intensity }, { key: "hero_background_position", value: settings.hero_background_position }, { key: "hero_background_scale", value: settings.hero_background_scale }, { key: "hero_cards_motion", value: settings.hero_cards_motion },
      { key: "title_styles", value: JSON.stringify(titles) }, { key: "divider_styles", value: JSON.stringify(dividers) },
    ]
    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" }); setSaving(false); setNotice(error ? error.message : "Direção visual salva.")
  }

  if (loading) return <main className="min-h-screen bg-vm-bg p-8 text-sm text-vm-muted">Carregando direção visual…</main>
  return <main className="min-h-screen bg-vm-bg"><div className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><Link href="/admin" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-vm-muted"><ArrowLeft size={14} />Admin</Link><h1 className="mt-4 text-3xl font-semibold text-vm-ink">Direção visual</h1><p className="mt-2 text-sm text-vm-muted">Conteúdo, identidade e sistema visual da Home, sem alterar componentes individualmente.</p></div><button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-vm-coral px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"><Save size={16} />{saving ? "Salvando…" : "Salvar alterações"}</button></div>
    {notice && <div className="mt-5 rounded-2xl border border-vm-border bg-white px-4 py-3 text-sm text-vm-ink">{notice}</div>}

    <section className="mt-7 rounded-[2rem] border border-vm-border bg-white p-6 md:p-8"><h2 className="font-semibold text-vm-ink">Identidade</h2><p className="mt-1 text-xs text-vm-muted">Logo 1 = favicon/ícone. Logo 2 = identidade completa no header.</p><div className="mt-5 grid gap-5 md:grid-cols-2"><Asset label="Logo 1 · favicon" value={settings.logo1} busy={uploading === "logo1"} onUpload={f => upload("logo1", f)} /><Asset label="Logo 2 · header / marca completa" value={settings.logo2} busy={uploading === "logo2"} onUpload={f => upload("logo2", f)} /></div></section>

    <section className="mt-6 rounded-[2rem] border border-vm-border bg-white p-6 md:p-8"><h2 className="font-semibold text-vm-ink">Títulos editoriais</h2><p className="mt-1 text-xs text-vm-muted">Cada seção tem texto, destaque, cor e peso próprios, mantendo o componente centralizado.</p><div className="mt-5 grid gap-5 lg:grid-cols-2">{Object.entries(titles).map(([id, style]) => <TitleEditor key={id} label={titleLabels[id] || id} style={style} onChange={patch => setTitles(t => ({ ...t, [id]: { ...t[id], ...patch } }))} />)}</div></section>

    <section className="mt-6 rounded-[2rem] border border-vm-border bg-white p-6 md:p-8"><h2 className="font-semibold text-vm-ink">Divisores</h2><p className="mt-1 text-xs text-vm-muted">Um único componente renderiza todos os capítulos. Aqui você configura apenas o tema de cada seção.</p><div className="mt-5 space-y-4">{Object.entries(dividers).map(([id, d]) => <div key={id} className="rounded-2xl border border-vm-border bg-vm-bg p-5"><div className="grid gap-3 md:grid-cols-2"><label className="text-xs font-semibold text-vm-ink">Rótulo<input value={d.label} onChange={e => setDividers(s => ({ ...s, [id]: { ...d, label: e.target.value } }))} className="mt-2 w-full rounded-xl border border-vm-border bg-white px-3 py-2 font-normal" /></label><label className="text-xs font-semibold text-vm-ink">Modo<select value={d.mode} onChange={e => setDividers(s => ({ ...s, [id]: { ...d, mode: e.target.value as DividerStyle["mode"] } }))} className="mt-2 w-full rounded-xl border border-vm-border bg-white px-3 py-2 font-normal"><option value="color">Cor</option><option value="image">Imagem</option></select></label></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-vm-ink">Fundo<input value={d.backgroundColor} onChange={e => setDividers(s => ({ ...s, [id]: { ...d, backgroundColor: e.target.value } }))} className="mt-2 w-full rounded-xl border border-vm-border bg-white px-3 py-2 font-mono font-normal" /></label><label className="text-xs font-semibold text-vm-ink">Texto<input value={d.textColor} onChange={e => setDividers(s => ({ ...s, [id]: { ...d, textColor: e.target.value } }))} className="mt-2 w-full rounded-xl border border-vm-border bg-white px-3 py-2 font-mono font-normal" /></label></div></div>)}</div></section>

    <section className="mt-6 rounded-[2rem] border border-vm-border bg-white p-6 md:p-8"><h2 className="font-semibold text-vm-ink">Hero</h2><div className="mt-5 grid gap-5 md:grid-cols-2"><Gallery label="Desktop" images={list(settings.hero_background_images)} busy={uploading === "desktop"} onUpload={f => upload("desktop", f)} onRemove={i => setSettings(s => ({ ...s, hero_background_images: JSON.stringify(list(s.hero_background_images).filter((_, x) => x !== i)) }))} /><Gallery label="Mobile" images={list(settings.hero_mobile_background_images)} busy={uploading === "mobile"} onUpload={f => upload("mobile", f)} onRemove={i => setSettings(s => ({ ...s, hero_mobile_background_images: JSON.stringify(list(s.hero_mobile_background_images).filter((_, x) => x !== i)) }))} /></div></section>
  </div></main>
}

function Asset({ label, value, busy, onUpload }: { label: string; value: string; busy: boolean; onUpload: (files: File[]) => void }) { return <div className="rounded-2xl border border-vm-border bg-vm-bg p-3"><div className="relative h-40 overflow-hidden rounded-xl bg-vm-sand">{value ? <Image src={value} alt={label} fill className="object-contain p-5" unoptimized /> : <div className="absolute inset-0 grid place-items-center text-xs text-vm-muted">Nenhum asset configurado</div>}</div><div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs font-semibold text-vm-ink">{label}</span><label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-vm-border bg-white px-3 py-2 text-[11px] font-semibold"><Upload size={13} />{busy ? "Enviando…" : "Trocar"}<input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={e => { const files = Array.from(e.target.files || []); if (files.length) onUpload(files); e.currentTarget.value = "" }} /></label></div></div> }
function TitleEditor({ label, style, onChange }: { label: string; style: TitleStyle; onChange: (patch: Partial<TitleStyle>) => void }) { return <div className="rounded-2xl border border-vm-border bg-vm-bg p-5"><h3 className="text-sm font-semibold text-vm-ink">{label}</h3><input value={style.text} onChange={e => onChange({ text: e.target.value })} className="mt-4 w-full rounded-xl border border-vm-border bg-white px-4 py-3 text-sm" placeholder="Texto do título" /><div className="mt-3 grid gap-3 md:grid-cols-2"><input value={style.highlight || ""} onChange={e => onChange({ highlight: e.target.value })} className="rounded-xl border border-vm-border bg-white px-4 py-3 text-sm" placeholder="Trecho em destaque" /><select value={style.highlightStyle || "color"} onChange={e => onChange({ highlightStyle: e.target.value as TitleStyle["highlightStyle"] })} className="rounded-xl border border-vm-border bg-white px-4 py-3 text-sm"><option value="color">Cor</option><option value="italic">Itálico</option><option value="underline">Sublinhado</option><option value="marker">Marcador</option></select></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-[10px] font-semibold uppercase tracking-wider text-vm-muted">Cor<input value={style.textColor || "#171717"} onChange={e => onChange({ textColor: e.target.value })} className="mt-1 w-full rounded-xl border border-vm-border bg-white px-3 py-2 font-mono text-sm" /></label><label className="text-[10px] font-semibold uppercase tracking-wider text-vm-muted">Peso<select value={String(style.fontWeight || 600)} onChange={e => onChange({ fontWeight: Number(e.target.value) as TitleStyle["fontWeight"] })} className="mt-1 w-full rounded-xl border border-vm-border bg-white px-3 py-2 text-sm"><option value="400">Regular</option><option value="500">Medium</option><option value="600">Semibold</option><option value="700">Bold</option></select></label></div><label className="mt-3 block text-[10px] font-semibold uppercase tracking-wider text-vm-muted">Cor do destaque<input value={style.highlightColor || "#E07A5F"} onChange={e => onChange({ highlightColor: e.target.value })} className="mt-1 w-full rounded-xl border border-vm-border bg-white px-3 py-2 font-mono text-sm" /></label></div> }
function Gallery({ label, images, busy, onUpload, onRemove }: { label: string; images: string[]; busy: boolean; onUpload: (files: File[]) => void; onRemove: (i: number) => void }) { return <div className="rounded-2xl border border-vm-border bg-vm-bg p-4"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-vm-ink">{label}</h3><label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-vm-border bg-white px-3 py-2 text-[11px] font-semibold"><Upload size={13} />{busy ? "Enviando…" : "Adicionar"}<input type="file" accept="image/*" multiple className="sr-only" disabled={busy} onChange={e => { const files = Array.from(e.target.files || []); if (files.length) onUpload(files); e.currentTarget.value = "" }} /></label></div><div className="mt-4 grid grid-cols-2 gap-3">{images.map((src, i) => <div key={`${src}-${i}`} className="group relative aspect-video overflow-hidden rounded-xl bg-vm-sand"><Image src={src} alt="" fill className="object-cover" unoptimized /><button type="button" onClick={() => onRemove(i)} className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-red-500 opacity-0 shadow group-hover:opacity-100"><Trash2 size={14} /></button></div>)}</div></div> }
