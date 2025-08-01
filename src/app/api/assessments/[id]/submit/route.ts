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

    const body = await req.json();
    const { attemptId, answers } = body;
    const assessmentId = params.id;

    if (!attemptId) {
      return NextResponse.json({ error: "Attempt ID is required" }, { status: 400 });
    }

    // Get the attempt and assessment details
    const attempt = await prisma.assessmentAttempt.findFirst({
      where: {
        id: attemptId,
        userId: session.user.id,
        assessmentId: assessmentId,
        status: 'IN_PROGRESS'
      },
      include: {
        assessment: {
          include: {
            questions: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found or already completed" }, { status: 404 });
    }

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;

    for (const question of attempt.assessment.questions) {
      totalPoints += question.marks;
      
      const userAnswer = answers[question.id];
      if (userAnswer) {
        // Simple scoring logic - this should be enhanced based on question type
        let isCorrect = false;
        
        switch (question.type) {
          case 'MULTIPLE_CHOICE':
          case 'TRUE_FALSE':
            isCorrect = userAnswer === question.correctAnswer;
            break;
          case 'SHORT_ANSWER':
            // Simple case-insensitive comparison
            isCorrect = userAnswer.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();
            break;
          case 'ESSAY':
            // Essays need manual grading - for now, give partial credit
            isCorrect = userAnswer.trim().length > 50; // Basic length check
            earnedPoints += isCorrect ? question.marks * 0.8 : 0; // 80% credit for effort
            continue;
        }
        
        if (isCorrect) {
          earnedPoints += question.marks;
        }
      }
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const completedAt = new Date();
    const timeSpent = Math.floor((completedAt.getTime() - new Date(attempt.startedAt).getTime()) / 1000);

    // Save the answers
    if (answers && Object.keys(answers).length > 0) {
      const answerRecords = Object.entries(answers).map(([questionId, answer]) => ({
        attemptId,
        questionId,
        answer: answer as string,
      }));

      await prisma.answer.createMany({
        data: answerRecords,
        skipDuplicates: true
      });
    }

    // Update the attempt
    await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        score: earnedPoints,
        percentage: score,
        submittedAt: completedAt,
        timeTaken: timeSpent,
        status: 'SUBMITTED'
      }
    });

    return NextResponse.json({
      message: "Assessment submitted successfully",
      score: score,
      totalPoints: totalPoints,
      earnedPoints: earnedPoints
    });

  } catch (error) {
    console.error("Error submitting assessment:", error);
    return NextResponse.json(
      { error: "Failed to submit assessment" },
      { status: 500 }
    );
  }
}