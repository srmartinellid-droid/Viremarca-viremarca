import { NextRequest, NextResponse } from "next/server"
import { getAdminProfile } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

function csv(value: unknown) {
  const text = String(value ?? "").replace(/"/g, '""')
  return '"' + text + '"'
}

export async function GET(request: NextRequest) {
  const profile = await getAdminProfile()
  if (!profile) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  const p = request.nextUrl.searchParams
  const status = p.get("status") || ""
  const leadFilter = p.get("lead") || ""
  const search = (p.get("search") || "").trim().toLowerCase()
  const from = p.get("from")
  const to = p.get("to")
  const supabase = createAdminClient()
  let query = supabase.from("chat_conversations").select("*").order("last_message_at", { ascending: false }).limit(5000)
  if (status) query = query.eq("status", status)
  if (from) query = query.gte("last_message_at", from)
  if (to) query = query.lt("last_message_at", to)
  const { data: conversations, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const ids = (conversations ?? []).map(row => row.id)
  const { data: leads } = ids.length ? await supabase.from("chat_leads").select("*").in("conversation_id", ids) : { data: [] }
  const map = new Map((leads ?? []).map(l => [l.conversation_id, l]))
  let rows = (conversations ?? []).map(c => ({ c, l: map.get(c.id) || null }))
  if (leadFilter === "with") rows = rows.filter(r => r.c.has_lead)
  if (leadFilter === "without") rows = rows.filter(r => !r.c.has_lead)
  if (search) rows = rows.filter(r => [r.l?.name,r.l?.whatsapp,r.l?.email,r.l?.business_name,r.l?.business_segment,r.l?.demand_summary,r.c.summary,r.c.admin_notes].filter(Boolean).join(" ").toLowerCase().includes(search))
  const header = ["data","nome","whatsapp","email","ramo","negócio","demanda","serviços","lead_score","status","whatsapp_clicked","cidade","site"]
  const lines = [header.map(csv).join(",")]
  for (const { c, l } of rows) lines.push([
    c.last_message_at,l?.name,l?.whatsapp,l?.email,l?.business_segment,l?.business_name,l?.demand_summary,
    Array.isArray(l?.services_interest) ? l.services_interest.join(" | ") : "",l?.lead_score,c.status,c.whatsapp_clicked ? "sim" : "não",l?.city,l?.current_site_url
  ].map(csv).join(","))
  return new NextResponse("\ufeff" + lines.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="viremarca-atendimentos.csv"' } })
}
