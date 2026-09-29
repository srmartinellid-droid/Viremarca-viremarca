import type { MetadataRoute } from "next";

const BASE_URL = "https://www.viremarca.com.br";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: BASE_URL + "/sitemap.xml",
  };
}
