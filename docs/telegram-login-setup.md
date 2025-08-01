# Telegram Login Setup Guide

## Overview

The PLP TEC LMS now supports Telegram login, allowing users to:
- Sign in without passwords using their Telegram account
- Automatically create accounts on first login
- Link existing accounts with Telegram

## Features Implemented

### 1. **Telegram Login Widget**
- Added to the signin page
- Shows "Sign in with Telegram" button
- Works in both development and production

### 2. **Automatic Account Creation**
- New users are automatically registered
- Default role: Student
- Email format: `username@telegram.user` or `telegramId@telegram.user`

### 3. **Account Linking**
- Existing users can link Telegram in their profile
- Telegram users automatically linked on first login
- One Telegram account per user

### 4. **Security Features**
- Hash verification for authenticity
- 5-minute authentication expiration
- Secure JWT token generation
- Development mode with mock data

## Setup Instructions

### 1. Configure Bot Domain (Required for Production)

Open Telegram and message @BotFather:
```
/mybots
→ Select @plp_tec_bot
→ Bot Settings
→ Domain
→ Send: tec.openplp.com
```

### 2. Environment Variables

Your `.env` file already contains:
```env
TELEGRAM_BOT_TOKEN=8418035816:AAEw4Y6I7FkaEn3cRb4mt1AH4gxefF0QmNg
TELEGRAM_WEBHOOK_URL=https://tec.openplp.com
INTERNAL_API_KEY=sk-internal-plptec-2024-secure-key
```

### 3. Testing in Development

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Go to: http://localhost:3000/auth/signin

3. Click "Sign in with Telegram"
   - In development, this uses mock data
   - In production, opens Telegram OAuth

### 4. Production Deployment

1. Deploy to your domain (tec.openplp.com)
2. Ensure HTTPS is enabled (required by Telegram)
3. Set webhook URL in production

## User Flow

### New User Login
1. User clicks "Sign in with Telegram"
2. Telegram prompts for authorization
3. User data sent to `/api/auth/telegram`
4. New account created with Student role
5. User redirected to dashboard

### Existing User Login
1. User signs in with Telegram
2. System finds linked account
3. User logged in automatically
4. No password required

### Profile Linking
1. User goes to Profile page
2. Clicks Telegram Integration
3. Gets 6-character code from bot
4. Enters code to link accounts

## API Endpoints

### Authentication
- `POST /api/auth/telegram` - Handle Telegram OAuth callback
- Creates JWT token for NextAuth

### Account Management
- `GET /api/telegram/link` - Check link status
- `POST /api/telegram/link` - Link Telegram account
- `DELETE /api/telegram/link` - Unlink account

## Database Schema

Users created via Telegram have:
- Email: `username@telegram.user` or `telegramId@telegram.user`
- No password (empty string)
- Linked TelegramAccount record
- Default Student role

## Security Considerations

1. **Hash Verification**: All Telegram data is cryptographically verified
2. **Time Limit**: Authentication expires after 5 minutes
3. **HTTPS Required**: Telegram only works over HTTPS in production
4. **JWT Tokens**: Secure session management with NextAuth

## Troubleshooting

### "Invalid authentication data"
- Check TELEGRAM_BOT_TOKEN is correct
- Ensure domain is set in BotFather
- Verify HTTPS in production

### Widget Not Showing
- Check browser console for errors
- Ensure domain matches BotFather setting
- Try clearing browser cache

### Development Mode
- Uses mock data (id: 123456789)
- No actual Telegram authentication
- Good for testing user flows

## What Else to Do

### 1. **Email Notifications**
- Send welcome email on Telegram signup
- Notify when account is linked

### 2. **Role Selection**
- Add role selection during signup
- Allow admins to approve new users

### 3. **Profile Completion**
- Prompt users to complete profile
- Add phone number, department, etc.

### 4. **Two-Factor Authentication**
- Use Telegram as 2FA method
- Send OTP via Telegram bot

### 5. **Social Features**
- Show Telegram username in profiles
- Enable direct messaging via Telegram

### 6. **Analytics**
- Track Telegram vs email logins
- Monitor account creation rates
- User engagement metrics

### 7. **Enhanced Bot Commands**
- `/profile` - View/edit profile
- `/schedule` - Class schedule
- `/grades` - View grades
- `/support` - Contact support

### 8. **Telegram Groups**
- Auto-add to course groups
- Announcement channels
- Study groups

### 9. **Rich Notifications**
- Send documents via bot
- Interactive buttons
- Quick replies

### 10. **Mobile App Integration**
- Deep links to Telegram
- Single sign-on
- Push notifications