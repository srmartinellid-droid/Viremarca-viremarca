"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Settings,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  Save,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import { createClientOptional } from "@/lib/supabase/client"
import type { PortfolioProject } from "@/types"
import { cn } from "@/lib/utils"
import {
  createProject,
  updateProject,
  deleteProject,
  toggleProjectActive,
} from "@/app/actions/portfolio"
import { logoutAction } from "@/app/actions/auth"

type Tab = "dashboard" | "portfolio" | "content" | "settings"
type Notice = { type: "ok" | "err"; text: string }

type SiteMap = Record<string, string>

const emptyForm = {
  title: "",
  slug: "",
  category: "",
  description: "",
  thumbnail: "",
  site_url: "",
  display_order: 0,
  featured: false,
  active: true,
}

const defaultContent: SiteMap = {
  hero_title: "Seu negócio merece uma presença digital à altura.",
  hero_subtitle: "A VireMarca cria sites profissionais pensados para cada segmento — com design, performance e estrutura que realmente vendem.",
  about_title: "Uma nova marca, construída sobre experiência real.",
  about_body: "",
}

const defaultSettings: SiteMap = {
  whatsapp: "",
  email: "",
  instagram: "",
}

const nav = [
  { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
  { id: "portfolio" as Tab, label: "Portfólio", icon: FolderKanban },
  { id: "content" as Tab, label: "Conteúdo", icon: FileText },
  { id: "settings" as Tab, label: "Configurações", icon: Settings },
]

function Field({ label, value, onChange, multiline = false, placeholder = "" }: {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  placeholder?: string
}) {
  const classes = "w-full rounded-xl border border-vm-border bg-white px-4 py-3 text-sm text-vm-ink outline-none transition focus:border-vm-coral focus:ring-4 focus:ring-vm-coral/10"
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-vm-muted">{label}</span>
      {multiline ? (
        <textarea rows={7} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={classes + " resize-y leading-relaxed"} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={classes} />
      )}
    </label>
  )
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
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [content, setContent] = useState<SiteMap>(defaultContent)
  const [settings, setSettings] = useState<SiteMap>(defaultSettings)
  const [savingContent, setSavingContent] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  const flash = (type: Notice["type"], text: string) => {
    setNotice({ type, text })
    window.setTimeout(() => setNotice(null), 4000)
  }

  const loadData = useCallback(async () => {
    const supabase = createClientOptional()
    if (!supabase) {
      setLoading(false)
      flash("err", "Supabase não configurado.")
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = "/admin/login"
      return
    }

    setUserEmail(user.email ?? null)

    const [projectsResult, profileResult, contentResult, settingsResult] = await Promise.all([
      supabase.from("portfolio_projects").select("*").order("display_order", { ascending: true }),
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      supabase.from("site_content").select("key,value"),
      supabase.from("site_settings").select("key,value"),
    ])

    if (projectsResult.error) {
      flash("err", projectsResult.error.message)
      setProjects([])
    } else {
      setProjects((projectsResult.data as PortfolioProject[]) ?? [])
    }

    setRole((profileResult.data?.role as string) ?? "admin")

    if (!contentResult.error) {
      const next = { ...defaultContent }
      for (const row of (contentResult.data ?? []) as Array<{ key: string; value: string }>) next[row.key] = row.value
      setContent(next)
    }

    if (!settingsResult.error) {
      const next = { ...defaultSettings }
      for (const row of (settingsResult.data ?? []) as Array<{ key: string; value: string }>) next[row.key] = row.value
      setSettings(next)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setModal("create")
  }

  const openEdit = (p: PortfolioProject) => {
    setForm({
      title: p.title,
      slug: p.slug,
      category: p.category,
      description: p.description,
      thumbnail: p.thumbnail || "",
      site_url: p.site_url || "",
      display_order: p.display_order,
      featured: p.featured,
      active: p.active,
    })
    setEditingId(p.id)
    setModal("edit")
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal === "create") {
        const res = await createProject({ ...form, thumbnail: form.thumbnail || null, site_url: form.site_url || null })
        if (res.error) flash("err", res.error)
        else {
          flash("ok", "Projeto criado.")
          setModal(null)
          await loadData()
        }
      } else if (modal === "edit" && editingId) {
        const res = await updateProject(editingId, { ...form, thumbnail: form.thumbnail || null, site_url: form.site_url || null })
        if (res.error) flash("err", res.error)
        else {
          flash("ok", "Projeto atualizado.")
          setModal(null)
          await loadData()
        }
      }
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (p: PortfolioProject) => {
    const res = await toggleProjectActive(p.id, !p.active)
    if (res.error) flash("err", res.error)
    else {
      flash("ok", p.active ? "Projeto despublicado." : "Projeto publicado.")
      await loadData()
    }
  }

  const handleDelete = async (p: PortfolioProject) => {
    if (!confirm(`Excluir "${p.title}"? Esta ação não pode ser desfeita.`)) return
    const res = await deleteProject(p.id)
    if (res.error) flash("err", res.error)
    else {
      flash("ok", "Projeto excluído.")
      await loadData()
    }
  }

  const saveMap = async (table: "site_content" | "site_settings", map: SiteMap, setSavingState: (value: boolean) => void, label: string) => {
    const supabase = createClientOptional()
    if (!supabase) {
      flash("err", "Supabase não configurado.")
      return
    }
    setSavingState(true)
    const rows = Object.entries(map).map(([key, value]) => ({ key, value }))
    const { error } = await supabase.from(table).upsert(rows, { onConflict: "key" })
    setSavingState(false)
    if (error) flash("err", error.message)
    else flash("ok", `${label} salvo com sucesso.`)
  }

  return (
    <div className="min-h-screen bg-vm-bg flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-vm-border bg-white">
        <div className="p-6 border-b border-vm-border">
          <Image src="/logo-wordmark.png" alt="VireMarca" width={280} height={72} className="h-11 w-auto" />
          <p className="mt-3 text-xs text-vm-muted truncate">{userEmail || "Admin"}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1.5">
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} type="button" onClick={() => setTab(item.id)} className={cn(
                "w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                tab === item.id ? "bg-vm-coral/10 text-vm-coral shadow-sm" : "text-vm-muted hover:bg-vm-sand hover:text-vm-ink"
              )}>
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </nav>
        <div className="p-4 border-t border-vm-border">
          <button type="button" onClick={() => logoutAction()} className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-vm-muted hover:bg-vm-sand">
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 min-h-16 border-b border-vm-border bg-white/90 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-vm-coral">VireMarca · Admin</p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight text-vm-ink">{nav.find((item) => item.id === tab)?.label}</h1>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-vm-border bg-white px-4 py-2 text-xs font-semibold text-vm-ink hover:border-vm-coral hover:text-vm-coral transition-colors">
            Ver site <ExternalLink size={13} />
          </Link>
        </header>

        <div className="md:hidden overflow-x-auto border-b border-vm-border bg-white px-3 py-2">
          <div className="flex gap-2 min-w-max">
            {nav.map((item) => {
              const Icon = item.icon
              return <button key={item.id} type="button" onClick={() => setTab(item.id)} className={cn("inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium", tab === item.id ? "bg-vm-coral text-white" : "bg-vm-bg text-vm-muted")}><Icon size={14} />{item.label}</button>
            })}
          </div>
        </div>

        {notice && (
          <div className={cn("mx-4 mt-4 md:mx-8 rounded-2xl border px-4 py-3 text-sm flex items-center gap-3", notice.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700")}>
            {notice.type === "ok" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
            {notice.text}
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 lg:p-10">
          {loading ? (
            <div className="rounded-3xl border border-vm-border bg-white p-10 text-sm text-vm-muted">Carregando painel…</div>
          ) : (
            <>
              {tab === "dashboard" && (
                <div className="space-y-8">
                  <section className="relative overflow-hidden rounded-[2rem] bg-vm-ink p-7 md:p-10 text-white">
                    <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-vm-coral/25 blur-3xl" />
                    <div className="relative max-w-2xl">
                      <div className="flex items-center gap-2 text-vm-coral"><Sparkles size={16} /><span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Central de controle</span></div>
                      <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">A marca no ar. Agora, sob controle.</h2>
                      <p className="mt-3 max-w-xl text-sm md:text-base leading-relaxed text-white/65">Gerencie portfólio, textos públicos e canais de contato sem tocar na arquitetura do site.</p>
                    </div>
                  </section>

                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      ["Projetos ativos", projects.filter((p) => p.active).length],
                      ["Em destaque", projects.filter((p) => p.featured).length],
                      ["Total", projects.length],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="rounded-3xl border border-vm-border bg-white p-6 shadow-sm">
                        <p className="text-sm text-vm-muted">{label}</p>
                        <p className="mt-2 text-4xl font-semibold tracking-tight text-vm-ink">{value}</p>
                      </div>
                    ))}
                  </div>

                  <section className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
                    <div className="rounded-3xl border border-vm-border bg-white p-6">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-vm-coral">Estado</p>
                      <h3 className="mt-2 text-xl font-semibold text-vm-ink">Operação protegida</h3>
                      <p className="mt-2 text-sm leading-relaxed text-vm-muted">Autenticação Supabase ativa, conteúdo protegido por RLS e portfólio administrável sem alterar o front-end público.</p>
                    </div>
                    <div className="rounded-3xl border border-vm-border bg-vm-sand p-6">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-vm-muted">Sessão</p>
                      <p className="mt-2 font-semibold text-vm-ink break-all">{userEmail}</p>
                      <p className="mt-1 text-xs text-vm-muted">Perfil: {role || "admin"}</p>
                    </div>
                  </section>
                </div>
              )}

              {tab === "portfolio" && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
                    <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-vm-coral">Vitrine</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-vm-ink">Projetos publicados</h2><p className="mt-1 text-sm text-vm-muted">A mesma coleção que alimenta a vitrine pública.</p></div>
                    <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-full bg-vm-coral px-5 py-3 text-sm font-semibold text-white hover:bg-vm-coral-deep transition-colors"><Plus size={16} />Novo projeto</button>
                  </div>
                  <div className="rounded-3xl border border-vm-border bg-white overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[680px]">
                        <thead><tr className="border-b border-vm-border text-left text-vm-muted"><th className="px-5 py-4 font-medium">Projeto</th><th className="px-5 py-4 font-medium">Categoria</th><th className="px-5 py-4 font-medium">Status</th><th className="px-5 py-4 font-medium text-right">Ações</th></tr></thead>
                        <tbody>
                          {projects.length === 0 && <tr><td colSpan={4} className="px-5 py-12 text-center text-vm-muted">Nenhum projeto cadastrado.</td></tr>}
                          {projects.map((p) => <tr key={p.id} className="border-b border-vm-border last:border-0 hover:bg-vm-bg/60 transition-colors">
                            <td className="px-5 py-4"><div className="flex items-center gap-3">{p.thumbnail ? <Image src={p.thumbnail} alt="" width={54} height={42} className="h-11 w-14 rounded-lg object-cover" /> : <div className="h-11 w-14 rounded-lg bg-vm-sand" />}<div><p className="font-semibold text-vm-ink">{p.title}</p><p className="text-xs text-vm-muted">/{p.slug}</p></div></div></td>
                            <td className="px-5 py-4 text-vm-muted">{p.category}</td>
                            <td className="px-5 py-4"><span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", p.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500")}>{p.active ? "Ativo" : "Inativo"}</span></td>
                            <td className="px-5 py-4 text-right"><div className="inline-flex gap-1"><button type="button" onClick={() => handleToggle(p)} className="p-2 rounded-lg text-vm-muted hover:bg-vm-sand" title={p.active ? "Despublicar" : "Publicar"}>{p.active ? <Eye size={16} /> : <EyeOff size={16} />}</button><button type="button" onClick={() => openEdit(p)} className="p-2 rounded-lg text-vm-muted hover:bg-vm-sand" title="Editar"><Pencil size={16} /></button><button type="button" onClick={() => handleDelete(p)} className="p-2 rounded-lg text-red-500 hover:bg-red-50" title="Excluir"><Trash2 size={16} /></button></div></td>
                          </tr>)}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {tab === "content" && (
                <div className="max-w-4xl space-y-6">
                  <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-vm-coral">Conteúdo público</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-vm-ink">Controle a mensagem da VireMarca</h2><p className="mt-1 text-sm text-vm-muted">Edite os textos persistidos no Supabase. A estrutura e o design continuam intactos.</p></div>
                  <div className="grid gap-5 lg:grid-cols-2">
                    <section className="rounded-3xl border border-vm-border bg-white p-6 space-y-5"><div><h3 className="font-semibold text-vm-ink">Hero</h3><p className="mt-1 text-xs text-vm-muted">Primeira impressão do site.</p></div><Field label="Título principal" value={content.hero_title} onChange={(value) => setContent((s) => ({ ...s, hero_title: value }))} /><Field label="Subtítulo" value={content.hero_subtitle} onChange={(value) => setContent((s) => ({ ...s, hero_subtitle: value }))} multiline /></section>
                    <section className="rounded-3xl border border-vm-border bg-white p-6 space-y-5"><div><h3 className="font-semibold text-vm-ink">Quem somos</h3><p className="mt-1 text-xs text-vm-muted">Narrativa institucional.</p></div><Field label="Título" value={content.about_title} onChange={(value) => setContent((s) => ({ ...s, about_title: value }))} /><Field label="Texto" value={content.about_body} onChange={(value) => setContent((s) => ({ ...s, about_body: value }))} multiline /></section>
                  </div>
                  <div className="flex justify-end"><button type="button" disabled={savingContent} onClick={() => saveMap("site_content", content, setSavingContent, "Conteúdo")} className="inline-flex items-center gap-2 rounded-full bg-vm-coral px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"><Save size={16} />{savingContent ? "Salvando…" : "Salvar conteúdo"}</button></div>
                </div>
              )}

              {tab === "settings" && (
                <div className="max-w-4xl space-y-6">
                  <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-vm-coral">Configurações</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-vm-ink">Canais e operação</h2><p className="mt-1 text-sm text-vm-muted">Informações usadas nos pontos de contato do site.</p></div>
                  <section className="rounded-3xl border border-vm-border bg-white p-6 md:p-7 space-y-6"><div className="grid gap-5 md:grid-cols-2"><Field label="WhatsApp" value={settings.whatsapp} onChange={(value) => setSettings((s) => ({ ...s, whatsapp: value }))} placeholder="5548999999999" /><Field label="E-mail" value={settings.email} onChange={(value) => setSettings((s) => ({ ...s, email: value }))} placeholder="contato@viremarca.com.br" /></div><Field label="Instagram" value={settings.instagram} onChange={(value) => setSettings((s) => ({ ...s, instagram: value }))} placeholder="viremarca" /></section>
                  <section className="rounded-3xl border border-vm-border bg-vm-sand p-6"><div className="flex items-start gap-3"><Settings size={18} className="mt-0.5 text-vm-coral" /><div><h3 className="font-semibold text-vm-ink">Conta administrativa</h3><p className="mt-1 text-sm text-vm-muted">{userEmail}</p><p className="mt-1 text-xs text-vm-muted">Perfil atual: {role || "admin"}. Permissões continuam controladas pelo Supabase RLS.</p></div></div></section>
                  <div className="flex justify-end"><button type="button" disabled={savingSettings} onClick={() => saveMap("site_settings", settings, setSavingSettings, "Configurações")} className="inline-flex items-center gap-2 rounded-full bg-vm-coral px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"><Save size={16} />{savingSettings ? "Salvando…" : "Salvar configurações"}</button></div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vm-ink/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[1.75rem] bg-white border border-vm-border shadow-2xl max-h-[92vh] overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-vm-border"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-vm-coral">Portfólio</p><h3 className="mt-1 text-xl font-semibold text-vm-ink">{modal === "create" ? "Novo projeto" : "Editar projeto"}</h3></div><button type="button" onClick={() => setModal(null)} className="p-2 rounded-full text-vm-muted hover:bg-vm-bg"><X size={18} /></button></div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid gap-5 md:grid-cols-2"><Field label="Título *" value={form.title} onChange={(value) => setForm((f) => ({ ...f, title: value }))} /><Field label="Categoria" value={form.category} onChange={(value) => setForm((f) => ({ ...f, category: value }))} /></div>
              <div className="grid gap-5 md:grid-cols-2"><Field label="Slug" value={form.slug} onChange={(value) => setForm((f) => ({ ...f, slug: value }))} placeholder="auto" /><Field label="Thumbnail (URL)" value={form.thumbnail} onChange={(value) => setForm((f) => ({ ...f, thumbnail: value }))} placeholder="/portfolio/exemplo.jpg" /></div>
              <Field label="Descrição" value={form.description} onChange={(value) => setForm((f) => ({ ...f, description: value }))} multiline />
              <Field label="URL do site" value={form.site_url} onChange={(value) => setForm((f) => ({ ...f, site_url: value }))} placeholder="https://..." />
              <div className="grid gap-4 md:grid-cols-3"><label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-vm-muted">Ordem</span><input type="number" value={form.display_order} onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))} className="w-full rounded-xl border border-vm-border px-4 py-3 text-sm" /></label><label className="flex items-center gap-3 rounded-xl border border-vm-border px-4 py-3 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} className="accent-[var(--color-vm-coral)]" />Em destaque</label><label className="flex items-center gap-3 rounded-xl border border-vm-border px-4 py-3 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="accent-[var(--color-vm-coral)]" />Publicado</label></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setModal(null)} className="rounded-full border border-vm-border px-5 py-3 text-sm font-semibold text-vm-muted">Cancelar</button><button type="submit" disabled={saving || !form.title} className="inline-flex items-center gap-2 rounded-full bg-vm-coral px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"><Save size={16} />{saving ? "Salvando…" : "Salvar projeto"}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
