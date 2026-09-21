import { describe, expect, it, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { checkRateLimit, resetRateLimitForTests } from "../src/lib/core-chat/rate-limit"
import { buildSystemPrompt, hasCommercialIntent, extractLead } from "../src/lib/core-chat/prompt"

describe("Core Chat", () => {
  beforeEach(() => resetRateLimitForTests())

  it("bloqueia a 13a mensagem na mesma janela", () => {
    for (let i = 0; i < 12; i++) assert.equal(checkRateLimit("test").allowed, true)
    assert.equal(checkRateLimit("test").allowed, false)
  })

  it("reseta o limite após a janela", () => {
    assert.equal(checkRateLimit("test", 1000).allowed, true)
    assert.equal(checkRateLimit("test", 62001).allowed, true)
  })

  it("detecta intenção comercial", () => {
    expect(hasCommercialIntent("Quanto custa um site?")).toBe(true)
  })

  it("extrai nome e contato", () => {
    const lead = extractLead("Meu nome é João da Silva, meu WhatsApp é 48999998888")
    assert.equal(lead.name, "João da Silva")
    assert.equal(lead.contact, "48999998888")
  })

  it("monta prompt sem inventar base comercial", () => {
    const prompt = buildSystemPrompt({
      enabled: true,
      assistant_name: "Teste",
      model: "modelo",
      knowledge_base: "Sites institucionais.",
      fallback_whatsapp: "5548999999999",
      secret_reference: "GROQ_API_KEY",
    })
    assert.match(prompt, /Teste/)
    assert.match(prompt, /Sites institucionais/)
    assert.match(prompt, /Nunca invente/)
  })
})
