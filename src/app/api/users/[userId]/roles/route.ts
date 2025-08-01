import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Users can view their own roles, admins can view any user's roles
    if (session.user.id !== params.userId) {
      // Check if requesting user has permission
      const requestingUser = await prisma.user.findUnique({
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

      const hasPermission = requestingUser?.userRoles.some(ur => 
        ur.role.permissions.some(rp => 
          (rp.permission.resource === 'user' && rp.permission.action === 'read') ||
          (rp.permission.resource === 'user' && rp.permission.action === 'manage_roles')
        )
      );

      if (!hasPermission) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }
    }

    const userRoles = await prisma.userRole.findMany({
      where: { userId: params.userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        },
        institution: true,
        department: true
      }
    });

    return NextResponse.json(userRoles);

  } catch (error) {
    console.error("Error fetching user roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch user roles" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const requestingUser = await prisma.user.findUnique({
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

    const hasPermission = requestingUser?.userRoles.some(ur => 
      ur.role.permissions.some(rp => 
        rp.permission.resource === 'user' && rp.permission.action === 'manage_roles'
      )
    );

    if (!hasPermission) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { roleId, institutionId, departmentId, validUntil } = body;

    // Validate required fields
    if (!roleId) {
      return NextResponse.json(
        { error: "Role ID is required" },
        { status: 400 }
      );
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user already has this role in the same context
    const existingRole = await prisma.userRole.findFirst({
      where: {
        userId: params.userId,
        roleId,
        institutionId: institutionId || null,
        departmentId: departmentId || null
      }
    });

    if (existingRole) {
      return NextResponse.json(
        { error: "User already has this role in the specified context" },
        { status: 409 }
      );
    }

    // Get the level of the role being assigned
    const requestingUserHighestLevel = Math.min(
      ...requestingUser!.userRoles.map(ur => ur.role.level)
    );

    // Can only assign roles at same level or lower
    if (role.level < requestingUserHighestLevel) {
      return NextResponse.json(
        { error: "Cannot assign roles higher than your own level" },
        { status: 403 }
      );
    }

    // Create user role
    const userRole = await prisma.userRole.create({
      data: {
        userId: params.userId,
        roleId,
        institutionId,
        departmentId,
        assignedBy: session.user.id,
        validUntil: validUntil ? new Date(validUntil) : undefined
      },
      include: {
        role: true,
        institution: true,
        department: true
      }
    });

    return NextResponse.json(userRole, { status: 201 });

  } catch (error) {
    console.error("Error assigning role:", error);
    return NextResponse.json(
      { error: "Failed to assign role" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const requestingUser = await prisma.user.findUnique({
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

    const hasPermission = requestingUser?.userRoles.some(ur => 
      ur.role.permissions.some(rp => 
        rp.permission.resource === 'user' && rp.permission.action === 'manage_roles'
      )
    );

    if (!hasPermission) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userRoleId = searchParams.get('userRoleId');

    if (!userRoleId) {
      return NextResponse.json(
        { error: "User role ID is required" },
        { status: 400 }
      );
    }

    // Get the user role
    const userRole = await prisma.userRole.findUnique({
      where: { id: userRoleId },
      include: { role: true }
    });

    if (!userRole) {
      return NextResponse.json(
        { error: "User role not found" },
        { status: 404 }
      );
    }

    // Verify the user role belongs to the specified user
    if (userRole.userId !== params.userId) {
      return NextResponse.json(
        { error: "User role mismatch" },
        { status: 400 }
      );
    }

    // Get the level of the role being removed
    const requestingUserHighestLevel = Math.min(
      ...requestingUser!.userRoles.map(ur => ur.role.level)
    );

    // Can only remove roles at same level or lower
    if (userRole.role.level < requestingUserHighestLevel) {
      return NextResponse.json(
        { error: "Cannot remove roles higher than your own level" },
        { status: 403 }
      );
    }

    // Delete the user role
    await prisma.userRole.delete({
      where: { id: userRoleId }
    });

    return NextResponse.json({ message: "Role removed successfully" });

  } catch (error) {
    console.error("Error removing role:", error);
    return NextResponse.json(
      { error: "Failed to remove role" },
      { status: 500 }
    );
  }
}