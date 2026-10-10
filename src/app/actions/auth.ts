"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim()
  const password = String(formData.get("password") || "")

  if (!email || !password) {
    return { error: "Informe e-mail e senha." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message === "Invalid login credentials"
      ? "Credenciais inválidas."
      : error.message }
  }

  redirect("/admin")
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/admin/login")
}

export async function changePasswordAction(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const current = String(formData.get("current") || "")
  const next = String(formData.get("next") || "")
  const confirm = String(formData.get("confirm") || "")
  if (!current || !next || !confirm) return { ok: false, message: "Preencha todos os campos." }
  if (next !== confirm) return { ok: false, message: "A confirmação não é igual à nova senha." }
  if (next.length < 12) return { ok: false, message: "Use ao menos 12 caracteres." }
  if (next === current) return { ok: false, message: "A nova senha deve ser diferente da atual." }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { ok: false, message: "Sessão expirada. Entre novamente." }
  const check = await supabase.auth.signInWithPassword({ email: user.email, password: current })
  if (check.error) return { ok: false, message: "Senha atual incorreta." }
  const { error } = await supabase.auth.updateUser({ password: next })
  if (error) return { ok: false, message: "Não foi possível alterar a senha. Tente novamente." }
  return { ok: true, message: "Senha alterada com sucesso." }
}
