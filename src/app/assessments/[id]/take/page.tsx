'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

interface Question {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
  question: string;
  options?: string[];
  points: number;
  order: number;
}

interface Assessment {
  id: string;
  title: string;
  duration: number;
  totalQuestions: number;
  questions: Question[];
}

interface AttemptData {
  id: string;
  startedAt: string;
  timeRemaining: number;
  answers: Record<string, any>;
}

export default function TakeAssessmentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.id as string;
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
    else fetchAssessmentAndAttempt();
  }, [session, status, router, assessmentId]);

  useEffect(() => {
    if (timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmit(true); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeRemaining]);

  useEffect(() => {
    // Auto-save answers every 30 seconds
    if (attempt) {
      autoSaveRef.current = setInterval(() => {
        autoSaveAnswers();
      }, 30000);
    }

    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [answers, attempt]);

  const fetchAssessmentAndAttempt = async () => {
    try {
      // First get the assessment
      const assessmentRes = await fetch(`/api/assessments/${assessmentId}/take`);
      if (!assessmentRes.ok) {
        router.push(`/assessments/${assessmentId}`);
        return;
      }
      
      const data = await assessmentRes.json();
      setAssessment(data.assessment);
      
      if (data.attempt) {
        // Existing attempt
        setAttempt(data.attempt);
        setAnswers(data.attempt.answers || {});
        setTimeRemaining(data.attempt.timeRemaining);
      } else {
        // Create new attempt
        const newAttemptRes = await fetch(`/api/assessments/${assessmentId}/start`, {
          method: 'POST'
        });
        
        if (newAttemptRes.ok) {
          const newAttempt = await newAttemptRes.json();
          setAttempt(newAttempt);
          setTimeRemaining(data.assessment.duration * 60); // Convert minutes to seconds
        }
      }
    } catch (error) {
      console.error('Error fetching assessment:', error);
      router.push('/assessments');
    } finally {
      setLoading(false);
    }
  };

  const autoSaveAnswers = async () => {
    if (!attempt || autoSaving) return;
    
    setAutoSaving(true);
    try {
      await fetch(`/api/assessments/${assessmentId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: attempt.id,
          answers,
          timeRemaining
        })
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (submitting) return;
    
    if (!autoSubmit) {
      const confirmSubmit = window.confirm(
        'Are you sure you want to submit your assessment? You cannot change your answers after submission.'
      );
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: attempt?.id,
          answers
        })
      });

      if (response.ok) {
        router.push(`/assessments/${assessmentId}/results`);
      } else {
        alert('Failed to submit assessment. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert('Failed to submit assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining > 600) return 'text-success'; // > 10 minutes
    if (timeRemaining > 300) return 'text-warning'; // > 5 minutes
    return 'text-error'; // < 5 minutes
  };

  const renderQuestion = (question: Question) => {
    const currentAnswer = answers[question.id];

    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="label cursor-pointer justify-start gap-3">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={currentAnswer === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="radio radio-primary"
                />
                <span className="label-text">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'TRUE_FALSE':
        return (
          <div className="space-y-3">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="radio"
                name={question.id}
                value="true"
                checked={currentAnswer === 'true'}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="radio radio-primary"
              />
              <span className="label-text">True</span>
            </label>
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="radio"
                name={question.id}
                value="false"
                checked={currentAnswer === 'false'}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="radio radio-primary"
              />
              <span className="label-text">False</span>
            </label>
          </div>
        );

      case 'SHORT_ANSWER':
        return (
          <input
            type="text"
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="input input-bordered w-full"
            placeholder="Enter your answer..."
          />
        );

      case 'ESSAY':
        return (
          <textarea
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="textarea textarea-bordered w-full h-32"
            placeholder="Enter your detailed answer..."
          />
        );

      default:
        return <div>Unknown question type</div>;
    }
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).filter(key => answers[key] && answers[key] !== '').length;
  };

  if (status === 'loading' || loading || !assessment || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const question = assessment.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-base-200" data-theme="plp">
      {/* Fixed Header */}
      <div className="navbar bg-base-100 shadow-lg sticky top-0 z-50">
        <div className="navbar-start">
          <h1 className="text-xl font-bold">{assessment.title}</h1>
        </div>
        <div className="navbar-center">
          <div className="flex items-center gap-4">
            <span className="text-sm">
              Question {currentQuestion + 1} of {assessment.totalQuestions}
            </span>
            <div className="divider divider-horizontal"></div>
            <span className="text-sm">
              Answered: {getAnsweredCount()}/{assessment.totalQuestions}
            </span>
          </div>
        </div>
        <div className="navbar-end">
          <div className="flex items-center gap-4">
            {autoSaving && (
              <span className="text-xs text-base-content/60 flex items-center gap-1">
                <span className="loading loading-spinner loading-xs"></span>
                Saving...
              </span>
            )}
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`font-mono text-lg font-bold ${getTimeColor()}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="card bg-base-100 shadow-lg sticky top-24">
              <div className="card-body">
                <h3 className="card-title text-sm">Question Navigation</h3>
                <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                  {assessment.questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestion(index)}
                      className={`btn btn-sm ${
                        index === currentQuestion
                          ? 'btn-primary'
                          : answers[assessment.questions[index].id]
                          ? 'btn-success btn-outline'
                          : 'btn-ghost'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-base-content/60 mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="btn btn-primary btn-xs"></div>
                    <span>Current</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="btn btn-success btn-outline btn-xs"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="btn btn-ghost btn-xs"></div>
                    <span>Unanswered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-sm text-base-content/60 mb-2">
                      Question {currentQuestion + 1} of {assessment.totalQuestions}
                    </h2>
                    <div className="badge badge-outline">{question.points} points</div>
                  </div>
                  <div className="badge badge-neutral">{question.type.replace('_', ' ')}</div>
                </div>

                <div className="prose max-w-none mb-6">
                  <h3 className="text-lg font-medium mb-4">{question.question}</h3>
                  {renderQuestion(question)}
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                    disabled={currentQuestion === 0}
                    className="btn btn-outline"
                  >
                    Previous
                  </button>

                  <div className="flex gap-2">
                    {currentQuestion === assessment.questions.length - 1 ? (
                      <button
                        onClick={() => handleSubmit(false)}
                        disabled={submitting}
                        className="btn btn-success"
                      >
                        {submitting ? (
                          <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Submitting...
                          </>
                        ) : (
                          'Submit Assessment'
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => setCurrentQuestion(Math.min(assessment.questions.length - 1, currentQuestion + 1))}
                        className="btn btn-primary"
                      >
                        Next
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-base-content/60 mb-2">
                <span>Progress</span>
                <span>{Math.round(((currentQuestion + 1) / assessment.totalQuestions) * 100)}%</span>
              </div>
              <progress 
                className="progress progress-primary w-full" 
                value={currentQuestion + 1} 
                max={assessment.totalQuestions}
              ></progress>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Modal for Time Running Out */}
      {timeRemaining <= 300 && timeRemaining > 0 && (
        <div className="toast toast-top toast-center">
          <div className="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>Only {Math.floor(timeRemaining / 60)} minutes remaining!</span>
          </div>
        </div>
      )}
    </div>
  );
}