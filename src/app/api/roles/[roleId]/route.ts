import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await prisma.role.findUnique({
      where: { id: params.roleId },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json(role);

  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { error: "Failed to fetch role" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { roleId: string } }
) {
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
    const { displayName, description, level, isActive, permissions } = body;

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: params.roleId }
    });

    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Prevent modification of system roles
    if (existingRole.isSystem && (level !== undefined || isActive === false)) {
      return NextResponse.json(
        { error: "Cannot modify system role structure" },
        { status: 403 }
      );
    }

    // Update role
    const updatedRole = await prisma.role.update({
      where: { id: params.roleId },
      data: {
        displayName: displayName || undefined,
        description: description || undefined,
        level: level || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      }
    });

    // Update permissions if provided
    if (permissions !== undefined) {
      // Remove all existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: params.roleId }
      });

      // Add new permissions
      if (permissions.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissions.map((permissionId: string) => ({
            roleId: params.roleId,
            permissionId
          }))
        });
      }
    }

    // Fetch updated role with permissions
    const role = await prisma.role.findUnique({
      where: { id: params.roleId },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    return NextResponse.json(role);

  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { roleId: string } }
) {
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

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: params.roleId },
      include: {
        _count: {
          select: {
            userRoles: true
          }
        }
      }
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Prevent deletion of system roles
    if (role.isSystem) {
      return NextResponse.json(
        { error: "Cannot delete system role" },
        { status: 403 }
      );
    }

    // Prevent deletion if users have this role
    if (role._count.userRoles > 0) {
      return NextResponse.json(
        { error: "Cannot delete role with active users" },
        { status: 409 }
      );
    }

    // Delete role (cascade will handle permissions)
    await prisma.role.delete({
      where: { id: params.roleId }
    });

    return NextResponse.json({ message: "Role deleted successfully" });

  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 }
    );
  }
}