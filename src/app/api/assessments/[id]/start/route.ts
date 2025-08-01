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

    const assessmentId = params.id;
    const userId = session.user.id;

    // Get assessment details
    const assessment = await prisma.assessment.findUnique({
      where: { 
        id: assessmentId,
        isActive: true
      }
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Check if user is enrolled
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: assessment.courseId
      }
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
    }

    // Check if assessment is still available
    if (assessment.endDateTime && new Date() > assessment.endDateTime) {
      return NextResponse.json({ error: "Assessment deadline has passed" }, { status: 400 });
    }

    // Check for existing in-progress attempt
    const existingAttempt = await prisma.assessmentAttempt.findFirst({
      where: {
        assessmentId,
        userId,
        status: 'IN_PROGRESS'
      }
    });

    if (existingAttempt) {
      return NextResponse.json({ error: "You already have an in-progress attempt" }, { status: 400 });
    }

    // Check attempt limits
    const completedAttempts = await prisma.assessmentAttempt.count({
      where: {
        assessmentId,
        userId,
        status: 'GRADED'
      }
    });

    if (completedAttempts >= assessment.maxAttempts) {
      return NextResponse.json({ error: "Maximum attempts reached" }, { status: 400 });
    }

    // Create new attempt
    const attemptNumber = completedAttempts + 1;
    const attempt = await prisma.assessmentAttempt.create({
      data: {
        assessmentId,
        userId,
        attemptNumber,
        startedAt: new Date(),
        status: 'IN_PROGRESS'
      }
    });

    return NextResponse.json({
      id: attempt.id,
      startedAt: attempt.startedAt,
      timeRemaining: assessment.duration ? assessment.duration * 60 : null, // Convert minutes to seconds
      answers: {}
    });

  } catch (error) {
    console.error("Error starting assessment:", error);
    return NextResponse.json(
      { error: "Failed to start assessment" },
      { status: 500 }
    );
  }
}