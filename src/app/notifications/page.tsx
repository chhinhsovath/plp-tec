'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ASSIGNMENT' | 'ASSESSMENT' | 'COURSE' | 'ANNOUNCEMENT';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  actionText?: string;
  relatedEntity?: {
    type: string;
    id: string;
    name: string;
  };
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
    else fetchNotifications();
  }, [session, status, router]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notification => notification.id !== notificationId)
        );
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons = {
      INFO: '🔵',
      SUCCESS: '✅',
      WARNING: '⚠️',
      ERROR: '❌',
      ASSIGNMENT: '📝',
      ASSESSMENT: '📋',
      COURSE: '📚',
      ANNOUNCEMENT: '📢'
    };
    return icons[type as keyof typeof icons] || '🔔';
  };

  const getNotificationColor = (type: string) => {
    const colors = {
      INFO: 'alert-info',
      SUCCESS: 'alert-success',
      WARNING: 'alert-warning',
      ERROR: 'alert-error',
      ASSIGNMENT: 'bg-orange-50 border-orange-200',
      ASSESSMENT: 'bg-red-50 border-red-200',
      COURSE: 'bg-blue-50 border-blue-200',
      ANNOUNCEMENT: 'bg-purple-50 border-purple-200'
    };
    return colors[type as keyof typeof colors] || 'bg-base-200';
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'read':
        return notification.isRead;
      case 'assignments':
        return notification.type === 'ASSIGNMENT';
      case 'assessments':
        return notification.type === 'ASSESSMENT';
      case 'courses':
        return notification.type === 'COURSE';
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium">Notifications</span>
            {unreadCount > 0 && (
              <div className="badge badge-error badge-sm">{unreadCount}</div>
            )}
          </div>
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
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">🔔 Notifications</h1>
            <p className="text-base-content/70">
              Stay updated with your courses, assignments, and announcements
            </p>
          </div>
          
          {unreadCount > 0 && (
            <button 
              className="btn btn-outline btn-sm"
              onClick={markAllAsRead}
            >
              Mark All as Read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="card bg-base-100 shadow-lg mb-6">
          <div className="card-body">
            <div className="flex flex-wrap gap-2">
              <button 
                className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </button>
              <button 
                className={`btn btn-sm ${filter === 'unread' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </button>
              <button 
                className={`btn btn-sm ${filter === 'assignments' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFilter('assignments')}
              >
                📝 Assignments
              </button>
              <button 
                className={`btn btn-sm ${filter === 'assessments' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFilter('assessments')}
              >
                📋 Assessments
              </button>
              <button 
                className={`btn btn-sm ${filter === 'courses' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFilter('courses')}
              >
                📚 Courses
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`card shadow-lg transition-all hover:shadow-xl ${
                notification.isRead ? 'bg-base-100' : 'bg-base-100 border-l-4 border-primary'
              }`}
            >
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${!notification.isRead ? 'text-primary' : ''}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`badge badge-sm ${
                            notification.type === 'SUCCESS' ? 'badge-success' :
                            notification.type === 'WARNING' ? 'badge-warning' :
                            notification.type === 'ERROR' ? 'badge-error' :
                            'badge-info'
                          }`}>
                            {notification.type}
                          </span>
                          <span className="text-xs text-base-content/60">
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-base-content/80 mb-4">
                      {notification.message}
                    </p>

                    {notification.relatedEntity && (
                      <div className="flex items-center gap-2 text-sm text-base-content/70 mb-3">
                        <span>Related to:</span>
                        <span className="badge badge-outline badge-sm">
                          {notification.relatedEntity.name}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {notification.actionUrl && notification.actionText && (
                        <Link 
                          href={notification.actionUrl}
                          className="btn btn-primary btn-sm"
                          onClick={() => !notification.isRead && markAsRead(notification.id)}
                        >
                          {notification.actionText}
                        </Link>
                      )}
                      
                      {!notification.isRead && (
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-sm btn-circle">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01" />
                      </svg>
                    </div>
                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40">
                      {!notification.isRead && (
                        <li>
                          <button onClick={() => markAsRead(notification.id)}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Mark as Read
                          </button>
                        </li>
                      )}
                      <li>
                        <button 
                          onClick={() => deleteNotification(notification.id)}
                          className="text-error"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredNotifications.length === 0 && (
          <div className="hero min-h-96">
            <div className="hero-content text-center">
              <div className="max-w-md">
                <div className="text-6xl mb-4">🔕</div>
                <h1 className="text-2xl font-bold">No notifications</h1>
                <p className="py-4 opacity-70">
                  {filter === 'all' 
                    ? 'You have no notifications at the moment.'
                    : `No notifications match the "${filter}" filter.`
                  }
                </p>
                <div className="space-x-2">
                  <button 
                    className="btn btn-primary"
                    onClick={() => setFilter('all')}
                  >
                    View All
                  </button>
                  <Link href="/dashboard" className="btn btn-outline">
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}