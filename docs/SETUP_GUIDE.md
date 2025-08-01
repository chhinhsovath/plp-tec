# TEC LMS Setup Guide

## Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## Initial Setup

1. **Clone and Install Dependencies**
```bash
cd tec-lms
npm install
```

2. **Database Setup**
```bash
# Create PostgreSQL database
createdb tec_lms

# Copy environment variables
cp .env.example .env.local
```

3. **Configure Environment Variables**
Edit `.env.local` with your database credentials:
```
DATABASE_URL="postgresql://username:password@localhost:5432/tec_lms?schema=public"
NEXTAUTH_SECRET="generate-a-secret-key"
```

4. **Run Database Migrations**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed initial data (optional)
npm run db:seed
```

5. **Start Development Server**
```bash
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
tec-lms/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── (auth)/           # Authentication pages
│   │   ├── (dashboard)/      # Dashboard pages
│   │   ├── (public)/         # Public pages
│   │   └── layout.tsx        # Root layout
│   ├── components/           # React components
│   │   ├── ui/              # UI components
│   │   ├── forms/           # Form components
│   │   ├── layouts/         # Layout components
│   │   └── features/        # Feature components
│   ├── lib/                 # Utilities
│   │   ├── prisma.ts       # Database client
│   │   ├── auth.ts         # Auth configuration
│   │   └── utils.ts        # Helper functions
│   ├── hooks/              # Custom React hooks
│   ├── services/           # Business logic
│   └── types/              # TypeScript types
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Seed script
├── public/                 # Static files
└── docs/                  # Documentation
```

## Key Features Implementation

### 1. Authentication
- NextAuth.js with credentials provider
- JWT tokens for session management
- Role-based access control (RBAC)

### 2. Course Management
- CRUD operations for courses
- Module and lesson organization
- Resource attachment system

### 3. Assessment System
- Multiple question types
- Auto-grading for objective questions
- Manual grading for subjective answers
- Attempt tracking

### 4. E-Library
- File upload and management
- Resource categorization
- Access tracking

### 5. Communication
- Internal messaging system
- Course announcements
- Real-time notifications

### 6. AI Chatbot
- OpenAI integration
- Context-aware responses
- Learning assistance

### 7. Analytics
- Progress tracking
- Performance reports
- Data visualization

## Development Workflow

1. **Database Changes**
```bash
# Modify schema.prisma
# Generate migration
npx prisma migrate dev --name description

# Update Prisma Client
npx prisma generate
```

2. **API Development**
- Create route handlers in `src/app/api/`
- Use Prisma client for database operations
- Implement proper error handling

3. **Frontend Development**
- Use TypeScript for type safety
- Follow component composition patterns
- Implement responsive design

4. **Testing**
```bash
# Run tests
npm test

# Run linter
npm run lint
```

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
```
NODE_ENV=production
DATABASE_URL=your-production-db-url
NEXTAUTH_URL=https://your-domain.com
```

### Database Migration in Production
```bash
npx prisma migrate deploy
```

## Security Considerations

1. **Authentication**
   - Strong password requirements
   - Session management
   - CSRF protection

2. **Authorization**
   - Role-based permissions
   - Resource-level access control
   - API route protection

3. **Data Protection**
   - Input validation
   - SQL injection prevention (via Prisma)
   - XSS protection

4. **File Uploads**
   - File type validation
   - Size restrictions
   - Virus scanning (recommended)

## Performance Optimization

1. **Database**
   - Proper indexing
   - Query optimization
   - Connection pooling

2. **Caching**
   - Redis for session storage
   - API response caching
   - Static asset caching

3. **Frontend**
   - Code splitting
   - Lazy loading
   - Image optimization

## Monitoring

1. **Application Monitoring**
   - Error tracking
   - Performance metrics
   - User analytics

2. **Database Monitoring**
   - Query performance
   - Connection pool metrics
   - Storage usage

3. **Infrastructure**
   - Server resources
   - Network performance
   - Uptime monitoring