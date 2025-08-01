# Database Setup Guide for TEC LMS

## Overview
This project uses PostgreSQL as the database and Prisma as the ORM. The database schema includes all tables needed for the LMS features.

## Database Tables
The system includes the following main tables:
- **Users** - Admin, Instructors, Students with authentication
- **Courses** - Course management with modules and lessons
- **Enrollments** - Student course registrations
- **Assessments** - Quizzes, exams with questions and answers
- **Assignments** - Homework and submissions
- **Resources** - E-library materials and documents
- **ChatMessages** - AI chatbot conversation history
- **Attendance** - Student attendance tracking
- **Notifications** - System notifications
- **Analytics** - Learning analytics and tracking

## Setup Instructions

### 1. Local Development Setup

#### Prerequisites
- PostgreSQL installed locally or access to a PostgreSQL database
- Node.js and npm installed

#### Steps

1. **Install dependencies**
```bash
npm install
```

2. **Set up environment variables**
Create `.env.local` file with your database URL:
```env
DATABASE_URL=postgresql://admin:P@ssw0rd@157.10.73.52:5432/plp_tec?schema=public
```

3. **Generate Prisma Client**
```bash
npx prisma generate
```

4. **Create database tables**
```bash
# Create a new migration
npx prisma migrate dev --name init

# Or apply existing migrations
npx prisma migrate deploy
```

5. **Seed the database with initial data**
```bash
npm run db:seed
```

### 2. Production Setup (Vercel)

1. **Add DATABASE_URL to Vercel Environment Variables**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add `DATABASE_URL` with your production database connection string

2. **Run migrations on production**
```bash
# Pull production environment variables
vercel env pull .env.production.local

# Run migrations
npx prisma migrate deploy
```

3. **Seed production database (optional)**
```bash
# Use with caution in production
NODE_ENV=production npx prisma db seed
```

## Database Commands

### Prisma Commands
```bash
# Generate Prisma Client
npx prisma generate

# Create a new migration
npx prisma migrate dev --name <migration_name>

# Apply migrations
npx prisma migrate deploy

# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset

# Open Prisma Studio (GUI)
npx prisma studio

# Seed database
npx prisma db seed
```

### Package.json Scripts
```bash
# Open Prisma Studio
npm run db:studio

# Run migrations
npm run db:migrate

# Push schema changes (dev only)
npm run db:push

# Seed database
npm run db:seed
```

## Test Credentials (After Seeding)

### Admin
- Email: `admin@tec-lms.com`
- Password: `admin123`

### Instructor
- Email: `instructor1@tec-lms.com`
- Password: `instructor123`

### Student
- Email: `student1@tec-lms.com`
- Password: `student123`

## Database Schema Overview

### Core Models
1. **User** - Stores all user information with roles (ADMIN, INSTRUCTOR, STUDENT)
2. **Course** - Course details with instructor assignment
3. **Module** - Course modules/chapters
4. **Lesson** - Individual lessons within modules
5. **Assessment** - Quizzes and exams
6. **Question** - Assessment questions with various types
7. **Assignment** - Homework and projects
8. **Resource** - Learning materials and documents
9. **ChatMessage** - AI chatbot conversations
10. **Enrollment** - Student-course relationships
11. **Attendance** - Attendance tracking
12. **Notification** - System notifications

### Features Supported
- ✅ User authentication and roles
- ✅ Course management with modules
- ✅ Student enrollment
- ✅ Assessments and quizzes
- ✅ Assignment submission
- ✅ E-library resources
- ✅ AI chatbot with history
- ✅ Attendance tracking
- ✅ Learning progress tracking
- ✅ Notifications system
- ✅ Analytics and reporting

## Troubleshooting

### Connection Issues
1. Check if PostgreSQL is running
2. Verify DATABASE_URL is correct
3. Ensure database user has proper permissions
4. Check if SSL is required (add `?sslmode=require`)

### Migration Issues
1. If migrations fail, check for:
   - Database connection
   - User permissions
   - Existing tables conflicting
2. Use `npx prisma migrate reset` to start fresh (dev only)

### Seed Issues
1. Ensure database is empty or use upsert operations
2. Check for unique constraint violations
3. Verify all required fields are provided

## Database Backup

### Export Database
```bash
pg_dump -h 157.10.73.52 -U admin -d plp_tec > backup.sql
```

### Import Database
```bash
psql -h 157.10.73.52 -U admin -d plp_tec < backup.sql
```

## Security Notes
- Never commit `.env` files with real credentials
- Use strong passwords in production
- Enable SSL for database connections
- Regularly backup your database
- Use read replicas for analytics queries