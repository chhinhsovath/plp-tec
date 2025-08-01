'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-base-200" data-theme="plp">
      {/* Navigation */}
      <div className="navbar bg-base-100 shadow-lg">
        <div className="navbar-start">
          <h1 className="text-xl font-bold">PLP TEC LMS</h1>
        </div>
        <div className="navbar-center hidden lg:flex">
          <span className="text-lg font-medium">Dashboard</span>
        </div>
        <div className="navbar-end">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                {session.user?.email?.[0]?.toUpperCase()}
              </div>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li><a href="/profile">👤 Profile</a></li>
              <li><a href="/notifications">🔔 Notifications</a></li>
              <li><a onClick={() => signOut({ callbackUrl: '/' })}>🚪 Sign Out</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4 lg:p-6">
        {/* Welcome Section */}
        <div className="hero bg-gradient-to-br from-primary to-secondary text-primary-content rounded-lg mb-8">
          <div className="hero-content text-center py-8 lg:py-12">
            <div className="max-w-md">
              <h1 className="text-3xl lg:text-5xl font-bold mb-4">Welcome Back!</h1>
              <p className="text-lg lg:text-xl mb-2">
                {session.user?.email}
              </p>
              <p className="opacity-80">
                Teacher Effectiveness Coaching - Learning Management System
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-figure text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="stat-title text-xs lg:text-sm">My Courses</div>
            <div className="stat-value text-lg lg:text-2xl text-primary">5</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-figure text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="stat-title text-xs lg:text-sm">Assignments</div>
            <div className="stat-value text-lg lg:text-2xl text-secondary">12</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-figure text-accent">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div className="stat-title text-xs lg:text-sm">Assessments</div>
            <div className="stat-value text-lg lg:text-2xl text-accent">8</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-figure text-success">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="stat-title text-xs lg:text-sm">Progress</div>
            <div className="stat-value text-lg lg:text-2xl text-success">85%</div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            <a href="/courses" className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <div className="card-body p-4 text-center">
                <div className="text-3xl mb-2">📚</div>
                <h3 className="card-title text-sm lg:text-base justify-center">Courses</h3>
                <p className="text-xs text-base-content/70">View courses</p>
              </div>
            </a>
            
            <a href="/assignments" className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <div className="card-body p-4 text-center">
                <div className="text-3xl mb-2">📝</div>
                <h3 className="card-title text-sm lg:text-base justify-center">Assignments</h3>
                <p className="text-xs text-base-content/70">Submit work</p>
              </div>
            </a>
            
            <a href="/assessments" className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <div className="card-body p-4 text-center">
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="card-title text-sm lg:text-base justify-center">Assessments</h3>
                <p className="text-xs text-base-content/70">Take tests</p>
              </div>
            </a>
            
            <a href="/progress" className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <div className="card-body p-4 text-center">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="card-title text-sm lg:text-base justify-center">Progress</h3>
                <p className="text-xs text-base-content/70">Track learning</p>
              </div>
            </a>
            
            <a href="/library" className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <div className="card-body p-4 text-center">
                <div className="text-3xl mb-2">📖</div>
                <h3 className="card-title text-sm lg:text-base justify-center">E-Library</h3>
                <p className="text-xs text-base-content/70">Resources</p>
              </div>
            </a>
            
            <a href="/notifications" className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <div className="card-body p-4 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <h3 className="card-title text-sm lg:text-base justify-center">Notifications</h3>
                <p className="text-xs text-base-content/70">Updates</p>
              </div>
            </a>
            
            <a href="/chat" className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <div className="card-body p-4 text-center">
                <div className="text-3xl mb-2">🤖</div>
                <h3 className="card-title text-sm lg:text-base justify-center">AI Assistant</h3>
                <p className="text-xs text-base-content/70">Get help</p>
              </div>
            </a>
            
            <a href="/reports" className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <div className="card-body p-4 text-center">
                <div className="text-3xl mb-2">📈</div>
                <h3 className="card-title text-sm lg:text-base justify-center">Reports</h3>
                <p className="text-xs text-base-content/70">Analytics</p>
              </div>
            </a>
            
            {session.user.role === 'ADMIN' && (
              <a href="/admin/users" className="card bg-gradient-to-br from-error to-error-focus text-error-content shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <div className="card-body p-4 text-center">
                  <div className="text-3xl mb-2">👥</div>
                  <h3 className="card-title text-sm lg:text-base justify-center">Admin Panel</h3>
                  <p className="text-xs opacity-80">Manage users</p>
                </div>
              </a>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">📋 Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-base-200">
                <div className="text-2xl">📚</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Completed Module 3</h4>
                  <p className="text-xs text-base-content/70">Introduction to Teaching Methods</p>
                  <span className="text-xs text-base-content/60">2 hours ago</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-3 rounded-lg bg-base-200">
                <div className="text-2xl">📝</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Submitted Assignment</h4>
                  <p className="text-xs text-base-content/70">Lesson Plan Development</p>
                  <span className="text-xs text-base-content/60">1 day ago</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-3 rounded-lg bg-base-200">
                <div className="text-2xl">🎯</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Assessment Score</h4>
                  <p className="text-xs text-base-content/70">Pedagogical Theory Quiz - 92%</p>
                  <span className="text-xs text-base-content/60">3 days ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}