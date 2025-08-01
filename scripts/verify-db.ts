import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...\n');
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful\n');
    
    // Check tables
    const tables = [
      { name: 'User', count: await prisma.user.count() },
      { name: 'Course', count: await prisma.course.count() },
      { name: 'Module', count: await prisma.module.count() },
      { name: 'Lesson', count: await prisma.lesson.count() },
      { name: 'Assessment', count: await prisma.assessment.count() },
      { name: 'Question', count: await prisma.question.count() },
      { name: 'Assignment', count: await prisma.assignment.count() },
      { name: 'Resource', count: await prisma.resource.count() },
      { name: 'Enrollment', count: await prisma.enrollment.count() },
      { name: 'ChatMessage', count: await prisma.chatMessage.count() },
      { name: 'Announcement', count: await prisma.announcement.count() },
      { name: 'Notification', count: await prisma.notification.count() },
      { name: 'Attendance', count: await prisma.attendance.count() },
    ];
    
    console.log('📊 Database Tables Status:');
    console.log('─'.repeat(40));
    
    let hasData = false;
    tables.forEach(table => {
      const status = table.count > 0 ? '✅' : '⚠️';
      console.log(`${status} ${table.name.padEnd(20)} ${table.count} records`);
      if (table.count > 0) hasData = true;
    });
    
    console.log('─'.repeat(40));
    
    if (!hasData) {
      console.log('\n⚠️  Database is empty. Run seeding:');
      console.log('   npm run db:seed\n');
    } else {
      // Show some sample data
      console.log('\n👥 Sample Users:');
      const users = await prisma.user.findMany({
        take: 5,
        select: {
          email: true,
          role: true,
          firstName: true,
          lastName: true,
        }
      });
      users.forEach(user => {
        console.log(`   ${user.role.padEnd(10)} - ${user.email} (${user.firstName} ${user.lastName})`);
      });
      
      console.log('\n📚 Courses:');
      const courses = await prisma.course.findMany({
        select: {
          code: true,
          title: true,
          _count: {
            select: { enrollments: true }
          }
        }
      });
      courses.forEach(course => {
        console.log(`   ${course.code} - ${course.title} (${course._count.enrollments} students)`);
      });
    }
    
    console.log('\n✅ Database verification complete!');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check DATABASE_URL in .env.local');
    console.log('2. Ensure PostgreSQL is running');
    console.log('3. Run: npx prisma migrate deploy');
    console.log('4. Run: npm run db:seed');
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();