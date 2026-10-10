import { NextRequest, NextResponse } from "next/server"
import { assertAdmin } from "@/lib/admin-auth"
import { callModel, clearCache, getTranslationConfig, hasTranslationKey, saveTranslationConfig, TRANSLATION_SECRET } from "@/lib/translation/engine"
import { deleteNamedSecret, getGroqApiKey, getNamedSecret, saveNamedSecret } from "@/lib/core-chat/secrets"

export const dynamic = "force-dynamic"
const deny = () => NextResponse.json({ error: "Não autorizado." }, { status: 401 })

async function state() {
  return { config: await getTranslationConfig(), key_source: await hasTranslationKey() }
}

export async function GET() {
  try { if (!await assertAdmin()) return deny(); return NextResponse.json(await state()) }
  catch (e) { console.error(e); return NextResponse.json({ error: "Não foi possível carregar." }, { status: 500 }) }
}

export async function PUT(req: NextRequest) {
  try {
    if (!await assertAdmin()) return deny()
    const b = await req.json()
    await saveTranslationConfig({ enabled: Boolean(b.enabled), endpoint: String(b.endpoint ?? ""), model: String(b.model ?? ""), daily_cap: Number(b.daily_cap) || 1500 })
    return NextResponse.json(await state())
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Não foi possível salvar." }, { status: 400 }) }
}

export async function POST(req: NextRequest) {
  try {
    if (!await assertAdmin()) return deny()
    const b = await req.json()
    if (b.action === "save_key") {
      if (typeof b.api_key !== "string" || !b.api_key.trim()) return NextResponse.json({ error: "Informe a chave." }, { status: 400 })
      await saveNamedSecret(TRANSLATION_SECRET, b.api_key)
      return NextResponse.json(await state())
    }
    if (b.action === "remove_key") { await deleteNamedSecret(TRANSLATION_SECRET); return NextResponse.json(await state()) }
    if (b.action === "clear_cache") { await clearCache(); return NextResponse.json({ ok: true }) }
    if (b.action === "test") {
      const cfg = await getTranslationConfig()
      let key: string
      try { key = await getNamedSecret(TRANSLATION_SECRET) } catch { key = await getGroqApiKey() }
      const t0 = Date.now()
      const [en, es] = await Promise.all([callModel(cfg, key, "en", ["Site de verdade para a sua marca."]), callModel(cfg, key, "es", ["Site de verdade para a sua marca."])])
      return NextResponse.json({ ok: true, ms: Date.now() - t0, en: en[0], es: es[0] })
    }
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 })
  } catch (e) { return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Falha." }, { status: 400 }) }
}
