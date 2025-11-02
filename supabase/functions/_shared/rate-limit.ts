/**
 * Simple in-memory rate limiter for edge functions
 * 
 * NOTE: This is a basic implementation using an in-memory Map.
 * For production with multiple edge function instances, consider:
 * - Using Redis or Upstash for distributed rate limiting
 * - Implementing sliding window algorithms
 * - Adding per-IP rate limiting in addition to per-user
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitRecord>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimits.entries()) {
    if (now > record.resetAt) {
      rateLimits.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  limit: number;        // Number of requests allowed
  windowMs: number;     // Time window in milliseconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;  // Seconds until rate limit resets (if denied)
}

/**
 * Check if a user has exceeded their rate limit
 * 
 * @param userId - The user's ID (from auth.uid())
 * @param config - Rate limit configuration
 * @returns RateLimitResult with allowed status and metadata
 */
export const checkRateLimit = (
  userId: string,
  config: RateLimitConfig
): RateLimitResult => {
  const now = Date.now();
  const key = userId;
  const record = rateLimits.get(key);

  // No existing record or window expired - allow and create new record
  if (!record || now > record.resetAt) {
    const resetAt = now + config.windowMs;
    rateLimits.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt,
    };
  }

  // Within window - check if limit exceeded
  if (record.count >= config.limit) {
    const retryAfterMs = record.resetAt - now;
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
      retryAfter: Math.ceil(retryAfterMs / 1000),
    };
  }

  // Within limit - increment and allow
  record.count++;
  return {
    allowed: true,
    remaining: config.limit - record.count,
    resetAt: record.resetAt,
  };
};
