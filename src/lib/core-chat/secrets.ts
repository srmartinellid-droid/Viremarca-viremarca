import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import { createAdminClient } from "@/lib/supabase/admin"

const ALGORITHM = "aes-256-gcm"
const IV_BYTES = 12
const KEY_BYTES = 32
const SECRET_NAME = "groq_api_key"

function getMasterKey() {
  const raw = process.env.APP_ENCRYPTION_KEY
  if (!raw) throw new Error("APP_ENCRYPTION_KEY não configurada no ambiente.")

  const key = /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64")

  if (key.length !== KEY_BYTES) {
    throw new Error("APP_ENCRYPTION_KEY deve representar exatamente 32 bytes.")
  }
  return key
}

export function encryptSecret(value: string, masterKey = getMasterKey()) {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, masterKey, iv)
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  }
}

export function decryptSecret(input: { ciphertext: string; iv: string; authTag: string }, masterKey = getMasterKey()) {
  const decipher = createDecipheriv(ALGORITHM, masterKey, Buffer.from(input.iv, "base64"))
  decipher.setAuthTag(Buffer.from(input.authTag, "base64"))
  return Buffer.concat([
    decipher.update(Buffer.from(input.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8")
}

export async function getGroqApiKey() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("assistant_secrets")
    .select("ciphertext,iv,auth_tag")
    .eq("secret_name", SECRET_NAME)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error("Chave da API Groq não configurada.")
  return decryptSecret({ ciphertext: data.ciphertext, iv: data.iv, authTag: data.auth_tag })
}

export async function hasGroqApiKey() {
  try {
    await getGroqApiKey()
    return true
  } catch {
    return false
  }
}

export async function saveGroqApiKey(value: string) {
  const normalized = value.trim()
  if (!normalized) throw new Error("A chave da API Groq não pode estar vazia.")
  if (normalized.length > 512) throw new Error("A chave da API Groq é inválida.")

  const encrypted = encryptSecret(normalized)
  const supabase = createAdminClient()
  const { error } = await supabase.from("assistant_secrets").upsert({
    secret_name: SECRET_NAME,
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    auth_tag: encrypted.authTag,
    updated_at: new Date().toISOString(),
  }, { onConflict: "secret_name" })

  if (error) throw error
}
