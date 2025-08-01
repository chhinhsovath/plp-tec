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

    const resourceId = params.id;
    const userId = session.user.id;

    // Check if resource exists and user has access
    const resource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        OR: [
          { isPublic: true },
          {
            course: {
              enrollments: {
                some: { userId }
              }
            }
          }
        ]
      }
    });

    if (!resource) {
      return NextResponse.json({ error: "Resource not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Download tracked successfully",
      resource: {
        id: resource.id,
        title: resource.title,
        url: resource.url
      }
    });

  } catch (error) {
    console.error("Error tracking download:", error);
    return NextResponse.json(
      { error: "Failed to track download" },
      { status: 500 }
    );
  }
}