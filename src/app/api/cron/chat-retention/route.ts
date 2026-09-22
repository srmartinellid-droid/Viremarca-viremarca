import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get("authorization")
  if (!secret || auth !== "Bearer " + secret) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("chat_conversations").delete().lt("expires_at", new Date().toISOString()).not("expires_at", "is", null).select("id")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: data?.length || 0 })
}
