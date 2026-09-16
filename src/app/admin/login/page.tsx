"use client"

import { useState } from "react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { createClientOptional } from "@/lib/supabase/client"

export default function AdminLoginPage() {
  const searchParams = useSearchParams()
  const forbidden = searchParams.get("error") === "forbidden"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(forbidden ? "Conta sem permissão de administrador." : "")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const supabase = createClientOptional()
      if (!supabase) {
        setError("Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY na Vercel.")
        setLoading(false)
        return
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        setError(
          authError.message === "Invalid login credentials"
            ? "Credenciais inválidas."
            : authError.message
        )
        setLoading(false)
        return
      }

      window.location.href = "/admin"
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-vm-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-vm-border bg-white p-8 shadow-sm">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo-wordmark.png"
            alt="VireMarca"
            width={140}
            height={36}
            className="h-8 w-auto"
          />
        </div>
        <h1 className="text-xl font-semibold text-center text-vm-ink mb-1">
          Painel administrativo
        </h1>
        <p className="text-sm text-vm-muted text-center mb-6">
          Acesso restrito via Supabase Auth
        </p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-vm-ink mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
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
              autoComplete="current-password"
              className="w-full rounded-lg border border-vm-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vm-coral/40"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-vm-coral py-2.5 text-sm font-semibold text-white hover:bg-vm-coral-deep transition-colors disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  )
}
