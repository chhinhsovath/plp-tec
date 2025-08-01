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

    const assignmentId = params.id;
    const userId = session.user.id;

    // Get assignment details
    const assignment = await prisma.assignment.findUnique({
      where: { 
        id: assignmentId,
        isPublished: true
      },
      include: {
        module: {
          select: {
            courseId: true
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Check if user is enrolled
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: assignment.module.courseId
      }
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
    }

    // Check if assignment is overdue
    if (new Date() > assignment.dueDate) {
      return NextResponse.json({ error: "Assignment is overdue" }, { status: 400 });
    }

    // Check if already submitted
    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        userId
      }
    });

    if (existingSubmission) {
      return NextResponse.json({ error: "Assignment already submitted" }, { status: 400 });
    }

    // Parse form data
    const formData = await req.formData();
    const content = formData.get('content') as string;
    
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Handle file uploads (for now, we'll store file names as a simple array)
    // In a real implementation, you'd upload files to cloud storage
    const files = formData.getAll('files') as File[];
    const attachments: string[] = [];
    
    for (const file of files) {
      if (file.size > 0) {
        // In production, upload to cloud storage and store URLs
        // For now, just store the filename as a placeholder
        attachments.push(`/uploads/${Date.now()}-${file.name}`);
      }
    }

    // Create submission
    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        userId,
        content: content.trim(),
        attachmentUrl: attachments.length > 0 ? attachments[0] : null,
        submittedAt: new Date(),
        status: 'SUBMITTED'
      }
    });

    return NextResponse.json({
      message: "Assignment submitted successfully",
      submission: {
        id: submission.id,
        submittedAt: submission.submittedAt,
        status: submission.status
      }
    });

  } catch (error) {
    console.error("Error submitting assignment:", error);
    return NextResponse.json(
      { error: "Failed to submit assignment" },
      { status: 500 }
    );
  }
}