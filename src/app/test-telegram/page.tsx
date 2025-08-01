'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Alert, Typography, Space, Divider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function TestTelegramPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const fetchDebugInfo = async () => {
    try {
      const response = await fetch('/api/debug/telegram');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error('Failed to fetch debug info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramAuth = (user: any) => {
    alert(`Telegram auth received: ${JSON.stringify(user, null, 2)}`);
  };

  // Set global callback
  useEffect(() => {
    (window as any).onTelegramAuth = handleTelegramAuth;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingOutlined style={{ fontSize: 48 }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Title level={2}>Telegram Login Widget Test</Title>
        
        <Card className="mb-6">
          <Title level={4}>Environment Status</Title>
          <Space direction="vertical" className="w-full">
            <div className="flex justify-between">
              <Text>Environment:</Text>
              <Text strong>{debugInfo?.environment?.NODE_ENV}</Text>
            </div>
            <div className="flex justify-between">
              <Text>URL:</Text>
              <Text strong>{debugInfo?.environment?.url}</Text>
            </div>
            <div className="flex justify-between">
              <Text>Bot Token:</Text>
              <Text strong>
                {debugInfo?.environment?.hasToken ? (
                  <><CheckCircleOutlined className="text-green-500 mr-2" />Configured</>
                ) : (
                  <><CloseCircleOutlined className="text-red-500 mr-2" />Missing</>
                )}
              </Text>
            </div>
          </Space>
        </Card>

        <Card className="mb-6">
          <Title level={4}>Bot Information</Title>
          {debugInfo?.bot?.info ? (
            <Space direction="vertical" className="w-full">
              <div className="flex justify-between">
                <Text>Bot ID:</Text>
                <Text strong>{debugInfo.bot.info.id}</Text>
              </div>
              <div className="flex justify-between">
                <Text>Username:</Text>
                <Text strong>@{debugInfo.bot.info.username}</Text>
              </div>
              <div className="flex justify-between">
                <Text>Name:</Text>
                <Text strong>{debugInfo.bot.info.first_name}</Text>
              </div>
              <div className="flex justify-between">
                <Text>Can Join Groups:</Text>
                <Text strong>{debugInfo.bot.info.can_join_groups ? 'Yes' : 'No'}</Text>
              </div>
            </Space>
          ) : (
            <Alert
              message="Bot not reachable"
              description={debugInfo?.bot?.error || 'Could not fetch bot information'}
              type="error"
            />
          )}
        </Card>

        <Card className="mb-6">
          <Title level={4}>Widget Tests</Title>
          
          <Divider>Method 1: Script Tag</Divider>
          <div 
            className="text-center"
            dangerouslySetInnerHTML={{ 
              __html: `
                <script 
                  async 
                  src="https://telegram.org/js/telegram-widget.js?22" 
                  data-telegram-login="plp_tec_bot"
                  data-size="large"
                  data-onauth="onTelegramAuth(user)"
                  data-request-access="write">
                </script>
              ` 
            }}
          />

          <Divider>Method 2: Dynamic Script</Divider>
          <div id="telegram-login-dynamic" className="text-center" />

          <Divider>Method 3: Iframe (Fallback)</Divider>
          <div className="text-center">
            <iframe
              src={`https://oauth.telegram.org/embed/plp_tec_bot?origin=${encodeURIComponent(window.location.origin)}&size=large&request_access=write`}
              width="238"
              height="40"
              frameBorder="0"
              scrolling="no"
              style={{ overflow: 'hidden', border: 'none' }}
            />
          </div>
        </Card>

        <Card>
          <Title level={4}>Troubleshooting</Title>
          <Alert
            message="Common Issues"
            description={
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Domain must be set in @BotFather (Bot Settings → Domain)</li>
                <li>Production must use HTTPS (HTTP won&apos;t work)</li>
                <li>Domain must match exactly (no www prefix unless configured)</li>
                <li>Clear browser cache and cookies if widget was working before</li>
                <li>Check browser console for errors</li>
                <li>Ensure no ad blockers are interfering</li>
              </ul>
            }
            type="info"
          />
          
          <div className="mt-4">
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
            <Button 
              className="ml-2"
              onClick={() => {
                const script = document.createElement('script');
                script.src = 'https://telegram.org/js/telegram-widget.js?22';
                script.setAttribute('data-telegram-login', 'plp_tec_bot');
                script.setAttribute('data-size', 'large');
                script.setAttribute('data-onauth', 'onTelegramAuth(user)');
                script.setAttribute('data-request-access', 'write');
                script.async = true;
                
                const container = document.getElementById('telegram-login-dynamic');
                if (container) {
                  container.innerHTML = '';
                  container.appendChild(script);
                }
              }}
            >
              Load Widget Dynamically
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}