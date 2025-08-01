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

    const userId = session.user.id;

    // Get user's enrolled courses
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true }
    });

    const courseIds = enrollments.map(e => e.courseId);

    // Get assessments from enrolled courses
    const assessments = await prisma.assessment.findMany({
      where: {
        module: {
          courseId: {
            in: courseIds
          },
          isPublished: true
        },
        isActive: true
      },
      include: {
        module: {
          select: {
            title: true,
            course: {
              select: {
                title: true,
                code: true
              }
            }
          }
        },
        attempts: {
          where: { userId },
          select: {
            id: true,
            score: true,
            status: true,
            startedAt: true,
            completedAt: true
          },
          orderBy: {
            startedAt: 'desc'
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    return NextResponse.json(assessments);

  } catch (error) {
    console.error("Error fetching assessments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessments" },
      { status: 500 }
    );
  }
}