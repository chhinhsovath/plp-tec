# TEC LMS API Documentation

## Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication
All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## API Endpoints

### Authentication

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "clx123...",
    "email": "user@example.com",
    "username": "username",
    "role": "STUDENT"
  }
}
```

#### POST /api/auth/login
Authenticate and receive access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "clx123...",
    "email": "user@example.com",
    "role": "STUDENT"
  }
}
```

### Users

#### GET /api/users/profile
Get current user profile.

**Response:**
```json
{
  "id": "clx123...",
  "email": "user@example.com",
  "username": "username",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT",
  "profile": {
    "phoneNumber": "+855123456789",
    "address": "Phnom Penh",
    "bio": "Student bio"
  }
}
```

#### PUT /api/users/profile
Update user profile.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "profile": {
    "phoneNumber": "+855123456789",
    "address": "Phnom Penh",
    "bio": "Updated bio"
  }
}
```

### Courses

#### GET /api/courses
List all courses with pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `category` (string): Filter by category
- `level` (string): Filter by level
- `search` (string): Search term

**Response:**
```json
{
  "courses": [
    {
      "id": "clx123...",
      "code": "PED101",
      "title": "Introduction to Pedagogy",
      "description": "...",
      "credits": 3,
      "category": "PEDAGOGY",
      "level": "BEGINNER",
      "instructor": {
        "id": "clx456...",
        "firstName": "John",
        "lastName": "Smith"
      }
    }
  ],
  "total": 25,
  "page": 1,
  "totalPages": 3
}
```

#### GET /api/courses/:id
Get course details.

**Response:**
```json
{
  "id": "clx123...",
  "code": "PED101",
  "title": "Introduction to Pedagogy",
  "description": "...",
  "credits": 3,
  "duration": 16,
  "category": "PEDAGOGY",
  "level": "BEGINNER",
  "prerequisites": [],
  "instructor": {
    "id": "clx456...",
    "firstName": "John",
    "lastName": "Smith"
  },
  "modules": [
    {
      "id": "clx789...",
      "title": "Foundations of Education",
      "order": 1,
      "lessons": [...]
    }
  ]
}
```

#### POST /api/courses (Instructor/Admin only)
Create a new course.

**Request Body:**
```json
{
  "code": "PED102",
  "title": "Advanced Pedagogy",
  "description": "...",
  "credits": 3,
  "duration": 16,
  "category": "PEDAGOGY",
  "level": "ADVANCED",
  "prerequisites": ["PED101"],
  "maxStudents": 30
}
```

### Enrollments

#### POST /api/enrollments
Enroll in a course.

**Request Body:**
```json
{
  "courseId": "clx123..."
}
```

#### GET /api/enrollments
Get user's enrollments.

**Response:**
```json
{
  "enrollments": [
    {
      "id": "clx123...",
      "course": {
        "id": "clx456...",
        "code": "PED101",
        "title": "Introduction to Pedagogy"
      },
      "enrolledAt": "2024-01-15T10:00:00Z",
      "progress": 45.5,
      "status": "ACTIVE"
    }
  ]
}
```

### Lessons

#### GET /api/lessons/:id
Get lesson content.

**Response:**
```json
{
  "id": "clx123...",
  "title": "History of Education",
  "content": "...",
  "videoUrl": "https://...",
  "duration": 60,
  "resources": [...]
}
```

#### POST /api/lessons/:id/progress
Update lesson progress.

**Request Body:**
```json
{
  "completed": true,
  "timeSpent": 3600
}
```

### Assessments

#### GET /api/assessments/:courseId
Get assessments for a course.

**Response:**
```json
{
  "assessments": [
    {
      "id": "clx123...",
      "title": "Midterm Exam",
      "type": "MIDTERM",
      "totalMarks": 100,
      "duration": 120,
      "startDateTime": "2024-03-15T10:00:00Z",
      "endDateTime": "2024-03-15T12:00:00Z"
    }
  ]
}
```

#### POST /api/assessments/:id/attempt
Start an assessment attempt.

**Response:**
```json
{
  "attemptId": "clx123...",
  "questions": [
    {
      "id": "clx456...",
      "content": "What is constructivism?",
      "type": "MULTIPLE_CHOICE",
      "options": ["A", "B", "C", "D"],
      "marks": 10
    }
  ]
}
```

#### POST /api/assessments/attempt/:attemptId/submit
Submit assessment answers.

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "clx456...",
      "answer": "B"
    }
  ]
}
```

### Resources

#### GET /api/resources
List available resources.

**Query Parameters:**
- `courseId` (string): Filter by course
- `type` (string): Filter by resource type
- `search` (string): Search term

#### POST /api/resources/upload
Upload a resource file.

**Request:** Multipart form data
- `file`: File to upload
- `title`: Resource title
- `description`: Resource description
- `courseId`: Associated course (optional)
- `type`: Resource type

### Messages

#### GET /api/messages
Get user messages.

**Query Parameters:**
- `type` (string): inbox/sent
- `unread` (boolean): Filter unread messages

#### POST /api/messages
Send a message.

**Request Body:**
```json
{
  "recipientId": "clx123...",
  "subject": "Question about assignment",
  "content": "Message content..."
}
```

### Analytics

#### GET /api/analytics/progress
Get learning progress analytics.

**Response:**
```json
{
  "overallProgress": 67.5,
  "coursesCompleted": 2,
  "coursesInProgress": 3,
  "totalStudyTime": 12450,
  "courseProgress": [
    {
      "courseId": "clx123...",
      "courseTitle": "Introduction to Pedagogy",
      "progress": 85.0,
      "lastAccessed": "2024-01-20T14:30:00Z"
    }
  ]
}
```

#### GET /api/analytics/performance
Get performance analytics.

**Response:**
```json
{
  "averageScore": 78.5,
  "assessmentsTaken": 15,
  "assignmentsSubmitted": 12,
  "performanceByCategory": {
    "PEDAGOGY": 82.0,
    "ICT_SKILLS": 75.5,
    "ASSESSMENT": 77.0
  }
}
```

### AI Chatbot

#### POST /api/chat
Send message to AI chatbot.

**Request Body:**
```json
{
  "message": "Can you explain constructivism?",
  "sessionId": "session123",
  "context": {
    "courseId": "clx123...",
    "lessonId": "clx456..."
  }
}
```

**Response:**
```json
{
  "response": "Constructivism is a learning theory that suggests...",
  "sessionId": "session123",
  "suggestions": [
    "Tell me more about Piaget",
    "What is social constructivism?",
    "How to apply constructivism in teaching?"
  ]
}
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

Common error codes:
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input data
- `SERVER_ERROR`: Internal server error

## Rate Limiting

API requests are limited to:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1516131600
```

## Webhooks

The system can send webhooks for certain events:

### Events
- `enrollment.created`: New enrollment
- `assessment.submitted`: Assessment submitted
- `course.completed`: Course completed
- `certificate.issued`: Certificate generated

### Webhook Payload
```json
{
  "event": "enrollment.created",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "userId": "clx123...",
    "courseId": "clx456...",
    "enrollmentId": "clx789..."
  }
}
```