import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { encryptSecret, decryptSecret } from "../src/lib/core-chat/secrets.ts"

const testKey = Buffer.alloc(32, 7)

describe("Core Chat secrets", () => {
  it("cifra a chave sem armazenar o texto puro", () => {
    const plaintext = "gsk_TESTE_CORE_CHAT_123"
    const encrypted = encryptSecret(plaintext, testKey)
    assert.notEqual(encrypted.ciphertext, plaintext)
    assert.equal(decryptSecret(encrypted, testKey), plaintext)
  })

  it("falha ao decifrar com a chave mestra errada", () => {
    const encrypted = encryptSecret("gsk_TESTE_CORE_CHAT_123", testKey)
    assert.throws(() => decryptSecret(encrypted, Buffer.alloc(32, 8)))
  })
})
