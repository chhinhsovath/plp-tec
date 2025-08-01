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

    // Get user's enrollments with course details
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            modules: {
              select: {
                id: true,
                isPublished: true
              }
            },
            _count: {
              select: {
                modules: true,
                assessments: true,
                enrollments: true
              }
            }
          }
        }
      }
    });

    // Get assignments data
    const assignments = await prisma.assignmentSubmission.findMany({
      where: {
        userId,
        assignment: {
          module: {
            course: {
              enrollments: {
                some: { userId }
              }
            }
          }
        }
      },
      include: {
        assignment: {
          select: {
            module: {
              select: {
                course: {
                  select: {
                    title: true,
                    code: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Get assessments data
    const assessments = await prisma.assessmentAttempt.findMany({
      where: {
        userId,
        assessment: {
          course: {
            enrollments: {
              some: { userId }
            }
          }
        }
      },
      include: {
        assessment: {
          select: {
            passingMarks: true,
            course: {
              select: {
                title: true,
                code: true
              }
            }
          }
        }
      }
    });

    // Calculate overview statistics
    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.progress >= 100).length;
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(a => a.status === 'GRADED').length;
    const totalAssessments = assessments.filter(a => a.status === 'GRADED').length;
    const passedAssessments = assessments.filter(a => 
      a.status === 'GRADED' && a.score && a.score >= a.assessment.passingMarks
    ).length;
    const overallProgress = enrollments.length > 0 
      ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length 
      : 0;

    // Calculate study time (mock data - in real app, track actual time)
    const studyTimeHours = Math.round((completedAssignments * 2) + (totalAssessments * 1.5) + (totalCourses * 10));

    // Prepare course progress data
    const courseProgress = enrollments.map(enrollment => ({
      id: enrollment.course.id,
      code: enrollment.course.code,
      title: enrollment.course.title,
      progress: enrollment.progress,
      completedModules: Math.floor((enrollment.progress / 100) * enrollment.course.modules.length),
      totalModules: enrollment.course.modules.length,
      lastAccessed: enrollment.enrolledAt.toISOString(),
      instructor: `${enrollment.course.instructor.firstName} ${enrollment.course.instructor.lastName}`
    }));

    // Get recent activity
    const recentActivity = [
      ...assignments.slice(-5).map(assignment => ({
        id: assignment.id,
        type: 'ASSIGNMENT_SUBMIT' as const,
        title: `Assignment Submitted`,
        description: `Submitted assignment for ${assignment.assignment.module.course.title}`,
        timestamp: assignment.submittedAt.toISOString(),
        score: assignment.score || undefined
      })),
      ...assessments.slice(-5).map(assessment => ({
        id: assessment.id,
        type: 'ASSESSMENT_COMPLETE' as const,
        title: `Assessment Completed`,
        description: `Completed assessment for ${assessment.assessment.course.title}`,
        timestamp: assessment.submittedAt?.toISOString() || assessment.startedAt.toISOString(),
        score: assessment.score || undefined
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    // Get upcoming deadlines (mock data - replace with real assignment/assessment due dates)
    const upcomingDeadlines = [
      ...assignments.filter(a => a.status !== 'GRADED').slice(0, 3).map(assignment => ({
        id: assignment.id,
        type: 'ASSIGNMENT' as const,
        title: `Assignment Due`,
        course: assignment.assignment.module.course.title,
        dueDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'HIGH' as const
      })),
      ...assessments.filter(a => a.status !== 'GRADED').slice(0, 3).map(assessment => ({
        id: assessment.id,
        type: 'ASSESSMENT' as const,
        title: `Assessment Due`,
        course: assessment.assessment.course.title,
        dueDate: new Date(Date.now() + Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'MEDIUM' as const
      }))
    ].slice(0, 6);

    // Generate achievements based on progress
    const achievements = [];
    
    if (completedCourses >= 1) {
      achievements.push({
        id: 'first-course',
        title: 'First Steps',
        description: 'Completed your first course',
        icon: '🎯',
        earnedAt: enrollments.find(e => e.progress >= 100)?.completedAt?.toISOString() || new Date().toISOString(),
        category: 'Milestone'
      });
    }
    
    if (completedAssignments >= 5) {
      achievements.push({
        id: 'assignment-warrior',
        title: 'Assignment Warrior',
        description: 'Completed 5 assignments',
        icon: '📝',
        earnedAt: new Date().toISOString(),
        category: 'Academic'
      });
    }
    
    if (passedAssessments >= 3) {
      achievements.push({
        id: 'test-master',
        title: 'Test Master',
        description: 'Passed 3 assessments',
        icon: '🏆',
        earnedAt: new Date().toISOString(),
        category: 'Academic'
      });
    }
    
    if (studyTimeHours >= 50) {
      achievements.push({
        id: 'dedicated-learner',
        title: 'Dedicated Learner',
        description: 'Accumulated 50+ hours of study time',
        icon: '⏰',
        earnedAt: new Date().toISOString(),
        category: 'Dedication'
      });
    }

    const progressData = {
      overview: {
        totalCourses,
        completedCourses,
        totalAssignments,
        completedAssignments,
        totalAssessments,
        passedAssessments,
        overallProgress,
        studyTimeHours
      },
      courseProgress,
      recentActivity,
      upcomingDeadlines,
      achievements
    };

    return NextResponse.json(progressData);

  } catch (error) {
    console.error("Error fetching progress data:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress data" },
      { status: 500 }
    );
  }
}