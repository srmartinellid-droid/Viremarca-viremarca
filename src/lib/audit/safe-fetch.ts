import { lookup } from "node:dns/promises"
import { isIP } from "node:net"

// Fetch seguro para auditoria: só http/https, bloqueia rede interna (SSRF), limita redirects, tempo e tamanho.
function privateIp(ip: string) {
  if (ip.includes(":")) {
    const v = ip.toLowerCase()
    return v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:127.") || v.startsWith("::ffff:10.") || v.startsWith("::ffff:192.168.") || v === "::"
  }
  const [a, b] = ip.split(".").map(Number)
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
}

export async function assertPublicUrl(raw: string): Promise<URL> {
  let u: URL
  try { u = new URL(raw) } catch { throw new Error("Endereço inválido.") }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("Só é possível auditar endereços http ou https.")
  if (u.username || u.password) throw new Error("Endereço inválido.")
  const host = u.hostname.toLowerCase()
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || !host.includes(".") && !isIP(host)) throw new Error("Esse endereço não é um site público.")
  if (isIP(host)) { if (privateIp(host)) throw new Error("Esse endereço não é um site público."); return u }
  const addrs = await lookup(host, { all: true }).catch(() => { throw new Error("Não encontrei esse endereço na internet. Confira se está escrito certo.") })
  if (!addrs.length || addrs.some(a => privateIp(a.address))) throw new Error("Esse endereço não é um site público.")
  return u
}

export type FetchResult = { url: string; status: number; headers: Record<string, string>; body: string; bytes: number; ttfbMs: number; totalMs: number; redirects: string[]; truncated: boolean }

export async function safeFetch(raw: string, opts: { maxBytes?: number; timeoutMs?: number; method?: "GET" | "HEAD"; maxRedirects?: number } = {}): Promise<FetchResult> {
  const maxBytes = opts.maxBytes ?? 1_500_000
  const timeoutMs = opts.timeoutMs ?? 9000
  const maxRedirects = opts.maxRedirects ?? 5
  const redirects: string[] = []
  let current = raw
  const t0 = Date.now()
  for (let i = 0; i <= maxRedirects; i++) {
    const u = await assertPublicUrl(current)
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    const t1 = Date.now()
    let res: Response
    try {
      res = await fetch(u.toString(), { method: opts.method ?? "GET", redirect: "manual", signal: ctrl.signal, headers: { "User-Agent": "VireMarcaAuditBot/1.0 (+https://www.viremarca.com.br)", Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.5", "Accept-Language": "pt-BR,pt;q=0.9", "Accept-Encoding": "gzip, br" }, cache: "no-store" })
    } catch (e) {
      clearTimeout(timer)
      throw new Error(ctrl.signal.aborted ? "O site demorou demais para responder." : "Não consegui acessar o site.")
    }
    const ttfbMs = Date.now() - t1
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      clearTimeout(timer)
      redirects.push(`${res.status} ${u.toString()}`)
      current = new URL(res.headers.get("location")!, u).toString()
      continue
    }
    const headers: Record<string, string> = {}
    res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v })
    let body = ""
    let bytes = 0
    let truncated = false
    if ((opts.method ?? "GET") === "GET" && res.body) {
      const reader = res.body.getReader()
      const chunks: Uint8Array[] = []
      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          bytes += value.length
          if (bytes > maxBytes) { truncated = true; chunks.push(value.slice(0, value.length - (bytes - maxBytes))); bytes = maxBytes; await reader.cancel().catch(() => {}); break }
          chunks.push(value)
        }
      } catch { /* leitura interrompida: usa o que veio */ }
      body = Buffer.concat(chunks).toString("utf8")
    }
    clearTimeout(timer)
    return { url: u.toString(), status: res.status, headers, body, bytes, ttfbMs, totalMs: Date.now() - t0, redirects, truncated }
  }
  throw new Error("O site redireciona em excesso.")
}
