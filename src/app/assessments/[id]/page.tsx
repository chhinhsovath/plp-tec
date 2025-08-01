'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Assessment {
  id: string;
  title: string;
  description: string;
  instructions: string;
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
      instructor: {
        firstName: string;
        lastName: string;
      };
    };
  };
  attempts: {
    id: string;
    score: number;
    status: string;
    startedAt: string;
    completedAt?: string;
    answers: any[];
  }[];
  questions: {
    id: string;
    type: string;
    question: string;
    options?: string[];
    correctAnswer?: string;
    points: number;
    order: number;
  }[];
}

export default function AssessmentDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.id as string;
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
    else fetchAssessment();
  }, [session, status, router, assessmentId]);

  const fetchAssessment = async () => {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}`);
      if (response.ok) {
        const data = await response.json();
        setAssessment(data);
      } else if (response.status === 404) {
        router.push('/assessments');
      }
    } catch (error) {
      console.error('Error fetching assessment:', error);
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

  const canTakeAssessment = (assessment: Assessment) => {
    if (!assessment.isActive) return false;
    if (new Date() > new Date(assessment.dueDate)) return false;
    
    const completedAttempts = assessment.attempts.filter(a => a.status === 'COMPLETED').length;
    return completedAttempts < assessment.maxAttempts;
  };

  const getBestScore = (assessment: Assessment) => {
    if (assessment.attempts.length === 0) return null;
    const completedAttempts = assessment.attempts.filter(a => a.status === 'COMPLETED');
    if (completedAttempts.length === 0) return null;
    return Math.max(...completedAttempts.map(a => a.score));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'not-started': { class: 'badge-neutral', text: 'Not Started' },
      'in-progress': { class: 'badge-warning', text: 'In Progress' },
      'passed': { class: 'badge-success', text: 'Passed' },
      'failed': { class: 'badge-error', text: 'Failed' }
    };
    
    const config = statusConfig[status];
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  if (status === 'loading' || loading || !assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const status_val = getAssessmentStatus(assessment);
  const bestScore = getBestScore(assessment);

  return (
    <div className="min-h-screen bg-base-200" data-theme="plp">
      {/* Navigation */}
      <div className="navbar bg-base-100 shadow-lg">
        <div className="navbar-start">
          <Link href="/dashboard" className="btn btn-ghost text-xl">
            PLP TEC LMS
          </Link>
          <div className="breadcrumbs text-sm ml-4">
            <ul>
              <li><Link href="/assessments">Assessments</Link></li>
              <li>{assessment.title}</li>
            </ul>
          </div>
        </div>
        <div className="navbar-end">
          <span className="text-sm mr-4">Welcome, {session?.user?.email}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Assessment Header Card */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{assessment.title}</h1>
                <p className="text-base-content/70">
                  {assessment.module.course.code} - {assessment.module.title}
                </p>
                <p className="text-sm text-base-content/60">
                  Instructor: {assessment.module.course.instructor.firstName} {assessment.module.course.instructor.lastName}
                </p>
              </div>
              {getStatusBadge(status_val)}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">Questions</div>
                <div className="stat-value text-2xl">{assessment.totalQuestions}</div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">Duration</div>
                <div className="stat-value text-2xl">{assessment.duration}m</div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">Passing Score</div>
                <div className="stat-value text-2xl">{assessment.passingScore}%</div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">Attempts</div>
                <div className="stat-value text-2xl">
                  {assessment.attempts.filter(a => a.status === 'COMPLETED').length}/{assessment.maxAttempts}
                </div>
              </div>
            </div>

            {bestScore && (
              <div className="alert alert-success mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Your Best Score: {bestScore}%</span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm">
              <span className="badge badge-outline">{assessment.type}</span>
              <span>Due: {new Date(assessment.dueDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">Description</h2>
                <p className="text-base-content/80 whitespace-pre-wrap">{assessment.description}</p>
              </div>
            </div>

            {/* Instructions */}
            {assessment.instructions && (
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h2 className="card-title">Instructions</h2>
                  <div className="prose max-w-none">
                    <p className="text-base-content/80 whitespace-pre-wrap">{assessment.instructions}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Previous Attempts */}
            {assessment.attempts.length > 0 && (
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h2 className="card-title">Previous Attempts</h2>
                  <div className="overflow-x-auto">
                    <table className="table table-zebra">
                      <thead>
                        <tr>
                          <th>Attempt</th>
                          <th>Score</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assessment.attempts.map((attempt, index) => (
                          <tr key={attempt.id}>
                            <td>{index + 1}</td>
                            <td>
                              {attempt.status === 'COMPLETED' ? (
                                <span className={`badge ${attempt.score >= assessment.passingScore ? 'badge-success' : 'badge-error'}`}>
                                  {attempt.score}%
                                </span>
                              ) : (
                                <span className="badge badge-warning">In Progress</span>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${
                                attempt.status === 'COMPLETED' 
                                  ? attempt.score >= assessment.passingScore 
                                    ? 'badge-success' 
                                    : 'badge-error'
                                  : 'badge-warning'
                              }`}>
                                {attempt.status === 'COMPLETED' 
                                  ? attempt.score >= assessment.passingScore ? 'Passed' : 'Failed'
                                  : 'In Progress'
                                }
                              </span>
                            </td>
                            <td>{new Date(attempt.startedAt).toLocaleDateString()}</td>
                            <td>
                              {attempt.completedAt 
                                ? `${Math.round((new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime()) / 60000)}m`
                                : 'N/A'
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card bg-base-100 shadow-lg sticky top-6">
              <div className="card-body">
                <h3 className="card-title text-lg">Actions</h3>
                
                {canTakeAssessment(assessment) ? (
                  <Link
                    href={`/assessments/${assessment.id}/take`}
                    className="btn btn-primary btn-block"
                  >
                    {assessment.attempts.some(a => a.status === 'IN_PROGRESS') ? 'Continue Assessment' : 'Start Assessment'}
                  </Link>
                ) : assessment.attempts.length > 0 ? (
                  <div className="text-center">
                    <div className="alert alert-info">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>Maximum attempts reached</span>
                    </div>
                  </div>
                ) : new Date() > new Date(assessment.dueDate) ? (
                  <div className="text-center">
                    <div className="alert alert-error">
                      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Assessment deadline passed</span>
                    </div>
                  </div>
                ) : null}

                <div className="divider"></div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Type:</span>
                    <span className="font-medium">{assessment.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Questions:</span>
                    <span className="font-medium">{assessment.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Time Limit:</span>
                    <span className="font-medium">{assessment.duration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Passing Score:</span>
                    <span className="font-medium">{assessment.passingScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Max Attempts:</span>
                    <span className="font-medium">{assessment.maxAttempts}</span>
                  </div>
                </div>

                <div className="divider"></div>

                <Link
                  href="/assessments"
                  className="btn btn-outline btn-sm"
                >
                  ← Back to Assessments
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}