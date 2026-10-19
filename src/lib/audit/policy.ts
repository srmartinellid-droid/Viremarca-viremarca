import type { Confidence, CriterionId, GateId, Pillar } from "./types"

/**
 * Política única do motor. Pesos, limiares, tetos e textos de escopo vivem aqui.
 * Mudou a política? Sobe POLICY_VERSION: o número aparece no relatório.
 */
export const POLICY_VERSION = "2.0"

export const CRITERIA: { id: CriterionId; label: string; pillar: Pillar; weight: number; question: string }[] = [
  { id: "clareza", label: "Clareza da proposta", pillar: "experiencia", weight: 12, question: "A página inicial deixa claro o que a empresa faz e qual é o próximo passo?" },
  { id: "navegacao", label: "Navegação e estrutura", pillar: "experiencia", weight: 8, question: "Há caminhos claros entre as páginas e elas respondem sem erro?" },
  { id: "confianca", label: "Confiança e credibilidade", pillar: "experiencia", weight: 12, question: "O site mostra quem está por trás, como falar e como os dados são tratados?" },
  { id: "conversao", label: "Conversão e contato", pillar: "experiencia", weight: 14, question: "Há canais de contato visíveis e fáceis de usar?" },
  { id: "conteudo", label: "Conteúdo", pillar: "experiencia", weight: 8, question: "Há texto e imagens suficientes para explicar o negócio?" },
  { id: "desempenho", label: "Desempenho", pillar: "tecnico", weight: 12, question: "As medições de velocidade estão dentro de faixas recomendadas?" },
  { id: "mobile", label: "Experiência no celular", pillar: "tecnico", weight: 8, question: "A página está preparada e estável para telas pequenas?" },
  { id: "seo", label: "SEO e indexação", pillar: "tecnico", weight: 12, question: "Os sinais técnicos básicos para buscadores estão presentes?" },
  { id: "seguranca", label: "Segurança e acessibilidade", pillar: "tecnico", weight: 8, question: "As proteções básicas de conexão e as práticas de acessibilidade estão presentes?" },
  { id: "presenca", label: "Compartilhamento e presença", pillar: "tecnico", weight: 6, question: "O link aparece bem ao ser compartilhado e há dados de empresa para buscas locais?" },
]

export const STATUS_VALUE = { pass: 1, warn: 0.5, fail: 0 } as const

export const COVERAGE = {
  /** Abaixo disso o critério é "parcial". */
  minFull: 0.75,
  /** Também vira "parcial" quando uma verificação obrigatória não foi testada. */
  requiredMissingPartial: true,
  /** Nota máxima de um critério parcial. */
  partialCap: 8,
}

/** Tetos de integridade: só falhas objetivamente medidas. */
export const CAPS: Record<GateId, { limit: number; label: string }> = {
  https: { limit: 4.9, label: "Site sem HTTPS" },
  noindex: { limit: 5.9, label: "Página inicial bloqueada para indexação (noindex)" },
  robots: { limit: 5.9, label: "robots.txt bloqueia todo o site" },
  viewport: { limit: 7.4, label: "Sem meta viewport para celular" },
  links: { limit: 7.4, label: "Links internos quebrados na amostra" },
}

export const CONFIDENCE: Record<Confidence, { minCoverage: number; margin: number; label: string }> = {
  alta: { minCoverage: 0.85, margin: 0.3, label: "alta" },
  media: { minCoverage: 0.6, margin: 0.6, label: "média" },
  baixa: { minCoverage: 0, margin: 1, label: "baixa" },
}

export const VERDICTS: { min: number; label: string }[] = [
  { min: 8.5, label: "Base técnica sólida" },
  { min: 7, label: "Boa, com pontos a melhorar" },
  { min: 5.5, label: "Regular: há pontos importantes a tratar" },
  { min: 4, label: "Fraca: vários pontos a corrigir" },
  { min: 0, label: "Crítica: pontos básicos ausentes" },
]

/** Limiares das medições (referências públicas: web.dev / Google). */
export const THRESHOLDS = {
  ttfbGoodMs: 800, ttfbWarnMs: 1800, ttfbUnstableRatio: 3,
  htmlWarnBytes: 200_000, htmlFailBytes: 500_000,
  titleMin: 25, titleMax: 65, descMin: 80, descMax: 175,
  wordsGood: 300, wordsWarn: 150,
  imgDimsWarnShare: 0.3, altGood: 0.9, altWarn: 0.5,
  thirdPartyMax: 5,
  staticCacheMinSeconds: 2_592_000, // 30 dias
  psiGood: 90, psiWarn: 50, psiSeoWarn: 70,
  clsGood: 0.1, clsWarn: 0.25, lcpGoodMs: 2500, lcpWarnMs: 4000,
}

export const SCOPE_STATEMENT = "Auditoria técnica simples. Lê o que é público no site e mede o que é mensurável. Cada item indica como conferir. Não avalia visual nem concorrência, não prevê resultados de vendas ou tráfego e não substitui a análise de um profissional."

/** Trechos que o texto gerado por IA não pode conter (consequências não provadas, visual, comparações, números). */
export const FORBIDDEN_AI = /\d|\b(clar[ao]s?|bem|bom|boa|boas|bons|[óo]tim[ao]s?|excelente|adequad[ao]s?|corret[ao]s?(mente)?|correta?mente|relevantes?|imediat[ao]s?|posicionad[ao]s?|eficientes?|profissionais?|atrativ[ao]s?|intuitiv[ao]s?|facilita(m|ndo)?|melhor(es)?|ideal|ideais|fort(e|es)|fracos?|robust[ao]s?|sólid[ao]s?|solid[ao]s?|agrad[aá]ve(l|is)|convincentes?)\b|perd(e|em|a|endo|er)\b|clientes?\b|ranking|posi[cç][aã]o|vend(a|as|er|e)\b|faturamento|dinheiro|concorr|urgente|cr[ií]tic|fatal|grave|garant|certeza|design|\bcor(es)?\b|tipografia|layout|espa[cç]amento|visual|contra[sz]te|nota\b|redis|cloudflare|wordpress|wp[- ]?rocket/i
