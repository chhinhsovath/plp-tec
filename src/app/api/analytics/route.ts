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

    // Only admins can view analytics
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get total users
    const totalUsers = await prisma.user.count();

    // Get total courses
    const totalCourses = await prisma.course.count({
      where: { isActive: true }
    });

    // Get total enrollments
    const totalEnrollments = await prisma.enrollment.count();

    // Get average progress
    const enrollments = await prisma.enrollment.findMany({
      select: { progress: true }
    });
    const averageProgress = enrollments.length > 0
      ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
      : 0;

    // Get course statistics
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      include: {
        enrollments: {
          select: { progress: true }
        }
      }
    });

    const courseStats = courses.map(course => ({
      courseId: course.id,
      courseName: course.title,
      enrollmentCount: course.enrollments.length,
      averageProgress: course.enrollments.length > 0
        ? course.enrollments.reduce((sum, e) => sum + e.progress, 0) / course.enrollments.length
        : 0
    }));

    return NextResponse.json({
      totalUsers,
      totalCourses,
      totalEnrollments,
      averageProgress,
      courseStats,
      userActivity: [] // Placeholder for activity data
    });

  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}