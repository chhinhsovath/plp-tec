'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Row, Col, Tag, Space, Typography, Spin, Select, Badge, Button, Empty } from 'antd';
import { 
  BookOutlined, 
  UserOutlined, 
  ClockCircleOutlined,
  TrophyOutlined,
  TeamOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import AppLayout from '@/components/Layout/AppLayout';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface Course {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  level: string;
  credits: number;
  duration: number;
  instructor: {
    firstName: string;
    lastName: string;
  };
  _count: {
    enrollments: number;
    modules: number;
  };
}

export default function CoursesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
    else fetchCourses();
  }, [session, status, router]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = filter === 'all' 
    ? courses 
    : courses.filter(course => course.category === filter);

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      PEDAGOGY: 'blue',
      ICT_SKILLS: 'green',
      CLASSROOM_MANAGEMENT: 'purple',
      ASSESSMENT: 'gold',
      PROFESSIONAL_DEVELOPMENT: 'magenta',
      OTHER: 'default'
    };
    return colors[category] || 'default';
  };

  const getCategoryName = (category: string): string => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getLevelIcon = (level: string) => {
    const icons: Record<string, string> = {
      BEGINNER: '🌱',
      INTERMEDIATE: '🌿',
      ADVANCED: '🌳'
    };
    return icons[level] || '📚';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <AppLayout title="Courses">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Title level={2} className="!mb-1">Available Courses</Title>
            <Text type="secondary">Explore and enroll in courses to enhance your teaching skills</Text>
          </div>
          
          <Select
            value={filter}
            onChange={setFilter}
            style={{ width: 250 }}
            size="large"
          >
            <Option value="all">All Categories</Option>
            <Option value="PEDAGOGY">Pedagogy</Option>
            <Option value="ICT_SKILLS">ICT Skills</Option>
            <Option value="CLASSROOM_MANAGEMENT">Classroom Management</Option>
            <Option value="ASSESSMENT">Assessment</Option>
            <Option value="PROFESSIONAL_DEVELOPMENT">Professional Development</Option>
            <Option value="OTHER">Other</Option>
          </Select>
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <Empty
          description={
            <span>
              No courses found {filter !== 'all' && `in ${getCategoryName(filter)} category`}
            </span>
          }
        />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredCourses.map((course) => (
            <Col xs={24} sm={12} lg={8} key={course.id}>
              <Link href={`/courses/${course.id}`}>
                <Card
                  hoverable
                  className="h-full"
                  cover={
                    <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <BookOutlined style={{ fontSize: 48, color: 'white' }} />
                    </div>
                  }
                >
                  <div className="flex flex-col h-full">
                    <div className="mb-3">
                      <Space size="small" className="mb-2">
                        <Tag color={getCategoryColor(course.category)}>
                          {getCategoryName(course.category)}
                        </Tag>
                        <Tag>
                          {getLevelIcon(course.level)} {course.level}
                        </Tag>
                      </Space>
                      
                      <Title level={4} className="!mb-1">
                        {course.code}: {course.title}
                      </Title>
                      
                      <Paragraph 
                        ellipsis={{ rows: 2 }} 
                        type="secondary"
                        className="!mb-3"
                      >
                        {course.description}
                      </Paragraph>
                    </div>

                    <div className="mt-auto">
                      <Space direction="vertical" size="small" className="w-full">
                        <div className="flex items-center gap-2">
                          <UserOutlined className="text-gray-500" />
                          <Text type="secondary">
                            {course.instructor.firstName} {course.instructor.lastName}
                          </Text>
                        </div>
                        
                        <div className="flex justify-between">
                          <Space size="small">
                            <Badge
                              count={`${course.credits} credits`}
                              style={{ backgroundColor: '#52c41a' }}
                            />
                            <Badge
                              count={`${course.duration} weeks`}
                              style={{ backgroundColor: '#1890ff' }}
                            />
                          </Space>
                          
                          <Space size="small">
                            <TeamOutlined />
                            <Text type="secondary">{course._count.enrollments}</Text>
                            <BarChartOutlined />
                            <Text type="secondary">{course._count.modules}</Text>
                          </Space>
                        </div>
                      </Space>
                    </div>
                  </div>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      )}
    </AppLayout>
  );
}