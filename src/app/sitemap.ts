import type { MetadataRoute } from "next";
import { getPublicProjects } from "@/lib/projects";

const BASE_URL = "https://www.viremarca.com.br";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getPublicProjects();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: BASE_URL + "/privacidade", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  const portfolioRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: BASE_URL + "/portfolio/" + encodeURIComponent(project.slug),
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...portfolioRoutes];
}
