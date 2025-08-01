import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignmentId = params.id;
    const userId = session.user.id;

    const assignment = await prisma.assignment.findUnique({
      where: { 
        id: assignmentId,
        isPublished: true
      },
      include: {
        module: {
          select: {
            title: true,
            course: {
              select: {
                id: true,
                title: true,
                code: true,
                instructor: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        },
        submissions: {
          where: { userId },
          select: {
            id: true,
            content: true,
            attachmentUrl: true,
            submittedAt: true,
            score: true,
            feedback: true,
            status: true
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: assignment.module.course.id
      }
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
    }

    // Transform submission data
    const response = {
      ...assignment,
      submission: assignment.submissions[0] || null,
      submissions: undefined // Remove the array
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Error fetching assignment:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignment details" },
      { status: 500 }
    );
  }
}