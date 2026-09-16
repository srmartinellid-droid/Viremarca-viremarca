"use client"

import { useState } from "react"
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
} from "lucide-react"
import { DEMO_PROJECTS, DEMO_CONTENT } from "@/lib/demo-data"
import type { PortfolioProject } from "@/types"
import { cn } from "@/lib/utils"

type Tab = "dashboard" | "portfolio" | "content" | "settings"

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("dashboard")
  const [projects, setProjects] = useState<PortfolioProject[]>(DEMO_PROJECTS)
  const [authed, setAuthed] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  // Demo auth — replace with Supabase Auth in production
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (email === "admin@viremarca.com.br" && password === "viremarca2026") {
      setAuthed(true)
    } else {
      setError("Credenciais inválidas (demo: admin@viremarca.com.br / viremarca2026)")
    }
  }

  const toggleActive = (id: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    )
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vm-bg px-4">
        <div className="w-full max-w-sm rounded-2xl border border-vm-border bg-white p-8 shadow-sm">
          <div className="flex justify-center mb-6">
            <Image src="/logo-wordmark.png" alt="VireMarca" width={140} height={36} className="h-8 w-auto" />
          </div>
          <h1 className="text-xl font-semibold text-center text-vm-ink mb-1">Painel administrativo</h1>
          <p className="text-sm text-vm-muted text-center mb-6">
            Acesso restrito. Em produção usa Supabase Auth.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-vm-ink mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-vm-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vm-coral/40"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-vm-ink mb-1.5">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-vm-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vm-coral/40"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-full bg-vm-coral py-2.5 text-sm font-semibold text-white hover:bg-vm-coral-deep transition-colors"
            >
              Entrar
            </button>
          </form>
          <p className="mt-6 text-xs text-center text-vm-muted">
            Demo: admin@viremarca.com.br · viremarca2026
          </p>
        </div>
      </div>
    )
  }

  const nav = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
    { id: "portfolio" as Tab, label: "Portfólio", icon: FolderKanban },
    { id: "content" as Tab, label: "Conteúdo", icon: FileText },
    { id: "settings" as Tab, label: "Configurações", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-vm-bg flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-vm-border bg-white">
        <div className="p-5 border-b border-vm-border">
          <Image src="/logo-wordmark.png" alt="VireMarca" width={120} height={30} className="h-7 w-auto" />
          <p className="mt-1 text-xs text-vm-muted">Admin</p>
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
            onClick={() => setAuthed(false)}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-vm-muted hover:bg-vm-sand"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-vm-border bg-white flex items-center justify-between px-4 md:px-6">
          <h1 className="text-sm font-semibold text-vm-ink capitalize">{tab}</h1>
          <Link href="/" className="text-xs text-vm-muted hover:text-vm-coral">
            Ver site →
          </Link>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
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
                            <button
                              type="button"
                              onClick={() => toggleActive(p.id)}
                              className="p-2 rounded-lg text-vm-muted hover:bg-vm-sand"
                              title={p.active ? "Desativar" : "Ativar"}
                            >
                              {p.active ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                            <button type="button" className="p-2 rounded-lg text-vm-muted hover:bg-vm-sand">
                              <Pencil size={16} />
                            </button>
                            <button type="button" className="p-2 rounded-lg text-red-500 hover:bg-red-50">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs text-vm-muted">
                Em produção: CRUD completo com Supabase (tabela portfolio_projects) + upload de thumbnails no Storage.
              </p>
            </div>
          )}

          {tab === "content" && (
            <div className="max-w-2xl space-y-6">
              <div className="rounded-2xl border border-vm-border bg-white p-6">
                <h3 className="font-semibold text-vm-ink mb-4">Hero</h3>
                <label className="block text-sm text-vm-muted mb-1">Título</label>
                <input
                  defaultValue={DEMO_CONTENT.heroTitle}
                  className="w-full rounded-lg border border-vm-border px-3 py-2 text-sm mb-4"
                />
                <label className="block text-sm text-vm-muted mb-1">Subtítulo</label>
                <textarea
                  defaultValue={DEMO_CONTENT.heroSubtitle}
                  rows={3}
                  className="w-full rounded-lg border border-vm-border px-3 py-2 text-sm"
                />
              </div>
              <div className="rounded-2xl border border-vm-border bg-white p-6">
                <h3 className="font-semibold text-vm-ink mb-4">Quem somos</h3>
                <textarea
                  defaultValue={DEMO_CONTENT.aboutBody}
                  rows={8}
                  className="w-full rounded-lg border border-vm-border px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                className="rounded-full bg-vm-coral px-6 py-2.5 text-sm font-semibold text-white hover:bg-vm-coral-deep"
              >
                Salvar alterações
              </button>
            </div>
          )}

          {tab === "settings" && (
            <div className="max-w-md space-y-4">
              <div className="rounded-2xl border border-vm-border bg-white p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-vm-ink mb-1">WhatsApp</label>
                  <input
                    defaultValue={DEMO_CONTENT.contact.whatsapp}
                    className="w-full rounded-lg border border-vm-border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-vm-ink mb-1">E-mail</label>
                  <input
                    defaultValue={DEMO_CONTENT.contact.email}
                    className="w-full rounded-lg border border-vm-border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-vm-ink mb-1">Instagram</label>
                  <input
                    defaultValue={DEMO_CONTENT.contact.instagram}
                    className="w-full rounded-lg border border-vm-border px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-vm-muted">
                Conecte o Supabase (veja README) para persistir estas configurações e o portfólio.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
