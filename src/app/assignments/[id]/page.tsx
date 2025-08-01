'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  dueDate: string;
  points: number;
  type: string;
  status: string;
  attachments?: string[];
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
  submission?: {
    id: string;
    content: string;
    attachments?: string[];
    submittedAt: string;
    grade?: number;
    feedback?: string;
    status: string;
  };
}

export default function AssignmentDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
    else fetchAssignment();
  }, [session, status, router, assignmentId]);

  const fetchAssignment = async () => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`);
      if (response.ok) {
        const data = await response.json();
        setAssignment(data);
      } else if (response.status === 404) {
        router.push('/assignments');
      }
    } catch (error) {
      console.error('Error fetching assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (assignment: Assignment) => {
    if (assignment.submission) {
      switch (assignment.submission.status) {
        case 'GRADED':
          return 'bg-green-100 text-green-800';
        case 'SUBMITTED':
          return 'bg-blue-100 text-blue-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }
    
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    
    if (dueDate < now) {
      return 'bg-red-100 text-red-800';
    } else if (dueDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  const getStatusText = (assignment: Assignment) => {
    if (assignment.submission) {
      switch (assignment.submission.status) {
        case 'GRADED':
          return 'Graded';
        case 'SUBMITTED':
          return 'Submitted';
        default:
          return 'Draft';
      }
    }
    
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    
    if (dueDate < now) {
      return 'Overdue';
    } else if (dueDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return 'Due Soon';
    }
    return 'Pending';
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const canSubmit = (assignment: Assignment) => {
    return !assignment.submission && !isOverdue(assignment.dueDate);
  };

  if (status === 'loading' || loading || !assignment) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-semibold">
                PLP TEC LMS
              </Link>
              <span className="ml-4 text-gray-400">/</span>
              <Link href="/assignments" className="ml-4 text-gray-600 hover:text-gray-900">
                Assignments
              </Link>
              <span className="ml-4 text-gray-400">/</span>
              <span className="ml-4 text-gray-600">{assignment.title}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {session?.user?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Assignment Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
                <p className="text-gray-600">
                  {assignment.module.course.code} - {assignment.module.title}
                </p>
                <p className="text-sm text-gray-500">
                  Instructor: {assignment.module.course.instructor.firstName} {assignment.module.course.instructor.lastName}
                </p>
              </div>
              <span className={`px-4 py-2 text-sm font-medium rounded-full ${getStatusColor(assignment)}`}>
                {getStatusText(assignment)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Due Date</h4>
                <p className="text-lg font-semibold">
                  {new Date(assignment.dueDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(assignment.dueDate).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Points</h4>
                <p className="text-lg font-semibold">{assignment.points}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Type</h4>
                <p className="text-lg font-semibold capitalize">{assignment.type}</p>
              </div>
            </div>
          </div>

          {/* Assignment Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
                </div>
              </div>

              {/* Instructions */}
              {assignment.instructions && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Instructions</h2>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{assignment.instructions}</p>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {assignment.attachments && assignment.attachments.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Attachments</h2>
                  <div className="space-y-2">
                    {assignment.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center p-3 border rounded-lg">
                        <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <a href={attachment} className="text-blue-600 hover:text-blue-700" target="_blank" rel="noopener noreferrer">
                          {attachment.split('/').pop()}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submission */}
              {assignment.submission && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Your Submission</h2>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Submitted: {new Date(assignment.submission.submittedAt).toLocaleString()}
                    </p>
                    {assignment.submission.grade && (
                      <p className="text-lg font-semibold text-green-600">
                        Grade: {assignment.submission.grade}/{assignment.points}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Content:</h4>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="whitespace-pre-wrap">{assignment.submission.content}</p>
                    </div>
                  </div>

                  {assignment.submission.attachments && assignment.submission.attachments.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Submitted Files:</h4>
                      <div className="space-y-2">
                        {assignment.submission.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center p-2 border rounded">
                            <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <a href={attachment} className="text-blue-600 hover:text-blue-700 text-sm" target="_blank" rel="noopener noreferrer">
                              {attachment.split('/').pop()}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {assignment.submission.feedback && (
                    <div>
                      <h4 className="font-medium mb-2">Instructor Feedback:</h4>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-blue-900 whitespace-pre-wrap">{assignment.submission.feedback}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                <h3 className="text-lg font-semibold mb-4">Actions</h3>
                
                {canSubmit(assignment) ? (
                  <Link
                    href={`/assignments/${assignment.id}/submit`}
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center block"
                  >
                    Submit Assignment
                  </Link>
                ) : assignment.submission ? (
                  <div className="text-center">
                    <p className="text-green-600 font-medium mb-2">✓ Submitted</p>
                    {assignment.submission.status === 'SUBMITTED' && (
                      <p className="text-sm text-gray-600">Waiting for grade</p>
                    )}
                  </div>
                ) : isOverdue(assignment.dueDate) ? (
                  <div className="text-center">
                    <p className="text-red-600 font-medium mb-2">Assignment Overdue</p>
                    <p className="text-sm text-gray-600">Submission deadline has passed</p>
                  </div>
                ) : null}

                <div className="mt-6 pt-6 border-t">
                  <Link
                    href="/assignments"
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                  >
                    ← Back to Assignments
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}