import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { createAdminClient } from "../src/lib/supabase/admin.ts"
import { decryptSecret } from "../src/lib/core-chat/secrets.ts"

const baseUrl = process.env.CHAT_TEST_BASE_URL
const plaintextMarker = "gsk_TESTE_CORE_CHAT_123"

describe("Core Chat encrypted Groq integration", () => {
  it("proves database storage is ciphertext and the chat route can decrypt/use the configured key", async () => {
    assert.ok(baseUrl, "CHAT_TEST_BASE_URL não configurada")
    assert.ok(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL não configurada")
    assert.ok(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY não configurada")
    assert.ok(process.env.APP_ENCRYPTION_KEY, "APP_ENCRYPTION_KEY não configurada")

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("assistant_secrets")
      .select("ciphertext,iv,auth_tag")
      .eq("secret_name", "groq_api_key")
      .maybeSingle()

    assert.equal(error, null)
    assert.ok(data, "Nenhuma chave Groq cifrada configurada no banco")
    assert.notEqual(data.ciphertext, plaintextMarker)

    const decrypted = decryptSecret({
      ciphertext: data.ciphertext,
      iv: data.iv,
      authTag: data.auth_tag,
    })
    assert.ok(decrypted.length > 0)
    assert.notEqual(decrypted, data.ciphertext)

    const response = await fetch(baseUrl + "/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "127.0.0.98" },
      body: JSON.stringify({ message: "Teste de leitura da chave cifrada.", history: [] }),
    })
    const body = await response.json()
    assert.equal(response.status, 200, JSON.stringify(body))
    assert.equal(typeof body.message, "string")
    assert.ok(body.message.length > 0)
  })
})
