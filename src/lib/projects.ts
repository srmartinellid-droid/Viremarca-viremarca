import { createClientOptional } from "@/lib/supabase/server"
import { DEMO_PROJECTS } from "@/lib/demo-data"
import type { PortfolioProject } from "@/types"

async function getProjects(): Promise<PortfolioProject[]> {
  try {
    const supabase = await createClientOptional()
    if (!supabase) return DEMO_PROJECTS.filter((p) => p.active)

    const { data, error } = await supabase
      .from("portfolio_projects")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true })

    if (error || !data?.length) return DEMO_PROJECTS.filter((p) => p.active)
    return data as PortfolioProject[]
  } catch {
    return DEMO_PROJECTS.filter((p) => p.active)
  }
}

export async function getPublicProjects(): Promise<PortfolioProject[]> {
  return getProjects()
}

export async function getFeaturedProjects(): Promise<PortfolioProject[]> {
  const projects = await getProjects()
  const featured = projects.filter((project) => project.featured)
  return (featured.length ? featured : projects).slice(0, 8)
}

export async function getProjectBySlug(slug: string): Promise<PortfolioProject | null> {
  try {
    const supabase = await createClientOptional()
    if (!supabase) return DEMO_PROJECTS.find((p) => p.slug === slug) ?? null

    const decodedSlug = decodeURIComponent(slug)
    const { data, error } = await supabase
      .from("portfolio_projects")
      .select("*")
      .eq("active", true)
      .ilike("slug", decodedSlug)
      .maybeSingle()

    if (error || !data) return DEMO_PROJECTS.find((p) => p.slug === decodedSlug) ?? null
    return data as PortfolioProject
  } catch {
    const decodedSlug = decodeURIComponent(slug)
    return DEMO_PROJECTS.find((p) => p.slug === decodedSlug) ?? null
  }
}
