import { getGroqApiKey, getNamedSecret } from "@/lib/core-chat/secrets"
import { getTranslationConfig, TRANSLATION_SECRET } from "@/lib/translation/engine"
import type { Facts } from "./collect"
import type { Psi } from "./psi"
import type { LlmOut } from "./score"
import { CRITERIA, ruleChecks } from "./score"

type Provider = { name: "chave-chat" | "chave-traducao"; endpoint: string; key: string; model: string }

// Duas chaves: a do chat (Groq) e a da tradução (se houver chave própria). Cada análise começa por uma
// e, se ela falhar (limite, erro, timeout), passa automaticamente para a outra.
export async function getProviders(): Promise<Provider[]> {
  const list: Provider[] = []
  try { list.push({ name: "chave-chat", endpoint: "https://api.groq.com/openai/v1", key: await getGroqApiKey(), model: "openai/gpt-oss-120b" }) } catch {}
  try {
    const cfg = await getTranslationConfig()
    const key = await getNamedSecret(TRANSLATION_SECRET)
    const groq = /groq\.com/.test(cfg.endpoint)
    list.push({ name: "chave-traducao", endpoint: cfg.endpoint, key, model: groq ? "openai/gpt-oss-120b" : cfg.model })
  } catch {}
  return list
}

async function once(p: Provider, system: string, user: string): Promise<string> {
  const body: Record<string, unknown> = { model: p.model, messages: [{ role: "system", content: system }, { role: "user", content: user }], temperature: 0.2, max_completion_tokens: 3500, response_format: { type: "json_object" } }
  if (/groq\.com/.test(p.endpoint)) { body.reasoning_effort = "low"; body.include_reasoning = false }
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(p.endpoint.replace(/\/+$/, "") + "/chat/completions", { method: "POST", headers: { Authorization: "Bearer " + p.key, "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(40000) })
    const j = await res.json().catch(() => null)
    if (res.ok) { const c = j?.choices?.[0]?.message?.content; if (typeof c === "string" && c.trim()) return c; throw new Error("resposta vazia") }
    if (res.status === 400 && body.response_format) { delete body.response_format; continue }
    if (res.status === 429 && attempt === 0) { const ra = Number(res.headers.get("retry-after") || "2"); await new Promise(r => setTimeout(r, Math.min(Math.max(ra, 1), 6) * 1000)); continue }
    throw new Error(j?.error?.message || "HTTP " + res.status)
  }
  throw new Error("falha")
}

function parseJson(raw: string): LlmOut {
  const t = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim()
  try { return JSON.parse(t) } catch { const m = t.match(/\{[\s\S]*\}/); if (!m) throw new Error("JSON inválido"); return JSON.parse(m[0]) }
}

export async function routed(providers: Provider[], preferred: number, system: string, user: string): Promise<{ out: LlmOut | null; route: string }> {
  if (!providers.length) return { out: null, route: "sem chave" }
  const order = [...providers.slice(preferred % providers.length), ...providers.slice(0, preferred % providers.length)]
  const tried: string[] = []
  for (const p of order) {
    try { const out = parseJson(await once(p, system, user)); return { out, route: tried.length ? `${tried.join(" → ")} → ${p.name}` : p.name } }
    catch (e) { tried.push(p.name + " (falhou)"); console.error("[audit llm]", p.name, e instanceof Error ? e.message : e) }
  }
  return { out: null, route: tried.join(" → ") }
}

const RULES = "Regras: use APENAS os fatos fornecidos; nunca invente números, páginas, concorrentes ou problemas; se um dado não foi fornecido, diga que não foi possível avaliar. Seja um auditor sênior honesto e calibrado (um site típico de pequena empresa fica entre 5 e 7). Notas de 0 a 10 com uma casa decimal. Escreva em português do Brasil, simples, sem jargão. Coerência: a justificativa (why) NÃO pode contradizer `verificacoes_automaticas`: item 'em atenção' ou 'falhou' não pode ser descrito como correto, e item 'ok' não pode ser apontado como problema. Link de WhatsApp clicável conta como canal de contato. Você NÃO enxerga o visual da página (cores, espaçamento, layout, design): não opine sobre isso. Não cite ferramentas ou tecnologias específicas (Redis, plugins, nomes de hospedagem); descreva o resultado esperado. Em 'evidence' escreva frases naturais, nunca nomes de campos ou chaves do JSON recebido (como sinais_de_confianca ou phone:false). Não repita problemas já cobertos por `verificacoes_automaticas`: seus findings devem trazer só observações qualitativas novas. Responda SOMENTE com JSON."

const verificacoes = (f: Facts, psi: Psi | null, pillar: "experiencia" | "tecnico") => {
  const rc = ruleChecks(f, psi)
  return Object.fromEntries(CRITERIA.filter(c => c.pillar === pillar).map(c => [c.id, rc[c.id].map(x => `${x.label}: ${x.status === "pass" ? "ok" : x.status === "warn" ? "em atenção" : "falhou"}`)]))
}

export function promptA(f: Facts) {
  const crit = CRITERIA.filter(c => c.pillar === "experiencia")
  const system = `Você audita a EXPERIÊNCIA DO VISITANTE de um site para a VireMarca. Avalie como um visitante real que chegou pelo celular: se entende, se confia, se contata, se se prende ao conteúdo. ${RULES}
Critérios: ${crit.map(c => `${c.id} (${c.question})`).join("; ")}.
Formato: {"criteria":{"clareza":{"score":0,"why":"1-2 frases com evidência"},"navegacao":{...},"confianca":{...},"conversao":{...},"conteudo":{...}},"findings":[{"severity":"critico|atencao|info","criterion":"id","title":"...","evidence":"trecho/fato real","impact":"efeito para o visitante","fix":"ação concreta"}],"strengths":["..."],"first_impression":"2 frases sobre a primeira impressão em 5 segundos"}. No máximo 5 findings e 3 strengths.`
  const user = JSON.stringify({ site: f.url, verificacoes_automaticas: verificacoes(f, null, "experiencia"), titulo: f.title, titulo_caracteres: f.title.length, descricao: f.description, h1: f.h1, h2: f.h2, menu: f.nav, chamadas_para_acao: f.ctas, primeira_dobra: f.text.aboveFold, sinais_de_confianca: f.signals, contato_clicavel: { whatsapp: f.links.whatsapp, tel: f.links.tel, mailto: f.links.mailto, formularios: f.forms }, palavras_home: f.text.words, imagens: f.images.total, paginas_amostradas: f.pages.map(p => ({ url: p.url, status: p.status, titulo: p.title, palavras: p.words })), links_quebrados: f.links.broken, texto_da_home: f.text.excerpt })
  return { system, user }
}

export function promptB(f: Facts, psi: Psi | null) {
  const crit = CRITERIA.filter(c => c.pillar === "tecnico")
  const system = `Você audita o lado TÉCNICO e de SEO de um site para a VireMarca, interpretando medições reais. ${RULES}
Critérios: ${crit.map(c => `${c.id} (${c.question})`).join("; ")}.
Formato: {"criteria":{"desempenho":{"score":0,"why":"..."},"mobile":{...},"seo":{...},"seguranca":{...},"presenca":{...}},"findings":[{"severity":"critico|atencao|info","criterion":"id","title":"...","evidence":"medida real","impact":"...","fix":"ação concreta"}],"strengths":["..."]}. No máximo 5 findings.`
  const user = JSON.stringify({ site: f.url, verificacoes_automaticas: verificacoes(f, psi, "tecnico"), https: f.https, http_redireciona_https: f.httpRedirectsToHttps, ttfb_ms: f.ttfbMs, tempo_total_ms: f.totalMs, html_kb: Math.round(f.htmlBytes / 1024), compressao: f.headers.encoding, cache_control: f.headers.cache, cabecalhos: { hsts: f.headers.hsts, csp: f.headers.csp, nosniff: f.headers.xcto, frame: f.headers.frame }, title: f.title, title_caracteres: f.title.length, meta_description_len: f.description.length, h1: f.h1.length, canonical: !!f.canonical, lang: f.lang, viewport: f.viewport, robots_meta: f.robotsMeta, robots_txt: f.robotsTxt, sitemap: f.sitemap, jsonld: f.jsonLdTypes, og: f.og, imagens: f.images, scripts: f.scripts, folhas_de_estilo: f.stylesheets, pagespeed_celular: psi, links_quebrados: f.links.broken, soft404: f.soft404 })
  return { system, user }
}
