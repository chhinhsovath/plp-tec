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

    // Get assessment with questions
    const assessment = await prisma.assessment.findUnique({
      where: { 
        id: assessmentId,
        isActive: true
      },
      include: {
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

    // Check attempt limits
    const completedAttempts = await prisma.assessmentAttempt.count({
      where: {
        assessmentId,
        userId,
        status: 'GRADED'
      }
    });

    if (completedAttempts >= assessment.maxAttempts && !existingAttempt) {
      return NextResponse.json({ error: "Maximum attempts reached" }, { status: 400 });
    }

    let attemptData = null;
    if (existingAttempt) {
      const startedAt = new Date(existingAttempt.startedAt);
      const now = new Date();
      const elapsedMinutes = Math.floor((now.getTime() - startedAt.getTime()) / 60000);
      const timeRemainingMinutes = assessment.duration ? Math.max(0, assessment.duration - elapsedMinutes) : null;
      
      // Load existing answers
      const existingAnswers = await prisma.answer.findMany({
        where: { attemptId: existingAttempt.id },
        select: {
          questionId: true,
          answer: true
        }
      });
      
      // Convert to object format
      const answersObj: Record<string, string> = {};
      existingAnswers.forEach(ans => {
        if (ans.answer) {
          answersObj[ans.questionId] = ans.answer;
        }
      });
      
      attemptData = {
        id: existingAttempt.id,
        startedAt: existingAttempt.startedAt,
        timeRemaining: timeRemainingMinutes ? timeRemainingMinutes * 60 : null, // Convert to seconds
        answers: answersObj
      };
    }

    return NextResponse.json({
      assessment: {
        id: assessment.id,
        title: assessment.title,
        duration: assessment.duration,
        totalQuestions: assessment.questions.length,
        questions: assessment.questions
      },
      attempt: attemptData
    });

  } catch (error) {
    console.error("Error fetching assessment for taking:", error);
    return NextResponse.json(
      { error: "Failed to load assessment" },
      { status: 500 }
    );
  }
}