'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Assessment {
  id: string;
  title: string;
  description: string;
  type: string;
  duration: number;
  totalQuestions: number;
  passingScore: number;
  maxAttempts: number;
  dueDate: string;
  isActive: boolean;
  module: {
    title: string;
    course: {
      title: string;
      code: string;
    };
  };
  attempts: {
    id: string;
    score: number;
    status: string;
    startedAt: string;
    completedAt?: string;
  }[];
}

export default function AssessmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
    else fetchAssessments();
  }, [session, status, router]);

  const fetchAssessments = async () => {
    try {
      const response = await fetch('/api/assessments');
      if (response.ok) {
        const data = await response.json();
        setAssessments(data);
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAssessmentStatus = (assessment: Assessment) => {
    if (assessment.attempts.length === 0) return 'not-started';
    
    const latestAttempt = assessment.attempts[assessment.attempts.length - 1];
    if (latestAttempt.status === 'IN_PROGRESS') return 'in-progress';
    if (latestAttempt.status === 'COMPLETED') {
      return latestAttempt.score >= assessment.passingScore ? 'passed' : 'failed';
    }
    return 'not-started';
  };

  const getStatusBadge = (assessment: Assessment) => {
    const status = getAssessmentStatus(assessment);
    const statusConfig = {
      'not-started': { class: 'badge-neutral', text: 'Not Started' },
      'in-progress': { class: 'badge-warning', text: 'In Progress' },
      'passed': { class: 'badge-success', text: 'Passed' },
      'failed': { class: 'badge-error', text: 'Failed' }
    };
    
    const config = statusConfig[status];
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const canTakeAssessment = (assessment: Assessment) => {
    if (!assessment.isActive) return false;
    if (new Date() > new Date(assessment.dueDate)) return false;
    
    const completedAttempts = assessment.attempts.filter(a => a.status === 'COMPLETED').length;
    return completedAttempts < assessment.maxAttempts;
  };

  const getAttemptsText = (assessment: Assessment) => {
    const completedAttempts = assessment.attempts.filter(a => a.status === 'COMPLETED').length;
    return `${completedAttempts}/${assessment.maxAttempts} attempts`;
  };

  const getBestScore = (assessment: Assessment) => {
    if (assessment.attempts.length === 0) return null;
    const completedAttempts = assessment.attempts.filter(a => a.status === 'COMPLETED');
    if (completedAttempts.length === 0) return null;
    return Math.max(...completedAttempts.map(a => a.score));
  };

  const filteredAssessments = assessments.filter(assessment => {
    const status = getAssessmentStatus(assessment);
    switch (filter) {
      case 'available':
        return canTakeAssessment(assessment) && status === 'not-started';
      case 'completed':
        return status === 'passed' || status === 'failed';
      case 'passed':
        return status === 'passed';
      case 'in-progress':
        return status === 'in-progress';
      default:
        return true;
    }
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
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
          <span className="text-lg font-medium">Assessments & Quizzes</span>
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
      <div className="container mx-auto p-6">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold">Assessments & Quizzes</h1>
            <p className="text-base-content/70 mt-2">Take tests and track your progress</p>
          </div>
          <div className="form-control">
            <select 
              className="select select-bordered w-full max-w-xs"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Assessments</option>
              <option value="available">Available</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="passed">Passed</option>
            </select>
          </div>
        </div>

        {/* Assessments Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAssessments.map((assessment) => (
            <div key={assessment.id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="card-title text-xl">{assessment.title}</h2>
                    <p className="text-sm opacity-70 mb-2">
                      {assessment.module.course.code} - {assessment.module.title}
                    </p>
                  </div>
                  {getStatusBadge(assessment)}
                </div>

                <p className="text-base-content/80 mb-4 line-clamp-3">
                  {assessment.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="stat bg-base-200 rounded-lg p-3">
                    <div className="stat-title text-xs">Questions</div>
                    <div className="stat-value text-lg">{assessment.totalQuestions}</div>
                  </div>
                  <div className="stat bg-base-200 rounded-lg p-3">
                    <div className="stat-title text-xs">Duration</div>
                    <div className="stat-value text-lg">{assessment.duration}m</div>
                  </div>
                  <div className="stat bg-base-200 rounded-lg p-3">
                    <div className="stat-title text-xs">Passing Score</div>
                    <div className="stat-value text-lg">{assessment.passingScore}%</div>
                  </div>
                  <div className="stat bg-base-200 rounded-lg p-3">
                    <div className="stat-title text-xs">Attempts</div>
                    <div className="stat-value text-lg">{getAttemptsText(assessment)}</div>
                  </div>
                </div>

                {getBestScore(assessment) && (
                  <div className="alert alert-info mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Best Score: {getBestScore(assessment)}%</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm opacity-70 mb-4">
                  <span>Due: {new Date(assessment.dueDate).toLocaleDateString()}</span>
                  <span className="badge badge-outline">{assessment.type}</span>
                </div>

                <div className="card-actions justify-end">
                  <Link
                    href={`/assessments/${assessment.id}`}
                    className="btn btn-outline btn-sm"
                  >
                    View Details
                  </Link>
                  {canTakeAssessment(assessment) && (
                    <Link
                      href={`/assessments/${assessment.id}/take`}
                      className="btn btn-primary btn-sm"
                    >
                      {assessment.attempts.some(a => a.status === 'IN_PROGRESS') ? 'Continue' : 'Start Assessment'}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAssessments.length === 0 && (
          <div className="hero min-h-96">
            <div className="hero-content text-center">
              <div className="max-w-md">
                <div className="text-6xl mb-4">📝</div>
                <h1 className="text-2xl font-bold">No assessments found</h1>
                <p className="py-4 opacity-70">
                  {filter === 'all' 
                    ? 'You have no assessments at the moment.'
                    : `No assessments match the "${filter}" filter.`
                  }
                </p>
                <Link href="/courses" className="btn btn-primary">
                  Browse Courses
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}