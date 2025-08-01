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
    const { attemptId, answers, timeRemaining } = body;

    if (!attemptId) {
      return NextResponse.json({ error: "Attempt ID is required" }, { status: 400 });
    }

    // Verify the attempt belongs to the current user
    const attempt = await prisma.assessmentAttempt.findFirst({
      where: {
        id: attemptId,
        userId: session.user.id,
        status: 'IN_PROGRESS'
      }
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found or not in progress" }, { status: 404 });
    }

    // Update the attempt with current answers
    await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        answers: answers || {},
        lastSavedAt: new Date()
      }
    });

    return NextResponse.json({ message: "Answers saved successfully" });

  } catch (error) {
    console.error("Error saving assessment answers:", error);
    return NextResponse.json(
      { error: "Failed to save answers" },
      { status: 500 }
    );
  }
}