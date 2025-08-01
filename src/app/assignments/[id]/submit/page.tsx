'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  type: string;
  module: {
    title: string;
    course: {
      title: string;
      code: string;
    };
  };
}

export default function SubmitAssignmentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);

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
        
        // Check if assignment can still be submitted
        if (data.submission || new Date(data.dueDate) < new Date()) {
          router.push(`/assignments/${assignmentId}`);
          return;
        }
        
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      
      if (files) {
        Array.from(files).forEach((file, index) => {
          formData.append(`files`, file);
        });
      }

      const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        router.push(`/assignments/${assignmentId}`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit assignment');
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const timeUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    
    if (diff < 0) return 'Overdue';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''} remaining`;
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
    }
  };

  if (status === 'loading' || loading || !assignment) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (isOverdue(assignment.dueDate)) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Assignment Overdue</h2>
          <p className="text-gray-600 mb-6">
            The submission deadline for this assignment has passed.
          </p>
          <Link
            href={`/assignments/${assignment.id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Back to Assignment
          </Link>
        </div>
      </div>
    );
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
              <Link href={`/assignments/${assignment.id}`} className="ml-4 text-gray-600 hover:text-gray-900">
                {assignment.title}
              </Link>
              <span className="ml-4 text-gray-400">/</span>
              <span className="ml-4 text-gray-600">Submit</span>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Submit Assignment</h1>
            <h2 className="text-xl text-gray-700 mb-4">{assignment.title}</h2>
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {assignment.module.course.code} - {assignment.module.title}
              </p>
              <div className="text-right">
                <p className="text-sm text-gray-600">Due: {new Date(assignment.dueDate).toLocaleString()}</p>
                <p className={`text-sm font-medium ${
                  timeUntilDue(assignment.dueDate).includes('hour') ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {timeUntilDue(assignment.dueDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Submission Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Content *
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your assignment content here..."
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Provide your complete assignment response in the text area above.
                </p>
              </div>

              <div>
                <label htmlFor="files" className="block text-sm font-medium text-gray-700 mb-2">
                  File Attachments (Optional)
                </label>
                <input
                  type="file"
                  id="files"
                  multiple
                  onChange={(e) => setFiles(e.target.files)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                />
                <p className="mt-1 text-sm text-gray-500">
                  You can upload multiple files. Supported formats: PDF, Word documents, images, text files, and archives.
                </p>
                {files && files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-medium text-gray-700">Selected files:</p>
                    {Array.from(files).map((file, index) => (
                      <p key={index} className="text-sm text-gray-600">
                        • {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Before you submit:</h4>
                    <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
                      <li>Review your content for completeness and accuracy</li>
                      <li>Check that all required components are included</li>
                      <li>Ensure file attachments are relevant and properly named</li>
                      <li>Once submitted, you cannot modify your submission</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Link
                  href={`/assignments/${assignment.id}`}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  ← Cancel
                </Link>
                <button
                  type="submit"
                  disabled={!content.trim() || submitting}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {submitting ? 'Submitting...' : 'Submit Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}