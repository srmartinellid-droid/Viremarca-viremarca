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
