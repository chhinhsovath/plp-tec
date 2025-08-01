import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courseId = params.id;
    const userId = session.user.id;

    // Check if course exists and is active
    const course = await prisma.course.findUnique({
      where: { 
        id: courseId,
        isActive: true
      }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        courseId: courseId,
        userId: userId
      }
    });

    if (existingEnrollment) {
      return NextResponse.json({ 
        error: "Already enrolled in this course",
        enrollment: existingEnrollment
      }, { status: 400 });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        courseId: courseId,
        userId: userId,
        progress: 0,
        status: 'ACTIVE',
        enrolledAt: new Date()
      },
      select: {
        id: true,
        progress: true,
        enrolledAt: true,
        status: true
      }
    });

    return NextResponse.json({
      message: "Successfully enrolled in course",
      enrollment
    });

  } catch (error) {
    console.error("Error enrolling in course:", error);
    return NextResponse.json(
      { error: "Failed to enroll in course" },
      { status: 500 }
    );
  }
}