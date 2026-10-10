import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type PDFImage, type RGB } from "pdf-lib"
import { CRITERIA, type Report, type Finding } from "./score"
import { LOGO_VM_DARK, LOGO_WORDMARK_DARK, LOGO_WORDMARK_LIGHT, LOGO_VM_LIGHT } from "./logos"

const W = 595.28, H = 841.89, M = 44
const C = { orange: rgb(0.945, 0.353, 0), ink: rgb(0.071, 0.071, 0.071), bg: rgb(0.984, 0.976, 0.965), line: rgb(0.906, 0.89, 0.871), mute: rgb(0.42, 0.42, 0.42), red: rgb(0.85, 0.19, 0.15), amber: rgb(0.91, 0.64, 0.09), green: rgb(0.18, 0.62, 0.36), white: rgb(1, 1, 1), card: rgb(1, 1, 1) }
const fmt = (n: number) => n.toFixed(1).replace(".", ",")
const scoreColor = (n: number): RGB => (n >= 7.5 ? C.green : n >= 5 ? C.amber : C.red)

export async function buildPdf(r: Report): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`Auditoria de site — ${r.host}`); pdf.setAuthor("VireMarca"); pdf.setCreator("VireMarca Auditoria")
  const reg = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const sets = new Map<PDFFont, Set<number>>([[reg, new Set(reg.getCharacterSet())], [bold, new Set(bold.getCharacterSet())]])
  const safe = (s: string, f: PDFFont) => {
    const ok = sets.get(f)!
    return s.replace(/→/g, ">").replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/[ -‏ ]/g, " ").replace(/✓|✔/g, "").split("").map(ch => ok.has(ch.codePointAt(0)!) ? ch : "").join("")
  }
  const img = async (b64: string) => pdf.embedPng(Buffer.from(b64, "base64"))
  const [wmDark, wmLight, vmDark, vmLight]: PDFImage[] = await Promise.all([img(LOGO_WORDMARK_DARK), img(LOGO_WORDMARK_LIGHT), img(LOGO_VM_DARK), img(LOGO_VM_LIGHT)])

  let page!: PDFPage
  let y = 0
  let pageNo = 0
  const pages: PDFPage[] = []
  const lines = (s: string, f: PDFFont, size: number, maxW: number) => {
    const out: string[] = []
    for (const para of safe(s, f).split("\n")) {
      let cur = ""
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const t = cur ? cur + " " + word : word
        if (f.widthOfTextAtSize(t, size) > maxW && cur) { out.push(cur); cur = word } else cur = t
      }
      out.push(cur)
    }
    return out
  }
  const text = (s: string, o: { x?: number; size?: number; font?: PDFFont; color?: RGB; maxW?: number; lh?: number; pg?: PDFPage; yy?: number } = {}) => {
    const f = o.font ?? reg, size = o.size ?? 10, x = o.x ?? M, maxW = o.maxW ?? W - 2 * M, lh = o.lh ?? size * 1.42
    const ls = lines(s, f, size, maxW)
    const p = o.pg ?? page
    let yy = o.yy ?? y
    for (const l of ls) { yy -= lh; p.drawText(l, { x, y: yy + (lh - size) / 2 + size * 0.1, size, font: f, color: o.color ?? C.ink }); }
    if (o.yy === undefined) y = yy
    return ls.length * lh
  }
  const textH = (s: string, size: number, maxW: number, f = reg, lh?: number) => lines(s, f, size, maxW).length * (lh ?? size * 1.42)

  const newPage = (label: string) => {
    page = pdf.addPage([W, H]); pages.push(page); pageNo++
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.bg })
    page.drawText("vire", { x: M, y: H - 42, size: 15, font: bold, color: C.ink })
    page.drawText("marca", { x: M + bold.widthOfTextAtSize("vire", 15), y: H - 42, size: 15, font: bold, color: C.orange })
    const lab = safe(label.toUpperCase(), reg)
    page.drawText(lab, { x: W - M - reg.widthOfTextAtSize(lab, 7.5), y: H - 40, size: 7.5, font: reg, color: C.mute })
    page.drawLine({ start: { x: M, y: H - 52 }, end: { x: W - M, y: H - 52 }, thickness: 1.2, color: C.ink })
    page.drawLine({ start: { x: M, y: 34 }, end: { x: W - M, y: 34 }, thickness: 0.6, color: C.line })
    page.drawText(safe(`VireMarca · Auditoria de site · ${r.host} · viremarca.com.br`, reg), { x: M, y: 22, size: 7, font: reg, color: C.mute })
    const pn = `Página ${pageNo}`
    page.drawText(pn, { x: W - M - reg.widthOfTextAtSize(pn, 7), y: 22, size: 7, font: reg, color: C.mute })
    y = H - 70
  }
  const ensure = (h: number, label = "Auditoria") => { if (y - h < 50) newPage(label + " · " + r.host) }
  const kicker = (k: string, title: string, sub?: string) => {
    text(k.toUpperCase(), { size: 8, font: bold, color: C.orange }); y -= 2
    text(title, { size: 19, font: bold }); y -= 3
    if (sub) { text(sub, { size: 9.5, color: C.mute }); y -= 6 }
  }

  // ---------- CAPA ----------
  page = pdf.addPage([W, H]); pages.push(page); pageNo++
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.ink })
  for (const [rad, op] of [[300, 0.05], [230, 0.07], [160, 0.09]] as const) page.drawCircle({ x: W - 40, y: H - 40, size: rad, color: C.orange, opacity: op })
  const wl = 24
  page.drawText("vire", { x: M, y: H - 54 - wl / 2, size: wl, font: bold, color: rgb(1, 1, 1) })
  page.drawText("marca", { x: M + bold.widthOfTextAtSize("vire", wl), y: H - 54 - wl / 2, size: wl, font: bold, color: C.orange })
  const tag = "AUDITORIA DE SITE · CONFIDENCIAL"
  page.drawText(tag, { x: W - M - reg.widthOfTextAtSize(tag, 7.5), y: H - 62, size: 7.5, font: reg, color: rgb(0.7, 0.7, 0.7) })
  const vw = 110
  page.drawImage(vmDark, { x: (W - vw) / 2, y: H - 330, width: vw, height: vw * (vmDark.height / vmDark.width) })
  page.drawText("RELATÓRIO DE AUDITORIA", { x: M, y: 330, size: 8.5, font: bold, color: C.orange })
  const t1 = lines("Como o seu site é visto, medido e encontrado.", bold, 27, W - 2 * M)
  t1.forEach((l, i) => page.drawText(l, { x: M, y: 296 - i * 32, size: 27, font: bold, color: i === t1.length - 1 ? C.orange : C.white }))
  const sub = "Análise de experiência do visitante, desempenho, SEO, segurança e conversão, com notas por critério e um plano de correção."
  lines(sub, reg, 10.5, W - 2 * M - 40).forEach((l, i) => page.drawText(l, { x: M, y: 296 - t1.length * 32 - 8 - i * 15, size: 10.5, font: reg, color: rgb(0.82, 0.82, 0.82) }))
  page.drawRectangle({ x: M, y: 70, width: W - 2 * M, height: 62, color: rgb(0.11, 0.11, 0.11), borderColor: rgb(0.2, 0.2, 0.2), borderWidth: 0.8 })
  const meta: [string, string][] = [["SITE", r.host], ["DATA", new Date(r.generatedAt).toLocaleDateString("pt-BR")], ["NOTA GERAL", `${fmt(r.overall)} / 10`], ["VEREDITO", r.verdict.split(":")[0]]]
  const cw = (W - 2 * M - 28) / 4
  meta.forEach(([k, v], i) => { const x = M + 14 + i * cw; page.drawText(k, { x, y: 112, size: 6.5, font: reg, color: rgb(0.6, 0.6, 0.6) }); lines(v, bold, 9.5, cw - 8).slice(0, 2).forEach((l, j) => page.drawText(l, { x, y: 96 - j * 12, size: 9.5, font: bold, color: i === 2 ? C.orange : C.white })) })
  page.drawText("VireMarca — sites sob medida · viremarca.com.br · viremarca@gmail.com · (48) 99141-0717", { x: M, y: 40, size: 7.5, font: reg, color: rgb(0.6, 0.6, 0.6) })

  // ---------- RESUMO ----------
  newPage("Resumo executivo · " + r.host)
  kicker("01 — Resumo executivo", "Como o site está hoje", `Auditoria de ${r.url}`)
  y -= 4
  const cy = y - 62, cx = M + 62
  page.drawCircle({ x: cx, y: cy, size: 52, borderColor: C.line, borderWidth: 9, color: C.card })
  const frac = Math.max(0.001, Math.min(0.999, r.overall / 10)), ang = frac * Math.PI * 2, R = 52
  page.drawSvgPath(`M 0 ${-R} A ${R} ${R} 0 ${frac > 0.5 ? 1 : 0} 1 ${(R * Math.sin(ang)).toFixed(2)} ${(-R * Math.cos(ang)).toFixed(2)}`, { x: cx, y: cy, borderColor: scoreColor(r.overall), borderWidth: 9, borderLineCap: 1 })
  const big = fmt(r.overall)
  page.drawText(big, { x: cx - bold.widthOfTextAtSize(big, 26) / 2, y: cy - 5, size: 26, font: bold })
  page.drawText("de 10", { x: cx - reg.widthOfTextAtSize("de 10", 8) / 2, y: cy - 19, size: 8, font: reg, color: C.mute })
  const tx = M + 150, tw = W - M - tx
  let ty = y - 8
  text(r.verdict, { x: tx, yy: ty, size: 13, font: bold, maxW: tw }); ty -= textH(r.verdict, 13, tw, bold)
  const para = r.firstImpression || "Resultado das verificações automáticas de experiência, desempenho, SEO, segurança e conversão feitas no site."
  text(para, { x: tx, yy: ty - 4, size: 9.5, color: C.mute, maxW: tw }); ty -= 4 + textH(para, 9.5, tw)
  ;[["Experiência do visitante", r.pillars.experiencia], ["Técnico e SEO", r.pillars.tecnico]].forEach(([k, v], i) => {
    const yy = ty - 12 - i * 22
    page.drawText(String(k), { x: tx, y: yy, size: 8.5, font: bold }); page.drawText(fmt(v as number), { x: W - M - 20, y: yy, size: 9, font: bold, color: scoreColor(v as number) })
    page.drawRectangle({ x: tx, y: yy - 8, width: tw - 30, height: 4, color: C.line }); page.drawRectangle({ x: tx, y: yy - 8, width: (tw - 30) * ((v as number) / 10), height: 4, color: scoreColor(v as number) })
  })
  y = Math.min(cy - 70, ty - 62) - 4
  const gw = (W - 2 * M - 14) / 2
  r.criteria.forEach((c, i) => {
    const col = i % 2
    if (col === 0) { ensure(78); }
    const x = M + col * (gw + 14), top = y
    const why = c.why || (r.findings.find(f => f.criterion === c.id && f.source === "regra")?.title ?? "Sem ressalvas relevantes nas verificações.")
    const h = 68
    page.drawRectangle({ x, y: top - h, width: gw, height: h, color: C.card, borderColor: C.line, borderWidth: 0.8 })
    page.drawText(safe(c.label, bold), { x: x + 10, y: top - 17, size: 9.5, font: bold })
    const sc = fmt(c.score); page.drawText(sc, { x: x + gw - 10 - bold.widthOfTextAtSize(sc, 14), y: top - 19, size: 14, font: bold, color: scoreColor(c.score) })
    page.drawRectangle({ x: x + 10, y: top - 28, width: gw - 20, height: 4, color: C.line }); page.drawRectangle({ x: x + 10, y: top - 28, width: (gw - 20) * (c.score / 10), height: 4, color: scoreColor(c.score) })
    lines(why, reg, 7.5, gw - 20).slice(0, 3).forEach((l, j) => page.drawText(l, { x: x + 10, y: top - 41 - j * 10, size: 7.5, font: reg, color: C.mute }))
    if (col === 1 || i === r.criteria.length - 1) y -= h + 10
  })

  // ---------- BLOCOS POR PILAR ----------
  const block = (pillar: "experiencia" | "tecnico", k: string, title: string, sub: string) => {
    newPage((pillar === "experiencia" ? "Experiência do visitante" : "Técnico e SEO") + " · " + r.host)
    kicker(k, title, sub); y -= 4
    for (const c of r.criteria.filter(x => x.pillar === pillar)) {
      const q = CRITERIA.find(x => x.id === c.id)!.question
      const checkH = c.checks.length * 11.5
      ensure(46 + checkH + (c.why ? textH(c.why, 8.5, W - 2 * M - 20) : 0))
      page.drawRectangle({ x: M, y: y - 22, width: W - 2 * M, height: 22, color: C.ink })
      page.drawText(safe(c.label, bold), { x: M + 10, y: y - 15, size: 10, font: bold, color: C.white })
      const sc = `${fmt(c.score)} / 10`; page.drawText(sc, { x: W - M - 10 - bold.widthOfTextAtSize(sc, 10), y: y - 15, size: 10, font: bold, color: scoreColor(c.score) === C.red ? rgb(1, 0.5, 0.45) : scoreColor(c.score) === C.amber ? rgb(1, 0.78, 0.35) : rgb(0.5, 0.9, 0.62) })
      y -= 22 + 6
      text(q, { size: 8, color: C.mute, font: reg }); y -= 2
      if (c.why) { text(c.why, { size: 8.5 }); y -= 2 }
      for (const ck of c.checks) {
        const col = ck.status === "pass" ? C.green : ck.status === "warn" ? C.amber : C.red
        page.drawCircle({ x: M + 5, y: y - 6, size: 2.6, color: col })
        text(ck.label + (ck.status === "pass" ? "" : ck.status === "warn" ? " (atenção)" : " (falhou)"), { x: M + 14, size: 8.5, lh: 11.5, color: ck.status === "pass" ? C.ink : col })
      }
      y -= 10
    }
  }
  block("experiencia", "02 — O que o visitante vê", "Experiência do visitante", "Como alguém que chega pelo celular entende, confia e decide entrar em contato.")
  newPage("Técnico e SEO · " + r.host)
  kicker("03 — O que está por trás", "Desempenho, SEO e segurança", "Medições feitas no servidor e pelo Google PageSpeed Insights (celular).")
  y -= 4
  const rows: [string, string][] = [["Primeira resposta do servidor", `${r.metrics.ttfbMs} ms`], ["Tamanho do HTML", `${r.metrics.htmlKb} KB`], ["Palavras na página inicial", String(r.metrics.words)], ["Imagens na página inicial", String(r.metrics.images)], ["Páginas internas testadas", String(r.metrics.internalChecked)]]
  if (r.psi) rows.push(["Google: desempenho (celular)", String(r.psi.performance ?? "n/d")], ["Google: acessibilidade", String(r.psi.accessibility ?? "n/d")], ["Google: boas práticas", String(r.psi.bestPractices ?? "n/d")], ["Google: SEO", String(r.psi.seo ?? "n/d")], ["Maior conteúdo visível (LCP)", r.psi.lcpMs != null ? `${(r.psi.lcpMs / 1000).toFixed(1).replace(".", ",")} s` : "n/d"], ["Bloqueio de interação (TBT)", r.psi.tbtMs != null ? `${Math.round(r.psi.tbtMs)} ms` : "n/d"], ["Estabilidade visual (CLS)", r.psi.cls != null ? r.psi.cls.toFixed(2).replace(".", ",") : "n/d"])
  const half = (W - 2 * M - 12) / 2
  page.drawRectangle({ x: M, y: y - 16, width: W - 2 * M, height: 16, color: C.ink })
  page.drawText("MEDIÇÃO", { x: M + 8, y: y - 11, size: 7.5, font: bold, color: C.white }); page.drawText("RESULTADO", { x: M + half + 20, y: y - 11, size: 7.5, font: bold, color: C.white })
  y -= 16
  rows.forEach(([k, v], i) => { page.drawRectangle({ x: M, y: y - 16, width: W - 2 * M, height: 16, color: i % 2 ? C.bg : C.card, borderColor: C.line, borderWidth: 0.4 }); page.drawText(safe(k, reg), { x: M + 8, y: y - 11, size: 8.5, font: reg }); page.drawText(safe(v, bold), { x: M + half + 20, y: y - 11, size: 8.5, font: bold }); y -= 16 })
  y -= 14
  for (const c of r.criteria.filter(x => x.pillar === "tecnico")) {
    const q = CRITERIA.find(x => x.id === c.id)!.question
    ensure(46 + c.checks.length * 11.5 + (c.why ? textH(c.why, 8.5, W - 2 * M - 20) : 0))
    page.drawRectangle({ x: M, y: y - 22, width: W - 2 * M, height: 22, color: C.ink })
    page.drawText(safe(c.label, bold), { x: M + 10, y: y - 15, size: 10, font: bold, color: C.white })
    const sc = `${fmt(c.score)} / 10`; page.drawText(sc, { x: W - M - 10 - bold.widthOfTextAtSize(sc, 10), y: y - 15, size: 10, font: bold, color: scoreColor(c.score) === C.red ? rgb(1, 0.5, 0.45) : scoreColor(c.score) === C.amber ? rgb(1, 0.78, 0.35) : rgb(0.5, 0.9, 0.62) })
    y -= 28
    text(q, { size: 8, color: C.mute }); y -= 2
    if (c.why) { text(c.why, { size: 8.5 }); y -= 2 }
    for (const ck of c.checks) {
      const col = ck.status === "pass" ? C.green : ck.status === "warn" ? C.amber : C.red
      page.drawCircle({ x: M + 5, y: y - 6, size: 2.6, color: col })
      text(ck.label + (ck.status === "pass" ? "" : ck.status === "warn" ? " (atenção)" : " (falhou)"), { x: M + 14, size: 8.5, lh: 11.5, color: ck.status === "pass" ? C.ink : col })
    }
    y -= 10
  }

  // ---------- ACHADOS ----------
  newPage("Achados · " + r.host)
  kicker("04 — Achados priorizados", "O que mais pesa na nota", "Vermelho: crítico. Âmbar: atenção. Cada item traz a evidência encontrada e como corrigir.")
  y -= 4
  const list: Finding[] = r.findings.filter(x => x.severity !== "info").slice(0, 22)
  list.forEach((fd, i) => {
    const col = fd.severity === "critico" ? C.red : C.amber
    const bw = W - 2 * M - 22
    const hh = 16 + textH(fd.title, 10, bw, bold) + (fd.evidence ? textH("Evidência: " + fd.evidence, 8.5, bw) : 0) + (fd.impact ? textH("Impacto: " + fd.impact, 8.5, bw) : 0) + textH("Como corrigir: " + fd.fix, 8.5, bw) + 8
    ensure(hh + 8)
    page.drawRectangle({ x: M, y: y - hh, width: W - 2 * M, height: hh, color: C.card, borderColor: C.line, borderWidth: 0.6 })
    page.drawRectangle({ x: M, y: y - hh, width: 4, height: hh, color: col })
    const top = y; y -= 6
    text(`${i + 1}. ${fd.title}`, { x: M + 14, size: 10, font: bold, maxW: bw })
    if (fd.evidence) text("Evidência: " + fd.evidence, { x: M + 14, size: 8.5, color: C.mute, maxW: bw })
    if (fd.impact) text("Impacto: " + fd.impact, { x: M + 14, size: 8.5, maxW: bw })
    text("Como corrigir: " + fd.fix, { x: M + 14, size: 8.5, font: bold, color: C.ink, maxW: bw })
    y = top - hh - 8
  })
  if (!list.length) text("Nenhum problema relevante foi encontrado nas verificações automáticas.", { size: 10 })

  // ---------- PLANO ----------
  newPage("Plano de ação · " + r.host)
  kicker("05 — Plano de ação", "O que já funciona e o que fazer primeiro")
  y -= 6
  text("O QUE JÁ FUNCIONA BEM", { size: 8, font: bold, color: C.green }); y -= 3
  ;(r.strengths.length ? r.strengths : ["Nenhum ponto forte se destacou nas verificações automáticas."]).forEach(s => { page.drawCircle({ x: M + 4, y: y - 7, size: 2.6, color: C.green }); text(s, { x: M + 14, size: 9.5, maxW: W - 2 * M - 14 }) })
  y -= 12
  const steps = (title: string, tag: string, arr: string[], col: RGB) => {
    if (!arr.length) return
    ensure(40); text(title, { size: 8, font: bold, color: col }); y -= 1; text(tag, { size: 8.5, color: C.mute }); y -= 4
    arr.forEach((s, i) => { ensure(textH(s, 9.5, W - 2 * M - 30) + 8); const top = y; page.drawCircle({ x: M + 9, y: top - 11, size: 8, color: C.ink }); page.drawText(String(i + 1), { x: M + 9 - bold.widthOfTextAtSize(String(i + 1), 8) / 2, y: top - 14, size: 8, font: bold, color: C.white }); text(s, { x: M + 26, size: 9.5, maxW: W - 2 * M - 26 }); y -= 5 })
    y -= 8
  }
  steps("COMEÇAR POR AQUI", "Ações rápidas, de maior impacto e menor esforço.", r.quickWins, C.orange)
  steps("EM SEGUIDA", "Melhorias estruturais para consolidar o resultado.", r.structural, C.ink)

  // ---------- METODOLOGIA + CONTRACAPA ----------
  ensure(190)
  y -= 6
  text("COMO AVALIAMOS", { size: 8, font: bold, color: C.orange }); y -= 2
  text("Dez critérios em dois grupos, com pesos diferentes na nota geral: " + CRITERIA.map(c => `${c.label} (${c.weight}%)`).join(", ") + ".", { size: 8.5, color: C.mute }); y -= 6
  text("LIMITES DESTA AUDITORIA", { size: 8, font: bold, color: C.orange }); y -= 2
  r.limits.forEach(l => { page.drawCircle({ x: M + 4, y: y - 6.5, size: 2, color: C.mute }); text(l, { x: M + 14, size: 8, color: C.mute, maxW: W - 2 * M - 14 }) })
  y -= 14
  ensure(96)
  page.drawRectangle({ x: M, y: y - 84, width: W - 2 * M, height: 84, color: C.ink })
  page.drawImage(vmLight === vmLight ? vmDark : vmDark, { x: M + 16, y: y - 60, width: 56, height: 56 * (vmDark.height / vmDark.width) })
  text("Quer corrigir isso com quem entende?", { x: M + 90, yy: y - 8, size: 12.5, font: bold, color: C.white, maxW: W - 2 * M - 106 })
  text("A VireMarca transforma este diagnóstico em um plano e cuida da execução. Fale com a equipe:", { x: M + 90, yy: y - 28, size: 8.5, color: rgb(0.82, 0.82, 0.82), maxW: W - 2 * M - 106 })
  page.drawText("WhatsApp (48) 99141-0717  ·  viremarca@gmail.com  ·  viremarca.com.br", { x: M + 90, y: y - 70, size: 9, font: bold, color: C.orange })
  return pdf.save()
}
