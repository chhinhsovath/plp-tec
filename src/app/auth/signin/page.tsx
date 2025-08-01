'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TelegramLogin, { TelegramUser } from '@/components/auth/telegram-login';
import TelegramLoginInline from '@/components/auth/telegram-login-inline';
import TelegramLoginManual from '@/components/auth/telegram-login-manual';
import { MessageOutlined } from '@ant-design/icons';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramAuth = async (telegramUser: TelegramUser) => {
    setLoading(true);
    setError('');

    try {
      // Try direct authentication first
      const response = await fetch('/api/auth/telegram-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Telegram auth error:', errorData);
        throw new Error(errorData.error || 'Authentication failed');
      }

      const data = await response.json();
      console.log('Telegram auth response:', data);
      
      if (data.success && data.user) {
        // Sign in with credentials using the Telegram user data
        const result = await signIn('credentials', {
          email: data.user.email,
          password: `telegram_${telegramUser.id}_${telegramUser.hash.substring(0, 10)}`,
          redirect: false,
        });

        if (result?.error) {
          // If credentials fail, try the JWT approach
          const tokenResponse = await fetch('/api/auth/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(telegramUser),
          });

          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            const tokenResult = await signIn('telegram', {
              token: tokenData.token,
              redirect: false,
            });

            if (tokenResult?.error) {
              setError('Failed to sign in with Telegram');
            } else {
              router.push('/dashboard');
            }
          } else {
            setError('Authentication failed. Please try again.');
          }
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Telegram auth error:', error);
      setError('Failed to authenticate with Telegram. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to PLP TEC LMS
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Use your email or Telegram account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in with Email'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-center">
              {!loading && (
                <TelegramLogin
                  botName="plp_tec_bot"
                  onAuth={handleTelegramAuth}
                  buttonSize="large"
                />
              )}
              {loading && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <MessageOutlined className="animate-pulse" />
                  <span>Authenticating...</span>
                </div>
              )}
            </div>
            
            {/* Alternative method - inline script */}
            {!loading && typeof window !== 'undefined' && window.location.hostname !== 'localhost' && (
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">Alternative login method:</p>
                <TelegramLoginInline
                  botName="plp_tec_bot"
                  onAuth={handleTelegramAuth}
                  buttonSize="large"
                />
              </div>
            )}
            
            {/* Manual login fallback */}
            {!loading && (
              <TelegramLoginManual />
            )}
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <a href="/auth/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}