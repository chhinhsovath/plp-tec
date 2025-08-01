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

    const courseId = params.id;
    const userId = session.user.id;

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseId: courseId,
        userId: userId
      },
      select: {
        id: true,
        progress: true,
        enrolledAt: true,
        completedAt: true,
        status: true
      }
    });

    if (!enrollment) {
      return NextResponse.json({ enrolled: false }, { status: 200 });
    }

    return NextResponse.json({
      enrolled: true,
      ...enrollment
    });

  } catch (error) {
    console.error("Error checking enrollment:", error);
    return NextResponse.json(
      { error: "Failed to check enrollment status" },
      { status: 500 }
    );
  }
}