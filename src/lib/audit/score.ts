import type { Facts } from "./collect"
import type { Psi } from "./psi"
import { CAPS, CONFIDENCE, COVERAGE, CRITERIA, FORBIDDEN_AI, POLICY_VERSION, SCOPE_STATEMENT, STATUS_VALUE, VERDICTS } from "./policy.ts"
import { ruleChecks } from "./rules.ts"
import type { AiNotes, AppliedCap, Check, Confidence, CriterionId, CriterionResult, Finding, Report, Untested } from "./types"

export { CRITERIA } from "./policy.ts"
export { ruleChecks } from "./rules.ts"
export type * from "./types"

const r1 = (n: number) => Math.round(n * 10) / 10
const clamp = (n: number, lo = 0, hi = 10) => Math.max(lo, Math.min(hi, n))
const fmt = (n: number) => String(r1(n)).replace(".", ",")

export function verdictFor(n: number) {
  return (VERDICTS.find(v => n >= v.min) ?? VERDICTS[VERDICTS.length - 1]).label
}

/** Texto de IA só entra se for curto, sem números, sem consequências não provadas e sem opinião visual. */
export function cleanAiText(s: unknown, max = 280): string | null {
  if (typeof s !== "string") return null
  const t = s.replace(/\s+/g, " ").trim()
  if (t.length < 20 || t.length > max || FORBIDDEN_AI.test(t)) return null
  return t
}

type Scored = { id: CriterionId; label: string; pillar: "experiencia" | "tecnico"; weight: number; score: number | null; coverage: number; partial: boolean; checks: Check[] }

export function scoreCriterion(id: CriterionId, checks: Check[]): Scored {
  const c = CRITERIA.find(x => x.id === id)!
  const total = checks.reduce((s, x) => s + x.w, 0) || 1
  const tested = checks.filter(x => x.status !== "untested")
  const tw = tested.reduce((s, x) => s + x.w, 0)
  const coverage = tw / total
  if (!tested.length) return { id, label: c.label, pillar: c.pillar, weight: c.weight, score: null, coverage: 0, partial: true, checks }
  const raw = 10 * tested.reduce((s, x) => s + x.w * STATUS_VALUE[x.status as keyof typeof STATUS_VALUE], 0) / tw
  const requiredMissing = COVERAGE.requiredMissingPartial && checks.some(x => x.required && x.status === "untested")
  const partial = coverage < COVERAGE.minFull || requiredMissing
  return { id, label: c.label, pillar: c.pillar, weight: c.weight, score: r1(partial ? Math.min(raw, COVERAGE.partialCap) : raw), coverage, partial, checks }
}

function summarize(s: Scored): string {
  const t = s.checks.filter(x => x.status !== "untested")
  const ok = t.filter(x => x.status === "pass").length
  const warn = t.filter(x => x.status === "warn").map(x => x.label)
  const fail = t.filter(x => x.status === "fail").map(x => x.label)
  const nt = s.checks.length - t.length
  return [
    t.length ? `${ok} de ${t.length} verificações ok.` : "Nenhuma verificação pôde ser feita.",
    fail.length ? `Falha: ${fail.join("; ")}.` : "",
    warn.length ? `Em atenção: ${warn.join("; ")}.` : "",
    nt ? `${nt} não testada${nt > 1 ? "s" : ""}.` : "",
    s.partial && t.length ? "Critério parcial: falta uma medição essencial ou a cobertura é baixa; nota limitada." : "",
  ].filter(Boolean).join(" ")
}

export function buildReport(f: Facts, psi: Psi | null, ai: AiNotes | null, now = new Date(), psiError: string | null = null): Report {
  const checks = ruleChecks(f, psi, psiError)
  const scored = CRITERIA.map(c => scoreCriterion(c.id, checks[c.id]))
  const withScore = scored.filter((s): s is Scored & { score: number } => s.score != null)
  const wsum = withScore.reduce((s, x) => s + x.weight, 0) || 1
  const mean = (list: typeof withScore) => list.length ? list.reduce((s, x) => s + x.weight * x.score, 0) / list.reduce((s, x) => s + x.weight, 0) : null

  const caps: AppliedCap[] = []
  for (const list of Object.values(checks)) for (const x of list) if (x.gate && x.status === "fail" && !caps.some(k => k.id === x.gate)) caps.push({ id: x.gate, label: CAPS[x.gate].label, limit: CAPS[x.gate].limit })
  const capLimit = caps.length ? Math.min(...caps.map(k => k.limit)) : 10
  const overall = r1(Math.min(withScore.reduce((s, x) => s + x.weight * x.score, 0) / wsum, capLimit))

  const coverageAll = scored.reduce((s, x) => s + x.weight * x.coverage, 0) / scored.reduce((s, x) => s + x.weight, 0)
  const confidence: Confidence = coverageAll >= CONFIDENCE.alta.minCoverage && psi ? "alta" : coverageAll >= CONFIDENCE.media.minCoverage ? "media" : "baixa"
  const m = CONFIDENCE[confidence].margin
  const range = { low: r1(clamp(overall - m)), high: r1(Math.min(clamp(overall + m), capLimit)) }

  const notes = ai?.notes ?? {}
  const criteria: CriterionResult[] = scored.map(s => ({
    id: s.id, label: s.label, pillar: s.pillar, weight: s.weight, score: s.score, coverage: Math.round(s.coverage * 100) / 100, partial: s.partial,
    summary: summarize(s), aiNote: cleanAiText(notes[s.id]),
    checks: s.checks.map(x => ({ label: x.label, status: x.status })),
  }))

  const strengths: string[] = []
  const untested: Untested[] = []
  const draft: { f: Finding; key: number }[] = []
  const cw = (id: CriterionId) => CRITERIA.find(c => c.id === id)!.weight
  for (const c of CRITERIA) for (const x of checks[c.id]) {
    if (x.status === "untested") { untested.push({ criterion: c.id, label: x.label, reason: x.reason ?? "Não foi possível medir." }); continue }
    if (x.status === "pass") { if (x.strength) strengths.push(x.strength); continue }
    draft.push({ key: x.w * cw(c.id), f: { id: `${c.id}:${x.id}`, kind: x.kind, criterion: c.id, title: x.title, evidence: x.evidence, howTo: x.howTo, fix: x.fix, ref: x.ref, effort: x.effort ?? "rapido", level: x.status === "fail" ? "falha" : "atencao" } })
  }
  const kindRank = { defeito: 0, recomendacao: 1, oportunidade: 2 } as const
  draft.sort((a, b) => kindRank[a.f.kind] - kindRank[b.f.kind] || Number(a.f.level === "atencao") - Number(b.f.level === "atencao") || b.key - a.key)
  const findings = draft.map(d => d.f)

  const plan = findings.filter(x => x.kind !== "oportunidade")
  const quickWins = [...new Set(plan.filter(x => x.effort === "rapido").map(x => x.fix))].slice(0, 6)
  const structural = [...new Set(plan.filter(x => x.effort === "estrutural" || !quickWins.includes(x.fix)).map(x => x.fix))].filter(x => !quickWins.includes(x)).slice(0, 6)

  const when = now.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
  const limits = [
    `Auditoria automática feita em ${when} a partir do que é visível ao público. ${SCOPE_STATEMENT}`,
    psi ? "Desempenho e acessibilidade foram medidos pelo PageSpeed Insights (celular), que varia entre medições." : `O PageSpeed Insights não respondeu${psiError ? ` (${psiError})` : ""}: os itens que dependem dele aparecem como “não testados”, os critérios afetados ficam “parciais” e a confiança da nota cai.`,
    ai ? "Os comentários em texto foram redigidos por IA a partir dos resultados acima e não alteram nenhuma nota." : "Os comentários em texto automáticos foram gerados por regras; a IA não esteve disponível.",
    ...f.warnings,
  ]
  const formula = `Cada verificação vale ok = 1, atenção = 0,5, falha = 0; as não testadas ficam fora. Nota do critério = 10 × soma(peso × valor) ÷ soma dos pesos testados. Nota geral = média dos critérios ponderada pelos pesos da política ${POLICY_VERSION}. Critérios com menos de ${Math.round(COVERAGE.minFull * 100)}% de cobertura, ou sem uma medição essencial (como o PageSpeed), são limitados a ${COVERAGE.partialCap}. Falhas objetivas aplicam tetos${caps.length ? ` (aplicado: ${caps.map(k => `${k.label} → máx. ${fmt(k.limit)}`).join("; ")})` : " (nenhum aplicado)"}.`

  return {
    policyVersion: POLICY_VERSION, url: f.url, host: f.host, generatedAt: now.toISOString(),
    overall, range, confidence, verdict: verdictFor(overall), caps, formula,
    pillars: { experiencia: mean(withScore.filter(x => x.pillar === "experiencia")) == null ? null : r1(mean(withScore.filter(x => x.pillar === "experiencia"))!), tecnico: mean(withScore.filter(x => x.pillar === "tecnico")) == null ? null : r1(mean(withScore.filter(x => x.pillar === "tecnico"))!) },
    criteria, findings, strengths: [...new Set(strengths)].slice(0, 10), untested, quickWins, structural, psi,
    firstImpression: cleanAiText(ai?.first_impression, 420), aiUsed: !!ai, limits,
    metrics: { ttfbMs: f.ttfbMs, ttfbSamples: f.ttfbSamples, htmlCache: f.headers.cache, htmlKb: Math.round(f.htmlBytes / 1024), words: f.text.words, images: f.images.total, internalChecked: f.links.checked },
  }
}

export function chatSummary(r: Report) {
  const top = r.findings.filter(x => x.kind !== "oportunidade").slice(0, 3).map(x => "• " + x.title)
  const good = r.strengths.slice(0, 2).map(x => "• " + x)
  const conf = { alta: "alta", media: "média", baixa: "baixa" }[r.confidence]
  return [
    `Pronto! Esta é uma análise automática preliminar de ${r.host}: nota ${fmt(r.overall)}/10, com faixa provável de ${fmt(r.range.low)} a ${fmt(r.range.high)} e confiança ${conf}. Leitura: ${r.verdict}.`,
    good.length ? "O que já funciona:\n" + good.join("\n") : "",
    top.length ? "Pontos para conferir primeiro:\n" + top.join("\n") : "",
    r.untested.length ? `${r.untested.length} verificação(ões) não puderam ser feitas e estão listadas no relatório.` : "",
    "No PDF, cada ponto mostra a evidência e como conferir por conta própria. É uma auditoria técnica simples: lê só o que é público e não substitui a análise de um profissional.",
  ].filter(Boolean).join("\n\n")
}
