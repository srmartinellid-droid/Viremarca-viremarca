import { createClientOptional } from "@/lib/supabase/server"
import { DEMO_PROJECTS } from "@/lib/demo-data"
import type { PortfolioProject } from "@/types"

const isProductionBuild = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production"

async function getProjects(): Promise<PortfolioProject[]> {
  try {
    const supabase = await createClientOptional()
    if (!supabase) {
      if (isProductionBuild) {
        throw new Error("[projects] Production build requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
      }
      return DEMO_PROJECTS.filter((p) => p.active)
    }

    const { data, error } = await supabase
      .from("portfolio_projects")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true })

    if (error) {
      if (isProductionBuild) {
        throw new Error("[projects] Supabase portfolio_projects query failed: " + error.message)
      }
      return DEMO_PROJECTS.filter((p) => p.active)
    }

    if (!data?.length) {
      if (isProductionBuild) {
        throw new Error("[projects] Production build requires at least one active public portfolio project in Supabase.")
      }
      return DEMO_PROJECTS.filter((p) => p.active)
    }

    return data as PortfolioProject[]
  } catch (error) {
    if (isProductionBuild) {
      throw error instanceof Error ? error : new Error("[projects] Failed to load public projects during production build.")
    }
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
  const decodedSlug = decodeURIComponent(slug)
  try {
    const supabase = await createClientOptional()
    if (!supabase) {
      if (isProductionBuild) {
        throw new Error("[projects] Production build requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
      }
      return DEMO_PROJECTS.find((p) => p.slug === decodedSlug) ?? null
    }

    const { data, error } = await supabase
      .from("portfolio_projects")
      .select("*")
      .eq("active", true)
      .eq("slug", decodedSlug)
      .maybeSingle()

    if (error) {
      if (isProductionBuild) {
        throw new Error("[projects] Supabase portfolio_projects query failed: " + error.message)
      }
      return DEMO_PROJECTS.find((p) => p.slug === decodedSlug) ?? null
    }

    return (data as PortfolioProject | null) ?? null
  } catch (error) {
    if (isProductionBuild) {
      throw error instanceof Error ? error : new Error("[projects] Failed to load project.")
    }
    return DEMO_PROJECTS.find((p) => p.slug === decodedSlug) ?? null
  }
}
