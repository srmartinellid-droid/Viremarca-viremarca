import { createClientOptional } from "@/lib/supabase/server"
import { DEMO_PROJECTS } from "@/lib/demo-data"
import type { PortfolioProject } from "@/types"

export async function getPublicProjects(): Promise<PortfolioProject[]> {
  try {
    const supabase = await createClientOptional()
    if (!supabase) return DEMO_PROJECTS.filter((p) => p.active)

    const { data, error } = await supabase
      .from("portfolio_projects")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true })

    if (error || !data?.length) {
      return DEMO_PROJECTS.filter((p) => p.active)
    }
    return data as PortfolioProject[]
  } catch {
    return DEMO_PROJECTS.filter((p) => p.active)
  }
}

export async function getProjectBySlug(slug: string): Promise<PortfolioProject | null> {
  try {
    const supabase = await createClientOptional()
    if (!supabase) {
      return DEMO_PROJECTS.find((p) => p.slug === slug) ?? null
    }

    const { data, error } = await supabase
      .from("portfolio_projects")
      .select("*")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle()

    if (error || !data) {
      return DEMO_PROJECTS.find((p) => p.slug === slug) ?? null
    }
    return data as PortfolioProject
  } catch {
    return DEMO_PROJECTS.find((p) => p.slug === slug) ?? null
  }
}
