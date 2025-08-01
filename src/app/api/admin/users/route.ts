import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createUserSchema, paginationSchema } from "@/lib/validations";
import { strictApiRateLimit } from "@/lib/rate-limit";
import { 
  handleApiError,
  createApiResponse,
  createPaginatedResponse,
  AuthorizationError,
  ValidationError,
  ConflictError,
  withErrorHandling
} from "@/lib/api-error-handler";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    throw new AuthorizationError("Admin access required");
  }

  // Apply rate limiting
  const rateLimitResult = strictApiRateLimit.check(req, session.user?.id);
  if (!rateLimitResult.success) {
    return rateLimitResult.error!;
  }

  // Parse query parameters for pagination and filtering
  const { searchParams } = new URL(req.url);
  const validationResult = paginationSchema.safeParse({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    search: searchParams.get('search') || undefined,
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  });

  if (!validationResult.success) {
    throw new ValidationError("Invalid query parameters", validationResult.error.issues);
  }

  const { page, limit, search, sortBy, sortOrder } = validationResult.data;
  const offset = (page - 1) * limit;
  
  // Create orderBy object with proper typing
  const orderBy: any = {};
  if (sortBy) {
    orderBy[sortBy] = sortOrder;
  } else {
    orderBy.createdAt = 'desc';
  }

  // Build where clause for search
  const where = search
    ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  // Get total count and users
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: {
        profile: {
          select: {
            bio: true,  // Contains department info
            phoneNumber: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            teachingCourses: true
          }
        }
      },
      orderBy,
      skip: offset,
      take: limit,
    })
  ]);

  // Remove passwords from response
  const usersWithoutPasswords = users.map(user => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });

  return createPaginatedResponse(usersWithoutPasswords, total, page, limit);
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    throw new AuthorizationError("Admin access required");
  }

  // Apply rate limiting
  const rateLimitResult = strictApiRateLimit.check(req, session.user?.id);
  if (!rateLimitResult.success) {
    return rateLimitResult.error!;
  }

  // Parse and validate request body
  const body = await req.json();
  const validationResult = createUserSchema.safeParse(body);
  
  if (!validationResult.success) {
    throw new ValidationError("Invalid user data", validationResult.error.issues);
  }

  const { name, email, password, role } = validationResult.data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Split name into first and last name (simple approach)
  const nameParts = name.trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '';

  // Create user
  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      isActive: true,
      profile: {
        create: {
          bio: null,  // Department info can be stored here
          phoneNumber: null
        }
      }
    },
    include: {
      profile: {
        select: {
          department: true,
          phone: true
        }
      },
      _count: {
        select: {
          enrollments: true,
          instructedCourses: true
        }
      }
    }
  });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  return createApiResponse(userWithoutPassword, "User created successfully", 201);
});