'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'PDF' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'LINK' | 'BOOK';
  url: string;
  fileSize?: string;
  duration?: string;
  author?: string;
  tags: string[];
  category: string;
  isPublic: boolean;
  downloadCount: number;
  createdAt: string;
  course?: {
    title: string;
    code: string;
  };
}

interface ResourceCategory {
  name: string;
  count: number;
  icon: string;
}

export default function LibraryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
    else fetchResources();
  }, [session, status, router]);

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/library/resources');
      if (response.ok) {
        const data = await response.json();
        setResources(data.resources);
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      PDF: '📄',
      VIDEO: '🎥',
      AUDIO: '🎵',
      DOCUMENT: '📝',
      LINK: '🔗',
      BOOK: '📚'
    };
    return icons[type as keyof typeof icons] || '📄';
  };

  const getTypeColor = (type: string) => {
    const colors = {
      PDF: 'badge-error',
      VIDEO: 'badge-primary',
      AUDIO: 'badge-accent',
      DOCUMENT: 'badge-info',
      LINK: 'badge-secondary',
      BOOK: 'badge-success'
    };
    return colors[type as keyof typeof colors] || 'badge-neutral';
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const handleDownload = async (resourceId: string, url: string, title: string) => {
    try {
      // Track download
      await fetch(`/api/library/resources/${resourceId}/download`, {
        method: 'POST'
      });
      
      // Open resource
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error tracking download:', error);
      // Still open the resource even if tracking fails
      window.open(url, '_blank');
    }
  };

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
          <span className="text-lg font-medium">E-Library & Resources</span>
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
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">📚 E-Library & Resources</h1>
          <p className="text-base-content/70 text-lg">
            Access course materials, reference documents, and educational resources
          </p>
        </div>

        {/* Search and Filters */}
        <div className="card bg-base-100 shadow-lg mb-6">
          <div className="card-body">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="form-control flex-1">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Search resources..."
                    className="input input-bordered flex-1"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="btn btn-square">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <select 
                  className="select select-bordered"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category.name} value={category.name}>
                      {category.name} ({category.count})
                    </option>
                  ))}
                </select>
                
                <select 
                  className="select select-bordered"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="PDF">PDF Documents</option>
                  <option value="VIDEO">Videos</option>
                  <option value="AUDIO">Audio Files</option>
                  <option value="DOCUMENT">Documents</option>
                  <option value="LINK">Web Links</option>
                  <option value="BOOK">Books</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Category Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {categories.map(category => (
            <div 
              key={category.name}
              className={`card bg-base-100 shadow cursor-pointer hover:shadow-lg transition-shadow ${
                selectedCategory === category.name ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedCategory(selectedCategory === category.name ? 'all' : category.name)}
            >
              <div className="card-body items-center text-center p-4">
                <div className="text-2xl mb-2">{category.icon}</div>
                <div className="stat-value text-lg">{category.count}</div>
                <div className="stat-title text-xs">{category.name}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <div key={resource.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
              <div className="card-body">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getTypeIcon(resource.type)}</span>
                    <span className={`badge ${getTypeColor(resource.type)}`}>
                      {resource.type}
                    </span>
                  </div>
                  <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-sm btn-circle">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01" />
                      </svg>
                    </div>
                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                      <li>
                        <button onClick={() => handleDownload(resource.id, resource.url, resource.title)}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Open/Download
                        </button>
                      </li>
                      <li>
                        <button>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          Add to Favorites
                        </button>
                      </li>
                      <li>
                        <button>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </svg>
                          Share
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                <h3 className="card-title text-lg mb-2 line-clamp-2">{resource.title}</h3>
                
                <p className="text-base-content/70 text-sm mb-4 line-clamp-3">
                  {resource.description}
                </p>

                <div className="space-y-2 mb-4">
                  {resource.author && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{resource.author}</span>
                    </div>
                  )}
                  
                  {resource.course && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span>{resource.course.code}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-base-content/60">
                    <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                    <span>{resource.downloadCount} downloads</span>
                  </div>
                </div>

                {resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {resource.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="badge badge-outline badge-sm">
                        {tag}
                      </span>
                    ))}
                    {resource.tags.length > 3 && (
                      <span className="badge badge-outline badge-sm">
                        +{resource.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="card-actions justify-end">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleDownload(resource.id, resource.url, resource.title)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {resource.type === 'LINK' ? 'Visit' : 'Download'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="hero min-h-96">
            <div className="hero-content text-center">
              <div className="max-w-md">
                <div className="text-6xl mb-4">🔍</div>
                <h1 className="text-2xl font-bold">No resources found</h1>
                <p className="py-4 opacity-70">
                  {searchTerm || selectedCategory !== 'all' || selectedType !== 'all'
                    ? 'No resources match your current filters. Try adjusting your search criteria.'
                    : 'No resources are available at the moment.'
                  }
                </p>
                <div className="space-x-2">
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setSelectedType('all');
                    }}
                  >
                    Clear Filters
                  </button>
                  <Link href="/courses" className="btn btn-outline">
                    Browse Courses
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