import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { createClient } from "@supabase/supabase-js"
import { createAdminClient } from "../src/lib/supabase/admin.ts"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const baseUrl = process.env.CHAT_TEST_BASE_URL

describe("chat_leads RLS integration", () => {
  it("anon cannot read chat_leads", async () => {
    if (!url || !anonKey) return
    const anon = createClient(url, anonKey, { auth: { persistSession: false } })
    const { data, error } = await anon.from("chat_leads").select("id").limit(1)
    assert.deepEqual(data, [])
    assert.ok(error === null || /permission|row-level|policy/i.test(error.message))
  })

  it("server admin client can insert a clearly marked test lead", async () => {
    if (!url || !process.env.SUPABASE_SERVICE_ROLE_KEY) return
    const admin = createAdminClient()
    const contact = "+55 00000-0000"
    const { data, error } = await admin
      .from("chat_leads")
      .insert({
        name: "Teste Core Chat",
        contact,
        transcript_summary: "INTEGRATION_TEST_ONLY",
        source: "core-chat-test",
      })
      .select("id,name,contact,source")
      .single()

    assert.equal(error, null)
    assert.equal(data?.name, "Teste Core Chat")
    assert.equal(data?.contact, contact)
    assert.equal(data?.source, "core-chat-test")

    if (data?.id) await admin.from("chat_leads").delete().eq("id", data.id)
  })

  it("chat route captures a clearly marked test lead", async () => {
    if (!baseUrl || !url || !process.env.SUPABASE_SERVICE_ROLE_KEY) return

    const contact = "+55 00000-0000"
    const response = await fetch(baseUrl + "/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "127.0.0.99" },
      body: JSON.stringify({
        message: "Quero contratar um site. Sou Teste Core Chat e meu WhatsApp é 00000-0000.",
        history: [],
      }),
    })
    const body = await response.json()
    assert.equal(response.status, 200, JSON.stringify(body))

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("chat_leads")
      .select("id,name,contact,source")
      .eq("source", "core-chat")
      .eq("contact", contact)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    assert.equal(error, null)
    assert.equal(data?.name, "Teste Core Chat")
    assert.equal(data?.contact, contact)

    if (data?.id) await admin.from("chat_leads").delete().eq("id", data.id)
  })
})
