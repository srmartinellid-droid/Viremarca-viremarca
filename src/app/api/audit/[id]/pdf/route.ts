import { loadAudit, loadPdf, validAuditId } from "@/lib/audit/store"
import { leadGate } from "@/lib/audit/gate"
import { assertAdmin } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

// O id é um UUID aleatório (capacidade): quem recebeu o link no chat pode baixar; o admin usa o mesmo link.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!validAuditId(id)) return new Response("id inválido", { status: 400 })
  const [s, pdf] = await Promise.all([loadAudit(id), loadPdf(id)])
  if (!s || !pdf) return new Response("Relatório indisponível", { status: 404 })
  // Trava de lead: só baixa quem já informou nome e WhatsApp na conversa (o admin logado sempre pode).
  const admin = await assertAdmin().catch(() => false)
  if (!admin && !s.free && !(await leadGate(s.conversation_id)).complete) return new Response("Para liberar o relatório, informe seu nome e WhatsApp no chat.", { status: 403 })
  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="auditoria-${s.host}.pdf"`, "Cache-Control": "private, no-store" } })
}
