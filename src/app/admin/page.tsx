"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { LayoutDashboard, FolderKanban, FileText, Settings, Activity, LogOut, Plus, Pencil, Trash2, Eye, EyeOff, X, Save, ExternalLink, CheckCircle2, AlertCircle, Sparkles, Upload, Star } from "lucide-react"
import { createClientOptional } from "@/lib/supabase/client"
import type { PortfolioProject } from "@/types"
import type { ProcessItem, DeliverItem } from "@/lib/site-content"
import { DEMO_CONTENT } from "@/lib/demo-data"
import { cn } from "@/lib/utils"
import { createProject, updateProject, deleteProject, toggleProjectActive } from "@/app/actions/portfolio"
import { logoutAction } from "@/app/actions/auth"
import { VisualSettings } from "@/components/VisualSettings"
import { eventLabel, formatEventContext } from "@/lib/event-labels"

type Tab = "dashboard" | "portfolio" | "content" | "settings" | "visual" | "performance"
type PerformancePeriod = "today" | "7d" | "30d"
type SiteEvent = { id: string; event_name: string; page: string; metadata: Record<string, unknown> | null; status: "production" | "lab"; created_at: string }
type Notice = { type: "ok" | "err"; text: string }
type SiteMap = Record<string, string>

const emptyForm = { title: "", slug: "", category: "", description: "", thumbnail: "", site_url: "", display_order: 0, featured: false, active: true }
const defaultContent: SiteMap = {
  hero_title: "Seu negócio merece uma",
  hero_accent: "presença digital à altura.",
  hero_subtitle: DEMO_CONTENT.heroSubtitle,
  about_title: DEMO_CONTENT.aboutTitle,
  about_body: DEMO_CONTENT.aboutBody,
}
const defaultSettings: SiteMap = { whatsapp: "", email: "", instagram: "", hero_accent_intensity: "100" }
const defaultProcess: ProcessItem[] = DEMO_CONTENT.process.map((item, i) => ({ ...item, image: ["/portfolio/magia-glass.jpg", "/portfolio/odonto.jpg", "/portfolio/imoveis.jpg", "/portfolio/advocacia.jpg"][i] }))
const defaultDelivers: DeliverItem[] = DEMO_CONTENT.delivers.map((item, i) => ({ ...item, image: ["/portfolio/magia-glass.jpg", "/portfolio/odonto.jpg", "/portfolio/imoveis.jpg", "/portfolio/advocacia.jpg", "/portfolio/odonto.jpg", "/portfolio/magia-glass.jpg"][i], details: "Conteúdo, estrutura e direção visual definidos para o objetivo do projeto." }))

const nav = [
  { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
  { id: "portfolio" as Tab, label: "Portfólio", icon: FolderKanban },
  { id: "content" as Tab, label: "Conteúdo", icon: FileText },
  { id: "settings" as Tab, label: "Configurações", icon: Settings },
  { id: "visual" as Tab, label: "Hero & Visual", icon: Sparkles },
  { id: "performance" as Tab, label: "Desempenho", icon: Activity },
]

function Field({ label, value, onChange, multiline = false, placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; placeholder?: string }) {
  const classes = "w-full rounded-xl border border-vm-border bg-white px-4 py-3 text-sm text-vm-ink outline-none transition focus:border-vm-coral focus:ring-4 focus:ring-vm-coral/10"
  return <label className="block"><span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-vm-muted">{label}</span>{multiline ? <textarea rows={6} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={classes + " resize-y leading-relaxed"} /> : <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={classes} />}</label>
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("dashboard")
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [modal, setModal] = useState<"create" | "edit" | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [content, setContent] = useState<SiteMap>(defaultContent)
  const [settings, setSettings] = useState<SiteMap>(defaultSettings)
  const [process, setProcess] = useState<ProcessItem[]>(defaultProcess)
  const [delivers, setDelivers] = useState<DeliverItem[]>(defaultDelivers)
  const [savingContent, setSavingContent] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [performancePeriod, setPerformancePeriod] = useState<PerformancePeriod>("7d")
  const [siteEvents, setSiteEvents] = useState<SiteEvent[]>([])
  const [performanceLoading, setPerformanceLoading] = useState(false)
  const [assistant, setAssistant] = useState({ enabled: false, assistant_name: "Assistente VireMarca", model: "", knowledge_base: "", fallback_whatsapp: "" })
  const [groqConfigured, setGroqConfigured] = useState(false)
  const [groqModels, setGroqModels] = useState<Array<{ id: string; active: boolean }>>([])
  const [savingAssistant, setSavingAssistant] = useState(false)
  const [groqApiKey, setGroqApiKey] = useState("")
  const [savingGroqKey, setSavingGroqKey] = useState(false)
  const [groqModelsError, setGroqModelsError] = useState("")

  const flash = (type: Notice["type"], text: string) => { setNotice({ type, text }); window.setTimeout(() => setNotice(null), 4000) }

  const loadData = useCallback(async () => {
    const supabase = createClientOptional()
    if (!supabase) { setLoading(false); flash("err", "Supabase não configurado."); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = "/admin/login"; return }
    setUserEmail(user.email ?? null)
    const [projectsResult, profileResult, contentResult, settingsResult] = await Promise.all([
      supabase.from("portfolio_projects").select("*").order("display_order", { ascending: true }),
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      supabase.from("site_content").select("key,value"),
      supabase.from("site_settings").select("key,value"),
    ])
    if (projectsResult.error) { flash("err", projectsResult.error.message); setProjects([]) } else setProjects((projectsResult.data as PortfolioProject[]) ?? [])
    setRole((profileResult.data?.role as string) ?? "admin")
    if (!contentResult.error) {
      const next = { ...defaultContent }
      for (const row of (contentResult.data ?? []) as Array<{ key: string; value: string }>) next[row.key] = row.value
      setContent(next)
      try { if ((next.process_json as string)) setProcess(JSON.parse(next.process_json)) } catch { setProcess(defaultProcess) }
      try { if ((next.delivers_json as string)) setDelivers(JSON.parse(next.delivers_json)) } catch { setDelivers(defaultDelivers) }
    }
    if (!settingsResult.error) { const next = { ...defaultSettings }; for (const row of (settingsResult.data ?? []) as Array<{ key: string; value: string }>) next[row.key] = row.value; setSettings(next) }
    try {
      const response = await fetch("/api/admin/assistant-config")
      if (response.ok) {
        const data = await response.json()
        setAssistant({ enabled: Boolean(data.enabled), assistant_name: data.assistant_name || "Assistente VireMarca", model: data.model || "", knowledge_base: data.knowledge_base || "", fallback_whatsapp: data.fallback_whatsapp || "" })
        setGroqConfigured(Boolean(data.groq_configured))
        if (data.groq_configured) {
          const modelsResponse = await fetch("/api/chat/models")
          const modelsData = await modelsResponse.json().catch(() => null)
          if (modelsResponse.ok) setGroqModels(modelsData?.models || [])
          else setGroqModelsError(modelsData?.error || "Não foi possível carregar os modelos Groq.")
        } else {
          setGroqModelsError("Configure a chave da API Groq para carregar os modelos disponíveis.")
        }
      }
    } catch { /* painel continua funcional mesmo sem a configuração do Core Chat */ }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (tab !== "performance") return
    const loadPerformance = async () => {
      const supabase = createClientOptional()
      if (!supabase) return
      setPerformanceLoading(true)
      const start = new Date()
      if (performancePeriod === "today") start.setHours(0, 0, 0, 0)
      else start.setDate(start.getDate() - (performancePeriod === "7d" ? 7 : 30))
      const { data, error } = await supabase.from("site_events").select("id,event_name,page,metadata,status,created_at").gte("created_at", start.toISOString()).order("created_at", { ascending: false }).limit(1000)
      if (error) flash("err", error.message)
      else setSiteEvents((data as SiteEvent[]) ?? [])
      setPerformanceLoading(false)
    }
    loadPerformance()
  }, [tab, performancePeriod])

  const uploadImage = async (file: File, folder: string) => {
    const supabase = createClientOptional()
    if (!supabase) throw new Error("Supabase não configurado.")
    if (!file.type.startsWith("image/")) throw new Error("Escolha uma imagem.")
    if (file.size > 10 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 10 MB.")
    setUploading(true)
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
      const path = `${folder}/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from("site-media").upload(path, file, { contentType: file.type, upsert: false })
      if (error) throw error
      return supabase.storage.from("site-media").getPublicUrl(path).data.publicUrl
    } finally { setUploading(false) }
  }

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setModal("create") }
  const openEdit = (p: PortfolioProject) => { setForm({ title: p.title, slug: p.slug, category: p.category, description: p.description, thumbnail: p.thumbnail || "", site_url: p.site_url || "", display_order: p.display_order, featured: p.featured, active: p.active }); setEditingId(p.id); setModal("edit") }

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const input = { ...form, thumbnail: form.thumbnail || null, site_url: form.site_url || null }
      const res = modal === "create" ? await createProject(input) : editingId ? await updateProject(editingId, input) : { error: "Projeto inválido." }
      if (res.error) flash("err", res.error)
      else { flash("ok", modal === "create" ? "Projeto criado." : "Projeto atualizado."); setModal(null); await loadData() }
    } finally { setSaving(false) }
  }

  const handleToggle = async (p: PortfolioProject) => { const res = await toggleProjectActive(p.id, !p.active); if (res.error) flash("err", res.error); else { flash("ok", p.active ? "Projeto despublicado." : "Projeto publicado."); await loadData() } }
  const handleDelete = async (p: PortfolioProject) => { if (!confirm(`Excluir "${p.title}"? Esta ação não pode ser desfeita.`)) return; const res = await deleteProject(p.id); if (res.error) flash("err", res.error); else { flash("ok", "Projeto excluído."); await loadData() } }

  const saveContent = async () => {
    const supabase = createClientOptional(); if (!supabase) return flash("err", "Supabase não configurado.")
    setSavingContent(true)
    const rows = Object.entries({ ...content, process_json: JSON.stringify(process), delivers_json: JSON.stringify(delivers) }).map(([key, value]) => ({ key, value }))
    const { error } = await supabase.from("site_content").upsert(rows, { onConflict: "key" })
    setSavingContent(false); if (error) flash("err", error.message); else flash("ok", "Conteúdo salvo com sucesso.")
  }

  const saveSettings = async () => {
    const supabase = createClientOptional(); if (!supabase) return flash("err", "Supabase não configurado.")
    setSavingSettings(true)
    const rows = Object.entries(settings).map(([key, value]) => ({ key, value }))
    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" })
    setSavingSettings(false); if (error) flash("err", error.message); else flash("ok", "Configurações salvas com sucesso.")
  }

  const saveGroqKey = async () => {
    if (!groqApiKey.trim()) return flash("err", "Informe a chave da API Groq.")
    setSavingGroqKey(true)
    try {
      const response = await fetch("/api/admin/assistant-secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: groqApiKey }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Falha ao salvar a chave Groq.")
      setGroqApiKey("")
      setGroqConfigured(Boolean(data.groq_configured))
      const modelsResponse = await fetch("/api/chat/models")
      const modelsData = await modelsResponse.json().catch(() => null)
      if (modelsResponse.ok) {
        setGroqModels(modelsData?.models || [])
        setGroqModelsError("")
      } else {
        setGroqModelsError(modelsData?.error || "Não foi possível carregar os modelos Groq.")
      }
      flash("ok", "Chave da API Groq salva com segurança.")
    } catch (error) {
      flash("err", error instanceof Error ? error.message : "Falha ao salvar a chave Groq.")
    } finally {
      setSavingGroqKey(false)
    }
  }

  const saveAssistant = async () =>
    setSavingAssistant(true)
    try {
      const response = await fetch("/api/admin/assistant-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(assistant) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Falha ao salvar o Assistente de IA.")
      setAssistant({ enabled: Boolean(data.enabled), assistant_name: data.assistant_name, model: data.model, knowledge_base: data.knowledge_base, fallback_whatsapp: data.fallback_whatsapp })
      setGroqConfigured(Boolean(data.groq_configured))
      flash("ok", "Configuração do Assistente de IA salva.")
    } catch (error) { flash("err", error instanceof Error ? error.message : "Falha ao salvar.") }
    finally { setSavingAssistant(false) }
  }

  const updateProcess = (index: number, patch: Partial<ProcessItem>) => setProcess((items) => items.map((item, i) => i === index ? { ...item, ...patch } : item))
  const updateDeliver = (index: number, patch: Partial<DeliverItem>) => setDelivers((items) => items.map((item, i) => i === index ? { ...item, ...patch } : item))

  return <div className="min-h-screen bg-vm-bg flex">
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-vm-border bg-white">
      <div className="p-6 border-b border-vm-border"><Image src="/logo-wordmark.png" alt="VireMarca" width={360} height={92} className="h-12 w-auto" /><p className="mt-3 text-xs text-vm-muted truncate">{userEmail || "Admin"}</p></div>
      <nav className="flex-1 p-4 space-y-1.5">{nav.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => setTab(item.id)} className={cn("w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all", tab === item.id ? "bg-vm-coral/10 text-vm-coral" : "text-vm-muted hover:bg-vm-sand hover:text-vm-ink")}><Icon size={18} />{item.label}</button> })}</nav>
      <div className="p-4 border-t border-vm-border"><button type="button" onClick={() => logoutAction()} className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-vm-muted hover:bg-vm-sand"><LogOut size={18} />Sair</button></div>
    </aside>

    <div className="flex-1 min-w-0 flex flex-col">
      <header className="sticky top-0 z-30 min-h-16 border-b border-vm-border bg-white/90 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-vm-coral">VireMarca · Admin</p><h1 className="mt-1 text-lg font-semibold tracking-tight text-vm-ink">{nav.find((item) => item.id === tab)?.label}</h1></div><Link href="/" className="inline-flex items-center gap-2 rounded-full border border-vm-border bg-white px-4 py-2 text-xs font-semibold text-vm-ink hover:border-vm-coral"><ExternalLink size={13} />Ver site</Link></header>
      <div className="md:hidden overflow-x-auto border-b border-vm-border bg-white px-3 py-2"><div className="flex gap-2 min-w-max">{nav.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => setTab(item.id)} className={cn("inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium", tab === item.id ? "bg-vm-coral text-white" : "bg-vm-bg text-vm-muted")}><Icon size={14} />{item.label}</button> })}</div></div>
      {notice && <div className={cn("mx-4 mt-4 md:mx-8 rounded-2xl border px-4 py-3 text-sm flex items-center gap-3", notice.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700")}>{notice.type === "ok" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}{notice.text}</div>}

      <main className="flex-1 p-4 md:p-8 lg:p-10">
        {loading ? <div className="rounded-3xl border border-vm-border bg-white p-10 text-sm text-vm-muted">Carregando painel…</div> : <>
          {tab === "dashboard" && <div className="space-y-7">
            <section className="relative overflow-hidden rounded-[2rem] bg-vm-ink p-7 md:p-10 text-white"><div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-vm-coral/25 blur-3xl" /><div className="relative max-w-2xl"><div className="flex items-center gap-2 text-vm-coral"><Sparkles size={16} /><span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Central de controle</span></div><h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">A marca no ar. Agora, sob controle.</h2><p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">Portfólio, textos, imagens, destaque da hero e canais de contato em um só lugar.</p></div></section>
            <div className="grid gap-4 sm:grid-cols-3">{[["Projetos ativos", projects.filter(p => p.active).length],["Em destaque", projects.filter(p => p.featured).length],["Total", projects.length]].map(([label, value]) => <div key={String(label)} className="rounded-3xl border border-vm-border bg-white p-6"><p className="text-sm text-vm-muted">{label}</p><p className="mt-2 text-4xl font-semibold text-vm-ink">{value}</p></div>)}</div>
            <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]"><div className="rounded-3xl border border-vm-border bg-white p-6"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-vm-coral">Estado</p><h3 className="mt-2 text-xl font-semibold text-vm-ink">Operação protegida</h3><p className="mt-2 text-sm leading-relaxed text-vm-muted">Autenticação Supabase, RLS e armazenamento privado para edição administrativa.</p></div><div className="rounded-3xl border border-vm-border bg-vm-sand p-6"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-vm-muted">Sessão</p><p className="mt-2 font-semibold text-vm-ink break-all">{userEmail}</p><p className="mt-1 text-xs text-vm-muted">Perfil: {role || "admin"}</p></div></div>
          </div>}

          {tab === "portfolio" && <div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-vm-coral">Vitrine</p><h2 className="mt-2 text-2xl font-semibold text-vm-ink">Projetos publicados</h2><p className="mt-1 text-sm text-vm-muted">Marque como <strong>destaque</strong> para alimentar automaticamente os cards da hero.</p></div><button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-full bg-vm-coral px-5 py-3 text-sm font-semibold text-white"><Plus size={16} />Novo projeto</button></div>
            <div className="rounded-3xl border border-vm-border bg-white overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm min-w-[760px]"><thead><tr className="border-b border-vm-border text-left text-vm-muted"><th className="px-5 py-4">Projeto</th><th className="px-5 py-4">Categoria</th><th className="px-5 py-4">Destaque</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Ações</th></tr></thead><tbody>{projects.map((p) => <tr key={p.id} className="border-b border-vm-border last:border-0 hover:bg-vm-bg/60"><td className="px-5 py-4"><div className="flex items-center gap-3">{p.thumbnail ? <Image src={p.thumbnail} alt="" width={58} height={44} className="h-11 w-14 rounded-lg object-cover" /> : <div className="h-11 w-14 rounded-lg bg-vm-sand" />}<div><p className="font-semibold text-vm-ink">{p.title}</p><p className="text-xs text-vm-muted">/{p.slug}</p></div></div></td><td className="px-5 py-4 text-vm-muted">{p.category}</td><td className="px-5 py-4">{p.featured ? <span className="inline-flex items-center gap-1 rounded-full bg-vm-coral/10 px-2.5 py-1 text-xs font-semibold text-vm-coral"><Star size={12} />Sim</span> : <span className="text-xs text-vm-muted">Não</span>}</td><td className="px-5 py-4"><span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", p.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500")}>{p.active ? "Ativo" : "Inativo"}</span></td><td className="px-5 py-4 text-right"><div className="inline-flex gap-1"><button type="button" onClick={() => handleToggle(p)} className="p-2 rounded-lg text-vm-muted hover:bg-vm-sand" title={p.active ? "Despublicar" : "Publicar"}>{p.active ? <Eye size={16} /> : <EyeOff size={16} />}</button><button type="button" onClick={() => openEdit(p)} className="p-2 rounded-lg text-vm-muted hover:bg-vm-sand" title="Editar"><Pencil size={16} /></button><button type="button" onClick={() => handleDelete(p)} className="p-2 rounded-lg text-red-500 hover:bg-red-50" title="Excluir"><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div></div>
          </div>}

          {tab === "content" && <div className="max-w-6xl space-y-8">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-vm-coral">Conteúdo público</p><h2 className="mt-2 text-2xl font-semibold text-vm-ink">Edite o que aparece no site</h2><p className="mt-1 text-sm text-vm-muted">Textos, imagens e abordagens ficam persistidos no Supabase. A arquitetura continua protegida.</p></div>
            <section className="rounded-3xl border border-vm-border bg-white p-6 space-y-5"><div><h3 className="font-semibold text-vm-ink">Hero</h3><p className="mt-1 text-xs text-vm-muted">O título mantém duas cores. A intensidade é calibrada em Configurações.</p></div><div className="grid gap-5 lg:grid-cols-2"><Field label="Título principal" value={content.hero_title} onChange={(v) => setContent(s => ({ ...s, hero_title: v }))} /><Field label="Trecho destacado" value={content.hero_accent} onChange={(v) => setContent(s => ({ ...s, hero_accent: v }))} /><div className="lg:col-span-2"><Field label="Subtítulo" value={content.hero_subtitle} onChange={(v) => setContent(s => ({ ...s, hero_subtitle: v }))} multiline /></div></div></section>
            <section className="rounded-3xl border border-vm-border bg-white p-6 space-y-5"><div><h3 className="font-semibold text-vm-ink">Como trabalhamos</h3><p className="mt-1 text-xs text-vm-muted">Cada etapa pode ter texto e imagem própria.</p></div><div className="grid gap-5 md:grid-cols-2">{process.map((item, i) => <article key={i} className="rounded-2xl border border-vm-border p-4"><div className="flex items-center justify-between mb-4"><span className="text-xs font-semibold text-vm-coral">Etapa {item.step}</span><label className="inline-flex items-center gap-2 rounded-full border border-vm-border px-3 py-2 text-xs font-semibold cursor-pointer"><Upload size={14} />{uploading ? "Enviando…" : "Trocar imagem"}<input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; try { const url = await uploadImage(file, "process"); updateProcess(i, { image: url }); flash("ok", "Imagem carregada.") } catch (error) { flash("err", error instanceof Error ? error.message : "Falha no upload.") } }} /></label></div>{item.image && <Image src={item.image} alt="" width={700} height={240} className="h-36 w-full rounded-xl object-cover mb-4" />}<div className="grid gap-4"><Field label="Título" value={item.title} onChange={(v) => updateProcess(i, { title: v })} /><Field label="Descrição" value={item.desc} onChange={(v) => updateProcess(i, { desc: v })} multiline /></div></article>)}</div></section>
            <section className="rounded-3xl border border-vm-border bg-white p-6 space-y-5"><div><h3 className="font-semibold text-vm-ink">O que entregamos</h3><p className="mt-1 text-xs text-vm-muted">Cards com imagem, descrição e conteúdo real para “Ver abordagem”.</p></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{delivers.map((item, i) => <article key={i} className="rounded-2xl border border-vm-border p-4"><div className="flex items-center justify-between mb-4"><span className="text-xs font-semibold text-vm-coral">0{i + 1}</span><div className="flex items-center gap-2"><label className="inline-flex items-center gap-2 rounded-full border border-vm-border px-2.5 py-2 text-xs font-semibold cursor-pointer"><Upload size={13} />Imagem<input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; try { const url = await uploadImage(file, "delivers"); updateDeliver(i, { image: url }); flash("ok", "Imagem carregada.") } catch (error) { flash("err", error instanceof Error ? error.message : "Falha no upload.") } }} /></label>{item.image && <button type="button" onClick={() => { updateDeliver(i, { image: "" }); flash("ok", "Imagem removida. Salve o conteúdo para publicar.") }} className="inline-flex items-center gap-1 rounded-full border border-red-200 px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"><Trash2 size={13} />Remover</button>}</div></div>{item.image && <Image src={item.image} alt="" width={600} height={260} className="h-28 w-full rounded-xl object-cover mb-4" />}<div className="space-y-4"><Field label="Título" value={item.title} onChange={(v) => updateDeliver(i, { title: v })} /><Field label="Descrição" value={item.desc} onChange={(v) => updateDeliver(i, { desc: v })} /><Field label="Abordagem" value={item.details} onChange={(v) => updateDeliver(i, { details: v })} multiline /></div></article>)}</div></section>
            <section className="rounded-3xl border border-vm-border bg-white p-6 space-y-5"><h3 className="font-semibold text-vm-ink">Quem somos</h3><div className="grid gap-5 lg:grid-cols-2"><Field label="Título" value={content.about_title} onChange={(v) => setContent(s => ({ ...s, about_title: v }))} /><Field label="Texto" value={content.about_body} onChange={(v) => setContent(s => ({ ...s, about_body: v }))} multiline /></div></section>
            <div className="flex justify-end"><button type="button" disabled={savingContent || uploading} onClick={saveContent} className="inline-flex items-center gap-2 rounded-full bg-vm-coral px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"><Save size={16} />{savingContent ? "Salvando…" : "Salvar conteúdo"}</button></div>
          </div>}

          {tab === "settings" && <div className="max-w-4xl space-y-7"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-vm-coral">Configurações</p><h2 className="mt-2 text-2xl font-semibold text-vm-ink">Identidade e canais</h2><p className="mt-1 text-sm text-vm-muted">Ajustes sem precisar tocar no código.</p></div><section className="rounded-3xl border border-vm-border bg-white p-6 space-y-6"><div className="grid gap-5 md:grid-cols-2"><Field label="WhatsApp" value={settings.whatsapp} onChange={(v) => setSettings(s => ({ ...s, whatsapp: v }))} placeholder="5548999999999" /><Field label="E-mail" value={settings.email} onChange={(v) => setSettings(s => ({ ...s, email: v }))} /><Field label="Instagram" value={settings.instagram} onChange={(v) => setSettings(s => ({ ...s, instagram: v }))} /></div></section><section className="rounded-3xl border border-vm-border bg-white p-6 space-y-6"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-vm-coral">Core Chat</p><h3 className="mt-2 text-lg font-semibold text-vm-ink">Assistente de IA</h3><p className="mt-1 text-sm text-vm-muted">Configuração comercial do assistente, sem expor a chave Groq ao navegador.</p></div><div className="grid gap-5 md:grid-cols-2"><Field label="Nome do assistente" value={assistant.assistant_name} onChange={(v) => setAssistant(a => ({ ...a, assistant_name: v }))} /><Field label="WhatsApp de fallback" value={assistant.fallback_whatsapp} onChange={(v) => setAssistant(a => ({ ...a, fallback_whatsapp: v }))} /><label className="block"><span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-vm-muted">Modelo Groq</span><select disabled={!groqConfigured || groqModels.length === 0} value={assistant.model} onChange={e => setAssistant(a => ({ ...a, model: e.target.value }))} className="w-full rounded-xl border border-vm-border bg-white px-4 py-3 text-sm text-vm-ink outline-none focus:border-vm-coral">{groqModels.map(model => <option key={model.id} value={model.id}>{model.id}</option>)}</select>{groqModelsError && <p className="mt-2 text-xs text-vm-muted">{groqModelsError}</p>}</label><label className="flex items-center gap-3 rounded-xl border border-vm-border p-4"><input type="checkbox" checked={assistant.enabled} onChange={e => setAssistant(a => ({ ...a, enabled: e.target.checked }))} className="accent-vm-coral" /><span><strong className="block text-sm text-vm-ink">Assistente ativo</strong><small className="text-xs text-vm-muted">Exibir o Core Chat no site.</small></span></label></div><Field label="Base de conhecimento comercial" value={assistant.knowledge_base} onChange={(v) => setAssistant(a => ({ ...a, knowledge_base: v }))} multiline placeholder="Serviços, diferenciais, processo, preços/faixas quando aplicável, FAQs e voz da marca." /><div className="rounded-2xl border border-vm-border bg-vm-bg p-4 space-y-3"><div><p className="text-xs font-semibold text-vm-ink">Chave da API Groq</p><p className="mt-1 text-sm text-vm-muted">{groqConfigured ? "•••••••• configurada" : "não configurada"}</p><p className="mt-1 text-[11px] text-vm-muted">A chave é cifrada antes de ser armazenada no Supabase. Nunca é retornada pela API.</p></div><div className="flex gap-2"><input type="password" autoComplete="new-password" value={groqApiKey} onChange={e => setGroqApiKey(e.target.value)} placeholder={groqConfigured ? "Informe uma nova chave para rotacionar" : "Cole a chave da API Groq"} className="min-w-0 flex-1 rounded-xl border border-vm-border bg-white px-4 py-3 text-sm text-vm-ink outline-none focus:border-vm-coral" /><button type="button" disabled={savingGroqKey || !groqApiKey.trim()} onClick={() => void saveGroqKey()} className="rounded-xl bg-vm-ink px-4 py-3 text-xs font-semibold text-white disabled:opacity-50">{savingGroqKey ? "Salvando…" : "Salvar chave"}</button></div></div><div className="flex justify-end"><button type="button" disabled={savingAssistant} onClick={() => void saveAssistant()} className="inline-flex items-center gap-2 rounded-full bg-vm-coral px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"><Save size={16} />{savingAssistant ? "Salvando…" : "Salvar Assistente de IA"}</button></div></section><section className="rounded-3xl border border-vm-border bg-white p-6"><div className="flex items-start justify-between gap-5"><div><h3 className="font-semibold text-vm-ink">Intensidade da cor da hero</h3><p className="mt-1 text-sm text-vm-muted">0 = quase neutro · 100 = coral máximo.</p></div><span className="text-2xl font-semibold text-vm-coral">{Number(settings.hero_accent_intensity || 100)}%</span></div><input type="range" min="0" max="100" value={Number(settings.hero_accent_intensity || 100)} onChange={(e) => setSettings(s => ({ ...s, hero_accent_intensity: e.target.value }))} className="mt-6 w-full accent-vm-coral" /><div className="mt-4 h-12 rounded-xl bg-vm-ink flex items-center px-5 text-xl font-semibold"><span className="text-white">Seu negócio merece uma&nbsp;</span><span style={{ color: `color-mix(in srgb, var(--color-vm-coral) ${Number(settings.hero_accent_intensity || 100)}%, white)` }}>presença digital.</span></div></section><div className="flex justify-end"><button type="button" disabled={savingSettings} onClick={saveSettings} className="inline-flex items-center gap-2 rounded-full bg-vm-coral px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"><Save size={16} />{savingSettings ? "Salvando…" : "Salvar configurações"}</button></div></div>}

          {tab === "performance" && (() => {
            const counts = siteEvents.reduce<Record<string, number>>((acc, event) => { acc[event.event_name] = (acc[event.event_name] || 0) + 1; return acc }, {})
            const countRows = Object.entries(counts).sort((x, y) => y[1] - x[1])
            const maxCount = countRows[0]?.[1] ?? 1
            const periodLabel = performancePeriod === "today" ? "Hoje" : performancePeriod === "7d" ? "7 dias" : "30 dias"
            return <div className="analytics-report max-w-6xl space-y-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-vm-coral">Analytics próprio</p><h2 className="mt-2 text-2xl font-semibold text-vm-ink">VireMarca · Desempenho</h2><p className="mt-1 text-sm text-vm-muted">Todos os eventos registrados no período, sem IP, nome ou e-mail.</p><p className="hidden print:block mt-2 text-xs text-vm-muted">Período: {periodLabel}</p></div>
                <div className="flex items-center gap-2 print:hidden"><button type="button" onClick={() => window.print()} className="rounded-full bg-vm-ink px-4 py-2 text-xs font-semibold text-white">Imprimir relatório</button></div>
              </div>
              <div className="flex flex-wrap gap-2 print:hidden">{([["today","Hoje"],["7d","7 dias"],["30d","30 dias"]] as const).map(([value,label]) => <button key={value} type="button" onClick={() => setPerformancePeriod(value)} className={cn("rounded-full px-4 py-2 text-xs font-semibold", performancePeriod === value ? "bg-vm-coral text-white" : "border border-vm-border bg-white text-vm-muted")}>{label}</button>)}</div>
              {performanceLoading ? <div className="rounded-3xl border border-vm-border bg-white p-10 text-sm text-vm-muted">Carregando eventos…</div> : <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-3xl border border-vm-border bg-white p-6"><p className="text-sm text-vm-muted">Total de eventos</p><p className="mt-2 text-4xl font-semibold text-vm-ink">{siteEvents.length}</p></div>
                  {countRows.slice(0,3).map(([name,count]) => <div key={name} className="rounded-3xl border border-vm-border bg-white p-6"><p className="text-sm text-vm-muted">{eventLabel(name)}</p><p className="mt-2 text-4xl font-semibold text-vm-ink">{count}</p></div>)}
                </div>
                {countRows.length > 0 && <section className="rounded-3xl border border-vm-border bg-white p-6 print:hidden"><div className="mb-5"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-vm-coral">Distribuição</p><h3 className="mt-1 text-lg font-semibold text-vm-ink">Eventos por tipo</h3></div><div className="space-y-3">{countRows.map(([name,count]) => <div key={name}><div className="mb-1.5 flex items-center justify-between gap-4 text-xs"><span className="font-medium text-vm-ink">{eventLabel(name)}</span><span className="text-vm-muted">{count}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-vm-bg"><div className="h-full rounded-full bg-vm-coral" style={{ width: `${Math.max(4, (count / maxCount) * 100)}%` }} /></div></div>)}</div></section>}
                <div className="rounded-3xl border border-vm-border bg-white overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm min-w-[780px]"><thead><tr className="border-b border-vm-border text-left text-vm-muted"><th className="px-5 py-4">Evento</th><th className="px-5 py-4">Página</th><th className="px-5 py-4">Contexto</th><th className="px-5 py-4">Data</th></tr></thead><tbody>{siteEvents.map(event => { const context = formatEventContext(event.metadata); return <tr key={event.id} className="border-b border-vm-border last:border-0"><td className="px-5 py-4"><p className="font-semibold text-vm-ink">{eventLabel(event.event_name)}</p></td><td className="px-5 py-4 text-vm-muted">{event.page}</td><td className="px-5 py-4 text-xs text-vm-muted">{context || "—"}</td><td className="px-5 py-4 text-vm-muted whitespace-nowrap">{new Date(event.created_at).toLocaleString("pt-BR")}</td></tr>})}</tbody></table></div>{siteEvents.length === 0 && <div className="p-8 text-sm text-vm-muted">Nenhum evento no período selecionado.</div>}</div>
              </>}
            </div>
          })()}
          {tab === "visual" && <VisualSettings />}
        </>}
      </main>
    </div>

    {modal && <div className="fixed inset-0 z-[80] bg-vm-ink/45 backdrop-blur-sm p-4 md:p-8 flex items-center justify-center"><form onSubmit={handleSaveProject} className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-[2rem] bg-white border border-vm-border shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-vm-border bg-white/95 backdrop-blur px-6 py-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-vm-coral">Portfólio</p><h2 className="mt-1 text-xl font-semibold text-vm-ink">{modal === "create" ? "Novo projeto" : "Editar projeto"}</h2></div><button type="button" onClick={() => setModal(null)} className="rounded-full p-2 text-vm-muted hover:bg-vm-bg"><X size={20} /></button></div><div className="p-6 space-y-5"><div className="grid gap-5 md:grid-cols-2"><Field label="Título" value={form.title} onChange={(v) => setForm(s => ({ ...s, title: v }))} /><Field label="Slug" value={form.slug} onChange={(v) => setForm(s => ({ ...s, slug: v }))} /><Field label="Categoria" value={form.category} onChange={(v) => setForm(s => ({ ...s, category: v }))} /><Field label="URL do site" value={form.site_url} onChange={(v) => setForm(s => ({ ...s, site_url: v }))} placeholder="https://..." /></div><Field label="Descrição" value={form.description} onChange={(v) => setForm(s => ({ ...s, description: v }))} multiline /><div className="rounded-2xl border border-vm-border p-4"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold text-vm-ink">Imagem do projeto</p><p className="text-xs text-vm-muted mt-1">Upload direto para o armazenamento da VireMarca.</p></div><label className="inline-flex items-center gap-2 rounded-full bg-vm-ink px-4 py-2.5 text-xs font-semibold text-white cursor-pointer"><Upload size={14} />{uploading ? "Enviando…" : "Enviar imagem"}<input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; try { const url = await uploadImage(file, "portfolio"); setForm(s => ({ ...s, thumbnail: url })); flash("ok", "Imagem carregada.") } catch (error) { flash("err", error instanceof Error ? error.message : "Falha no upload.") } }} /></label></div>{form.thumbnail && <Image src={form.thumbnail} alt="Preview" width={900} height={420} className="mt-4 h-48 w-full rounded-xl object-cover" />}</div><div className="grid gap-4 sm:grid-cols-3"><label className="flex items-center gap-3 rounded-xl border border-vm-border p-4 cursor-pointer"><input type="checkbox" checked={form.featured} onChange={(e) => setForm(s => ({ ...s, featured: e.target.checked }))} className="accent-vm-coral" /><span><strong className="block text-sm">Destaque</strong><small className="text-xs text-vm-muted">Aparece na hero</small></span></label><label className="flex items-center gap-3 rounded-xl border border-vm-border p-4 cursor-pointer"><input type="checkbox" checked={form.active} onChange={(e) => setForm(s => ({ ...s, active: e.target.checked }))} className="accent-vm-coral" /><span><strong className="block text-sm">Ativo</strong><small className="text-xs text-vm-muted">Publicado no site</small></span></label><label className="block rounded-xl border border-vm-border p-3"><span className="text-[10px] uppercase tracking-[0.1em] text-vm-muted">Ordem</span><input type="number" value={form.display_order} onChange={(e) => setForm(s => ({ ...s, display_order: Number(e.target.value) }))} className="mt-1 w-full bg-transparent text-sm outline-none" /></label></div></div><div className="flex justify-end gap-3 border-t border-vm-border px-6 py-5"><button type="button" onClick={() => setModal(null)} className="rounded-full border border-vm-border px-5 py-3 text-sm font-semibold text-vm-ink">Cancelar</button><button type="submit" disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-full bg-vm-coral px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"><Save size={16} />{saving ? "Salvando…" : "Salvar projeto"}</button></div></form></div>}
  </div>
}
