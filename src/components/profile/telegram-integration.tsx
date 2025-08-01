'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Input, message, Spin, Switch, Typography } from 'antd';
import { LinkOutlined, DisconnectOutlined, BellOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface TelegramStatus {
  linked: boolean;
  telegram?: {
    username?: string;
    firstName?: string;
    lastName?: string;
    notifications: boolean;
    isActive: boolean;
  };
}

export default function TelegramIntegration() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkCode, setLinkCode] = useState('');
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/telegram/link');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      message.error('Failed to fetch Telegram status');
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    if (!linkCode || linkCode.length !== 6) {
      message.error('Please enter a valid 6-character code');
      return;
    }

    setLinking(true);
    try {
      const response = await fetch('/api/telegram/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: linkCode,
          telegramId: linkCode // This should be replaced with actual Telegram ID from bot
        }),
      });

      if (response.ok) {
        message.success('Telegram account linked successfully');
        setLinkCode('');
        fetchStatus();
      } else {
        const error = await response.json();
        message.error(error.error || 'Failed to link account');
      }
    } catch (error) {
      message.error('Failed to link Telegram account');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    try {
      const response = await fetch('/api/telegram/link', {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('Telegram account unlinked');
        fetchStatus();
      } else {
        message.error('Failed to unlink account');
      }
    } catch (error) {
      message.error('Failed to unlink account');
    }
  };

  const toggleNotifications = async () => {
    try {
      const response = await fetch('/api/telegram/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          enabled: !status?.telegram?.notifications 
        }),
      });

      if (response.ok) {
        message.success('Notification settings updated');
        fetchStatus();
      }
    } catch (error) {
      message.error('Failed to update notifications');
    }
  };

  if (loading) {
    return <Spin size="large" />;
  }

  return (
    <Card title="Telegram Integration" className="w-full">
      {status?.linked ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Title level={5}>Connected Account</Title>
              <Text>
                {status.telegram?.firstName} {status.telegram?.lastName}
                {status.telegram?.username && ` (@${status.telegram.username})`}
              </Text>
            </div>
            <Button 
              danger 
              icon={<DisconnectOutlined />}
              onClick={handleUnlink}
            >
              Disconnect
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellOutlined />
              <Text>Notifications</Text>
            </div>
            <Switch 
              checked={status.telegram?.notifications}
              onChange={toggleNotifications}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Paragraph>
            Connect your Telegram account to receive notifications and access the LMS bot.
          </Paragraph>
          
          <div className="bg-gray-50 p-4 rounded">
            <Title level={5}>How to connect:</Title>
            <ol className="space-y-2">
              <li>1. Open Telegram and search for @PLPTECBot</li>
              <li>2. Send /start command to the bot</li>
              <li>3. Copy the 6-character code from the bot</li>
              <li>4. Enter the code below</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Enter 6-character code"
              value={linkCode}
              onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
              maxLength={6}
              style={{ textTransform: 'uppercase' }}
            />
            <Button 
              type="primary" 
              icon={<LinkOutlined />}
              onClick={handleLink}
              loading={linking}
            >
              Link Account
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}