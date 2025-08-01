'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Card, Input, Button, Space, Typography, Spin, Avatar, Upload, message, Empty } from 'antd';
import { SendOutlined, PictureOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import AppLayout from '@/components/Layout/AppLayout';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(`session-${Date.now()}`);
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
  }, [session, status, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      imageUrl: imageUrl || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const endpoint = imageUrl ? '/api/chat/vision' : '/api/chat';
      const body = imageUrl 
        ? { message: input, imageUrl, sessionId }
        : { message: input, sessionId };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        setImageUrl('');
        setShowImageInput(false);
      } else {
        message.error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      message.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <AppLayout title="AI Assistant">
      <Card className="h-[calc(100vh-200px)]">
        <div className="flex flex-col h-full">
          {/* Chat Header */}
          <div className="border-b pb-4 mb-4">
            <Title level={4} className="!mb-1">AI Learning Assistant</Title>
            <Text type="secondary">Ask questions about pedagogy, teaching methods, or get help with your courses</Text>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto mb-4">
            {messages.length === 0 ? (
              <Empty
                image={<RobotOutlined style={{ fontSize: 48, color: '#1890ff' }} />}
                description={
                  <div>
                    <Text>Hello! I&apos;m your AI learning assistant.</Text>
                    <div className="mt-4 text-left max-w-md mx-auto">
                      <Text type="secondary">I can help you with:</Text>
                      <ul className="mt-2 space-y-1">
                        <li>• Understanding educational concepts</li>
                        <li>• Teaching strategies and methods</li>
                        <li>• Course content questions</li>
                        <li>• Study tips and learning techniques</li>
                      </ul>
                    </div>
                  </div>
                }
              />
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[70%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <Avatar
                        icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                        className={message.role === 'user' ? 'bg-blue-500' : 'bg-green-500'}
                      />
                      <div>
                        <Card
                          className={message.role === 'user' ? 'bg-blue-50' : 'bg-gray-50'}
                          bodyStyle={{ padding: '12px 16px' }}
                        >
                          {message.imageUrl && message.role === 'user' && (
                            <div className="mb-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img 
                                src={message.imageUrl} 
                                alt="User uploaded image" 
                                className="max-w-full h-auto rounded"
                                style={{ maxHeight: '200px' }}
                              />
                            </div>
                          )}
                          <Text>{message.content}</Text>
                        </Card>
                        <Text type="secondary" className="text-xs mt-1 block">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </Text>
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[70%]">
                      <Avatar icon={<RobotOutlined />} className="bg-green-500" />
                      <Card className="bg-gray-50" bodyStyle={{ padding: '12px 16px' }}>
                        <Space>
                          <Spin size="small" />
                          <Text type="secondary">Thinking...</Text>
                        </Space>
                      </Card>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Container */}
          <div className="border-t pt-4">
            {showImageInput && (
              <Input
                placeholder="Enter image URL for analysis..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="mb-3"
                prefix={<PictureOutlined />}
                suffix={
                  <Button
                    type="text"
                    size="small"
                    onClick={() => {
                      setImageUrl('');
                      setShowImageInput(false);
                    }}
                  >
                    Cancel
                  </Button>
                }
              />
            )}
            
            <div className="flex gap-2">
              <TextArea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your question here..."
                autoSize={{ minRows: 1, maxRows: 4 }}
                disabled={loading}
                className="flex-1"
              />
              <Space direction="vertical">
                <Button
                  icon={<PictureOutlined />}
                  onClick={() => setShowImageInput(!showImageInput)}
                  title="Add image for analysis"
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  loading={loading}
                >
                  Send
                </Button>
              </Space>
            </div>
            
            <Text type="secondary" className="text-xs mt-2 block">
              Press Enter to send, Shift+Enter for new line
            </Text>
          </div>
        </div>
      </Card>
    </AppLayout>
  );
}