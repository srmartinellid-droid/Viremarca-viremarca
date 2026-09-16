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

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("dashboard")
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [modal, setModal] = useState<"create" | "edit" | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const flash = (type: "ok" | "err", text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const loadProjects = useCallback(async () => {
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

    const { data, error } = await supabase
      .from("portfolio_projects")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) {
      flash("err", error.message)
      setProjects([])
    } else {
      setProjects((data as PortfolioProject[]) ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

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
        const res = await createProject({
          ...form,
          thumbnail: form.thumbnail || null,
          site_url: form.site_url || null,
        })
        if (res.error) flash("err", res.error)
        else {
          flash("ok", "Projeto criado.")
          setModal(null)
          await loadProjects()
        }
      } else if (modal === "edit" && editingId) {
        const res = await updateProject(editingId, {
          ...form,
          thumbnail: form.thumbnail || null,
          site_url: form.site_url || null,
        })
        if (res.error) flash("err", res.error)
        else {
          flash("ok", "Projeto atualizado.")
          setModal(null)
          await loadProjects()
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
      await loadProjects()
    }
  }

  const handleDelete = async (p: PortfolioProject) => {
    if (!confirm(`Excluir "${p.title}"? Esta ação não pode ser desfeita.`)) return
    const res = await deleteProject(p.id)
    if (res.error) flash("err", res.error)
    else {
      flash("ok", "Projeto excluído.")
      await loadProjects()
    }
  }

  const handleLogout = async () => {
    await logoutAction()
  }

  const nav = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
    { id: "portfolio" as Tab, label: "Portfólio", icon: FolderKanban },
    { id: "content" as Tab, label: "Conteúdo", icon: FileText },
    { id: "settings" as Tab, label: "Configurações", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-vm-bg flex">
      <aside className="hidden md:flex w-60 flex-col border-r border-vm-border bg-white">
        <div className="p-5 border-b border-vm-border">
          <Image src="/logo-wordmark.png" alt="VireMarca" width={120} height={30} className="h-7 w-auto" />
          <p className="mt-1 text-xs text-vm-muted truncate">{userEmail || "Admin"}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                tab === item.id
                  ? "bg-vm-coral/10 text-vm-coral"
                  : "text-vm-muted hover:bg-vm-sand hover:text-vm-ink"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-vm-border">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-vm-muted hover:bg-vm-sand"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-vm-border bg-white flex items-center justify-between px-4 md:px-6">
          <h1 className="text-sm font-semibold text-vm-ink capitalize">{tab}</h1>
          <Link href="/" className="text-xs text-vm-muted hover:text-vm-coral">
            Ver site →
          </Link>
        </header>

        {message && (
          <div
            className={cn(
              "mx-4 mt-4 rounded-lg px-4 py-2 text-sm",
              message.type === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
            )}
          >
            {message.text}
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {loading ? (
            <p className="text-sm text-vm-muted">Carregando…</p>
          ) : (
            <>
              {tab === "dashboard" && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-vm-border bg-white p-5">
                    <p className="text-sm text-vm-muted">Projetos ativos</p>
                    <p className="mt-1 text-3xl font-semibold text-vm-ink">
                      {projects.filter((p) => p.active).length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-vm-border bg-white p-5">
                    <p className="text-sm text-vm-muted">Em destaque</p>
                    <p className="mt-1 text-3xl font-semibold text-vm-ink">
                      {projects.filter((p) => p.featured).length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-vm-border bg-white p-5">
                    <p className="text-sm text-vm-muted">Total</p>
                    <p className="mt-1 text-3xl font-semibold text-vm-ink">{projects.length}</p>
                  </div>
                </div>
              )}

              {tab === "portfolio" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-vm-ink">Projetos</h2>
                    <button
                      type="button"
                      onClick={openCreate}
                      className="inline-flex items-center gap-2 rounded-full bg-vm-coral px-4 py-2 text-sm font-semibold text-white hover:bg-vm-coral-deep"
                    >
                      <Plus size={16} />
                      Novo projeto
                    </button>
                  </div>
                  <div className="rounded-2xl border border-vm-border bg-white overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-vm-border text-left text-vm-muted">
                          <th className="px-4 py-3 font-medium">Projeto</th>
                          <th className="px-4 py-3 font-medium hidden sm:table-cell">Categoria</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projects.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-vm-muted">
                              Nenhum projeto. Clique em "Novo projeto" ou rode o seed no Supabase.
                            </td>
                          </tr>
                        )}
                        {projects.map((p) => (
                          <tr key={p.id} className="border-b border-vm-border last:border-0">
                            <td className="px-4 py-3 font-medium text-vm-ink">{p.title}</td>
                            <td className="px-4 py-3 text-vm-muted hidden sm:table-cell">{p.category}</td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                                  p.active
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-gray-100 text-gray-500"
                                )}
                              >
                                {p.active ? "Ativo" : "Inativo"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex gap-1">
                                <button type="button" onClick={() => handleToggle(p)} className="p-2 rounded-lg text-vm-muted hover:bg-vm-sand" title={p.active ? "Despublicar" : "Publicar"}>
                                  {p.active ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                                <button type="button" onClick={() => openEdit(p)} className="p-2 rounded-lg text-vm-muted hover:bg-vm-sand" title="Editar">
                                  <Pencil size={16} />
                                </button>
                                <button type="button" onClick={() => handleDelete(p)} className="p-2 rounded-lg text-red-500 hover:bg-red-50" title="Excluir">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === "content" && (
                <div className="max-w-2xl">
                  <p className="text-sm text-vm-muted mb-4">
                    Edição de textos via tabela site_content. Use o SQL Editor ou estenda este painel.
                  </p>
                </div>
              )}

              {tab === "settings" && (
                <div className="max-w-md">
                  <p className="text-sm text-vm-muted mb-4">
                    Sessão: {userEmail || "—"}. Logout encerra a sessão Supabase.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-vm-border shadow-xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-5 border-b border-vm-border">
              <h3 className="font-semibold text-vm-ink">
                {modal === "create" ? "Novo projeto" : "Editar projeto"}
              </h3>
              <button type="button" onClick={() => setModal(null)} className="p-1 text-vm-muted hover:text-vm-ink">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título *</label>
                <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded-lg border border-vm-border px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="auto" className="w-full rounded-lg border border-vm-border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full rounded-lg border border-vm-border px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border border-vm-border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Thumbnail (URL)</label>
                <input value={form.thumbnail} onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.value }))} className="w-full rounded-lg border border-vm-border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL do site</label>
                <input value={form.site_url} onChange={(e) => setForm((f) => ({ ...f, site_url: e.target.value }))} className="w-full rounded-lg border border-vm-border px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Ordem</label>
                  <input type="number" value={form.display_order} onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) || 0 }))} className="w-full rounded-lg border border-vm-border px-3 py-2 text-sm" />
                </div>
                <label className="flex items-center gap-2 text-sm pt-6">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
                  Destaque
                </label>
                <label className="flex items-center gap-2 text-sm pt-6">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                  Ativo
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(null)} className="rounded-full px-4 py-2 text-sm border border-vm-border">Cancelar</button>
                <button type="submit" disabled={saving} className="rounded-full bg-vm-coral px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Salvando…" : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
