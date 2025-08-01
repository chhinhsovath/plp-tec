import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to view roles
    const userWithRoles = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!userWithRoles) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has system or user management permissions
    const hasPermission = userWithRoles.userRoles.some(ur => 
      ur.role.permissions.some(rp => 
        (rp.permission.resource === 'system' && rp.permission.action === 'manage_settings') ||
        (rp.permission.resource === 'user' && rp.permission.action === 'manage_roles')
      )
    );

    if (!hasPermission) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const includePermissions = searchParams.get('includePermissions') === 'true';
    const isActive = searchParams.get('isActive');
    const level = searchParams.get('level');

    // Build where clause
    const where: any = {};
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }
    if (level) {
      where.level = parseInt(level);
    }

    const roles = await prisma.role.findMany({
      where,
      include: {
        permissions: includePermissions ? {
          include: {
            permission: true
          }
        } : false,
        _count: {
          select: {
            userRoles: true
          }
        }
      },
      orderBy: {
        level: 'asc'
      }
    });

    return NextResponse.json({
      roles,
      total: roles.length
    });

  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const userWithRoles = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const hasPermission = userWithRoles?.userRoles.some(ur => 
      ur.role.permissions.some(rp => 
        rp.permission.resource === 'system' && rp.permission.action === 'manage_settings'
      )
    );

    if (!hasPermission) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { name, displayName, description, level, permissions } = body;

    // Validate required fields
    if (!name || !displayName || !level) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name }
    });

    if (existingRole) {
      return NextResponse.json(
        { error: "Role name already exists" },
        { status: 409 }
      );
    }

    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name,
        displayName,
        description,
        level,
        permissions: permissions?.length > 0 ? {
          create: permissions.map((permissionId: string) => ({
            permissionId
          }))
        } : undefined
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    return NextResponse.json(role, { status: 201 });

  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    );
  }
}