'use client';

import { useEffect } from 'react';
import { TelegramUser } from './telegram-login';

interface TelegramLoginInlineProps {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  buttonSize?: 'large' | 'medium' | 'small';
}

declare global {
  interface Window {
    onTelegramAuth: (user: TelegramUser) => void;
  }
}

export default function TelegramLoginInline({ 
  botName, 
  onAuth, 
  buttonSize = 'large' 
}: TelegramLoginInlineProps) {
  
  useEffect(() => {
    // Set global callback
    window.onTelegramAuth = onAuth;
  }, [onAuth]);

  // Use dangerouslySetInnerHTML to inject the script inline
  const scriptHtml = `
    <script 
      async 
      src="https://telegram.org/js/telegram-widget.js?22" 
      data-telegram-login="${botName}"
      data-size="${buttonSize}"
      data-onauth="onTelegramAuth(user)"
      data-request-access="write">
    </script>
  `;

  return (
    <div 
      className="telegram-login-widget"
      dangerouslySetInnerHTML={{ __html: scriptHtml }}
    />
  );
}