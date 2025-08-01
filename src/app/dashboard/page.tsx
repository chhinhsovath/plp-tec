'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, Card, Statistic, Row, Col, Typography, Space, Spin, Timeline } from 'antd';
import {
  BookOutlined,
  FileTextOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  UserOutlined,
  BellOutlined,
  LogoutOutlined,
  DashboardOutlined,
  RobotOutlined,
  LineChartOutlined,
  TeamOutlined,
  ReadOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link href="/profile">Profile</Link>,
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: <Link href="/notifications">Notifications</Link>,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: () => signOut({ callbackUrl: '/' }),
    },
  ];

  const navigationCards = [
    {
      title: 'Courses',
      icon: <BookOutlined style={{ fontSize: '24px' }} />,
      description: 'View courses',
      href: '/courses',
      color: '#1890ff',
    },
    {
      title: 'Assignments',
      icon: <FileTextOutlined style={{ fontSize: '24px' }} />,
      description: 'Submit work',
      href: '/assignments',
      color: '#52c41a',
    },
    {
      title: 'Assessments',
      icon: <TrophyOutlined style={{ fontSize: '24px' }} />,
      description: 'Take tests',
      href: '/assessments',
      color: '#faad14',
    },
    {
      title: 'Progress',
      icon: <LineChartOutlined style={{ fontSize: '24px' }} />,
      description: 'Track learning',
      href: '/progress',
      color: '#722ed1',
    },
    {
      title: 'E-Library',
      icon: <ReadOutlined style={{ fontSize: '24px' }} />,
      description: 'Resources',
      href: '/library',
      color: '#13c2c2',
    },
    {
      title: 'Notifications',
      icon: <BellOutlined style={{ fontSize: '24px' }} />,
      description: 'Updates',
      href: '/notifications',
      color: '#fa541c',
    },
    {
      title: 'AI Assistant',
      icon: <RobotOutlined style={{ fontSize: '24px' }} />,
      description: 'Get help',
      href: '/chat',
      color: '#2f54eb',
    },
    {
      title: 'Reports',
      icon: <LineChartOutlined style={{ fontSize: '24px' }} />,
      description: 'Analytics',
      href: '/reports',
      color: '#a0d911',
    },
  ];

  if (session.user.role === 'ADMIN') {
    navigationCards.push({
      title: 'Admin Panel',
      icon: <TeamOutlined style={{ fontSize: '24px' }} />,
      description: 'Manage users',
      href: '/admin/users',
      color: '#f5222d',
    });
  }

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white shadow-sm px-4 lg:px-6">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center space-x-4">
            <Title level={4} className="!mb-0">PLP TEC LMS</Title>
            <Text type="secondary" className="hidden lg:inline">Dashboard</Text>
          </div>
          
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Avatar 
              className="cursor-pointer bg-blue-500"
              size="large"
            >
              {session.user?.email?.[0]?.toUpperCase()}
            </Avatar>
          </Dropdown>
        </div>
      </Header>

      <Content className="p-4 lg:p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <Card className="mb-6 bg-gradient-to-br from-blue-500 to-purple-600 border-0">
            <div className="text-center py-4 lg:py-8 text-white">
              <Title level={2} className="!text-white !mb-2">Welcome Back!</Title>
              <Text className="text-white text-lg block mb-1">{session.user?.email}</Text>
              <Text className="text-white/80">Teacher Effectiveness Coaching - Learning Management System</Text>
            </div>
          </Card>

          {/* Quick Stats */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="My Courses"
                  value={5}
                  prefix={<BookOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Assignments"
                  value={12}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Assessments"
                  value={8}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Progress"
                  value={85}
                  suffix="%"
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Quick Access */}
          <div className="mb-6">
            <Title level={3} className="mb-4">Quick Access</Title>
            <Row gutter={[16, 16]}>
              {navigationCards.map((card) => (
                <Col key={card.href} xs={12} sm={8} md={6} lg={4}>
                  <Link href={card.href}>
                    <Card 
                      hoverable
                      className="text-center h-full"
                      bodyStyle={{ padding: '20px' }}
                    >
                      <div style={{ color: card.color }}>
                        {card.icon}
                      </div>
                      <Title level={5} className="!mt-3 !mb-1">{card.title}</Title>
                      <Text type="secondary" className="text-xs">{card.description}</Text>
                    </Card>
                  </Link>
                </Col>
              ))}
            </Row>
          </div>

          {/* Recent Activity */}
          <Card title={<Space><CheckCircleOutlined /> Recent Activity</Space>}>
            <Timeline
              items={[
                {
                  color: 'green',
                  children: (
                    <div>
                      <Text strong>Completed Module 3</Text>
                      <br />
                      <Text type="secondary" className="text-xs">Introduction to Teaching Methods</Text>
                      <br />
                      <Text type="secondary" className="text-xs">2 hours ago</Text>
                    </div>
                  ),
                },
                {
                  color: 'blue',
                  children: (
                    <div>
                      <Text strong>Submitted Assignment</Text>
                      <br />
                      <Text type="secondary" className="text-xs">Lesson Plan Development</Text>
                      <br />
                      <Text type="secondary" className="text-xs">1 day ago</Text>
                    </div>
                  ),
                },
                {
                  color: 'gold',
                  children: (
                    <div>
                      <Text strong>Assessment Score</Text>
                      <br />
                      <Text type="secondary" className="text-xs">Pedagogical Theory Quiz - 92%</Text>
                      <br />
                      <Text type="secondary" className="text-xs">3 days ago</Text>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </Content>
    </Layout>
  );
}