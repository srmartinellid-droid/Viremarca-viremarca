type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()
const WINDOW_MS = 60_000
const MAX_REQUESTS = 12

export function checkRateLimit(key: string, now = Date.now()) {
  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    const fresh = { count: 1, resetAt: now + WINDOW_MS }
    buckets.set(key, fresh)
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: fresh.resetAt }
  }
  if (current.count >= MAX_REQUESTS) return { allowed: false, remaining: 0, resetAt: current.resetAt }
  current.count += 1
  return { allowed: true, remaining: MAX_REQUESTS - current.count, resetAt: current.resetAt }
}

export function resetRateLimitForTests() {
  buckets.clear()
}
