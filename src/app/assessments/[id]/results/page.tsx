'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface QuestionResult {
  id: string;
  question: string;
  type: string;
  correctAnswer?: string;
  userAnswer?: string;
  isCorrect: boolean;
  points: number;
  earnedPoints: number;
}

interface AssessmentResult {
  assessment: {
    id: string;
    title: string;
    passingScore: number;
    totalQuestions: number;
    module: {
      title: string;
      course: {
        title: string;
        code: string;
      };
    };
  };
  attempt: {
    id: string;
    score: number;
    totalPoints: number;
    earnedPoints: number;
    status: string;
    startedAt: string;
    completedAt: string;
    timeSpent: number;
  };
  questions: QuestionResult[];
}

export default function AssessmentResultsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.id as string;
  
  const [results, setResults] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
    else fetchResults();
  }, [session, status, router, assessmentId]);

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/results`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else if (response.status === 404) {
        router.push(`/assessments/${assessmentId}`);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      router.push('/assessments');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const getScoreColor = (score: number, passingScore: number) => {
    if (score >= passingScore) return 'text-success';
    if (score >= passingScore * 0.7) return 'text-warning';
    return 'text-error';
  };

  const getPerformanceLevel = (score: number, passingScore: number) => {
    if (score >= 90) return { level: 'Excellent', class: 'badge-success' };
    if (score >= passingScore) return { level: 'Good', class: 'badge-success' };
    if (score >= passingScore * 0.7) return { level: 'Needs Improvement', class: 'badge-warning' };
    return { level: 'Unsatisfactory', class: 'badge-error' };
  };

  if (status === 'loading' || loading || !results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const { assessment, attempt, questions } = results;
  const passed = attempt.score >= assessment.passingScore;
  const performance = getPerformanceLevel(attempt.score, assessment.passingScore);

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
              <li><Link href={`/assessments/${assessmentId}`}>{assessment.title}</Link></li>
              <li>Results</li>
            </ul>
          </div>
        </div>
        <div className="navbar-end">
          <span className="text-sm mr-4">Welcome, {session?.user?.email}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Results Header */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body text-center">
            <div className="mb-6">
              {passed ? (
                <div className="text-6xl mb-4">🎉</div>
              ) : (
                <div className="text-6xl mb-4">📚</div>
              )}
              <h1 className="text-3xl font-bold mb-2">
                {passed ? 'Congratulations!' : 'Assessment Complete'}
              </h1>
              <p className="text-base-content/70">
                {passed 
                  ? 'You have successfully passed the assessment!'
                  : 'Keep studying and try again when you\'re ready.'
                }
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-figure">
                  <div className={`radial-progress ${getScoreColor(attempt.score, assessment.passingScore)}`} 
                       style={{"--value": attempt.score, "--size": "4rem"} as any}>
                    {Math.round(attempt.score)}%
                  </div>
                </div>
                <div className="stat-title">Your Score</div>
                <div className={`stat-value text-2xl ${getScoreColor(attempt.score, assessment.passingScore)}`}>
                  {Math.round(attempt.score)}%
                </div>
                <div className="stat-desc">
                  {attempt.earnedPoints}/{attempt.totalPoints} points
                </div>
              </div>

              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">Performance</div>
                <div className="stat-value text-xl">
                  <span className={`badge ${performance.class} text-sm`}>
                    {performance.level}
                  </span>
                </div>
                <div className="stat-desc">
                  Passing Score: {assessment.passingScore}%
                </div>
              </div>

              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">Time Spent</div>
                <div className="stat-value text-xl">
                  {formatDuration(attempt.timeSpent)}
                </div>
                <div className="stat-desc">
                  Completed: {new Date(attempt.completedAt).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="alert alert-info">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <h3 className="font-bold">Assessment: {assessment.title}</h3>
                <div className="text-xs">{assessment.module.course.code} - {assessment.module.title}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Question Details Toggle */}
        <div className="card bg-base-100 shadow-lg mb-6">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <h2 className="card-title">Question Review</h2>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="btn btn-outline btn-sm"
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            
            {showDetails && (
              <div className="mt-6 space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="card bg-base-200 shadow">
                    <div className="card-body">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold">Question {index + 1}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${question.isCorrect ? 'badge-success' : 'badge-error'}`}>
                            {question.earnedPoints}/{question.points} points
                          </span>
                          {question.isCorrect ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-error" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      
                      <p className="mb-4">{question.question}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium text-sm">Your Answer:</span>
                          <span className={`text-sm ${question.isCorrect ? 'text-success' : 'text-error'}`}>
                            {question.userAnswer || 'No answer provided'}
                          </span>
                        </div>
                        
                        {!question.isCorrect && question.correctAnswer && (
                          <div className="flex justify-between">
                            <span className="font-medium text-sm">Correct Answer:</span>
                            <span className="text-sm text-success">
                              {question.correctAnswer}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Link
            href={`/assessments/${assessmentId}`}
            className="btn btn-outline"
          >
            Back to Assessment
          </Link>
          <Link
            href="/assessments"
            className="btn btn-primary"
          >
            View All Assessments
          </Link>
          {!passed && (
            <Link
              href={`/courses`}
              className="btn btn-secondary"
            >
              Study Materials
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}