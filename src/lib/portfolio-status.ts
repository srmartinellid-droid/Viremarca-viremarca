export type PortfolioStatus = "pilot"

/** Status explicitly approved for the QuiOS portfolio entry only. */
export function getPortfolioStatus(slug: string): PortfolioStatus | null {
  return slug.trim().toLowerCase() === "quios" ? "pilot" : null
}

export const PORTFOLIO_STATUS_LABELS: Record<PortfolioStatus, string> = {
  pilot: "Piloto em desenvolvimento",
}
