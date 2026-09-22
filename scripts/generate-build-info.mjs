import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"

const commit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || "local"
const timestamp = new Date().toISOString()
await mkdir(join(process.cwd(), "public"), { recursive: true })
await writeFile(join(process.cwd(), "public", "build-info.json"), JSON.stringify({ commit, timestamp }, null, 2) + "\n", "utf8")
console.log(`[build-info] ${commit} · ${timestamp}`)
