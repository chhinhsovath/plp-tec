'use client';

import { ReactNode } from 'react';
import { Layout, Menu, Dropdown, Avatar, Typography, Space } from 'antd';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  UserOutlined,
  BellOutlined,
  LogoutOutlined,
  DashboardOutlined,
  BookOutlined,
  FileTextOutlined,
  TrophyOutlined,
  LineChartOutlined,
  ReadOutlined,
  RobotOutlined,
  TeamOutlined,
} from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  user?: any;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

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
      type: 'divider' as const,
      key: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: () => signOut({ callbackUrl: '/' }),
    },
  ];

  const navigationItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link href="/dashboard">Dashboard</Link>,
    },
    {
      key: '/courses',
      icon: <BookOutlined />,
      label: <Link href="/courses">Courses</Link>,
    },
    {
      key: '/assignments',
      icon: <FileTextOutlined />,
      label: <Link href="/assignments">Assignments</Link>,
    },
    {
      key: '/assessments',
      icon: <TrophyOutlined />,
      label: <Link href="/assessments">Assessments</Link>,
    },
    {
      key: '/progress',
      icon: <LineChartOutlined />,
      label: <Link href="/progress">Progress</Link>,
    },
    {
      key: '/library',
      icon: <ReadOutlined />,
      label: <Link href="/library">E-Library</Link>,
    },
    {
      key: '/chat',
      icon: <RobotOutlined />,
      label: <Link href="/chat">AI Assistant</Link>,
    },
    {
      key: '/reports',
      icon: <LineChartOutlined />,
      label: <Link href="/reports">Reports</Link>,
    },
  ];

  if (session?.user?.role === 'ADMIN') {
    navigationItems.push({
      key: '/admin/users',
      icon: <TeamOutlined />,
      label: <Link href="/admin/users">Admin Panel</Link>,
    });
  }

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white shadow-sm px-4 lg:px-6 sticky top-0 z-50">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Title level={4} className="!mb-0 cursor-pointer">PLP TEC LMS</Title>
            </Link>
            {title && (
              <>
                <Text type="secondary" className="hidden lg:inline">|</Text>
                <Text type="secondary" className="hidden lg:inline">{title}</Text>
              </>
            )}
          </div>
          
          {session && (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar 
                className="cursor-pointer bg-blue-500"
                size="large"
              >
                {session.user?.email?.[0]?.toUpperCase()}
              </Avatar>
            </Dropdown>
          )}
        </div>
      </Header>

      <Layout>
        <Content className="p-4 lg:p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {/* Desktop Navigation */}
            <Menu
              mode="horizontal"
              selectedKeys={[pathname]}
              items={navigationItems}
              className="mb-4 bg-white rounded-lg shadow-sm hidden lg:flex"
            />
            
            {/* Mobile Navigation */}
            <Menu
              mode="horizontal"
              selectedKeys={[pathname]}
              items={navigationItems.slice(0, 4)}
              className="mb-4 bg-white rounded-lg shadow-sm lg:hidden"
              overflowedIndicator={
                <Dropdown
                  menu={{ 
                    items: navigationItems.slice(4),
                    selectedKeys: [pathname]
                  }}
                >
                  <span>More</span>
                </Dropdown>
              }
            />
            
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}