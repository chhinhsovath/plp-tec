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

#PLPTEC Database Configuration for Development
DB_HOST=157.10.73.52
DB_PORT=5432
DB_NAME=plp_tec
DB_USER=admin
DB_PASSWORD=P@ssw0rd
open_router=sk-or-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
model=google/gemma-3-27b-it:free
fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <OPENROUTER_API_KEY>",
    "HTTP-Referer": “https://tec.openplp.com”, // Optional. Site URL for rankings on openrouter.ai.
    "X-Title": “PLP TEC”, // Optional. Site title for rankings on openrouter.ai.
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    "model": "google/gemma-3-27b-it:free",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "What is in this image?"
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"
            }
          }
        ]
      }
    ]
  })
});
