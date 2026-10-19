export type Psi = {
  performance: number | null; accessibility: number | null; bestPractices: number | null; seo: number | null
  lcpMs: number | null; cls: number | null; tbtMs: number | null; fcpMs: number | null; speedIndexMs: number | null
  opportunities: { title: string; savingsMs: number | null }[]; fetchedAt: string
}

// Google PageSpeed Insights (Lighthouse mobile). API pública; falha de forma tolerante e diz o motivo.
// A rota de passo tem limite de 60 s: o orçamento total de tempo respeita isso (nada de duas tentativas de 48 s).
const PSI_BUDGET_MS = 52_000
const PSI_MIN_RETRY_MS = 20_000

export async function runPsiDetailed(url: string, apiKey?: string): Promise<{ psi: Psi | null; error: string | null }> {
  const q = new URLSearchParams({ url, strategy: "mobile", locale: "pt_BR" })
  for (const c of ["performance", "accessibility", "best-practices", "seo"]) q.append("category", c)
  if (apiKey) q.set("key", apiKey)
  const start = Date.now()
  let error = apiKey ? "sem resposta" : "sem chave de API; limite compartilhado"
  for (let attempt = 0; attempt < 2; attempt++) {
    const left = PSI_BUDGET_MS - (Date.now() - start)
    if (left < (attempt === 0 ? 5_000 : PSI_MIN_RETRY_MS)) break
    try {
      const res = await fetch("https://www.googleapis.com/pagespeedonline/v5/runPagespeed?" + q, { signal: AbortSignal.timeout(left), cache: "no-store" })
      if (res.status === 429 || res.status >= 500) { error = res.status === 429 ? "limite de uso da API (429)" : `erro do Google (${res.status})`; await new Promise(r => setTimeout(r, 1500)); continue }
      if (!res.ok) return { psi: null, error: `erro ${res.status}${apiKey ? "" : "; sem chave de API"}` }
      const j = await res.json()
      const lh = j.lighthouseResult
      if (!lh) return { psi: null, error: "resposta sem dados do Lighthouse" }
      const cat = (k: string) => typeof lh.categories?.[k]?.score === "number" ? Math.round(lh.categories[k].score * 100) : null
      const aud = (k: string) => lh.audits?.[k]?.numericValue ?? null
      const opps = Object.values(lh.audits ?? {}).filter((a: any) => a?.details?.type === "opportunity" && (a.details.overallSavingsMs ?? 0) > 150)
        .sort((a: any, b: any) => b.details.overallSavingsMs - a.details.overallSavingsMs).slice(0, 5)
        .map((a: any) => ({ title: String(a.title), savingsMs: Math.round(a.details.overallSavingsMs) }))
      return { psi: { performance: cat("performance"), accessibility: cat("accessibility"), bestPractices: cat("best-practices"), seo: cat("seo"), lcpMs: aud("largest-contentful-paint"), cls: aud("cumulative-layout-shift"), tbtMs: aud("total-blocking-time"), fcpMs: aud("first-contentful-paint"), speedIndexMs: aud("speed-index"), opportunities: opps, fetchedAt: new Date().toISOString() }, error: null }
    } catch (e) { error = e instanceof Error && e.name === "TimeoutError" ? "tempo esgotado" : "falha de rede" }
  }
  return { psi: null, error }
}

export async function runPsi(url: string, apiKey?: string): Promise<Psi | null> {
  return (await runPsiDetailed(url, apiKey)).psi
}
