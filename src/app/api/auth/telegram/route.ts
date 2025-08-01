import { NextRequest, NextResponse } from 'next/server';
import { createHash, createHmac } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sign } from 'jsonwebtoken';

interface TelegramAuthData {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
}

// Verify Telegram authentication data
function verifyTelegramAuth(authData: TelegramAuthData): boolean {
  // In development, accept mock data
  if (process.env.NODE_ENV === 'development' && authData.hash === 'development-mock-hash') {
    return true;
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return false;

  // Create check string
  const checkArr = [];
  for (const key in authData) {
    if (key !== 'hash') {
      checkArr.push(`${key}=${authData[key as keyof TelegramAuthData]}`);
    }
  }
  checkArr.sort();
  const checkString = checkArr.join('\n');

  // Create secret key
  const secretKey = createHash('sha256').update(botToken).digest();

  // Calculate hash
  const hmac = createHmac('sha256', secretKey).update(checkString).digest('hex');

  // Verify hash
  return hmac === authData.hash;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Verify Telegram auth data
    if (!verifyTelegramAuth(body)) {
      return NextResponse.json(
        { error: 'Invalid authentication data' },
        { status: 401 }
      );
    }

    // Check if auth is not too old (5 minutes)
    const authDate = parseInt(body.auth_date);
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - authDate > 300) {
      return NextResponse.json(
        { error: 'Authentication data expired' },
        { status: 401 }
      );
    }

    const telegramId = body.id.toString();

    // Check if user already exists with this Telegram ID
    let telegramAccount = await prisma.telegramAccount.findUnique({
      where: { telegramId },
      include: { user: true }
    });

    let user;

    if (telegramAccount) {
      // User exists, update Telegram info
      user = telegramAccount.user;
      
      await prisma.telegramAccount.update({
        where: { telegramId },
        data: {
          username: body.username,
          firstName: body.first_name,
          lastName: body.last_name,
          isActive: true
        }
      });
    } else {
      // Check if user exists with same username as email
      const email = body.username ? `${body.username}@telegram.user` : `${telegramId}@telegram.user`;
      
      user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Get default student role
        const studentRole = await prisma.role.findFirst({
          where: { name: 'Student' }
        });

        if (!studentRole) {
          return NextResponse.json(
            { error: 'System configuration error: Student role not found' },
            { status: 500 }
          );
        }

        // Create new user
        user = await prisma.user.create({
          data: {
            email,
            firstName: body.first_name,
            lastName: body.last_name || '',
            password: '', // No password for Telegram users
            isActive: true,
            userRoles: {
              create: {
                roleId: studentRole.id
              }
            }
          }
        });
      }

      // Create Telegram account link
      await prisma.telegramAccount.create({
        data: {
          userId: user.id,
          telegramId,
          username: body.username,
          firstName: body.first_name,
          lastName: body.last_name,
          isActive: true,
          notifications: true
        }
      });
    }

    // Create session token
    const token = sign(
      { 
        sub: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        telegramId
      },
      process.env.NEXTAUTH_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (error) {
    console.error('Telegram auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}