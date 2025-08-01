# Teacher Education College (TEC) Learning Management System

A comprehensive digital platform for Teacher Education Colleges featuring:

## Key Features

### Hardware & Software Infrastructure
- Campus-wide internet access
- Learning Management System (LMS)
- ICT equipment integration
- e-Library system
- AI-powered chatbot

### Teaching and Learning
- Self-paced/flipped learning
- Online live lessons
- Online assessment tools
- AI-enhanced learning

### LMS Core Components
- **Administration**: Admission, payment, registration, authentication
- **Assessment**: Online tests and evaluations
- **Communication**: Messaging and collaboration tools
- **Course Delivery**: PC and mobile access
- **Course Contents**: Materials, applications, websites
- **Tracking**: Learning progress monitoring
- **Reports**: Data analysis and insights
- **HRMIS Integration**: Human Resource Management Information System connectivity

## Tech Stack
- Frontend: Next.js 14, React, TypeScript, Tailwind CSS
- Backend: Next.js API Routes
- Database: PostgreSQL with Prisma ORM
- Authentication: NextAuth.js
- Real-time: Socket.io
- AI Integration: OpenAI API
- Charts: Chart.js/Recharts
- Deployment: Vercel/Docker

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

## Project Structure
```
tec-lms/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/             # Utilities and configurations
│   ├── prisma/          # Database schema and migrations
│   └── types/           # TypeScript types
├── public/              # Static assets
└── docs/               # Documentation
```