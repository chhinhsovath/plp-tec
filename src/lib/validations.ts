import { z } from 'zod';

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']).optional().default('STUDENT'),
});

// User management schemas
export const createUserSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }).optional(),
  email: z.string().email({ message: 'Invalid email address' }).optional(),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }).optional(),
  role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']).optional(),
});

// Course schemas
export const createCourseSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  category: z.string().min(2, { message: 'Category is required' }),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  duration: z.number().positive({ message: 'Duration must be positive' }),
  maxStudents: z.number().positive({ message: 'Max students must be positive' }).optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

// Assessment schemas
export const createAssessmentSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  courseId: z.string().uuid({ message: 'Invalid course ID' }),
  timeLimit: z.number().positive({ message: 'Time limit must be positive' }).optional(),
  totalMarks: z.number().positive({ message: 'Total marks must be positive' }),
  passingMarks: z.number().positive({ message: 'Passing marks must be positive' }),
  questions: z.array(z.object({
    question: z.string().min(5, { message: 'Question must be at least 5 characters' }),
    type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY']),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().optional(),
    marks: z.number().positive({ message: 'Marks must be positive' }),
  })).min(1, { message: 'At least one question is required' }),
});

export const submitAssessmentSchema = z.object({
  assessmentId: z.string().uuid({ message: 'Invalid assessment ID' }),
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.string(),
  })),
});

// Assignment schemas
export const createAssignmentSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  courseId: z.string().uuid({ message: 'Invalid course ID' }),
  dueDate: z.string().datetime({ message: 'Invalid due date format' }),
  maxMarks: z.number().positive({ message: 'Max marks must be positive' }),
  allowedFileTypes: z.array(z.string()).optional(),
  maxFileSize: z.number().positive({ message: 'Max file size must be positive' }).optional(),
});

export const submitAssignmentSchema = z.object({
  assignmentId: z.string().uuid({ message: 'Invalid assignment ID' }),
  content: z.string().min(10, { message: 'Content must be at least 10 characters' }).optional(),
  fileUrl: z.string().url({ message: 'Invalid file URL' }).optional(),
});

// Library resource schemas
export const createResourceSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  category: z.string().min(2, { message: 'Category is required' }),
  type: z.enum(['PDF', 'VIDEO', 'AUDIO', 'DOCUMENT', 'LINK']),
  url: z.string().url({ message: 'Invalid URL' }),
  courseId: z.string().uuid({ message: 'Invalid course ID' }).optional(),
  isPublic: z.boolean().default(false),
});

// Notification schemas
export const createNotificationSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  message: z.string().min(5, { message: 'Message must be at least 5 characters' }),
  type: z.enum(['INFO', 'WARNING', 'ERROR', 'SUCCESS']).default('INFO'),
  recipientId: z.string().uuid({ message: 'Invalid recipient ID' }).optional(),
  courseId: z.string().uuid({ message: 'Invalid course ID' }).optional(),
});

// Chat message schema
export const chatMessageSchema = z.object({
  message: z.string().min(1, { message: 'Message cannot be empty' }).max(1000, { message: 'Message too long' }),
  sessionId: z.string().optional(),
});

// ID validation schema
export const idSchema = z.object({
  id: z.string().uuid({ message: 'Invalid ID format' }),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().positive().default(1),
  limit: z.number().positive().max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// File upload schema
export const fileUploadSchema = z.object({
  fileName: z.string().min(1, { message: 'File name is required' }),
  fileSize: z.number().positive({ message: 'File size must be positive' }).max(10 * 1024 * 1024, { message: 'File too large (max 10MB)' }),
  fileType: z.string().min(1, { message: 'File type is required' }),
});

// Progress tracking schema
export const progressUpdateSchema = z.object({
  courseId: z.string().uuid({ message: 'Invalid course ID' }),
  lessonId: z.string().uuid({ message: 'Invalid lesson ID' }).optional(),
  progress: z.number().min(0).max(100, { message: 'Progress must be between 0 and 100' }),
  timeSpent: z.number().positive({ message: 'Time spent must be positive' }).optional(),
});

// Profile update schema
export const profileUpdateSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }).optional(),
  email: z.string().email({ message: 'Invalid email address' }).optional(),
  bio: z.string().max(500, { message: 'Bio too long' }).optional(),
  avatar: z.string().url({ message: 'Invalid avatar URL' }).optional(),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, { message: 'Invalid phone format' }).optional(),
  location: z.string().max(100, { message: 'Location too long' }).optional(),
});

// Types for form data
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
export type SubmitAssessmentInput = z.infer<typeof submitAssessmentSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;
export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type ProgressUpdateInput = z.infer<typeof progressUpdateSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;