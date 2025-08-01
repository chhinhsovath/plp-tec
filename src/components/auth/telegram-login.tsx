'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { MessageOutlined } from '@ant-design/icons';

interface TelegramLoginProps {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  buttonSize?: 'large' | 'medium' | 'small';
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

declare global {
  interface Window {
    TelegramLoginWidget: {
      dataOnauth: (user: TelegramUser) => void;
    };
    Telegram?: any;
  }
}

export default function TelegramLogin({ botName, onAuth, buttonSize = 'large' }: TelegramLoginProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMockButton, setShowMockButton] = useState(false);

  useEffect(() => {
    // Check if we're in development
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    setShowMockButton(isDev);
    
    // Set the callback function for Telegram
    window.TelegramLoginWidget = {
      dataOnauth: (user: TelegramUser) => onAuth(user),
    };

    // Only load the widget in production or if not showing mock
    if (!isDev && ref.current && !ref.current.hasChildNodes()) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', botName);
      script.setAttribute('data-size', buttonSize);
      script.setAttribute('data-onauth', 'TelegramLoginWidget.dataOnauth(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;
      
      script.onload = () => {
        setIsLoading(false);
      };
      
      script.onerror = () => {
        console.error('Failed to load Telegram widget');
        setIsLoading(false);
      };
      
      ref.current.appendChild(script);
    } else if (isDev) {
      setIsLoading(false);
    }
  }, [botName, buttonSize, onAuth]);

  // In development, show a mock button
  if (showMockButton) {
    return (
      <div className="text-center space-y-4">
        <button
          onClick={() => {
            // Simulate Telegram login in development
            const mockUser: TelegramUser = {
              id: 123456789,
              first_name: 'Test',
              last_name: 'User',
              username: 'testuser',
              auth_date: Math.floor(Date.now() / 1000),
              hash: 'development-mock-hash'
            };
            onAuth(mockUser);
          }}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#0088cc] hover:bg-[#006699] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0088cc]"
        >
          <MessageOutlined className="mr-2" />
          Sign in with Telegram
        </button>
        <p className="text-xs text-gray-500">
          (Development mode - using mock data)
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center px-6 py-3 text-gray-500">
          <MessageOutlined className="mr-2 animate-pulse" />
          Loading Telegram Login...
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="flex justify-center" />
  );
}