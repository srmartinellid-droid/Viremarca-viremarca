#!/usr/bin/env node

const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const base = (getArg("--base") || "").replace(/\/$/, "");
const expectedSha = getArg("--sha");
const strict = args.includes("--strict");

if (!base || !expectedSha) {
  console.error("Uso: npm run seo:gate -- --base https://www.viremarca.com.br --sha <commit> [--strict]");
  process.exit(1);
}

const failures = [];
const notes = [];
const pass = (message) => console.log("PASS  " + message);
const fail = (message) => { console.error("FAIL  " + message); failures.push(message); };
const note = (message) => { console.log("INFO  " + message); notes.push(message); };

async function request(url, options = {}) {
  return fetch(url, { redirect: "manual", ...options });
}

async function follow(url, maxHops = 5) {
  const chain = [];
  let current = url;
  for (let i = 0; i <= maxHops; i++) {
    const response = await fetch(current, { redirect: "manual" });
    chain.push({ url: current, status: response.status, location: response.headers.get("location") });
    if (response.status < 300 || response.status >= 400) {
      return { response, chain, finalUrl: current };
    }
    const location = response.headers.get("location");
    if (!location) throw new Error("redirect sem Location em " + current);
    current = new URL(location, current).toString();
  }
  throw new Error("redirect loop/excesso de hops em " + url);
}

function parseSitemap(xml) {
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (!urls.length) throw new Error("sitemap sem <loc>");
  return urls;
}

function canonicalValues(html) {
  return [...html.matchAll(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi)].map((m) => {
    const href = m[0].match(/\bhref=["']([^"']+)["']/i);
    return href?.[1] || "";
  });
}

function hasNoindex(html, headers) {
  const header = headers.get("x-robots-tag") || "";
  const meta = [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map((m) => m[0])
    .find((tag) => /\bname=["']robots["']/i.test(tag) && /noindex/i.test(tag));
  return /noindex/i.test(header) || Boolean(meta);
}

function countH1(html) {
  return [...html.matchAll(/<h1\b[^>]*>/gi)].length;
}

function sameSet(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

async function check() {
  console.log("SEO RELEASE GATE");
  console.log("base: " + base);
  console.log("expected sha: " + expectedSha);
  console.log("");

  try {
    const build = await request(base + "/build-info.json");
    if (build.status !== 200) fail("GET /build-info.json -> " + build.status);
    else {
      const data = await build.json();
      if (data.commit !== expectedSha) fail("/build-info.json commit " + data.commit + " != " + expectedSha);
      else pass("/build-info.json commit = expected SHA");
    }
  } catch (e) { fail("GET /build-info.json: " + e.message); }

  let sitemapUrls = [];
  try {
    const robots = await request(base + "/robots.txt");
    const text = await robots.text();
    if (robots.status !== 200) fail("GET /robots.txt -> " + robots.status);
    else {
      for (const required of [
        "Sitemap: https://www.viremarca.com.br/sitemap.xml",
        "Disallow: /admin",
        "Disallow: /api/"
      ]) {
        if (!text.includes(required)) fail("/robots.txt missing: " + required);
      }
      if (!failures.some((x) => x.includes("/robots.txt"))) pass("/robots.txt 200 and required directives present");
    }
  } catch (e) { fail("GET /robots.txt: " + e.message); }

  try {
    const sitemap = await request(base + "/sitemap.xml");
    const xml = await sitemap.text();
    if (sitemap.status !== 200) fail("GET /sitemap.xml -> " + sitemap.status);
    else {
      sitemapUrls = parseSitemap(xml);
      const unique = [...new Set(sitemapUrls)];
      if (unique.length !== sitemapUrls.length) fail("sitemap contains duplicate URLs");
      else pass("sitemap parseable and without duplicates");
      for (const url of sitemapUrls) {
        const parsed = new URL(url);
        if (parsed.origin !== "https://www.viremarca.com.br") fail("sitemap URL outside www domain: " + url);
      }
      if (sitemapUrls.every((url) => new URL(url).origin === "https://www.viremarca.com.br")) pass("all sitemap URLs use https://www.viremarca.com.br");
    }
  } catch (e) { fail("GET /sitemap.xml: " + e.message); }

  for (const url of sitemapUrls) {
    try {
      const response = await request(url);
      if (response.status !== 200) {
        fail(url + " -> " + response.status + " (sitemap URL must not redirect or error)");
        continue;
      }
      const html = await response.text();
      if (hasNoindex(html, response.headers)) fail(url + " has noindex");
      const canonicals = canonicalValues(html);
      if (canonicals.length !== 1) fail(url + " has " + canonicals.length + " canonical tags");
      else if (canonicals[0] !== url) fail(url + " canonical is " + canonicals[0]);
      if (countH1(html) !== 1) fail(url + " has " + countH1(html) + " h1 elements");
      if (!hasNoindex(html, response.headers) && canonicals.length === 1 && canonicals[0] === url && countH1(html) === 1) {
        pass(url + " -> 200, indexable, canonical self, one h1");
      }
    } catch (e) { fail(url + ": " + e.message); }
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_READONLY_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    const message = "NÃO VERIFICADO: Supabase read-only env não disponível para consistência de dados.";
    if (strict) fail(message);
    else note(message);
    note("A etapa permanece explicitamente NÃO VERIFICADO e requer revisão humana antes do release.");
  } else {
    try {
      const endpoint = supabaseUrl.replace(/\/$/, "") + "/rest/v1/portfolio_projects?select=slug&active=eq.true&order=display_order.asc";
      const r = await fetch(endpoint, {
        headers: { apikey: supabaseKey, Authorization: "Bearer " + supabaseKey }
      });
      if (!r.ok) throw new Error("Supabase REST -> " + r.status);
      const rows = await r.json();
      const expected = rows.map((row) => base + "/portfolio/" + encodeURIComponent(row.slug));
      const actual = sitemapUrls.filter((url) => url.includes("/portfolio/"));
      expected.sort(); actual.sort();
      if (!sameSet(expected, actual)) {
        fail("Supabase active/public projects != sitemap portfolio URLs");
        console.error("      expected: " + JSON.stringify(expected));
        console.error("      actual:   " + JSON.stringify(actual));
      } else pass("Supabase active/public projects = sitemap portfolio URLs");
    } catch (e) { fail("Supabase consistency check: " + e.message); }
  }

  for (const scheme of ["https", "http"]) {
    try {
      const result = await follow(scheme + "://viremarca.com.br/");
      const final = new URL(result.finalUrl);
      const first = result.chain[0];
      if (scheme === "https" && first.status !== 308) fail("https://viremarca.com.br/ first hop -> " + first.status + ", expected 308");
      if (final.origin !== "https://www.viremarca.com.br" || result.response.status !== 200) {
        fail(scheme + "://viremarca.com.br/ does not finish at https://www.viremarca.com.br/ with 200");
      } else pass(scheme + "://viremarca.com.br/ ends at www with 200");
    } catch (e) { fail(scheme + " apex redirect check: " + e.message); }
  }

  for (const path of ["/virelab", "/admin"]) {
    try {
      const result = await follow(base + path);
      const response = result.response;
      const html = await response.text();
      if (response.status !== 200) fail(path + " final response -> " + response.status);
      else if (!hasNoindex(html, response.headers)) fail(path + " is missing noindex");
      else if (sitemapUrls.includes(base + path)) fail(path + " appears in sitemap");
      else pass(path + " -> noindex and absent from sitemap");
    } catch (e) { fail(path + " check: " + e.message); }
  }

  console.log("");
  console.log("RESULT: " + (failures.length ? "FAIL" : "PASS"));
  if (notes.length) console.log("NOTES: " + notes.length);
  if (failures.length) {
    console.error("FAILURES: " + failures.length);
    process.exitCode = 1;
  }
}

check().catch((e) => {
  console.error("FATAL: " + e.stack);
  process.exitCode = 1;
});
