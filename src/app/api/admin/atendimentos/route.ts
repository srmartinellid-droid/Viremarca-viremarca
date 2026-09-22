import { NextRequest, NextResponse } from "next/server"
import { getAdminProfile } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  const profile = await getAdminProfile()
  if (!profile) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  const params = request.nextUrl.searchParams
  const status = params.get("status") || ""
  const leadFilter = params.get("lead") || ""
  const search = (params.get("search") || "").trim().toLowerCase()
  const from = params.get("from")
  const to = params.get("to")

  const supabase = createAdminClient()
  let query = supabase.from("chat_conversations").select("*")
  if (status) query = query.eq("status", status)
  if (from) query = query.gte("last_message_at", from)
  if (to) query = query.lt("last_message_at", to)
  query = query.order("last_message_at", { ascending: false }).limit(1000)
  const { data: conversations, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = (conversations ?? []).map(row => row.id)
  const { data: leads, error: leadError } = ids.length ? await supabase.from("chat_leads").select("*").in("conversation_id", ids) : { data: [], error: null }
  if (leadError) return NextResponse.json({ error: leadError.message }, { status: 500 })
  const leadMap = new Map((leads ?? []).map(lead => [lead.conversation_id, lead]))
  let items = (conversations ?? []).map(conversation => ({ ...conversation, lead: leadMap.get(conversation.id) ?? null }))

  if (leadFilter === "with") items = items.filter(item => item.has_lead)
  if (leadFilter === "without") items = items.filter(item => !item.has_lead)
  if (search) items = items.filter(item => {
    const l = item.lead || {}
    const haystack = [l.name,l.whatsapp,l.email,l.business_name,l.business_segment,l.demand_summary,item.summary,item.admin_notes].filter(Boolean).join(" ").toLowerCase()
    return haystack.includes(search)
  })

  const newCount = items.filter(item => item.status === "novo").length
  return NextResponse.json({ items, new_count: newCount })
}
