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
        status: 'GRADED'
      },
      orderBy: {
        submittedAt: 'desc'
      },
      include: {
        assessment: {
          include: {
            course: {
              select: {
                title: true,
                code: true
              }
            },
            questions: {
              orderBy: { order: 'asc' }
            }
          }
        },
        answers: true
      }
    });

    if (!attempt) {
      return NextResponse.json({ error: "No completed attempts found" }, { status: 404 });
    }

    // Process questions with user answers
    const questionsWithResults = attempt.assessment.questions.map(question => {
      const userAnswer = attempt.answers.find(a => a.questionId === question.id);
      let isCorrect = false;
      let earnedPoints = 0;

      if (userAnswer && userAnswer.answer) {
        switch (question.type) {
          case 'MULTIPLE_CHOICE':
          case 'TRUE_FALSE':
            isCorrect = userAnswer.answer === question.correctAnswer;
            break;
          case 'SHORT_ANSWER':
            isCorrect = userAnswer.answer.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();
            break;
          case 'ESSAY':
            // For essays, we gave partial credit during submission
            isCorrect = userAnswer.answer.trim().length > 50;
            earnedPoints = isCorrect ? question.marks * 0.8 : 0;
            break;
        }
        
        if (question.type !== 'ESSAY' && isCorrect) {
          earnedPoints = question.marks;
        }
      }

      return {
        id: question.id,
        question: question.content,
        type: question.type,
        correctAnswer: question.correctAnswer,
        userAnswer: userAnswer?.answer || null,
        isCorrect: isCorrect,
        points: question.marks,
        earnedPoints: earnedPoints
      };
    });

    const result = {
      assessment: {
        id: attempt.assessment.id,
        title: attempt.assessment.title,
        passingScore: attempt.assessment.passingMarks,
        totalQuestions: attempt.assessment.questions.length,
        course: attempt.assessment.course
      },
      attempt: {
        id: attempt.id,
        score: attempt.score,
        percentage: attempt.percentage,
        status: attempt.status,
        startedAt: attempt.startedAt.toISOString(),
        submittedAt: attempt.submittedAt?.toISOString(),
        timeTaken: attempt.timeTaken
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