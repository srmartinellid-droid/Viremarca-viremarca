export type Psi = {
  performance: number | null; accessibility: number | null; bestPractices: number | null; seo: number | null
  lcpMs: number | null; cls: number | null; tbtMs: number | null; fcpMs: number | null; speedIndexMs: number | null
  opportunities: { title: string; savingsMs: number | null }[]; fetchedAt: string
}

// Google PageSpeed Insights (Lighthouse mobile). API pública; falha de forma tolerante.
export async function runPsi(url: string, apiKey?: string): Promise<Psi | null> {
  const q = new URLSearchParams({ url, strategy: "mobile", locale: "pt_BR" })
  for (const c of ["performance", "accessibility", "best-practices", "seo"]) q.append("category", c)
  if (apiKey) q.set("key", apiKey)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch("https://www.googleapis.com/pagespeedonline/v5/runPagespeed?" + q, { signal: AbortSignal.timeout(48000), cache: "no-store" })
      if (res.status === 429 || res.status >= 500) { await new Promise(r => setTimeout(r, 1500)); continue }
      if (!res.ok) return null
      const j = await res.json()
      const lh = j.lighthouseResult
      if (!lh) return null
      const cat = (k: string) => typeof lh.categories?.[k]?.score === "number" ? Math.round(lh.categories[k].score * 100) : null
      const aud = (k: string) => lh.audits?.[k]?.numericValue ?? null
      const opps = Object.values(lh.audits ?? {}).filter((a: any) => a?.details?.type === "opportunity" && (a.details.overallSavingsMs ?? 0) > 150)
        .sort((a: any, b: any) => b.details.overallSavingsMs - a.details.overallSavingsMs).slice(0, 5)
        .map((a: any) => ({ title: String(a.title), savingsMs: Math.round(a.details.overallSavingsMs) }))
      return { performance: cat("performance"), accessibility: cat("accessibility"), bestPractices: cat("best-practices"), seo: cat("seo"), lcpMs: aud("largest-contentful-paint"), cls: aud("cumulative-layout-shift"), tbtMs: aud("total-blocking-time"), fcpMs: aud("first-contentful-paint"), speedIndexMs: aud("speed-index"), opportunities: opps, fetchedAt: new Date().toISOString() }
    } catch { /* tenta de novo uma vez */ }
  }
  return null
}
