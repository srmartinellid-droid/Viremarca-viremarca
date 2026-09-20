import { headers } from "next/headers"

export async function GET() {
  const requestHeaders = await headers()
  const region: Record<string, string> = {}
  const country = requestHeaders.get("x-vercel-ip-country")?.trim()
  const state = requestHeaders.get("x-vercel-ip-country-region")?.trim()
  const city = requestHeaders.get("x-vercel-ip-city")?.trim()
  if (country) region.country = country.slice(0, 2)
  if (state) region.region = state.slice(0, 100)
  if (city) region.city = city.slice(0, 200)
  return Response.json(region, { headers: { "Cache-Control": "no-store" } })
}
