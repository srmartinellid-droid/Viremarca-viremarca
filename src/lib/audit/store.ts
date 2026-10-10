import { createAdminClient } from "@/lib/supabase/admin"
import type { Facts } from "./collect"
import type { Psi } from "./psi"
import type { Report } from "./score"

export type AuditState = {
  id: string; url: string; host: string; conversation_id: string | null; visitor_id: string | null
  status: "running" | "done" | "failed"; step: "collect" | "psi" | "analyze" | "render" | "done"
  created_at: string; updated_at: string; lock_until?: number; attempts: Record<string, number>
  facts?: Facts; psi?: Psi | null; llm?: { A?: unknown; B?: unknown; routes?: string[] }
  report?: Report; summary?: string; error?: string; pdf_ready?: boolean; lead_notified?: boolean; delivered?: boolean; free?: boolean
}

const db = () => createAdminClient()
export const auditKey = (id: string) => "audit:" + id
export const pdfKey = (id: string) => "auditpdf:" + id
export const validAuditId = (id: unknown): id is string => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)

export async function loadAudit(id: string): Promise<AuditState | null> {
  const { data } = await db().from("site_settings").select("value").eq("key", auditKey(id)).maybeSingle()
  if (!data?.value) return null
  try { return JSON.parse(data.value) as AuditState } catch { return null }
}

export async function saveAudit(s: AuditState) {
  s.updated_at = new Date().toISOString()
  const { error } = await db().from("site_settings").upsert({ key: auditKey(s.id), value: JSON.stringify(s) }, { onConflict: "key" })
  if (error) throw error
}

export async function savePdf(id: string, bytes: Uint8Array) {
  const { error } = await db().from("site_settings").upsert({ key: pdfKey(id), value: Buffer.from(bytes).toString("base64") }, { onConflict: "key" })
  if (error) throw error
}

export async function loadPdf(id: string): Promise<Buffer | null> {
  const { data } = await db().from("site_settings").select("value").eq("key", pdfKey(id)).maybeSingle()
  return data?.value ? Buffer.from(data.value, "base64") : null
}

// Cota diária global (proteção de custo) — mesma tabela de configurações, sem migração.
export async function takeAuditQuota(cap = 500) {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await db().from("site_settings").select("value").eq("key", "audit_usage").maybeSingle()
  let used = 0
  try { const u = JSON.parse(data?.value || "{}"); if (u.date === today) used = Number(u.count) || 0 } catch {}
  if (used >= cap) return false
  await db().from("site_settings").upsert({ key: "audit_usage", value: JSON.stringify({ date: today, count: used + 1 }) }, { onConflict: "key" })
  return true
}

// Auditorias de uma conversa (para o painel de atendimentos). Lê só os metadados, nunca o PDF.
export async function listAuditsForConversation(conversationId: string) {
  const { data } = await db().from("site_settings").select("value").like("key", "audit:%").ilike("value", `%"conversation_id":"${conversationId}"%`)
  const out: Array<{ id: string; url: string; host: string; status: string; score: number | null; created_at: string; summary?: string }> = []
  for (const row of data ?? []) {
    try {
      const s = JSON.parse(row.value) as AuditState
      out.push({ id: s.id, url: s.url, host: s.host, status: s.status, score: s.report?.overall ?? null, created_at: s.created_at, summary: s.summary })
    } catch {}
  }
  return out.sort((a, b) => b.created_at.localeCompare(a.created_at))
}

// Mantém no máximo ~400 auditorias; remove as mais antigas (apenas as sem conversa de lead são removidas primeiro).
export async function pruneAudits(max = 400) {
  const { data } = await db().from("site_settings").select("key").like("key", "audit:%")
  const keys = (data ?? []).map(r => r.key as string)
  if (keys.length <= max) return
  const metas = await db().from("site_settings").select("key,value").in("key", keys)
  const rows = (metas.data ?? []).map(r => { try { const s = JSON.parse(r.value) as AuditState; return { id: s.id, created: s.created_at, lead: !!s.conversation_id } } catch { return null } }).filter(Boolean) as Array<{ id: string; created: string; lead: boolean }>
  rows.sort((a, b) => Number(a.lead) - Number(b.lead) || a.created.localeCompare(b.created))
  const drop = rows.slice(0, rows.length - max)
  if (drop.length) await db().from("site_settings").delete().in("key", drop.flatMap(d => [auditKey(d.id), pdfKey(d.id)]))
}
