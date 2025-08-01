import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's enrolled courses
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true }
    });

    const courseIds = enrollments.map(e => e.courseId);

    // Get resources from enrolled courses and public resources
    const resources = await prisma.resource.findMany({
      where: {
        OR: [
          { isPublic: true },
          {
            courseId: {
              in: courseIds
            }
          }
        ]
      },
      include: {
        course: {
          select: {
            title: true,
            code: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get category counts
    const categoryStats = await prisma.resource.groupBy({
      by: ['category'],
      where: {
        OR: [
          { isPublic: true },
          {
            courseId: {
              in: courseIds
            }
          }
        ]
      },
      _count: {
        category: true
      }
    });

    // Map categories with icons
    const categoryIcons: Record<string, string> = {
      'Textbooks': '📚',
      'Lectures': '🎥',
      'References': '📄',
      'Exercises': '✏️',
      'Multimedia': '🎬',
      'Software': '💻',
      'Templates': '📋',
      'Research': '🔬',
      'General': '📂'
    };

    const categories = categoryStats.map(stat => ({
      name: stat.category,
      count: stat._count.category,
      icon: categoryIcons[stat.category] || '📂'
    }));

    return NextResponse.json({
      resources,
      categories
    });

  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}