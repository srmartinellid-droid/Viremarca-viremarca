import { NextResponse } from "next/server"
import { loadAudit, validAuditId } from "@/lib/audit/store"
import { auditView } from "@/lib/audit/run"

export const dynamic = "force-dynamic"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!validAuditId(id)) return NextResponse.json({ error: "id inválido" }, { status: 400 })
  const s = await loadAudit(id)
  return s ? NextResponse.json(await auditView(s)) : NextResponse.json({ error: "não encontrada" }, { status: 404 })
}
