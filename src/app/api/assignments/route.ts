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

    // Get assignments from enrolled courses
    const assignments = await prisma.assignment.findMany({
      where: {
        module: {
          courseId: {
            in: courseIds
          },
          isPublished: true
        },
        isPublished: true
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
        submissions: {
          where: { userId },
          select: {
            id: true,
            submittedAt: true,
            score: true,
            feedback: true,
            status: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    // Transform to include submission info
    const assignmentsWithSubmissions = assignments.map(assignment => ({
      ...assignment,
      submission: assignment.submissions[0] || null,
      submissions: undefined // Remove the array
    }));

    return NextResponse.json(assignmentsWithSubmissions);

  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}