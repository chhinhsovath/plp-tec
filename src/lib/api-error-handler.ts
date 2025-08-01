import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  
  constructor(message: string, public errors?: any[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  statusCode = 401;
  code = 'AUTHENTICATION_ERROR';
  
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  statusCode = 403;
  code = 'AUTHORIZATION_ERROR';
  
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND_ERROR';
  
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  code = 'CONFLICT_ERROR';
  
  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  statusCode = 429;
  code = 'RATE_LIMIT_ERROR';
  
  constructor(message: string = 'Rate limit exceeded', public retryAfter?: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class InternalServerError extends Error {
  statusCode = 500;
  code = 'INTERNAL_SERVER_ERROR';
  
  constructor(message: string = 'Internal server error') {
    super(message);
    this.name = 'InternalServerError';
  }
}

// Main error handler function
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      },
      { status: 400 }
    );
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }

  // Handle custom API errors
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.errors && { errors: error.errors }),
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ConflictError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof RateLimitError) {
    const headers: Record<string, string> = {};
    if (error.retryAfter) {
      headers['Retry-After'] = error.retryAfter.toString();
    }
    
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.retryAfter && { retryAfter: error.retryAfter }),
      },
      { status: error.statusCode, headers }
    );
  }

  // Handle standard API errors
  if (error instanceof Error && 'statusCode' in error) {
    const apiError = error as ApiError;
    return NextResponse.json(
      {
        error: apiError.message,
        code: apiError.code || 'API_ERROR',
      },
      { status: apiError.statusCode || 500 }
    );
  }

  // Handle standard errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        ...(process.env.NODE_ENV === 'development' && { details: error.message }),
      },
      { status: 500 }
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    },
    { status: 500 }
  );
}

// Handle Prisma-specific errors
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): NextResponse {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = error.meta?.target as string[] | undefined;
      return NextResponse.json(
        {
          error: `A record with this ${field?.join(', ') || 'value'} already exists`,
          code: 'UNIQUE_CONSTRAINT_ERROR',
          field: field?.[0],
        },
        { status: 409 }
      );
    
    case 'P2014':
      // Related record not found
      return NextResponse.json(
        {
          error: 'Related record not found',
          code: 'RELATED_RECORD_NOT_FOUND',
        },
        { status: 400 }
      );
    
    case 'P2003':
      // Foreign key constraint violation
      return NextResponse.json(
        {
          error: 'Cannot delete record due to related data',
          code: 'FOREIGN_KEY_CONSTRAINT_ERROR',
        },
        { status: 400 }
      );
    
    case 'P2025':
      // Record not found
      return NextResponse.json(
        {
          error: 'Record not found',
          code: 'RECORD_NOT_FOUND',
        },
        { status: 404 }
      );
    
    default:
      return NextResponse.json(
        {
          error: 'Database operation failed',
          code: 'DATABASE_ERROR',
          ...(process.env.NODE_ENV === 'development' && { details: error.message }),
        },
        { status: 500 }
      );
  }
}

// Utility function to create consistent API responses
export function createApiResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

// Utility function for paginated responses
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
): NextResponse {
  const totalPages = Math.ceil(total / limit);
  
  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      ...(message && { message }),
    },
    { status: 200 }
  );
}

// Wrapper function for API route handlers
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// Logging utility for API errors
export function logApiError(error: unknown, context?: Record<string, any>): void {
  const errorInfo = {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    context,
  };

  // In production, send to logging service (e.g., Winston, DataDog, etc.)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to external logging service
    console.error('API Error:', JSON.stringify(errorInfo, null, 2));
  } else {
    console.error('API Error:', errorInfo);
  }
}