import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { chooseGroqModel, AUTO_MODEL, COST_EFFICIENT_MODEL, HIGH_CAPABILITY_MODEL } from "../src/lib/core-chat/groq.ts"

describe("Core Chat model selection", () => {
  it("uses the cost-efficient model for ordinary short conversations", () => {
    assert.equal(chooseGroqModel("Olá, vocês fazem sites?"), COST_EFFICIENT_MODEL)
  })

  it("escalates complex requests to the higher-capability model", () => {
    assert.equal(chooseGroqModel("Preciso analisar uma integração de API e arquitetura do projeto."), HIGH_CAPABILITY_MODEL)
  })

  it("recognizes automatic mode as a valid admin configuration", () => {
    assert.equal(AUTO_MODEL, "auto")
  })
})
