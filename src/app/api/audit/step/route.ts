import { NextResponse } from "next/server"
import { advance, publicView } from "@/lib/audit/run"
import { validAuditId } from "@/lib/audit/store"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(req: Request) {
  const { id } = await req.json().catch(() => ({}))
  if (!validAuditId(id)) return NextResponse.json({ error: "id inválido" }, { status: 400 })
  const s = await advance(id)
  if (!s) return NextResponse.json({ error: "não encontrada" }, { status: 404 })
  return NextResponse.json(publicView(s))
}
