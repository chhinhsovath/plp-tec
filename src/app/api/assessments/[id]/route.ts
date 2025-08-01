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

    const assessmentId = params.id;
    const userId = session.user.id;

    const assessment = await prisma.assessment.findUnique({
      where: { 
        id: assessmentId,
        isActive: true
      },
      include: {
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
        },
        attempts: {
          where: { userId },
          select: {
            id: true,
            score: true,
            status: true,
            startedAt: true,
            submittedAt: true,
            answers: true
          },
          orderBy: {
            startedAt: 'desc'
          }
        },
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            type: true,
            content: true,
            options: true,
            marks: true,
            order: true
          }
        }
      }
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: assessment.courseId
      }
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
    }

    return NextResponse.json(assessment);

  } catch (error) {
    console.error("Error fetching assessment:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessment details" },
      { status: 500 }
    );
  }
}