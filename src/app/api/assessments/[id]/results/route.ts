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

    // Get the latest completed attempt
    const attempt = await prisma.assessmentAttempt.findFirst({
      where: {
        assessmentId: assessmentId,
        userId: userId,
        status: 'COMPLETED'
      },
      orderBy: {
        completedAt: 'desc'
      },
      include: {
        assessment: {
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
            questions: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    if (!attempt) {
      return NextResponse.json({ error: "No completed attempts found" }, { status: 404 });
    }

    // Process questions with user answers
    const questionsWithResults = attempt.assessment.questions.map(question => {
      const userAnswer = attempt.answers?.[question.id];
      let isCorrect = false;
      let earnedPoints = 0;

      if (userAnswer) {
        switch (question.type) {
          case 'MULTIPLE_CHOICE':
          case 'TRUE_FALSE':
            isCorrect = userAnswer === question.correctAnswer;
            break;
          case 'SHORT_ANSWER':
            isCorrect = userAnswer.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();
            break;
          case 'ESSAY':
            // For essays, we gave partial credit during submission
            isCorrect = userAnswer.trim().length > 50;
            earnedPoints = isCorrect ? question.points * 0.8 : 0;
            break;
        }
        
        if (question.type !== 'ESSAY' && isCorrect) {
          earnedPoints = question.points;
        }
      }

      return {
        id: question.id,
        question: question.question,
        type: question.type,
        correctAnswer: question.correctAnswer,
        userAnswer: userAnswer,
        isCorrect: isCorrect,
        points: question.points,
        earnedPoints: earnedPoints
      };
    });

    const result = {
      assessment: {
        id: attempt.assessment.id,
        title: attempt.assessment.title,
        passingScore: attempt.assessment.passingScore,
        totalQuestions: attempt.assessment.totalQuestions,
        module: attempt.assessment.module
      },
      attempt: {
        id: attempt.id,
        score: attempt.score,
        totalPoints: attempt.totalPoints,
        earnedPoints: attempt.earnedPoints,
        status: attempt.status,
        startedAt: attempt.startedAt.toISOString(),
        completedAt: attempt.completedAt?.toISOString(),
        timeSpent: attempt.timeSpent
      },
      questions: questionsWithResults
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error fetching assessment results:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessment results" },
      { status: 500 }
    );
  }
}