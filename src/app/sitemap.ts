import type { MetadataRoute } from "next";
import { getPublicProjects } from "@/lib/projects";
import { portfolioCanonicalUrl } from "@/lib/seo-url";

const BASE_URL = "https://www.viremarca.com.br";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getPublicProjects();
  const seen = new Set<string>();
  const addUnique = (url: string): MetadataRoute.Sitemap[number] | null => {
    if (seen.has(url)) return null;
    seen.add(url);
    return { url };
  };
  const routes = [
    addUnique(BASE_URL),
    ...projects
      .filter((project) => typeof project.slug === "string" && project.slug.trim().length > 0)
      .map((project) => {
        const route = addUnique(portfolioCanonicalUrl(project.slug));
        if (!route) return null;
        if (project.updated_at) route.lastModified = new Date(project.updated_at);
        return route;
      }),
  ].filter((route): route is MetadataRoute.Sitemap[number] => Boolean(route));
  return routes;
}
