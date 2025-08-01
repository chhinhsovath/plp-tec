'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ProgressData {
  overview: {
    totalCourses: number;
    completedCourses: number;
    totalAssignments: number;
    completedAssignments: number;
    totalAssessments: number;
    passedAssessments: number;
    overallProgress: number;
    studyTimeHours: number;
  };
  courseProgress: {
    id: string;
    code: string;
    title: string;
    progress: number;
    completedModules: number;
    totalModules: number;
    lastAccessed: string;
    instructor: string;
  }[];
  recentActivity: {
    id: string;
    type: 'COURSE_ACCESS' | 'ASSIGNMENT_SUBMIT' | 'ASSESSMENT_COMPLETE' | 'RESOURCE_VIEW';
    title: string;
    description: string;
    timestamp: string;
    score?: number;
  }[];
  upcomingDeadlines: {
    id: string;
    type: 'ASSIGNMENT' | 'ASSESSMENT';
    title: string;
    course: string;
    dueDate: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  achievements: {
    id: string;
    title: string;
    description: string;
    icon: string;
    earnedAt: string;
    category: string;
  }[];
}

export default function ProgressDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
    else fetchProgressData();
  }, [session, status, router]);

  const fetchProgressData = async () => {
    try {
      const response = await fetch('/api/progress');
      if (response.ok) {
        const data = await response.json();
        setProgressData(data);
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'progress-success';
    if (progress >= 60) return 'progress-info';
    if (progress >= 40) return 'progress-warning';
    return 'progress-error';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'badge-error';
      case 'MEDIUM': return 'badge-warning';
      case 'LOW': return 'badge-info';
      default: return 'badge-neutral';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'COURSE_ACCESS': return '📚';
      case 'ASSIGNMENT_SUBMIT': return '📝';
      case 'ASSESSMENT_COMPLETE': return '🎯';
      case 'RESOURCE_VIEW': return '📄';
      default: return '📌';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold mb-2">No Progress Data</h2>
          <p className="text-base-content/70 mb-4">Start taking courses to see your progress!</p>
          <Link href="/courses" className="btn btn-primary">Browse Courses</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200" data-theme="plp">
      {/* Navigation */}
      <div className="navbar bg-base-100 shadow-lg">
        <div className="navbar-start">
          <Link href="/dashboard" className="btn btn-ghost text-xl">
            PLP TEC LMS
          </Link>
        </div>
        <div className="navbar-center">
          <span className="text-lg font-medium">Learning Progress</span>
        </div>
        <div className="navbar-end">
          <Link href="/dashboard" className="btn btn-ghost">
            Dashboard
          </Link>
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                {session?.user?.email?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">📊 Your Learning Journey</h1>
          <p className="text-base-content/70 text-sm lg:text-base">
            Track your progress, achievements, and upcoming deadlines
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card bg-gradient-to-br from-primary to-primary-focus text-primary-content shadow-lg">
            <div className="card-body p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl lg:text-3xl font-bold">
                    {progressData.overview.totalCourses}
                  </div>
                  <div className="text-xs lg:text-sm opacity-90">Total Courses</div>
                </div>
                <div className="text-2xl lg:text-3xl opacity-80">📚</div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-success to-success-focus text-success-content shadow-lg">
            <div className="card-body p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl lg:text-3xl font-bold">
                    {Math.round(progressData.overview.overallProgress)}%
                  </div>
                  <div className="text-xs lg:text-sm opacity-90">Overall Progress</div>
                </div>
                <div className="text-2xl lg:text-3xl opacity-80">🎯</div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-info to-info-focus text-info-content shadow-lg">
            <div className="card-body p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl lg:text-3xl font-bold">
                    {progressData.overview.completedAssignments}
                  </div>
                  <div className="text-xs lg:text-sm opacity-90">Assignments Done</div>
                </div>
                <div className="text-2xl lg:text-3xl opacity-80">📝</div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-warning to-warning-focus text-warning-content shadow-lg">
            <div className="card-body p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl lg:text-3xl font-bold">
                    {progressData.overview.studyTimeHours}h
                  </div>
                  <div className="text-xs lg:text-sm opacity-90">Study Time</div>
                </div>
                <div className="text-2xl lg:text-3xl opacity-80">⏱️</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-bordered tabs-lg mb-8 overflow-x-auto">
          <button 
            className={`tab tab-lg ${activeTab === 'overview' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab tab-lg ${activeTab === 'courses' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            Course Progress
          </button>
          <button 
            className={`tab tab-lg ${activeTab === 'activity' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Recent Activity
          </button>
          <button 
            className={`tab tab-lg ${activeTab === 'deadlines' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('deadlines')}
          >
            Deadlines
          </button>
          <button 
            className={`tab tab-lg ${activeTab === 'achievements' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            Achievements
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Summary */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">📈 Progress Summary</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Course Completion</span>
                      <span>{progressData.overview.completedCourses}/{progressData.overview.totalCourses}</span>
                    </div>
                    <progress 
                      className="progress progress-primary w-full" 
                      value={progressData.overview.completedCourses} 
                      max={progressData.overview.totalCourses || 1}
                    ></progress>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Assignment Completion</span>
                      <span>{progressData.overview.completedAssignments}/{progressData.overview.totalAssignments}</span>
                    </div>
                    <progress 
                      className="progress progress-info w-full" 
                      value={progressData.overview.completedAssignments} 
                      max={progressData.overview.totalAssignments || 1}
                    ></progress>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Assessment Success</span>
                      <span>{progressData.overview.passedAssessments}/{progressData.overview.totalAssessments}</span>
                    </div>
                    <progress 
                      className="progress progress-success w-full" 
                      value={progressData.overview.passedAssessments} 
                      max={progressData.overview.totalAssessments || 1}
                    ></progress>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">⚡ Quick Stats</h2>
                <div className="stats stats-vertical lg:stats-horizontal shadow">
                  <div className="stat">
                    <div className="stat-title">Completion Rate</div>
                    <div className="stat-value text-primary">
                      {Math.round((progressData.overview.completedCourses / (progressData.overview.totalCourses || 1)) * 100)}%
                    </div>
                  </div>
                  
                  <div className="stat">
                    <div className="stat-title">Success Rate</div>
                    <div className="stat-value text-success">
                      {Math.round((progressData.overview.passedAssessments / (progressData.overview.totalAssessments || 1)) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {progressData.courseProgress.map((course) => (
              <div key={course.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                <div className="card-body p-4 lg:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-sm lg:text-base">{course.code}</h3>
                      <p className="text-xs lg:text-sm text-base-content/70 line-clamp-2">{course.title}</p>
                    </div>
                    <div className={`radial-progress text-xs ${getProgressColor(course.progress)}`} 
                         style={{"--value": course.progress, "--size": "3rem"} as any}>
                      {course.progress}%
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs lg:text-sm">
                    <div className="flex justify-between">
                      <span>Modules:</span>
                      <span>{course.completedModules}/{course.totalModules}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Instructor:</span>
                      <span className="truncate ml-2">{course.instructor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Access:</span>
                      <span>{new Date(course.lastAccessed).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="card-actions justify-end mt-4">
                    <Link href={`/courses/${course.id}`} className="btn btn-primary btn-sm">
                      Continue
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title">🔄 Recent Activity</h2>
              <div className="space-y-4">
                {progressData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg bg-base-200 hover:bg-base-300 transition-colors">
                    <div className="text-2xl lg:text-3xl">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm lg:text-base truncate">{activity.title}</h4>
                      <p className="text-xs lg:text-sm text-base-content/70 line-clamp-2">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-base-content/60">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                        {activity.score && (
                          <span className="badge badge-success badge-sm">
                            Score: {activity.score}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deadlines' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {progressData.upcomingDeadlines.map((deadline) => (
              <div key={deadline.id} className="card bg-base-100 shadow-lg">
                <div className="card-body p-4 lg:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm lg:text-base truncate">{deadline.title}</h3>
                      <p className="text-xs lg:text-sm text-base-content/70">{deadline.course}</p>
                    </div>
                    <span className={`badge badge-sm ${getPriorityColor(deadline.priority)}`}>
                      {deadline.priority}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs lg:text-sm">
                      Due: {new Date(deadline.dueDate).toLocaleDateString()}
                    </span>
                    <span className={`badge badge-outline badge-sm ${deadline.type === 'ASSIGNMENT' ? 'badge-warning' : 'badge-error'}`}>
                      {deadline.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {progressData.achievements.map((achievement) => (
              <div key={achievement.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                <div className="card-body items-center text-center p-4 lg:p-6">
                  <div className="text-4xl lg:text-5xl mb-4">{achievement.icon}</div>
                  <h3 className="font-bold text-sm lg:text-base mb-2">{achievement.title}</h3>
                  <p className="text-xs lg:text-sm text-base-content/70 mb-4 line-clamp-3">{achievement.description}</p>
                  <div className="badge badge-outline badge-sm">{achievement.category}</div>
                  <div className="text-xs text-base-content/60 mt-2">
                    Earned: {new Date(achievement.earnedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}