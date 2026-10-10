export type FindingLike = { id: string; severity: "critico" | "atencao" | "info"; criterion: string; title: string; evidence: string; impact: string; fix: string; source: "regra" | "ia" }

// Um mesmo problema pode aparecer em vários critérios (regra) ou vir repetido pela IA. Cada tema entra uma única vez.
const TOPICS: [string, RegExp][] = [
  ["h1", /\bh1\b|t[ií]tulo principal/i],
  ["ttfb", /ttfb|primeira resposta|lento para responder|servidor (lento|elevado)|tempo de resposta/i],
  ["cache", /cache.?control|cache p[uú]blico/i],
  ["titulo", /t[ií]tulo.*(p[aá]gina|aba|seo|caracteres|tamanho)|<title>|\btitle\b/i],
  ["meta", /meta description|descri[cç][aã]o do google/i],
  ["img-dim", /largura|altura|dimens[oõã]|width|height|layout shift/i],
  ["img-alt", /\balt\b|texto alternativo/i],
  ["img-opt", /webp|avif|lazy|imagens sem otimiza/i],
  ["jsonld", /json-?ld|dados estruturados|marca[cç][aã]o de empresa local/i],
  ["headers", /\bcsp\b|nosniff|cabe[cç]alhos? de seguran[cç]a|x-frame|anti-frame/i],
  ["form", /formul[aá]rio/i],
  ["cnpj", /cnpj/i],
  ["address", /endere[cç]o|regi[aã]o de atua|localiza[cç]/i],
  ["phone", /telefone|e-?mail/i],
  ["lang", /idioma|\blang\b/i],
  ["https", /https/i],
  ["social", /redes sociais/i],
  ["proof", /depoimento|avalia[cç][oõ]es/i],
]

export function findingTopic(f: Pick<FindingLike, "title" | "fix">): string | null {
  const text = `${f.title} ${f.fix}`
  for (const [k, re] of TOPICS) if (re.test(text)) return k
  return null
}

// Mantém o primeiro de cada tema; achados de regra (com medição) têm prioridade sobre os da IA.
export function dedupeFindings<T extends FindingLike>(list: T[]): T[] {
  const ordered = [...list].sort((a, b) => (a.source === b.source ? 0 : a.source === "regra" ? -1 : 1))
  const seen = new Set<string>()
  const keep = new Set<T>()
  for (const f of ordered) {
    const t = findingTopic(f)
    if (t) { if (seen.has(t)) continue; seen.add(t) }
    keep.add(f)
  }
  return list.filter(f => keep.has(f))
}

// A IA às vezes copia nomes internos dos campos ("sinais_de_confianca: phone:false", "CSP=false"). O cliente não deve ver isso.
export function cleanEvidence(ev: string): string {
  const s = ev.trim()
  if (/\b[a-z]+(?:_[a-z]+)+\s*[:=]/.test(s) || /\b(csp|nosniff|frame|phone|email|address|cnpj)\s*[:=]\s*(true|false)\b/i.test(s)) return ""
  return s
}
