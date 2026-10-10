import { NextResponse } from "next/server"
import { extractSiteUrl } from "@/lib/audit/url"
import { createAudit, publicView } from "@/lib/audit/run"
import { takeAuditQuota } from "@/lib/audit/store"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

// Teto anti-abuso (custo de IA/PSI), alto o bastante para uso e testes normais.
const AUDIT_IP_DAILY_CAP = 50

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const url = extractSiteUrl(String(body.url ?? ""))
  if (!url) return NextResponse.json({ error: "Endereço de site inválido." }, { status: 400 })
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "anon"
  const db = createAdminClient()
  const key = "audit_ip:" + ip, today = new Date().toISOString().slice(0, 10)
  const { data } = await db.from("site_settings").select("value").eq("key", key).maybeSingle()
  let n = 0; try { const u = JSON.parse(data?.value || "{}"); if (u.date === today) n = u.count } catch {}
  if (n >= AUDIT_IP_DAILY_CAP) return NextResponse.json({ error: "Limite diário de auditorias atingido. Fale com a equipe pelo WhatsApp." }, { status: 429 })
  if (!(await takeAuditQuota())) return NextResponse.json({ error: "Muitas auditorias hoje. Tente amanhã ou fale com a equipe." }, { status: 429 })
  await db.from("site_settings").upsert({ key, value: JSON.stringify({ date: today, count: n + 1 }) }, { onConflict: "key" })
  const conv = typeof body.conversation_id === "string" ? body.conversation_id : null
  const vis = typeof body.visitor_id === "string" ? body.visitor_id : null
  const s = await createAudit(url, conv, vis)
  return NextResponse.json(publicView(s))
}
