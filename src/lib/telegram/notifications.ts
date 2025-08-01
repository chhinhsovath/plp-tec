import { getTelegramBot } from './bot';
import { prisma } from '@/lib/prisma';
import { NotificationStatus } from '@prisma/client';

interface NotificationOptions {
  userId: string;
  type: string;
  title: string;
  content: string;
  data?: any;
}

export async function sendTelegramNotification(options: NotificationOptions): Promise<boolean> {
  const { userId, type, title, content } = options;
  const bot = getTelegramBot();
  
  if (!bot) {
    console.error('Telegram bot not initialized');
    return false;
  }

  try {
    // Get user's telegram account
    const telegramAccount = await prisma.telegramAccount.findFirst({
      where: {
        userId,
        isActive: true,
        notifications: true
      }
    });

    if (!telegramAccount) {
      return false; // User doesn't have telegram linked or notifications disabled
    }

    // Format message based on notification type
    const message = formatNotificationMessage(type, title, content, options.data);

    // Create notification log
    const log = await prisma.telegramNotificationLog.create({
      data: {
        userId,
        telegramId: telegramAccount.telegramId,
        type,
        content: message,
        status: NotificationStatus.PENDING
      }
    });

    // Send notification
    try {
      await bot.sendMessage(telegramAccount.telegramId, message, {
        parse_mode: 'Markdown',
        disable_notification: false
      });

      // Update log status
      await prisma.telegramNotificationLog.update({
        where: { id: log.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date()
        }
      });

      return true;
    } catch (sendError: any) {
      // Update log with error
      await prisma.telegramNotificationLog.update({
        where: { id: log.id },
        data: {
          status: NotificationStatus.FAILED,
          error: sendError.message
        }
      });

      throw sendError;
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return false;
  }
}

function formatNotificationMessage(type: string, title: string, content: string, data?: any): string {
  let emoji = '📢';
  
  switch (type) {
    case 'COURSE':
      emoji = '📚';
      break;
    case 'ASSIGNMENT':
      emoji = '📝';
      break;
    case 'ASSESSMENT':
      emoji = '🎯';
      break;
    case 'MESSAGE':
      emoji = '💬';
      break;
    case 'ANNOUNCEMENT':
      emoji = '📣';
      break;
    case 'REMINDER':
      emoji = '⏰';
      break;
  }

  let message = `${emoji} *${title}*\n\n${content}`;

  // Add action buttons if applicable
  if (data?.url) {
    message += `\n\n[View in LMS](${data.url})`;
  }

  return message;
}

// Batch notification sender for multiple users
export async function sendBulkTelegramNotifications(
  userIds: string[],
  type: string,
  title: string,
  content: string,
  data?: any
): Promise<void> {
  const promises = userIds.map(userId =>
    sendTelegramNotification({ userId, type, title, content, data })
  );

  await Promise.allSettled(promises);
}

// Send course announcement to all enrolled students
export async function sendCourseAnnouncement(
  courseId: string,
  title: string,
  content: string
): Promise<void> {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseId,
      status: 'ACTIVE'
    },
    select: {
      userId: true
    }
  });

  const userIds = enrollments.map(e => e.userId);
  
  await sendBulkTelegramNotifications(
    userIds,
    'ANNOUNCEMENT',
    title,
    content,
    { url: `${process.env.NEXTAUTH_URL}/courses/${courseId}` }
  );
}

// Send assignment reminder
export async function sendAssignmentReminder(
  assignmentId: string,
  hoursBeforeDue: number = 24
): Promise<void> {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      module: {
        include: {
          course: {
            include: {
              enrollments: {
                where: { status: 'ACTIVE' },
                select: { userId: true }
              }
            }
          }
        }
      }
    }
  });

  if (!assignment) return;

  // Get users who haven't submitted yet
  const submittedUserIds = await prisma.assignmentSubmission.findMany({
    where: { assignmentId },
    select: { userId: true }
  }).then(subs => subs.map(s => s.userId));

  const enrolledUserIds = assignment.module.course.enrollments.map(e => e.userId);
  const pendingUserIds = enrolledUserIds.filter(id => !submittedUserIds.includes(id));

  const dueDate = new Date(assignment.dueDate);
  const hoursRemaining = Math.round((dueDate.getTime() - Date.now()) / (1000 * 60 * 60));

  await sendBulkTelegramNotifications(
    pendingUserIds,
    'REMINDER',
    `Assignment Due Soon: ${assignment.title}`,
    `Your assignment is due in ${hoursRemaining} hours.\n\n` +
    `Course: ${assignment.module.course.title}\n` +
    `Due: ${dueDate.toLocaleString()}`,
    { url: `${process.env.NEXTAUTH_URL}/assignments/${assignmentId}` }
  );
}

// Send assessment notification
export async function sendAssessmentNotification(
  assessmentId: string,
  notificationType: 'available' | 'reminder' | 'results'
): Promise<void> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      course: {
        include: {
          enrollments: {
            where: { status: 'ACTIVE' },
            select: { userId: true }
          }
        }
      }
    }
  });

  if (!assessment) return;

  const userIds = assessment.course.enrollments.map(e => e.userId);
  let title = '';
  let content = '';

  switch (notificationType) {
    case 'available':
      title = `New Assessment Available: ${assessment.title}`;
      content = `A new ${assessment.type.toLowerCase()} is now available in ${assessment.course.title}.`;
      break;
    case 'reminder':
      title = `Assessment Reminder: ${assessment.title}`;
      content = `Don't forget to complete the ${assessment.type.toLowerCase()} before the deadline.`;
      break;
    case 'results':
      title = `Assessment Results: ${assessment.title}`;
      content = `Your results for ${assessment.title} are now available.`;
      break;
  }

  await sendBulkTelegramNotifications(
    userIds,
    'ASSESSMENT',
    title,
    content,
    { url: `${process.env.NEXTAUTH_URL}/assessments/${assessmentId}` }
  );
}