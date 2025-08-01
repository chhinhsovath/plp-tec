import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const notificationSchema = z.object({
  enabled: z.boolean(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = notificationSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { enabled } = validation.data;

    const telegramAccount = await prisma.telegramAccount.findUnique({
      where: { userId: session.user.id }
    });

    if (!telegramAccount) {
      return NextResponse.json(
        { error: 'No Telegram account linked' },
        { status: 404 }
      );
    }

    await prisma.telegramAccount.update({
      where: { userId: session.user.id },
      data: { notifications: enabled }
    });

    return NextResponse.json({
      success: true,
      message: `Notifications ${enabled ? 'enabled' : 'disabled'}`
    });

  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}