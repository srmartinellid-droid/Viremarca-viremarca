import { parse } from "node-html-parser"

// Lê os blocos <script type="application/ld+json"> do HTML e devolve os tipos (@type) encontrados.
// Importante: usa o parser no modo padrão. Com blockTextElements.script=false o texto do <script> chega vazio
// e nenhum JSON-LD era detectado (falso "sem dados estruturados").
export function extractJsonLdTypes(html: string): string[] {
  const types: string[] = []
  const root = parse(html)
  for (const s of root.querySelectorAll("script")) {
    if (!/ld\+json/i.test(s.getAttribute("type") || "")) continue
    try {
      const walk = (n: unknown) => {
        if (Array.isArray(n)) { n.forEach(walk); return }
        if (!n || typeof n !== "object") return
        const o = n as Record<string, unknown>
        const t = o["@type"]
        if (typeof t === "string") types.push(t)
        else if (Array.isArray(t)) types.push(...t.map(String))
        if (o["@graph"]) walk(o["@graph"])
      }
      walk(JSON.parse(s.text))
    } catch { /* JSON-LD malformado: ignora o bloco */ }
  }
  return [...new Set(types)]
}
