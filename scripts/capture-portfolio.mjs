// Captura o topo de cada site do portfólio e grava em public/portfolio/capturas.
// Roda no GitHub Actions (com internet). Uso: node scripts/capture-portfolio.mjs
import { chromium } from "playwright"
import { mkdirSync, writeFileSync } from "node:fs"

const BASE = "https://www.viremarca.com.br"
const SLUGS = ["nascimento-reformas", "Vidraçaria", "Corretor", "imoveis", "TSI", "odonto"]
const ascii = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
const out = "public/portfolio/capturas"
mkdirSync(out, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: "pt-BR" })
const manifest = {}
for (const slug of SLUGS) {
  try {
    const page = await ctx.newPage()
    await page.goto(`${BASE}/portfolio/${encodeURIComponent(slug)}`, { waitUntil: "networkidle", timeout: 60000 })
    const target = await page.evaluate(() => {
      const f = document.querySelector("iframe[src^='http']")
      if (f) return f.src
      const a = [...document.querySelectorAll("a[target='_blank'][href^='http']")].find((x) => !x.href.includes("wa.me") && !x.href.includes("viremarca.com.br"))
      return a ? a.href : null
    })
    await page.close()
    if (!target) { console.log("sem URL:", slug); continue }
    console.log(slug, "->", target)
    const shot = await ctx.newPage()
    await shot.goto(target, { waitUntil: "networkidle", timeout: 60000 })
    await shot.waitForTimeout(2500)
    for (const sel of ["button:has-text('Recusar')", "button:has-text('Aceitar')"]) {
      const b = shot.locator(sel).first()
      if (await b.count()) { await b.click({ timeout: 1500 }).catch(() => {}); break }
    }
    await shot.waitForTimeout(800)
    const file = `${ascii(slug)}.jpg`
    await shot.screenshot({ path: `${out}/${file}`, type: "jpeg", quality: 82 })
    manifest[slug] = `/portfolio/capturas/${file}`
    await shot.close()
  } catch (e) { console.log("falhou:", slug, String(e).slice(0, 160)) }
}
await browser.close()
writeFileSync("src/lib/captures.json", JSON.stringify(manifest, null, 2) + "\n")
console.log("capturas:", Object.keys(manifest).length)
