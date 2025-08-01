import { NextRequest } from 'next/server';
import crypto from 'crypto';

// Security configuration
export const SECURITY_CONFIG = {
  // Password requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: false,
    MAX_LENGTH: 128,
  },
  
  // Session configuration
  SESSION: {
    MAX_AGE: 24 * 60 * 60, // 24 hours in seconds
    ROLLING: true, // Extend session on activity
    SECURE: process.env.NODE_ENV === 'production',
    HTTP_ONLY: true,
    SAME_SITE: 'lax' as const,
  },
  
  // File upload security
  FILE_UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
    SCAN_FOR_MALWARE: false, // Enable with external service
  },
  
  // Content Security Policy
  CSP: {
    DEFAULT_SRC: ["'self'"],
    SCRIPT_SRC: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    STYLE_SRC: ["'self'", "'unsafe-inline'"],
    IMG_SRC: ["'self'", 'data:', 'https:'],
    FONT_SRC: ["'self'", 'data:'],
    CONNECT_SRC: ["'self'", 'https://openrouter.ai'],
    FRAME_SRC: ["'none'"],
    OBJECT_SRC: ["'none'"],
    BASE_URI: ["'self'"],
    FORM_ACTION: ["'self'"],
  },
  
  // Rate limiting
  RATE_LIMITS: {
    AUTHENTICATION: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_ATTEMPTS: 5,
    },
    API_GENERAL: {
      WINDOW_MS: 60 * 1000, // 1 minute
      MAX_REQUESTS: 60,
    },
    API_STRICT: {
      WINDOW_MS: 60 * 1000, // 1 minute
      MAX_REQUESTS: 30,
    },
    CHAT: {
      WINDOW_MS: 60 * 1000, // 1 minute
      MAX_REQUESTS: 20,
    },
    FILE_UPLOAD: {
      WINDOW_MS: 60 * 1000, // 1 minute
      MAX_UPLOADS: 10,
    },
  },
};

// Password validation
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const config = SECURITY_CONFIG.PASSWORD;

  if (password.length < config.MIN_LENGTH) {
    errors.push(`Password must be at least ${config.MIN_LENGTH} characters long`);
  }

  if (password.length > config.MAX_LENGTH) {
    errors.push(`Password must not exceed ${config.MAX_LENGTH} characters`);
  }

  if (config.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (config.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (config.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (config.REQUIRE_SPECIAL_CHARS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Email validation (more comprehensive than basic regex)
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) {
    return false;
  }

  // Additional checks
  if (email.length > 254) return false; // RFC 5321 limit
  
  const [localPart, domain] = email.split('@');
  if (localPart.length > 64) return false; // RFC 5321 limit
  
  return true;
}

// File type validation
export function validateFileType(mimeType: string, fileName: string): boolean {
  const allowedTypes = SECURITY_CONFIG.FILE_UPLOAD.ALLOWED_TYPES;
  
  if (!allowedTypes.includes(mimeType)) {
    return false;
  }

  // Additional check based on file extension
  const extension = fileName.toLowerCase().split('.').pop();
  const mimeToExtension: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
    'application/pdf': ['pdf'],
    'application/msword': ['doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
    'application/vnd.ms-excel': ['xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
    'text/plain': ['txt'],
    'text/csv': ['csv'],
  };

  const validExtensions = mimeToExtension[mimeType];
  return validExtensions ? validExtensions.includes(extension || '') : false;
}

// Sanitize user input
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
}

// Generate secure random tokens
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Hash sensitive data (for logging, etc.)
export function hashSensitiveData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 8);
}

// Validate request origin
export function validateOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  const allowedOrigins = [
    process.env.NEXTAUTH_URL,
    'http://localhost:3000',
    'https://localhost:3000',
  ].filter(Boolean);

  if (!origin) {
    // Allow requests without origin (like direct API calls)
    return true;
  }

  return allowedOrigins.includes(origin);
}

// Check for suspicious patterns in user input
export function detectSuspiciousPatterns(input: string): {
  isSuspicious: boolean;
  patterns: string[];
} {
  const suspiciousPatterns = [
    // SQL Injection patterns
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /((\%27)|(\'))/gi, // Single quote and URL encoded
    /((\%3D)|(=))/gi, // Equals sign
    /((\%3B)|(;))/gi, // Semicolon
    
    // XSS patterns
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    
    // Path traversal
    /\.\.\//gi,
    /\.\.\\/gi,
    
    // Command injection
    /\b(wget|curl|nc|netcat|telnet|ssh|ftp)\b/gi,
    /[;&|`$]/gi,
  ];

  const foundPatterns: string[] = [];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      foundPatterns.push(pattern.source);
    }
  }

  return {
    isSuspicious: foundPatterns.length > 0,
    patterns: foundPatterns,
  };
}

// Generate Content Security Policy header value
export function generateCSPHeader(): string {
  const csp = SECURITY_CONFIG.CSP;
  const directives = [
    `default-src ${csp.DEFAULT_SRC.join(' ')}`,
    `script-src ${csp.SCRIPT_SRC.join(' ')}`,
    `style-src ${csp.STYLE_SRC.join(' ')}`,
    `img-src ${csp.IMG_SRC.join(' ')}`,
    `font-src ${csp.FONT_SRC.join(' ')}`,
    `connect-src ${csp.CONNECT_SRC.join(' ')}`,
    `frame-src ${csp.FRAME_SRC.join(' ')}`,
    `object-src ${csp.OBJECT_SRC.join(' ')}`,
    `base-uri ${csp.BASE_URI.join(' ')}`,
    `form-action ${csp.FORM_ACTION.join(' ')}`,
  ];

  return directives.join('; ');
}

// Audit log structure
export interface AuditLog {
  userId?: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Create audit log entry
export function createAuditLog(
  req: NextRequest,
  action: string,
  resource: string,
  details?: Record<string, any>,
  userId?: string,
  severity: AuditLog['severity'] = 'LOW'
): AuditLog {
  return {
    userId,
    action,
    resource,
    details,
    ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
    timestamp: new Date(),
    severity,
  };
}

// Security headers for responses
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': generateCSPHeader(),
} as const;