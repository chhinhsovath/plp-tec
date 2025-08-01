'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { LoadingOutlined } from '@ant-design/icons';

export default function TelegramCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Get Telegram auth data from URL hash
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    const authData: any = {};
    for (const [key, value] of params.entries()) {
      authData[key] = value;
    }

    if (authData.id) {
      handleTelegramAuth(authData);
    } else {
      router.push('/auth/signin');
    }
  }, [router]);

  const handleTelegramAuth = async (authData: any) => {
    try {
      // Create user or get existing
      const response = await fetch('/api/auth/telegram-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store user data in localStorage for session
        localStorage.setItem('telegram_user', JSON.stringify(data.user));
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        router.push('/auth/signin?error=telegram_auth_failed');
      }
    } catch (error) {
      console.error('Telegram callback error:', error);
      router.push('/auth/signin?error=telegram_auth_failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingOutlined style={{ fontSize: 48 }} className="mb-4" />
        <p className="text-lg">Authenticating with Telegram...</p>
      </div>
    </div>
  );
}