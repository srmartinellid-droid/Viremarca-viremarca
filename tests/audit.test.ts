import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { extractJsonLdTypes } from "../src/lib/audit/jsonld.ts"
import { dedupeFindings, cleanEvidence, findingTopic } from "../src/lib/audit/findings.ts"

const mk = (source: "regra" | "ia", title: string, fix = "x") => ({ id: title, severity: "atencao" as const, criterion: "seo", title, evidence: "", impact: "", fix, source })

describe("Auditoria de sites", () => {
  it("detecta JSON-LD (LocalBusiness) emitido como o Next.js emite", () => {
    const html = `<html><head><script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness","name":"A &amp; B"}</script></head><body></body></html>`
    assert.deepEqual(extractJsonLdTypes(html), ["LocalBusiness"])
  })
  it("lê @graph e @type em lista, ignora JSON inválido", () => {
    const html = `<script type="application/ld+json">{"@graph":[{"@type":["Organization","Store"]},{"@type":"WebSite"}]}</script><script type="application/ld+json">{quebrado</script>`
    assert.deepEqual(extractJsonLdTypes(html).sort(), ["Organization", "Store", "WebSite"])
  })
  it("sem JSON-LD devolve lista vazia", () => assert.deepEqual(extractJsonLdTypes("<html><body>oi</body></html>"), []))
  it("deduplica o mesmo problema e prefere o achado de regra", () => {
    const out = dedupeFindings([mk("ia", "TTFB elevado", "cache de servidor"), mk("regra", "Servidor lento para responder"), mk("regra", "Título da página fora do tamanho ideal"), mk("ia", "Título de SEO inadequado")])
    assert.deepEqual(out.map(f => f.title), ["Servidor lento para responder", "Título da página fora do tamanho ideal"])
  })
  it("não confunde H1 com título da página", () => {
    assert.equal(findingTopic({ title: "A página não tem título principal (H1)", fix: "Use um único H1" }), "h1")
    assert.equal(findingTopic({ title: "Título da página fora do tamanho ideal", fix: "30 a 60 caracteres" }), "titulo")
  })
  it("esconde evidência com nomes internos de campos", () => {
    assert.equal(cleanEvidence("contato_clicavel: formularios:0"), "")
    assert.equal(cleanEvidence("sinais_de_confianca: phone:false, email:false"), "")
    assert.equal(cleanEvidence("CSP=false, nosniff=false"), "")
    assert.equal(cleanEvidence("O título tem 77 caracteres"), "O título tem 77 caracteres")
  })
})
