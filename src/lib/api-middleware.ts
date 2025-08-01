import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createRateLimit } from '@/lib/rate-limit';
import { AuthenticationError, AuthorizationError } from '@/lib/api-error-handler';

export interface MiddlewareContext {
  session: any;
  user: any;
}

export interface MiddlewareOptions {
  requireAuth?: boolean;
  requiredRole?: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  rateLimit?: ReturnType<typeof createRateLimit>;
  allowedMethods?: string[];
}

// Main middleware composer
export function withMiddleware(
  options: MiddlewareOptions = {}
) {
  return function <T extends any[]>(
    handler: (req: NextRequest, context: MiddlewareContext, ...args: T) => Promise<NextResponse>
  ) {
    return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
      try {
        // Check allowed methods
        if (options.allowedMethods && !options.allowedMethods.includes(req.method)) {
          return NextResponse.json(
            { error: `Method ${req.method} not allowed` },
            { status: 405 }
          );
        }

        let session = null;
        let user = null;

        // Handle authentication
        if (options.requireAuth || options.requiredRole) {
          session = await getServerSession(authOptions);
          
          if (!session) {
            throw new AuthenticationError('Authentication required');
          }

          user = session.user;

          // Check role-based authorization
          if (options.requiredRole && user.role !== options.requiredRole) {
            // Special case: allow admins to access instructor endpoints
            if (!(options.requiredRole === 'INSTRUCTOR' && user.role === 'ADMIN')) {
              throw new AuthorizationError(`${options.requiredRole} role required`);
            }
          }
        }

        // Apply rate limiting
        if (options.rateLimit) {
          const identifier = user?.id || undefined;
          const rateLimitResult = options.rateLimit.check(req, identifier);
          
          if (!rateLimitResult.success) {
            return rateLimitResult.error!;
          }
        }

        // Create context
        const context: MiddlewareContext = {
          session,
          user
        };

        // Call the handler
        return await handler(req, context, ...args);

      } catch (error) {
        // Let the error handler deal with it
        throw error;
      }
    };
  };
}

// Convenience functions for common middleware combinations
export const withAuth = (rateLimit?: ReturnType<typeof createRateLimit>) =>
  withMiddleware({
    requireAuth: true,
    rateLimit
  });

export const withAdminAuth = (rateLimit?: ReturnType<typeof createRateLimit>) =>
  withMiddleware({
    requireAuth: true,
    requiredRole: 'ADMIN',
    rateLimit
  });

export const withInstructorAuth = (rateLimit?: ReturnType<typeof createRateLimit>) =>
  withMiddleware({
    requireAuth: true,
    requiredRole: 'INSTRUCTOR',
    rateLimit
  });

export const withStudentAuth = (rateLimit?: ReturnType<typeof createRateLimit>) =>
  withMiddleware({
    requireAuth: true,
    requiredRole: 'STUDENT',
    rateLimit
  });

// CORS middleware
export function withCors(
  allowedOrigins: string[] = ['http://localhost:3000'],
  allowedMethods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
) {
  return function <T extends any[]>(
    handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
      const origin = req.headers.get('origin');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
            'Access-Control-Allow-Methods': allowedMethods.join(', '),
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Max-Age': '86400',
          },
        });
      }

      // Handle actual request
      const response = await handler(req, ...args);

      // Add CORS headers to response
      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }

      return response;
    };
  };
}

// Request validation middleware
export function withValidation<T>(
  schema: any,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return function <U extends any[]>(
    handler: (req: NextRequest, validatedData: T, ...args: U) => Promise<NextResponse>
  ) {
    return async (req: NextRequest, ...args: U): Promise<NextResponse> => {
      let data: any;

      try {
        switch (source) {
          case 'body':
            data = await req.json();
            break;
          case 'query':
            data = Object.fromEntries(new URL(req.url).searchParams);
            break;
          case 'params':
            // Extract params from args (assuming they're passed as route params)
            data = args[0] || {};
            break;
        }

        const validationResult = schema.safeParse(data);
        
        if (!validationResult.success) {
          return NextResponse.json(
            {
              error: 'Validation failed',
              issues: validationResult.error.issues
            },
            { status: 400 }
          );
        }

        return await handler(req, validationResult.data, ...args);

      } catch (error) {
        if (source === 'body' && error instanceof SyntaxError) {
          return NextResponse.json(
            { error: 'Invalid JSON in request body' },
            { status: 400 }
          );
        }
        throw error;
      }
    };
  };
}

// Logging middleware
export function withLogging(
  logLevel: 'info' | 'debug' | 'error' = 'info'
) {
  return function <T extends any[]>(
    handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
      const start = Date.now();
      const requestId = Math.random().toString(36).substr(2, 9);
      
      if (logLevel === 'debug') {
        console.log(`[${requestId}] ${req.method} ${req.url} - Start`);
      }

      try {
        const response = await handler(req, ...args);
        const duration = Date.now() - start;
        
        if (logLevel === 'info' || logLevel === 'debug') {
          console.log(
            `[${requestId}] ${req.method} ${req.url} - ${response.status} (${duration}ms)`
          );
        }

        return response;
      } catch (error) {
        const duration = Date.now() - start;
        
        if (logLevel === 'error' || logLevel === 'debug') {
          console.error(
            `[${requestId}] ${req.method} ${req.url} - Error (${duration}ms):`,
            error
          );
        }

        throw error;
      }
    };
  };
}

// Security headers middleware
export function withSecurityHeaders() {
  return function <T extends any[]>(
    handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
      const response = await handler(req, ...args);

      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
      );

      return response;
    };
  };
}

// Compose multiple middlewares
export function compose<T extends any[]>(
  ...middlewares: Array<(handler: any) => any>
) {
  return function (handler: (req: NextRequest, ...args: T) => Promise<NextResponse>) {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}

// Helper type for middleware-enhanced handlers
export type ApiHandler<T extends any[] = []> = (
  req: NextRequest,
  context: MiddlewareContext,
  ...args: T
) => Promise<NextResponse>;