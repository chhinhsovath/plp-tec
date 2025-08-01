import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;
    const body = await req.json();
    const { firstName, lastName, email, role, isActive, department, phone } = body;

    // Prevent admin from deactivating themselves
    if (userId === session.user.id && isActive === false) {
      return NextResponse.json({ error: "Cannot deactivate your own account" }, { status: 400 });
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId }
        }
      });

      if (existingUser) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email,
        role,
        isActive,
        profile: {
          upsert: {
            create: {
              department: department || null,
              phone: phone || null
            },
            update: {
              department: department || null,
              phone: phone || null
            }
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

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Check if user has dependencies (enrollments, courses, etc.)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            enrollments: true,
            instructedCourses: true,
            submissions: true,
            assessmentAttempts: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user has dependencies, deactivate instead of delete
    if (user._count.enrollments > 0 || 
        user._count.instructedCourses > 0 || 
        user._count.submissions > 0 || 
        user._count.assessmentAttempts > 0) {
      
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false }
      });

      return NextResponse.json({ 
        message: "User has existing data and has been deactivated instead of deleted" 
      });
    }

    // Safe to delete user with no dependencies
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ message: "User deleted successfully" });

  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}