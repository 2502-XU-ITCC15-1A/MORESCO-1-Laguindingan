function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for']
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim()
  }

  return req.ip || req.socket?.remoteAddress || 'unknown'
}

export function createRateLimiter({
  windowMs = 60_000,
  maxRequests = 60,
  message = 'Too many requests. Please try again later.',
  keyGenerator,
} = {}) {
  const hits = new Map()

  function cleanupExpired(now) {
    for (const [key, entry] of hits.entries()) {
      if (entry.resetAt <= now) {
        hits.delete(key)
      }
    }
  }

  return function rateLimit(req, res, next) {
    const now = Date.now()
    cleanupExpired(now)

    const key = keyGenerator?.(req) || getClientIp(req)
    const existing = hits.get(key)

    if (!existing || existing.resetAt <= now) {
      hits.set(key, {
        count: 1,
        resetAt: now + windowMs,
      })
      return next()
    }

    existing.count += 1

    if (existing.count > maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
      res.set('Retry-After', String(retryAfterSeconds))
      return res.status(429).json({ message })
    }

    return next()
  }
}

