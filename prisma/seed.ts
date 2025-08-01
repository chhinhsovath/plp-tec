import { PrismaClient, UserRole, CourseCategory, CourseLevel, ResourceType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tec-lms.com' },
    update: {},
    create: {
      email: 'admin@tec-lms.com',
      username: 'admin',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      emailVerified: new Date(),
      profile: {
        create: {
          phoneNumber: '+855123456789',
          address: 'Phnom Penh, Cambodia',
        }
      }
    },
  })

  // Create instructor users
  const instructorPassword = await bcrypt.hash('instructor123', 10)
  const instructors = await Promise.all([
    prisma.user.upsert({
      where: { email: 'instructor1@tec-lms.com' },
      update: {},
      create: {
        email: 'instructor1@tec-lms.com',
        username: 'instructor1',
        password: instructorPassword,
        firstName: 'John',
        lastName: 'Smith',
        role: UserRole.INSTRUCTOR,
        emailVerified: new Date(),
        profile: {
          create: {
            bio: 'Experienced educator specializing in pedagogy and classroom management.',
          }
        }
      },
    }),
    prisma.user.upsert({
      where: { email: 'instructor2@tec-lms.com' },
      update: {},
      create: {
        email: 'instructor2@tec-lms.com',
        username: 'instructor2',
        password: instructorPassword,
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: UserRole.INSTRUCTOR,
        emailVerified: new Date(),
        profile: {
          create: {
            bio: 'ICT and digital learning specialist with 10 years of experience.',
          }
        }
      },
    }),
  ])

  // Create student users
  const studentPassword = await bcrypt.hash('student123', 10)
  const students = await Promise.all(
    Array.from({ length: 5 }, (_, i) => 
      prisma.user.upsert({
        where: { email: `student${i + 1}@tec-lms.com` },
        update: {},
        create: {
          email: `student${i + 1}@tec-lms.com`,
          username: `student${i + 1}`,
          password: studentPassword,
          firstName: `Student`,
          lastName: `${i + 1}`,
          role: UserRole.STUDENT,
          emailVerified: new Date(),
        },
      })
    )
  )

  // Create courses
  const courses = await Promise.all([
    prisma.course.create({
      data: {
        code: 'PED101',
        title: 'Introduction to Pedagogy',
        description: 'Fundamental principles of teaching and learning, educational psychology, and classroom management.',
        credits: 3,
        duration: 16,
        category: CourseCategory.PEDAGOGY,
        level: CourseLevel.BEGINNER,
        prerequisites: [],
        instructorId: instructors[0].id,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-05-15'),
        modules: {
          create: [
            {
              title: 'Foundations of Education',
              description: 'Understanding the history and philosophy of education',
              order: 1,
              estimatedHours: 10,
              isPublished: true,
              lessons: {
                create: [
                  {
                    title: 'History of Education',
                    content: 'Explore the evolution of educational systems throughout history...',
                    order: 1,
                    duration: 60,
                    isPublished: true,
                  },
                  {
                    title: 'Educational Philosophy',
                    content: 'Major philosophical approaches to education...',
                    order: 2,
                    duration: 90,
                    isPublished: true,
                  },
                ],
              },
            },
            {
              title: 'Learning Theories',
              description: 'Major theories of how people learn',
              order: 2,
              estimatedHours: 12,
              isPublished: true,
              lessons: {
                create: [
                  {
                    title: 'Behaviorism',
                    content: 'Understanding behaviorist approaches to learning...',
                    order: 1,
                    duration: 75,
                    isPublished: true,
                  },
                  {
                    title: 'Constructivism',
                    content: 'How learners construct knowledge...',
                    order: 2,
                    duration: 75,
                    isPublished: true,
                  },
                ],
              },
            },
          ],
        },
      },
    }),
    prisma.course.create({
      data: {
        code: 'ICT201',
        title: 'Digital Tools for Education',
        description: 'Learn to integrate technology effectively in the classroom using modern digital tools and platforms.',
        credits: 3,
        duration: 16,
        category: CourseCategory.ICT_SKILLS,
        level: CourseLevel.INTERMEDIATE,
        prerequisites: ['Basic computer skills'],
        instructorId: instructors[1].id,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-05-15'),
        modules: {
          create: [
            {
              title: 'Introduction to Educational Technology',
              description: 'Overview of technology in education',
              order: 1,
              estimatedHours: 8,
              isPublished: true,
              lessons: {
                create: [
                  {
                    title: 'Digital Literacy Basics',
                    content: 'Essential digital skills for educators...',
                    order: 1,
                    duration: 45,
                    isPublished: true,
                  },
                  {
                    title: 'Online Learning Platforms',
                    content: 'Overview of popular LMS and online learning tools...',
                    order: 2,
                    duration: 60,
                    isPublished: true,
                  },
                ],
              },
            },
          ],
        },
      },
    }),
  ])

  // Create resources
  const resources = await Promise.all([
    prisma.resource.create({
      data: {
        title: 'Educational Psychology Textbook',
        description: 'Comprehensive guide to educational psychology',
        type: ResourceType.EBOOK,
        courseId: courses[0].id,
        tags: ['psychology', 'education', 'textbook'],
        isPublic: false,
        uploadedBy: instructors[0].id,
      },
    }),
    prisma.resource.create({
      data: {
        title: 'Classroom Management Strategies',
        description: 'Video guide on effective classroom management',
        type: ResourceType.VIDEO,
        courseId: courses[0].id,
        tags: ['classroom', 'management', 'video'],
        isPublic: false,
        uploadedBy: instructors[0].id,
      },
    }),
    prisma.resource.create({
      data: {
        title: 'Digital Teaching Tools Guide',
        description: 'PDF guide for using digital tools in teaching',
        type: ResourceType.DOCUMENT,
        courseId: courses[1].id,
        tags: ['digital', 'tools', 'guide'],
        isPublic: true,
        uploadedBy: instructors[1].id,
      },
    }),
  ])

  // Create enrollments
  for (const student of students) {
    for (const course of courses) {
      await prisma.enrollment.create({
        data: {
          userId: student.id,
          courseId: course.id,
          progress: Math.random() * 50, // Random progress for demo
        },
      })
    }
  }

  // Create assessments
  const assessment = await prisma.assessment.create({
    data: {
      courseId: courses[0].id,
      title: 'Midterm Exam - Educational Psychology',
      description: 'Test your understanding of educational psychology concepts',
      type: 'MIDTERM',
      totalMarks: 100,
      passingMarks: 60,
      duration: 120,
      shuffleQuestions: true,
      showResults: false,
      questions: {
        create: [
          {
            content: 'What is the main principle of constructivism?',
            type: 'MULTIPLE_CHOICE',
            options: {
              choices: [
                'Learning is passive',
                'Learning is active construction of knowledge',
                'Learning is memorization',
                'Learning is teacher-centered'
              ]
            },
            correctAnswer: '1',
            marks: 10,
            order: 1,
          },
          {
            content: 'Behaviorism focuses on observable behaviors.',
            type: 'TRUE_FALSE',
            correctAnswer: 'true',
            marks: 5,
            order: 2,
          },
          {
            content: 'Explain the Zone of Proximal Development (ZPD) concept.',
            type: 'SHORT_ANSWER',
            marks: 15,
            order: 3,
          },
        ],
      },
    },
  })

  // Create sample announcements
  await prisma.announcement.createMany({
    data: [
      {
        courseId: courses[0].id,
        title: 'Welcome to Introduction to Pedagogy',
        content: 'Welcome to the course! Please review the syllabus and complete the introductory survey.',
        priority: 'HIGH',
        createdBy: instructors[0].id,
      },
      {
        courseId: courses[1].id,
        title: 'Lab Session Schedule',
        content: 'Computer lab sessions will be held every Tuesday and Thursday from 2-4 PM.',
        priority: 'NORMAL',
        createdBy: instructors[1].id,
      },
    ],
  })

  console.log('Seed completed successfully!')
  console.log('Admin credentials: admin@tec-lms.com / admin123')
  console.log('Instructor credentials: instructor1@tec-lms.com / instructor123')
  console.log('Student credentials: student1@tec-lms.com / student123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })