export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">PLP TEC LMS</h1>
        <p className="text-xl text-gray-600 mb-8">Learning Management System</p>
        <p className="text-sm text-gray-500">Version: 1.0.1 - Updated {new Date().toISOString()}</p>
        <div className="mt-8">
          <a 
            href="/api/auth/signin" 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Sign In
          </a>
        </div>
      </div>
    </main>
  );
}