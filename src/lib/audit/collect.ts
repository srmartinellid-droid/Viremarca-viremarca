import { parse } from "node-html-parser"
import { safeFetch, type FetchResult } from "./safe-fetch"

export type Facts = {
  url: string; host: string; fetchedAt: string
  https: boolean; httpRedirectsToHttps: boolean | null
  status: number; ttfbMs: number; totalMs: number; htmlBytes: number; truncated: boolean; redirects: string[]
  headers: { encoding: string | null; cache: string | null; hsts: boolean; csp: boolean; xcto: boolean; frame: boolean; server: string | null }
  title: string; description: string; lang: string; viewport: boolean; canonical: string; robotsMeta: string
  h1: string[]; h2: string[]; h3Count: number
  images: { total: number; noAlt: number; noDims: number; lazy: number; modernFormat: number }
  scripts: { external: number; inlineBytes: number; thirdParty: number }; stylesheets: number
  og: { title: boolean; description: boolean; image: boolean; imageOk: boolean | null }; twitterCard: boolean; jsonLdTypes: string[]; favicon: boolean
  links: { internal: number; external: number; tel: number; mailto: number; whatsapp: number; broken: { url: string; status: number }[]; checked: number; hash: number }
  nav: string[]; ctas: string[]; forms: number; formsWithLabels: number; buttons: number
  signals: { phone: boolean; email: boolean; address: boolean; cnpj: boolean; privacy: boolean; about: boolean; testimonials: boolean; social: string[]; mapEmbed: boolean; footer: boolean; copyright: boolean; videoEmbed: boolean }
  text: { words: number; excerpt: string; aboveFold: string }
  robotsTxt: { status: number; hasSitemap: boolean; blocksAll: boolean }
  sitemap: { status: number; urls: number }
  soft404: boolean | null
  pages: { url: string; status: number; title: string; words: number; titleDuplicate: boolean }[]
  warnings: string[]
}

const CTA_RE = /(whatsapp|fale|falar|contato|contate|chame|orçamento|orcamento|solicit|agende|agendar|comprar|compre|quero|peça|peca|reserv|ligar|ligue|baixar|cadastr|entre em|saiba mais|ver (mais|projetos|serviços)|conhe[cç]a|começ|comec|diagn[oó]stic)/i

function clean(s: string, max = 400) { return s.replace(/\s+/g, " ").trim().slice(0, max) }

export async function collectFacts(inputUrl: string): Promise<Facts> {
  const warnings: string[] = []
  const home: FetchResult = await safeFetch(inputUrl, { timeoutMs: 12000 })
  if (home.status >= 400) throw new Error(`O site respondeu com erro ${home.status}.`)
  if (!/html|xml/i.test(home.headers["content-type"] || "text/html")) throw new Error("O endereço não parece ser uma página de site (HTML).")
  const u = new URL(home.url)
  const origin = u.origin
  const root = parse(home.body, { blockTextElements: { script: false, style: false, noscript: false } })

  const meta = (sel: string) => root.querySelector(sel)?.getAttribute("content")?.trim() || ""
  const imgs = root.querySelectorAll("img")
  const scripts = root.querySelectorAll("script")
  const hostBase = u.hostname.replace(/^www\./, "")
  const isThird = (src: string) => { try { return !new URL(src, u).hostname.endsWith(hostBase) } catch { return false } }
  const anchors = root.querySelectorAll("a")
  const hrefs = anchors.map(a => ({ href: a.getAttribute("href") || "", text: clean(a.text, 80) }))
  const internalSet = new Set<string>()
  let external = 0, tel = 0, mailto = 0, wa = 0, hash = 0
  for (const { href } of hrefs) {
    if (!href) continue
    if (href.startsWith("#")) { hash++; continue }
    if (/^tel:/i.test(href)) { tel++; continue }
    if (/^mailto:/i.test(href)) { mailto++; continue }
    if (/wa\.me|api\.whatsapp\.com|whatsapp:/i.test(href)) { wa++; continue }
    if (/^(javascript:|data:)/i.test(href)) continue
    try {
      const l = new URL(href, u)
      if (l.hostname.replace(/^www\./, "") === hostBase) { l.hash = ""; internalSet.add(l.toString()) } else external++
    } catch {}
  }

  const bodyClone = parse(home.body)
  bodyClone.querySelectorAll("script,style,noscript,svg").forEach(n => n.remove())
  const fullText = clean(bodyClone.querySelector("body")?.text || bodyClone.text, 200000)
  const words = fullText ? fullText.split(" ").length : 0
  const mainHeading = root.querySelector("h1")
  const aboveFold = clean([mainHeading?.text, root.querySelector("h1 ~ p, header p, .hero p")?.text, ...root.querySelectorAll("header a, header button, nav a").slice(0, 8).map(n => n.text)].filter(Boolean).join(" · "), 500)

  const jsonLdTypes: string[] = []
  for (const s of root.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const j = JSON.parse(s.text)
      const walk = (n: unknown) => { if (Array.isArray(n)) n.forEach(walk); else if (n && typeof n === "object") { const t = (n as Record<string, unknown>)["@type"]; if (typeof t === "string") jsonLdTypes.push(t); else if (Array.isArray(t)) jsonLdTypes.push(...t.map(String)); const g = (n as Record<string, unknown>)["@graph"]; if (g) walk(g) } }
      walk(j)
    } catch {}
  }

  const lower = home.body.toLowerCase()
  const text = fullText
  const social = ["instagram.com", "facebook.com", "linkedin.com", "youtube.com", "tiktok.com", "x.com", "twitter.com"].filter(d => hrefs.some(h => h.href.includes(d)))
  const forms = root.querySelectorAll("form")
  const formsWithLabels = forms.filter(f => f.querySelectorAll("input:not([type=hidden]):not([type=submit]), textarea, select").every(i => i.getAttribute("aria-label") || i.getAttribute("placeholder") || i.getAttribute("id") && f.querySelector(`label[for="${i.getAttribute("id")}"]`) || i.parentNode?.tagName?.toLowerCase() === "label")).length

  // arquivos auxiliares e checagens extras em paralelo (cada uma tolerante a falha)
  const link = (p: string) => origin + p
  const [robots, sitemap, soft, httpRes, ogImg] = await Promise.all([
    safeFetch(link("/robots.txt"), { timeoutMs: 6000, maxBytes: 100_000 }).catch(() => null),
    safeFetch(link("/sitemap.xml"), { timeoutMs: 6000, maxBytes: 600_000 }).catch(() => null),
    safeFetch(link("/__vm_auditoria_inexistente_404"), { timeoutMs: 6000, maxBytes: 50_000 }).catch(() => null),
    u.protocol === "https:" ? safeFetch("http://" + u.host + "/", { timeoutMs: 6000, method: "HEAD", maxRedirects: 3 }).catch(() => null) : Promise.resolve(null),
    meta('meta[property="og:image"]') ? safeFetch(new URL(meta('meta[property="og:image"]'), u).toString(), { timeoutMs: 6000, method: "HEAD" }).catch(() => null) : Promise.resolve(null),
  ])

  // amostra de páginas internas (até 6) para links quebrados, títulos duplicados e conteúdo
  const sample = [...internalSet].filter(l => !/\.(pdf|jpg|jpeg|png|webp|svg|gif|zip|mp4)(\?|$)/i.test(l) && l !== home.url && l !== home.url.replace(/\/$/, "")).slice(0, 6)
  const pageResults = await Promise.all(sample.map(async l => {
    const r = await safeFetch(l, { timeoutMs: 8000, maxBytes: 600_000 }).catch(() => null)
    if (!r) return { url: l, status: 0, title: "", words: 0 }
    const d = parse(r.body)
    const t = clean(d.querySelector("title")?.text || "", 160)
    d.querySelectorAll("script,style,noscript,svg").forEach(n => n.remove())
    return { url: l, status: r.status, title: t, words: clean(d.text, 100000).split(" ").filter(Boolean).length }
  }))
  const title = clean(root.querySelector("title")?.text || "", 200)
  const pages = pageResults.map(p => ({ ...p, titleDuplicate: !!p.title && p.title === title }))
  const broken = pages.filter(p => p.status === 0 || p.status >= 400).map(p => ({ url: p.url, status: p.status }))

  const robotsBody = robots?.status === 200 ? robots.body : ""
  const sitemapUrls = sitemap?.status === 200 ? (sitemap.body.match(/<loc>/gi) || []).length : 0
  if (home.truncated) warnings.push("A página inicial é muito grande; a análise usou o começo do HTML.")

  return {
    url: home.url, host: u.hostname, fetchedAt: new Date().toISOString(),
    https: u.protocol === "https:", httpRedirectsToHttps: u.protocol === "https:" ? (httpRes ? httpRes.url.startsWith("https:") : null) : null,
    status: home.status, ttfbMs: home.ttfbMs, totalMs: home.totalMs, htmlBytes: home.bytes, truncated: home.truncated, redirects: home.redirects,
    headers: {
      encoding: home.headers["content-encoding"] || null, cache: home.headers["cache-control"] || null,
      hsts: !!home.headers["strict-transport-security"], csp: !!home.headers["content-security-policy"], xcto: !!home.headers["x-content-type-options"],
      frame: !!home.headers["x-frame-options"] || /frame-ancestors/i.test(home.headers["content-security-policy"] || ""), server: home.headers["server"] || null,
    },
    title, description: clean(meta('meta[name="description"]'), 400), lang: root.querySelector("html")?.getAttribute("lang") || "", viewport: !!meta('meta[name="viewport"]'),
    canonical: root.querySelector('link[rel="canonical"]')?.getAttribute("href") || "", robotsMeta: meta('meta[name="robots"]'),
    h1: root.querySelectorAll("h1").map(h => clean(h.text, 160)).filter(Boolean), h2: root.querySelectorAll("h2").map(h => clean(h.text, 120)).filter(Boolean).slice(0, 14), h3Count: root.querySelectorAll("h3").length,
    images: {
      total: imgs.length, noAlt: imgs.filter(i => i.getAttribute("alt") === undefined || i.getAttribute("alt") === null).length,
      noDims: imgs.filter(i => !(i.getAttribute("width") && i.getAttribute("height")) && !/aspect|fill/i.test(i.getAttribute("style") || "")).length,
      lazy: imgs.filter(i => i.getAttribute("loading") === "lazy").length,
      modernFormat: imgs.filter(i => /\.(webp|avif)|f=webp|f=avif|fm=webp|fm=avif|_next\/image/i.test((i.getAttribute("src") || "") + (i.getAttribute("srcset") || ""))).length,
    },
    scripts: { external: scripts.filter(s => s.getAttribute("src")).length, inlineBytes: scripts.filter(s => !s.getAttribute("src")).reduce((n, s) => n + s.text.length, 0), thirdParty: scripts.filter(s => s.getAttribute("src") && isThird(s.getAttribute("src")!)).length },
    stylesheets: root.querySelectorAll('link[rel="stylesheet"]').length,
    og: { title: !!meta('meta[property="og:title"]'), description: !!meta('meta[property="og:description"]'), image: !!meta('meta[property="og:image"]'), imageOk: ogImg ? ogImg.status < 400 : null },
    twitterCard: !!meta('meta[name="twitter:card"]'), jsonLdTypes: [...new Set(jsonLdTypes)], favicon: !!root.querySelector('link[rel~="icon"]'),
    links: { internal: internalSet.size, external, tel, mailto, whatsapp: wa, broken, checked: pages.length, hash },
    nav: [...new Set(root.querySelectorAll("nav a, header a").map(a => clean(a.text, 40)).filter(t => t && t.length < 40))].slice(0, 14),
    ctas: [...new Set([...root.querySelectorAll("a, button")].map(n => clean(n.text, 60)).filter(t => t && CTA_RE.test(t)))].slice(0, 12),
    forms: forms.length, formsWithLabels, buttons: root.querySelectorAll("button, [role=button], .btn").length,
    signals: {
      phone: tel > 0 || /\(?\b\d{2}\)?\s?9?\d{4}[-.\s]?\d{4}\b/.test(text), email: mailto > 0 || /[\w.+-]+@[\w-]+\.[\w.]+/.test(text),
      address: /\b(rua|av\.|avenida|rodovia|travessa|alameda|estrada)\s+[^,]{3,}/i.test(text) || /endereço/i.test(text), cnpj: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/.test(text),
      privacy: hrefs.some(h => /privacidade|privacy|lgpd|termos/i.test(h.href + h.text)), about: hrefs.some(h => /quem somos|sobre|about|nossa hist/i.test(h.text + h.href)),
      testimonials: /depoimento|avalia[cç][oõ]es|o que (nossos )?clientes|testimonial|clientes dizem/i.test(text), social, mapEmbed: /google\.com\/maps|maps\.google|openstreetmap/i.test(lower),
      footer: !!root.querySelector("footer"), copyright: /©|&copy;|copyright|todos os direitos/i.test(home.body), videoEmbed: /youtube\.com\/embed|player\.vimeo|<video/i.test(lower),
    },
    text: { words, excerpt: fullText.slice(0, 2800), aboveFold },
    robotsTxt: { status: robots?.status ?? 0, hasSitemap: /^sitemap:/im.test(robotsBody), blocksAll: /user-agent:\s*\*\s*[\r\n]+(?:[^\r\n]*[\r\n]+)*?disallow:\s*\/\s*$/im.test(robotsBody) },
    sitemap: { status: sitemap?.status ?? 0, urls: sitemapUrls },
    soft404: soft ? soft.status === 200 : null,
    pages, warnings,
  }
}
