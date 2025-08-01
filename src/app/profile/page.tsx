import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, Row, Col, Typography, Avatar, Tag, Space } from 'antd';
import { UserOutlined, MailOutlined, CalendarOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import TelegramIntegration from '@/components/profile/telegram-integration';
import AppLayout from '@/components/Layout/AppLayout';

const { Title, Text } = Typography;

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      userRoles: {
        include: {
          role: true
        }
      },
      enrollments: {
        where: { status: 'ACTIVE' },
        include: {
          course: true
        }
      }
    }
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <AppLayout user={session.user}>
      <div className="container mx-auto p-6">
        <Title level={2}>My Profile</Title>
        
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card>
              <div className="text-center">
                <Avatar size={100} icon={<UserOutlined />} className="mb-4" />
                <Title level={4}>{user.firstName} {user.lastName}</Title>
                <Text type="secondary">{user.email}</Text>
              </div>
              
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2">
                  <MailOutlined />
                  <Text>{user.email}</Text>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarOutlined />
                  <Text>Joined {new Date(user.createdAt).toLocaleDateString()}</Text>
                </div>
                <div className="flex items-center gap-2">
                  <SafetyCertificateOutlined />
                  <Space wrap>
                    {user.userRoles.map((ur) => (
                      <Tag key={ur.role.id} color="blue">{ur.role.name}</Tag>
                    ))}
                  </Space>
                </div>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} lg={16}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <TelegramIntegration />
              </Col>
              
              <Col span={24}>
                <Card title="Enrolled Courses">
                  {user.enrollments.length > 0 ? (
                    <div className="space-y-3">
                      {user.enrollments.map((enrollment) => (
                        <div key={enrollment.id} className="border-b pb-3 last:border-0">
                          <div className="flex justify-between items-center">
                            <div>
                              <Title level={5} className="mb-0">
                                {enrollment.course.code}: {enrollment.course.title}
                              </Title>
                              <Text type="secondary">
                                Progress: {enrollment.progress.toFixed(0)}%
                              </Text>
                            </div>
                            <Tag color="green">Active</Tag>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Text type="secondary">No active course enrollments</Text>
                  )}
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    </AppLayout>
  );
}