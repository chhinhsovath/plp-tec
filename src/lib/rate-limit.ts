import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory store for rate limiting
// In production, use Redis or similar
const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

export function createRateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return {
    check: (req: NextRequest, identifier?: string): { success: boolean; error?: NextResponse } => {
      // Use custom identifier or fall back to IP
      const key = identifier || getClientIP(req) || 'anonymous';
      const now = Date.now();
      const resetTime = now + windowMs;

      // Clean up expired entries
      for (const [k, v] of rateLimitStore.entries()) {
        if (now > v.resetTime) {
          rateLimitStore.delete(k);
        }
      }

      // Get or create entry
      let entry = rateLimitStore.get(key);
      if (!entry || now > entry.resetTime) {
        entry = { count: 0, resetTime };
        rateLimitStore.set(key, entry);
      }

      // Check if limit exceeded
      if (entry.count >= maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        return {
          success: false,
          error: NextResponse.json(
            { 
              error: message,
              retryAfter: retryAfter 
            },
            { 
              status: 429,
              headers: {
                'Retry-After': retryAfter.toString(),
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': entry.resetTime.toString(),
              }
            }
          )
        };
      }

      // Increment counter
      entry.count++;
      rateLimitStore.set(key, entry);

      return { success: true };
    },
    
    // Call this after request processing if you want to implement selective counting
    shouldCount: (success: boolean): boolean => {
      if (success && skipSuccessfulRequests) return false;
      if (!success && skipFailedRequests) return false;
      return true;
    }
  };
}

// Pre-configured rate limiters for different endpoints
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again in 15 minutes.',
});

export const apiRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  message: 'API rate limit exceeded, please slow down.',
});

export const strictApiRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute for sensitive endpoints
  message: 'Rate limit exceeded for this operation.',
});

export const chatRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // 20 chat messages per minute
  message: 'Too many chat messages, please wait before sending more.',
});

export const fileUploadRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 file uploads per minute
  message: 'Too many file uploads, please wait before uploading more.',
});

// Helper function to get client IP
function getClientIP(req: NextRequest): string | null {
  // Try various headers to get the real IP
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Fall back to connection remote address
  return req.ip || null;
}

// Utility function to create a rate-limited API handler
export function withRateLimit<T extends any[]>(
  rateLimit: ReturnType<typeof createRateLimit>,
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const result = rateLimit.check(req);
    
    if (!result.success) {
      return result.error!;
    }
    
    return handler(req, ...args);
  };
}

// Rate limit by user ID for authenticated endpoints
export function createUserRateLimit(options: RateLimitOptions) {
  const limiter = createRateLimit(options);
  
  return {
    check: (req: NextRequest, userId: string): { success: boolean; error?: NextResponse } => {
      return limiter.check(req, `user:${userId}`);
    }
  };
}

// Clean up expired entries periodically (call this in a background job)
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// For debugging/monitoring - get current rate limit stats
export function getRateLimitStats(): { totalEntries: number; activeEntries: number } {
  const now = Date.now();
  let activeEntries = 0;
  
  for (const [, entry] of rateLimitStore.entries()) {
    if (now <= entry.resetTime) {
      activeEntries++;
    }
  }
  
  return {
    totalEntries: rateLimitStore.size,
    activeEntries
  };
}