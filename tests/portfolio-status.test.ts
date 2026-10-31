import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { getPortfolioStatus, PORTFOLIO_STATUS_LABELS } from "../src/lib/portfolio-status.ts"

describe("status do portfólio", () => {
  it("marca QuiOS como piloto independentemente da capitalização do slug", () => {
    assert.equal(getPortfolioStatus("QuiOS"), "pilot")
    assert.equal(getPortfolioStatus("quios"), "pilot")
  })

  it("não classifica outros projetos nesta alteração de escopo", () => {
    assert.equal(getPortfolioStatus("magia-glass"), null)
    assert.equal(getPortfolioStatus("nascimento-reformas"), null)
  })

  it("usa o rótulo aprovado para piloto", () => {
    assert.equal(PORTFOLIO_STATUS_LABELS.pilot, "Piloto em desenvolvimento")
  })
})
