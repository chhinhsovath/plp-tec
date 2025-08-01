'use client';

import { Button } from 'antd';
import { MessageOutlined } from '@ant-design/icons';

export default function TelegramLoginManual() {
  const botUsername = 'plp_tec_bot';
  const redirectUrl = encodeURIComponent(`${window.location.origin}/auth/telegram-callback`);
  
  const handleClick = () => {
    // Generate Telegram OAuth URL
    const telegramAuthUrl = `https://oauth.telegram.org/auth?bot_id=8418035816&origin=${encodeURIComponent(window.location.origin)}&embed=0&request_access=write&return_to=${redirectUrl}`;
    
    // Open in same window
    window.location.href = telegramAuthUrl;
  };

  return (
    <div className="text-center space-y-4">
      <p className="text-sm text-gray-600">Having trouble? Try manual login:</p>
      <Button
        type="default"
        size="large"
        icon={<MessageOutlined />}
        onClick={handleClick}
        className="bg-[#0088cc] text-white hover:bg-[#006699] border-[#0088cc]"
      >
        Login with Telegram (Manual)
      </Button>
      <p className="text-xs text-gray-500">
        Or message @{botUsername} on Telegram
      </p>
    </div>
  );
}