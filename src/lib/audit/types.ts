import type { Psi } from "./psi"

export type CriterionId = "clareza" | "navegacao" | "confianca" | "conversao" | "conteudo" | "desempenho" | "mobile" | "seo" | "seguranca" | "presenca"
export type Pillar = "experiencia" | "tecnico"
export type Status = "pass" | "warn" | "fail" | "untested"
/** Defeito = falha objetiva. Recomendação = boa prática. Oportunidade = depende do negócio. */
export type FindingKind = "defeito" | "recomendacao" | "oportunidade"
export type Confidence = "alta" | "media" | "baixa"
export type GateId = "https" | "noindex" | "robots" | "viewport" | "links"

export type Check = {
  id: string; label: string; status: Status; w: number; kind: FindingKind
  title: string; evidence: string; howTo: string; fix: string; ref?: string
  strength?: string; effort?: "rapido" | "estrutural"; gate?: GateId
  /** Motivo, quando status = untested. */
  reason?: string
}

export type Finding = { id: string; kind: FindingKind; criterion: CriterionId; title: string; evidence: string; howTo: string; fix: string; ref?: string; effort: "rapido" | "estrutural"; level: "falha" | "atencao" }
export type CriterionResult = {
  id: CriterionId; label: string; pillar: Pillar; weight: number
  score: number | null; coverage: number; partial: boolean
  summary: string; aiNote: string | null
  checks: { label: string; status: Status }[]
}
export type Untested = { criterion: CriterionId; label: string; reason: string }
export type AppliedCap = { id: GateId; label: string; limit: number }

export type Report = {
  policyVersion: string
  url: string; host: string; generatedAt: string
  overall: number; range: { low: number; high: number }; confidence: Confidence; verdict: string
  caps: AppliedCap[]; formula: string
  pillars: { experiencia: number | null; tecnico: number | null }
  criteria: CriterionResult[]; findings: Finding[]; strengths: string[]; untested: Untested[]
  quickWins: string[]; structural: string[]
  psi: Psi | null; firstImpression: string | null; aiUsed: boolean; limits: string[]
  metrics: { ttfbMs: number; ttfbSamples: number[]; htmlKb: number; words: number; images: number; internalChecked: number }
}

export type AiNotes = { notes?: Partial<Record<CriterionId, string>>; first_impression?: string }
