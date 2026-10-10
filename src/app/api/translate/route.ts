import { NextRequest, NextResponse } from "next/server"
import { loadCache, translateTexts, T_LANGS, type TLang } from "@/lib/translation/engine"

export const dynamic = "force-dynamic"

const hits = new Map<string, { n: number; reset: number }>()
function limited(ip: string) {
  const now = Date.now()
  const h = hits.get(ip)
  if (!h || h.reset < now) { hits.set(ip, { n: 1, reset: now + 60000 }); return false }
  h.n++
  return h.n > 40
}
const isLang = (v: unknown): v is TLang => typeof v === "string" && (T_LANGS as string[]).includes(v)

export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get("lang")
  if (!isLang(lang)) return NextResponse.json({ error: "Idioma inválido." }, { status: 400 })
  try {
    return NextResponse.json({ translations: await loadCache(lang) }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } })
  } catch { return NextResponse.json({ translations: {} }) }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  if (limited(ip)) return NextResponse.json({ error: "Muitas requisições." }, { status: 429 })
  try {
    const body = await req.json()
    if (!isLang(body?.lang) || !Array.isArray(body?.texts)) return NextResponse.json({ error: "Requisição inválida." }, { status: 400 })
    const texts: string[] = body.texts.filter((t: unknown): t is string => typeof t === "string" && t.trim().length > 1 && t.length <= 1200).slice(0, 60)
    if (!texts.length) return NextResponse.json({ translations: {}, pending: 0 })
    return NextResponse.json(await translateTexts(body.lang, texts))
  } catch (e) {
    console.error("[api/translate]", e)
    return NextResponse.json({ translations: {}, pending: 0, reason: "error" })
  }
}
