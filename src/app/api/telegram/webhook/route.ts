import { NextRequest, NextResponse } from 'next/server';
import { getTelegramBot } from '@/lib/telegram/bot';

export async function POST(req: NextRequest) {
  try {
    const bot = getTelegramBot();
    
    if (!bot) {
      return NextResponse.json(
        { error: 'Telegram bot not configured' },
        { status: 500 }
      );
    }

    const body = await req.json();
    
    // Process the webhook update
    bot.processUpdate(body);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Verify webhook token for security
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  
  // You can add token verification here if needed
  return NextResponse.json({ 
    status: 'Telegram webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}