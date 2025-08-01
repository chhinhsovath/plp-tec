import TelegramBot from 'node-telegram-bot-api';
import { prisma } from '@/lib/prisma';

// Initialize bot
const token = process.env.TELEGRAM_BOT_TOKEN;
let bot: TelegramBot | null = null;

export function getTelegramBot(): TelegramBot | null {
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return null;
  }

  if (!bot) {
    // In production, use webhook mode
    const isProduction = process.env.NODE_ENV === 'production';
    
    bot = new TelegramBot(token, {
      polling: !isProduction,
      webHook: isProduction ? {
        port: parseInt(process.env.PORT || '3000'),
      } : false,
    });

    // Set webhook in production
    if (isProduction && process.env.TELEGRAM_WEBHOOK_URL) {
      bot.setWebHook(`${process.env.TELEGRAM_WEBHOOK_URL}/api/telegram/webhook`);
    }

    // Setup bot commands
    setupBotCommands();
  }

  return bot;
}

function setupBotCommands() {
  if (!bot) return;

  // Set bot commands menu
  bot.setMyCommands([
    { command: 'start', description: 'Start the bot and link your account' },
    { command: 'help', description: 'Show help information' },
    { command: 'link', description: 'Link your LMS account' },
    { command: 'unlink', description: 'Unlink your LMS account' },
    { command: 'courses', description: 'View your enrolled courses' },
    { command: 'assignments', description: 'Check pending assignments' },
    { command: 'notifications', description: 'Toggle notifications on/off' },
    { command: 'chat', description: 'Start AI chat session' },
  ]);

  // Handle /start command
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();
    
    if (!telegramId) return;

    // Check if user already linked
    const existingAccount = await prisma.telegramAccount.findUnique({
      where: { telegramId },
      include: { user: true }
    });

    if (existingAccount) {
      await bot!.sendMessage(chatId, 
        `Welcome back, ${existingAccount.user.firstName}! 👋\n\n` +
        `Your Telegram account is already linked to PLP TEC LMS.\n\n` +
        `Use /help to see available commands.`,
        { parse_mode: 'Markdown' }
      );
    } else {
      // Generate link code
      const linkCode = generateLinkCode();
      await storeLinkCode(telegramId, linkCode);
      
      await bot!.sendMessage(chatId,
        `Welcome to PLP TEC LMS Bot! 🎓\n\n` +
        `To link your LMS account:\n` +
        `1. Log in to the LMS website\n` +
        `2. Go to Profile → Telegram Integration\n` +
        `3. Enter this code: *${linkCode}*\n\n` +
        `The code expires in 10 minutes.`,
        { parse_mode: 'Markdown' }
      );
    }
  });

  // Handle /help command
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    
    await bot!.sendMessage(chatId,
      `*PLP TEC LMS Bot Commands*\n\n` +
      `📚 /courses - View your enrolled courses\n` +
      `📝 /assignments - Check pending assignments\n` +
      `🎯 /assessments - View upcoming assessments\n` +
      `💬 /chat - Start AI chat session\n` +
      `🔔 /notifications - Toggle notifications\n` +
      `🔗 /link - Link your LMS account\n` +
      `❌ /unlink - Unlink your account\n` +
      `❓ /help - Show this help message`,
      { parse_mode: 'Markdown' }
    );
  });

  // Handle /courses command
  bot.onText(/\/courses/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();
    
    if (!telegramId) return;

    const account = await prisma.telegramAccount.findUnique({
      where: { telegramId },
      include: {
        user: {
          include: {
            enrollments: {
              where: { status: 'ACTIVE' },
              include: {
                course: {
                  include: {
                    instructor: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!account) {
      await bot!.sendMessage(chatId, 
        'Please link your LMS account first using /start command.'
      );
      return;
    }

    if (account.user.enrollments.length === 0) {
      await bot!.sendMessage(chatId, 'You are not enrolled in any courses.');
      return;
    }

    let message = '*Your Enrolled Courses:*\n\n';
    account.user.enrollments.forEach((enrollment, index) => {
      const course = enrollment.course;
      message += `${index + 1}. *${course.code}: ${course.title}*\n`;
      message += `   👨‍🏫 ${course.instructor.firstName} ${course.instructor.lastName}\n`;
      message += `   📊 Progress: ${enrollment.progress.toFixed(0)}%\n\n`;
    });

    await bot!.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  });

  // Handle /notifications command
  bot.onText(/\/notifications/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();
    
    if (!telegramId) return;

    const account = await prisma.telegramAccount.findUnique({
      where: { telegramId }
    });

    if (!account) {
      await bot!.sendMessage(chatId, 
        'Please link your LMS account first using /start command.'
      );
      return;
    }

    // Toggle notifications
    const updatedAccount = await prisma.telegramAccount.update({
      where: { id: account.id },
      data: { notifications: !account.notifications }
    });

    await bot!.sendMessage(chatId,
      `Notifications ${updatedAccount.notifications ? '✅ enabled' : '❌ disabled'}`
    );
  });

  // Handle text messages for AI chat
  bot.on('message', async (msg) => {
    if (msg.text?.startsWith('/')) return; // Skip commands
    
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();
    const text = msg.text;
    
    if (!telegramId || !text) return;

    const account = await prisma.telegramAccount.findUnique({
      where: { telegramId },
      include: { user: true }
    });

    if (!account) {
      await bot!.sendMessage(chatId, 
        'Please link your LMS account first using /start command.'
      );
      return;
    }

    // Send typing indicator
    await bot!.sendChatAction(chatId, 'typing');

    // Store user message
    await prisma.telegramConversation.create({
      data: {
        telegramAccountId: account.id,
        chatId: chatId.toString(),
        messageId: msg.message_id,
        role: 'USER',
        content: text
      }
    });

    // Call AI service
    try {
      const aiResponse = await getAIResponse(text, account.userId);
      
      const reply = await bot!.sendMessage(chatId, aiResponse);
      
      // Store AI response
      await prisma.telegramConversation.create({
        data: {
          telegramAccountId: account.id,
          chatId: chatId.toString(),
          messageId: reply.message_id,
          role: 'ASSISTANT',
          content: aiResponse
        }
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      await bot!.sendMessage(chatId, 
        'Sorry, I encountered an error. Please try again later.'
      );
    }
  });
}

// Helper function to generate link code
function generateLinkCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Store link code in temporary storage (Redis in production)
const linkCodes = new Map<string, { code: string; expires: Date }>();

async function storeLinkCode(telegramId: string, code: string) {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 10);
  linkCodes.set(telegramId, { code, expires });
}

export function verifyLinkCode(telegramId: string, code: string): boolean {
  const stored = linkCodes.get(telegramId);
  if (!stored) return false;
  
  if (stored.expires < new Date()) {
    linkCodes.delete(telegramId);
    return false;
  }
  
  return stored.code === code;
}

// AI Response helper
async function getAIResponse(message: string, userId: string): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': process.env.INTERNAL_API_KEY || '',
      },
      body: JSON.stringify({
        message,
        sessionId: `telegram-${userId}`,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('AI API error:', error);
    return 'I apologize, but I am unable to process your request at the moment. Please try again later.';
  }
}