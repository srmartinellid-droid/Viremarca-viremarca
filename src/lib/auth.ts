import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export type Profile = {
  id: string
  email: string | null
  role: "admin" | "editor" | "user"
}

export async function getSessionUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function getAdminProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile) {
    return {
      id: user.id,
      email: user.email ?? null,
      role: "user",
    }
  }

  return profile as Profile
}

export async function requireAdmin() {
  const profile = await getAdminProfile()
  if (!profile) {
    redirect("/admin/login")
  }
  if (profile.role !== "admin" && profile.role !== "editor") {
    redirect("/admin/login?error=forbidden")
  }
  return profile
}
