import { randomUUID } from "crypto"
import { collectFacts } from "./collect"
import { runPsi } from "./psi"
import { getProviders, promptA, promptB, routed } from "./llm"
import { buildReport, chatSummary } from "./score"
import { buildPdf } from "./report-pdf"
import { loadAudit, saveAudit, savePdf, pruneAudits, type AuditState } from "./store"
import { createAdminClient } from "@/lib/supabase/admin"
import { leadGate, lockedAuditMessage, isFirstAuditOfVisitor } from "./gate"

export async function createAudit(url: string, conversationId: string | null, visitorId: string | null): Promise<AuditState> {
  const now = new Date().toISOString()
  const s: AuditState = { id: randomUUID(), url, host: new URL(url).hostname, conversation_id: conversationId, visitor_id: visitorId, status: "running", step: "collect", created_at: now, updated_at: now, attempts: {} }
  await saveAudit(s)
  void pruneAudits().catch(() => {})
  return s
}

const NEXT: Record<string, AuditState["step"]> = { collect: "psi", psi: "analyze", analyze: "render", render: "done" }

// Executa UM passo (idempotente e retomável). Nunca deixa a auditoria presa: após 3 falhas do mesmo passo,
// segue com o que existe (regras determinísticas) em vez de abortar.
export async function advance(id: string): Promise<AuditState | null> {
  const s = await loadAudit(id)
  if (!s || s.status !== "running") return s
  if (s.lock_until && s.lock_until > Date.now()) return s
  s.lock_until = Date.now() + 70000
  await saveAudit(s)
  const step = s.step
  s.attempts[step] = (s.attempts[step] ?? 0) + 1
  try {
    if (step === "collect") {
      s.facts = await collectFacts(s.url)
    } else if (step === "psi") {
      try { s.psi = await runPsi(s.url, process.env.PAGESPEED_API_KEY) } catch { s.psi = null }
    } else if (step === "analyze") {
      const providers = await getProviders()
      const a = promptA(s.facts!), b = promptB(s.facts!, s.psi ?? null)
      const [ra, rb] = await Promise.all([routed(providers, 0, a.system, a.user), routed(providers, 1, b.system, b.user)])
      s.llm = { A: ra.out, B: rb.out, routes: [ra.route, rb.route] }
    } else if (step === "render") {
      s.report = buildReport(s.facts!, s.psi ?? null, (s.llm?.A as any) ?? null, (s.llm?.B as any) ?? null)
      const pdf = await buildPdf(s.report)
      await savePdf(s.id, pdf)
      s.pdf_ready = true
      s.summary = chatSummary(s.report)
    }
    s.step = NEXT[step]
    if (s.step === "done") { s.status = "done"; await finishInChat(s) }
  } catch (e) {
    console.error("[audit step]", step, e instanceof Error ? e.message : e)
    if (step === "collect" && s.attempts[step] >= 2) { s.status = "failed"; s.error = "Não foi possível abrir o site informado." }
    else if (s.attempts[step] >= 3) {
      if (step === "psi") s.step = "analyze"
      else if (step === "analyze") { s.llm = { routes: ["falhou — relatório só com medições"] }; s.step = "render" }
      else { s.status = "failed"; s.error = "Falha ao gerar o relatório." }
    }
  }
  s.lock_until = 0
  await saveAudit(s)
  return s
}

// Registra o resultado no histórico do chat (aparece no painel de atendimentos junto do PDF).
// Sem nome e WhatsApp, o histórico recebe só o pedido de contato: resumo e PDF ficam travados até o lead existir.
async function finishInChat(s: AuditState) {
  if (!s.conversation_id || s.lead_notified) return
  try {
    const db = createAdminClient()
    const gate = await leadGate(s.conversation_id)
    // A primeira auditoria de cada visitante sai liberada; as seguintes exigem nome + WhatsApp.
    s.free = !gate.complete && await isFirstAuditOfVisitor(s.visitor_id, s.id, s.created_at)
    const released = gate.complete || s.free
    const content = released ? fullMessage(s, s.free ? gate.missing : []) : lockedAuditMessage(s.host, gate.missing)
    await db.from("chat_messages").insert({ conversation_id: s.conversation_id, role: "assistant", content })
    await db.from("chat_leads").update({ current_site_url: s.url }).eq("conversation_id", s.conversation_id)
    s.delivered = released
    s.lead_notified = true
  } catch (e) { console.error("[audit chat]", e instanceof Error ? e.message : e) }
}

export const fullMessage = (s: AuditState, missing: string[] = []) =>
  `${s.summary}${missing.length ? `\n\nPara a equipe te explicar o plano de correção, me diz ${missing.length === 2 ? "seu nome e seu WhatsApp (com DDD)" : missing[0] === "nome" ? "seu nome" : "seu WhatsApp (com DDD)"}.` : ""}\n\n[Relatório PDF gerado: /api/audit/${s.id}/pdf]`

/** Auditorias concluídas desta conversa que ainda não foram liberadas (mais recente primeiro). */
export async function pendingAudits(conversationId: string): Promise<AuditState[]> {
  const db = createAdminClient()
  const { data } = await db.from("site_settings").select("key,value").like("key", "audit:%").ilike("value", `%"conversation_id":"${conversationId}"%`)
  const pending: AuditState[] = []
  for (const row of data ?? []) { try { const s = JSON.parse(row.value) as AuditState; if (s.status === "done" && s.pdf_ready && !s.delivered) pending.push(s) } catch {} }
  return pending.sort((x, y) => y.created_at.localeCompare(x.created_at))
}

/** Entrega as auditorias prontas que ficaram travadas, assim que a conversa passa a ter nome e WhatsApp. */
export async function unlockPendingAudits(conversationId: string): Promise<{ message: string } | null> {
  const gate = await leadGate(conversationId)
  if (!gate.complete) return null
  const db = createAdminClient()
  const pending = await pendingAudits(conversationId)
  if (!pending.length) return null
  const latest = pending[0]
  for (const s of pending) { s.delivered = true; await saveAudit(s) }
  const message = fullMessage(latest)
  await db.from("chat_messages").insert({ conversation_id: conversationId, role: "assistant", content: message })
  return { message }
}

// Visão pública. Resumo, nota e PDF só saem quando a trava de lead (nome + WhatsApp) está liberada.
export async function auditView(s: AuditState) {
  const done = s.status === "done" && !!s.pdf_ready
  const gate = done ? await leadGate(s.conversation_id) : null
  const unlocked = !!gate?.complete || (done && !!s.free)
  return {
    id: s.id, status: s.status, step: s.step, host: s.host, error: s.error,
    summary: unlocked ? (s.free && gate && !gate.complete ? fullMessage(s, gate.missing).replace(/\n\n\[Relatório PDF gerado:[\s\S]*$/, "") : s.summary) : undefined,
    score: unlocked ? (s.report?.overall ?? null) : null,
    pdf_ready: unlocked,
    locked: done && !unlocked,
    locked_message: done && !unlocked ? lockedAuditMessage(s.host, gate!.missing) : undefined,
  }
}

export function publicView(s: AuditState) {
  return { id: s.id, status: s.status, step: s.step, host: s.host, error: s.error }
}
