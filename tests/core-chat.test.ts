import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { checkRateLimit, resetRateLimitForTests } from "../src/lib/core-chat/rate-limit.ts"
import { buildSystemPrompt, hasCommercialIntent, extractLead } from "../src/lib/core-chat/prompt.ts"
import { parseGroqResponse } from "../src/lib/core-chat/groq.ts"
import { sanitizeAssistantResponse } from "../src/lib/core-chat/response-sanitizer.ts"

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
    assert.equal(hasCommercialIntent("Quanto custa um site?"), true)
  })

  it("extrai nome e contato", () => {
    const lead = extractLead("Meu nome é João da Silva, meu WhatsApp é 48999998888")
    assert.equal(lead.name, "João da Silva")
    assert.equal(lead.contact, "48999998888")
  })

  it("monta system prompt com contrato comercial", () => {
    const prompt = buildSystemPrompt({
      enabled: true, assistant_name: "Teste", model: "modelo",
      knowledge_base: "Sites institucionais.", fallback_whatsapp: "5548999999999",
      secret_reference: "GROQ_API_KEY",
    })
    assert.match(prompt, /Teste/)
    assert.match(prompt, /Sites institucionais/)
    assert.match(prompt, /Nunca invente/)
  })

  it("sanitiza links e telefone do visitante no texto do assistente", () => {
    const official = "5548991410717"
    const visitor = "+55 48 90000-0000"
    const answer = "Aqui está: https://wa.me/5548998023620. Fale com a equipe pelo 48 90000-0000."
    const sanitized = sanitizeAssistantResponse(answer, official, [visitor])
    assert.equal(sanitized, "Aqui está: https://wa.me/5548991410717. Fale com a equipe pelo 5548991410717.")
    assert.doesNotMatch(sanitized, /wa\.me\/5548998023620/)
    assert.doesNotMatch(sanitized, /48 90000-0000/)
  })

  it("sanitiza api.whatsapp.com e preserva o canal oficial", () => {
    assert.equal(
      sanitizeAssistantResponse("https://api.whatsapp.com/send?phone=5548998023620", "5548991410717"),
      "https://wa.me/5548991410717",
    )
    assert.equal(
      sanitizeAssistantResponse("https://wa.me/5548991410717", "5548991410717"),
      "https://wa.me/5548991410717",
    )
  })

  it("faz parsing da resposta Groq", () => {
    assert.equal(parseGroqResponse({ choices: [{ message: { content: "Resposta OK" } }] }), "Resposta OK")
    assert.throws(() => parseGroqResponse({ choices: [] }))
  })
})
