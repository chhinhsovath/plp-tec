import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyLinkCode } from '@/lib/telegram/bot';
import { z } from 'zod';

const linkSchema = z.object({
  code: z.string().min(6).max(6),
  telegramId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = linkSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { code, telegramId } = validation.data;

    // Verify the link code
    if (!verifyLinkCode(telegramId, code)) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 400 }
      );
    }

    // Check if Telegram ID is already linked
    const existingAccount = await prisma.telegramAccount.findUnique({
      where: { telegramId }
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: 'This Telegram account is already linked to another user' },
        { status: 409 }
      );
    }

    // Check if user already has a Telegram account
    const userTelegram = await prisma.telegramAccount.findUnique({
      where: { userId: session.user.id }
    });

    if (userTelegram) {
      // Update existing
      await prisma.telegramAccount.update({
        where: { userId: session.user.id },
        data: {
          telegramId,
          isActive: true
        }
      });
    } else {
      // Create new Telegram account link
      await prisma.telegramAccount.create({
        data: {
          userId: session.user.id,
          telegramId,
          isActive: true,
          notifications: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Telegram account linked successfully'
    });

  } catch (error) {
    console.error('Error linking Telegram account:', error);
    return NextResponse.json(
      { error: 'Failed to link Telegram account' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const telegramAccount = await prisma.telegramAccount.findUnique({
      where: { userId: session.user.id }
    });

    if (!telegramAccount) {
      return NextResponse.json(
        { error: 'No Telegram account linked' },
        { status: 404 }
      );
    }

    await prisma.telegramAccount.delete({
      where: { userId: session.user.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Telegram account unlinked successfully'
    });

  } catch (error) {
    console.error('Error unlinking Telegram account:', error);
    return NextResponse.json(
      { error: 'Failed to unlink Telegram account' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const telegramAccount = await prisma.telegramAccount.findUnique({
      where: { userId: session.user.id }
    });

    if (!telegramAccount) {
      return NextResponse.json({ linked: false });
    }

    return NextResponse.json({
      linked: true,
      telegram: {
        username: telegramAccount.username,
        firstName: telegramAccount.firstName,
        lastName: telegramAccount.lastName,
        notifications: telegramAccount.notifications,
        isActive: telegramAccount.isActive
      }
    });

  } catch (error) {
    console.error('Error getting Telegram link status:', error);
    return NextResponse.json(
      { error: 'Failed to get Telegram link status' },
      { status: 500 }
    );
  }
}