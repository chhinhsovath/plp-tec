# Telegram Integration Guide

## Overview

The PLP TEC LMS platform includes Telegram integration that allows users to:
- Receive notifications via Telegram
- Chat with the AI assistant through Telegram
- Check course enrollments and assignments
- Manage their account settings

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```env
# Telegram Integration
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_WEBHOOK_URL=https://tec.openplp.com
INTERNAL_API_KEY=sk-internal-plptec-2024-secure-key
```

### 2. Create a Telegram Bot

1. Open Telegram and search for @BotFather
2. Send `/newbot` command
3. Choose a name and username for your bot
4. Copy the bot token and add it to your `.env` file

### 3. Set up Webhook (Production)

In production, the bot uses webhooks. The webhook URL should be:
```
https://your-domain.com/api/telegram/webhook
```

## User Guide

### Linking Telegram Account

1. **From Telegram:**
   - Search for your bot in Telegram
   - Send `/start` command
   - Copy the 6-character code

2. **From LMS:**
   - Go to Profile page
   - Click on Telegram Integration section
   - Enter the 6-character code
   - Click "Link Account"

### Available Commands

- `/start` - Start the bot and get linking code
- `/help` - Show available commands
- `/courses` - View enrolled courses
- `/assignments` - Check pending assignments
- `/assessments` - View upcoming assessments
- `/notifications` - Toggle notifications on/off
- `/link` - Get a new linking code
- `/unlink` - Unlink your account
- `/chat` - Start AI chat session

### AI Chat

Simply send any message (not starting with /) to chat with the AI assistant.

## Technical Details

### Database Schema

The integration uses the following Prisma models:

```prisma
model TelegramAccount {
  id              String    @id @default(cuid())
  userId          String    @unique
  telegramId      String    @unique
  username        String?
  firstName       String?
  lastName        String?
  notifications   Boolean   @default(true)
  isActive        Boolean   @default(true)
  // ... relationships
}

model TelegramConversation {
  id                String    @id @default(cuid())
  telegramAccountId String
  chatId            String
  messageId         Int
  role              Role
  content           String
  // ... relationships
}

model TelegramNotificationLog {
  id          String    @id @default(cuid())
  userId      String
  telegramId  String
  type        String
  content     String
  status      NotificationStatus
  sentAt      DateTime?
  error       String?
  // ... relationships
}
```

### API Endpoints

- `POST /api/telegram/webhook` - Webhook endpoint for Telegram
- `GET /api/telegram/link` - Get link status
- `POST /api/telegram/link` - Link Telegram account
- `DELETE /api/telegram/link` - Unlink Telegram account
- `PATCH /api/telegram/notifications` - Update notification preferences

### Services

#### Bot Service (`/src/lib/telegram/bot.ts`)
- Handles bot initialization and commands
- Manages user interactions
- Processes AI chat requests

#### Notification Service (`/src/lib/telegram/notifications.ts`)
- Sends notifications to users
- Formats messages based on notification type
- Logs notification status

### Security

- Internal API key for bot-to-API communication
- User authentication required for linking
- Telegram ID verification
- Rate limiting on chat requests

## Notification Types

The system sends the following types of notifications:

1. **Course Notifications**
   - New announcements
   - Schedule changes
   - Important updates

2. **Assignment Notifications**
   - New assignments
   - Due date reminders
   - Submission confirmations

3. **Assessment Notifications**
   - Assessment availability
   - Time reminders
   - Results available

4. **System Notifications**
   - Account updates
   - Security alerts
   - Platform announcements

## Troubleshooting

### Bot Not Responding

1. Check if `TELEGRAM_BOT_TOKEN` is set correctly
2. Verify webhook URL in production
3. Check server logs for errors

### Linking Issues

1. Ensure code hasn't expired (10 minutes)
2. Check if account is already linked
3. Verify user is authenticated in LMS

### Notifications Not Working

1. Check if notifications are enabled in profile
2. Verify Telegram account is active
3. Check notification logs in database

## Development

In development mode, the bot uses polling instead of webhooks. This allows testing locally without exposing your development server to the internet.

```typescript
const isProduction = process.env.NODE_ENV === 'production';

bot = new TelegramBot(token, {
  polling: !isProduction,
  webHook: isProduction ? {
    port: parseInt(process.env.PORT || '3000'),
  } : false,
});
```