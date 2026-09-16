"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"

export type ProjectInput = {
  title: string
  slug: string
  category: string
  description?: string
  thumbnail?: string | null
  site_url?: string | null
  display_order?: number
  featured?: boolean
  active?: boolean
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export async function listProjects() {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("portfolio_projects")
    .select("*")
    .order("display_order", { ascending: true })

  if (error) {
    return { error: error.message, data: [] as const }
  }
  return { data: data ?? [], error: null }
}

export async function createProject(input: ProjectInput) {
  await requireAdmin()
  const supabase = await createClient()

  const slug = input.slug?.trim() || slugify(input.title)
  if (!input.title?.trim()) {
    return { error: "Título é obrigatório." }
  }
  if (!slug) {
    return { error: "Slug inválido." }
  }

  const { data, error } = await supabase
    .from("portfolio_projects")
    .insert({
      title: input.title.trim(),
      slug,
      category: input.category?.trim() || "Geral",
      description: input.description?.trim() || "",
      thumbnail: input.thumbnail || null,
      site_url: input.site_url || null,
      display_order: input.display_order ?? 0,
      featured: input.featured ?? false,
      active: input.active ?? true,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath(`/portfolio/${slug}`)
  return { data, error: null }
}

export async function updateProject(id: string, input: Partial<ProjectInput>) {
  await requireAdmin()
  const supabase = await createClient()

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (input.title !== undefined) payload.title = input.title.trim()
  if (input.slug !== undefined) payload.slug = input.slug.trim()
  if (input.category !== undefined) payload.category = input.category.trim()
  if (input.description !== undefined) payload.description = input.description
  if (input.thumbnail !== undefined) payload.thumbnail = input.thumbnail
  if (input.site_url !== undefined) payload.site_url = input.site_url
  if (input.display_order !== undefined) payload.display_order = input.display_order
  if (input.featured !== undefined) payload.featured = input.featured
  if (input.active !== undefined) payload.active = input.active

  const { data, error } = await supabase
    .from("portfolio_projects")
    .update(payload)
    .eq("id", id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath("/")
  revalidatePath("/admin")
  if (data?.slug) revalidatePath(`/portfolio/${data.slug}`)
  return { data, error: null }
}

export async function deleteProject(id: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.from("portfolio_projects").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/")
  revalidatePath("/admin")
  return { error: null }
}

export async function toggleProjectActive(id: string, active: boolean) {
  return updateProject(id, { active })
}
