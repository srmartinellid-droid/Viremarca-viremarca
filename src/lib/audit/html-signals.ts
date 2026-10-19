// Funções puras sobre o HTML (sem dependências), testáveis sem rede.

/** Imagem com dimensões reservadas por outro meio: next/image `fill`, posicionamento absoluto ou aspect-ratio. */
export function imageHasReservedSpace(attrs: Record<string, string | undefined>): boolean {
  if (attrs["width"] && attrs["height"]) return true
  if (attrs["data-nimg"] === "fill") return true
  return /aspect-ratio|position:\s*absolute|inset:\s*0|\bfill\b/i.test(attrs["style"] || "")
}
