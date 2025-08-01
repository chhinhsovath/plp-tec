'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  type: string;
  status: string;
  module: {
    title: string;
    course: {
      title: string;
      code: string;
    };
  };
  submission?: {
    id: string;
    submittedAt: string;
    grade?: number;
    feedback?: string;
    status: string;
  };
}

export default function AssignmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
    else fetchAssignments();
  }, [session, status, router]);

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/assignments');
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
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

  const filteredAssignments = assignments.filter(assignment => {
    switch (filter) {
      case 'pending':
        return !assignment.submission;
      case 'submitted':
        return assignment.submission && assignment.submission.status === 'SUBMITTED';
      case 'graded':
        return assignment.submission && assignment.submission.status === 'GRADED';
      case 'overdue':
        return !assignment.submission && new Date(assignment.dueDate) < new Date();
      default:
        return true;
    }
  });

  if (status === 'loading' || loading) {
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
              <span className="ml-8 text-gray-600">Assignments</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <span className="text-gray-700">Welcome, {session?.user?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
              <p className="mt-2 text-gray-600">View and submit your course assignments</p>
            </div>
            <div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Assignments</option>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Assignments Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAssignments.map((assignment) => (
              <div key={assignment.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {assignment.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {assignment.module.course.code} - {assignment.module.title}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(assignment)}`}>
                    {getStatusText(assignment)}
                  </span>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-3">{assignment.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="font-medium">
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Points:</span>
                    <span className="font-medium">{assignment.points}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{assignment.type}</span>
                  </div>
                  {assignment.submission?.grade && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Grade:</span>
                      <span className="font-medium text-green-600">
                        {assignment.submission.grade}/{assignment.points}
                      </span>
                    </div>
                  )}
                </div>

                {assignment.submission?.feedback && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Feedback:</h4>
                    <p className="text-sm text-gray-700">{assignment.submission.feedback}</p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {assignment.submission ? (
                      `Submitted: ${new Date(assignment.submission.submittedAt).toLocaleDateString()}`
                    ) : (
                      `Due in ${Math.ceil((new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`
                    )}
                  </div>
                  <div className="space-x-2">
                    <Link
                      href={`/assignments/${assignment.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Details
                    </Link>
                    {!assignment.submission && new Date(assignment.dueDate) > new Date() && (
                      <Link
                        href={`/assignments/${assignment.id}/submit`}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Submit
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAssignments.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'You have no assignments at the moment.'
                  : `No assignments match the "${filter}" filter.`
                }
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}