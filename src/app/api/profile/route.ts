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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        _count: {
          select: {
            enrollments: true,
            enrollments: {
              where: {
                status: 'COMPLETED'
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get completed courses count separately due to Prisma limitations
    const completedCourses = await prisma.enrollment.count({
      where: {
        userId: session.user.id,
        status: 'COMPLETED'
      }
    });

    const response = {
      ...user,
      _count: {
        enrollments: user._count.enrollments,
        completedCourses
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      bio,
      phone,
      department,
      specialization,
      dateOfBirth,
      address
    } = body;

    // Update user basic info
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName
      }
    });

    // Upsert profile
    await prisma.profile.upsert({
      where: {
        userId: session.user.id
      },
      update: {
        bio,
        phone,
        department,
        specialization,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address
      },
      create: {
        userId: session.user.id,
        bio,
        phone,
        department,
        specialization,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address
      }
    });

    return NextResponse.json({ message: "Profile updated successfully" });

  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}