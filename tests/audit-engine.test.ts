import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { buildReport, chatSummary, cleanAiText, scoreCriterion, verdictFor } from "../src/lib/audit/score.ts"
import { imageHasReservedSpace } from "../src/lib/audit/html-signals.ts"
import { CAPS, COVERAGE } from "../src/lib/audit/policy.ts"
import type { Facts } from "../src/lib/audit/collect.ts"
import type { Check } from "../src/lib/audit/types.ts"

const NOW = new Date("2026-10-19T01:00:00Z") // 22h do dia 18 em São Paulo

function facts(over: Record<string, unknown> = {}): Facts {
  const base = {
    url: "https://exemplo.test/", host: "exemplo.test", fetchedAt: NOW.toISOString(), https: true, httpRedirectsToHttps: true,
    status: 200, ttfbMs: 300, ttfbSamples: [280, 300, 320], totalMs: 500, htmlBytes: 60_000, truncated: false, redirects: [],
    headers: { encoding: "br", cache: "public, max-age=0, must-revalidate", hsts: true, csp: true, xcto: true, frame: true, server: null },
    title: "Exemplo Serviços Técnicos em Florianópolis", description: "Serviços técnicos em Florianópolis com atendimento rápido, orçamento sem compromisso e equipe própria.", lang: "pt-BR", viewport: true, canonical: "https://exemplo.test/", robotsMeta: "",
    h1: ["Serviços técnicos"], h2: ["a", "b", "c", "d"], h3Count: 2,
    images: { total: 6, noAlt: 0, noDims: 0, fill: 0, lazy: 4, modernFormat: 6 },
    assets: [{ url: "https://exemplo.test/_next/static/app.js", kind: "js", status: 200, cache: "public,max-age=31536000,immutable" }],
    scripts: { external: 6, inlineBytes: 40_000, thirdParty: 1 }, stylesheets: 1,
    og: { title: true, description: true, image: true, imageOk: true }, twitterCard: true, jsonLdTypes: ["LocalBusiness"], favicon: true,
    links: { internal: 8, external: 2, tel: 1, mailto: 1, whatsapp: 2, broken: [], checked: 4, hash: 3 },
    nav: ["Início", "Serviços", "Sobre", "Contato"], ctas: ["Fale no WhatsApp", "Solicitar orçamento", "Contato"], forms: 1, formsWithLabels: 1, buttons: 5,
    signals: { phone: true, email: true, address: true, region: true, cnpj: true, privacy: true, about: true, testimonials: true, social: ["instagram.com"], mapEmbed: true, chat: false, footer: true, copyright: true, videoEmbed: false },
    text: { words: 600, excerpt: "texto", aboveFold: "Serviços técnicos · Fale no WhatsApp e solicite um orçamento para o seu projeto" },
    robotsTxt: { status: 200, hasSitemap: true, blocksAll: false }, sitemap: { status: 200, urls: 10 }, soft404: false,
    pages: [{ url: "https://exemplo.test/a", status: 200, title: "A", words: 300, titleDuplicate: false }], warnings: [],
  }
  return { ...base, ...over } as unknown as Facts
}
const psi = { performance: 95, accessibility: 95, bestPractices: 95, seo: 95, lcpMs: 1800, cls: 0.02, tbtMs: 100, fcpMs: 900, speedIndexMs: 1500, opportunities: [], fetchedAt: NOW.toISOString() }
const ids = (r: ReturnType<typeof buildReport>) => r.findings.map(f => f.id)

describe("Motor de auditoria v2", () => {
  it("imagem em modo fill ou com proporção não conta como sem dimensões", () => {
    assert.equal(imageHasReservedSpace({ "data-nimg": "fill" }), true)
    assert.equal(imageHasReservedSpace({ width: "10", height: "10" }), true)
    assert.equal(imageHasReservedSpace({ style: "position:absolute;inset:0" }), true)
    assert.equal(imageHasReservedSpace({ src: "/a.png" }), false)
  })
  it("é determinístico: mesma entrada, mesma nota", () => {
    const a = buildReport(facts(), psi, null, NOW), b = buildReport(facts(), psi, null, NOW)
    assert.deepEqual(a, b)
  })
  it("caso-ouro: site saudável com PageSpeed fica alto, com confiança alta e sem defeitos", () => {
    const r = buildReport(facts(), psi, null, NOW)
    assert.ok(r.overall >= 8.5, String(r.overall))
    assert.equal(r.confidence, "alta")
    assert.equal(r.findings.filter(f => f.kind === "defeito").length, 0)
    assert.equal(r.untested.length, 0)
  })
  it("a IA nunca altera a nota", () => {
    const sem = buildReport(facts(), psi, null, NOW)
    const com = buildReport(facts(), psi, { notes: { seo: "Os sinais básicos para buscadores aparecem no HTML público." }, first_impression: "A página apresenta serviços técnicos e convida ao contato." }, NOW)
    assert.equal(sem.overall, com.overall)
    assert.deepEqual(sem.criteria.map(c => c.score), com.criteria.map(c => c.score))
    assert.ok(com.criteria.find(c => c.id === "seo")?.aiNote)
  })
  it("texto de IA com número, consequência ou opinião visual é descartado", () => {
    assert.equal(cleanAiText("O site perde clientes todos os dias por causa disso."), null)
    assert.equal(cleanAiText("A nota deveria ser 9 neste critério."), null)
    assert.equal(cleanAiText("O design da página precisa de mais contraste."), null)
    assert.equal(cleanAiText("curto"), null)
    assert.ok(cleanAiText("O texto da página descreve os serviços e indica como entrar em contato."))
  })
  it("next/image com fill não gera achado de dimensões", () => {
    const r = buildReport(facts({ images: { total: 5, noAlt: 0, noDims: 0, fill: 5, lazy: 5, modernFormat: 5 } }), psi, null, NOW)
    assert.ok(!ids(r).includes("mobile:dims"))
  })
  it("site só com chat conta como canal de contato", () => {
    const r = buildReport(facts({ forms: 0, links: { ...facts().links, whatsapp: 0, tel: 0, mailto: 0 }, signals: { ...facts().signals, chat: true, phone: false, email: false } }), psi, null, NOW)
    assert.ok(!ids(r).includes("confianca:contato-visivel"))
    assert.ok(!ids(r).includes("conversao:canal-direto"))
  })
  it("site sem nenhum canal de contato gera defeito", () => {
    const r = buildReport(facts({ forms: 0, links: { ...facts().links, whatsapp: 0, tel: 0, mailto: 0 }, signals: { ...facts().signals, phone: false, email: false } }), psi, null, NOW)
    const f = r.findings.find(x => x.id === "conversao:canal-direto")
    assert.equal(f?.kind, "defeito")
  })
  it("HTTPS ausente aplica teto de integridade", () => {
    const r = buildReport(facts({ https: false, httpRedirectsToHttps: null }), psi, null, NOW)
    assert.ok(r.overall <= CAPS.https.limit)
    assert.ok(r.range.high <= CAPS.https.limit)
    assert.ok(r.caps.some(c => c.id === "https"))
  })
  it("sem PageSpeed: itens ficam como não testados e a confiança não é alta", () => {
    const r = buildReport(facts(), null, null, NOW)
    assert.ok(r.untested.some(u => u.label.includes("desempenho")))
    assert.notEqual(r.confidence, "alta")
    assert.ok(r.range.low < r.overall)
  })
  it("critério com pouca cobertura vira parcial e fica limitado", () => {
    const mk = (id: string, status: Check["status"], w: number): Check => ({ id, label: id, status, w, kind: "recomendacao", title: id, evidence: "", howTo: "", fix: "" })
    const s = scoreCriterion("desempenho", [mk("a", "pass", 1), mk("b", "untested", 5), mk("c", "untested", 4)])
    assert.equal(s.partial, true)
    assert.ok((s.score ?? 99) <= COVERAGE.partialCap)
    assert.equal(scoreCriterion("seo", [mk("a", "untested", 1)]).score, null)
  })
  it("achados não trazem consequências não provadas", () => {
    const bad = facts({ https: false, viewport: false, h1: [], title: "", description: "", ttfbMs: 4000, ttfbSamples: [4000, 4100, 3900], headers: { encoding: null, cache: "no-store", hsts: false, csp: false, xcto: false, frame: false, server: null }, ctas: [], jsonLdTypes: [], robotsTxt: { status: 404, hasSitemap: false, blocksAll: false }, sitemap: { status: 404, urls: 0 } })
    const r = buildReport(bad, null, null, NOW)
    assert.ok(r.findings.length > 10)
    for (const f of r.findings) assert.doesNotMatch(`${f.title} ${f.evidence} ${f.fix}`, /ranking|perde|derruba|desiste|fatal|clientes todos/i, f.id)
    for (const f of r.findings) assert.ok(f.howTo, `sem “como conferir”: ${f.id}`)
  })
  it("cache do HTML não vira achado; cache de estáticos curto vira recomendação", () => {
    const html = buildReport(facts({ headers: { ...facts().headers, cache: "private, no-cache, no-store" } }), psi, null, NOW)
    assert.ok(!ids(html).some(i => i.includes("cache")))
    const st = buildReport(facts({ assets: [{ url: "https://exemplo.test/a.png", kind: "img", status: 200, cache: "public, max-age=0, must-revalidate" }] }), psi, null, NOW)
    assert.ok(ids(st).includes("desempenho:cache-estatico"))
  })
  it("a data do relatório usa o fuso de São Paulo", () => {
    const r = buildReport(facts(), psi, null, NOW)
    assert.match(r.limits[0], /18\/10\/2026/)
  })
  it("o resumo do chat é uma análise preliminar com faixa e escopo, sem tom comercial", () => {
    const txt = chatSummary(buildReport(facts(), psi, null, NOW))
    assert.match(txt, /análise automática preliminar/)
    assert.match(txt, /faixa provável/)
    assert.match(txt, /não substitui a análise de um profissional/)
    assert.doesNotMatch(txt, /urgente|perdendo|orçamento/i)
  })
  it("faixas de leitura são neutras", () => {
    for (const n of [9, 7.5, 6, 4.5, 2]) assert.doesNotMatch(verdictFor(n), /urgente|perdendo/i)
  })
})
