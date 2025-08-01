'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Course {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  level: string;
  credits: number;
  duration: number;
  instructor: {
    firstName: string;
    lastName: string;
  };
  _count: {
    enrollments: number;
    modules: number;
  };
}

export default function CoursesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
    else fetchCourses();
  }, [session, status, router]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = filter === 'all' 
    ? courses 
    : courses.filter(course => course.category === filter);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      PEDAGOGY: 'bg-blue-100 text-blue-800',
      ICT_SKILLS: 'bg-green-100 text-green-800',
      CLASSROOM_MANAGEMENT: 'bg-purple-100 text-purple-800',
      ASSESSMENT: 'bg-yellow-100 text-yellow-800',
      PROFESSIONAL_DEVELOPMENT: 'bg-pink-100 text-pink-800',
      OTHER: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.OTHER;
  };

  const getLevelBadge = (level: string) => {
    const badges: Record<string, string> = {
      BEGINNER: '🌱 Beginner',
      INTERMEDIATE: '🌿 Intermediate',
      ADVANCED: '🌳 Advanced'
    };
    return badges[level] || level;
  };

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-semibold">
                PLP TEC LMS
              </Link>
              <span className="ml-8 text-gray-600">Courses</span>
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
            <p className="mt-2 text-gray-600">Browse and manage your courses</p>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setFilter('all')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === 'all' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Courses ({courses.length})
              </button>
              <button
                onClick={() => setFilter('PEDAGOGY')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === 'PEDAGOGY' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pedagogy
              </button>
              <button
                onClick={() => setFilter('ICT_SKILLS')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === 'ICT_SKILLS' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ICT Skills
              </button>
              <button
                onClick={() => setFilter('CLASSROOM_MANAGEMENT')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === 'CLASSROOM_MANAGEMENT' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Classroom Management
              </button>
            </nav>
          </div>

          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{course.code}</h3>
                      <h4 className="text-xl font-bold text-gray-800 mt-1">{course.title}</h4>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getCategoryColor(course.category)}`}>
                      {course.category.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7" />
                      </svg>
                      {getLevelBadge(course.level)}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {course.instructor.firstName} {course.instructor.lastName}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {course.duration} weeks • {course.credits} credits
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {course._count.enrollments} students
                    </div>
                    <Link
                      href={`/courses/${course.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      View Course
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No courses found in this category.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}