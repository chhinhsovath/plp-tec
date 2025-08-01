import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const botUsername = 'plp_tec_bot';
  
  // Get bot info
  let botInfo = null;
  let error = null;
  
  if (botToken) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const data = await response.json();
      botInfo = data.result;
    } catch (e) {
      error = e?.toString();
    }
  }
  
  return NextResponse.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      url: process.env.NEXTAUTH_URL,
      hasToken: !!botToken,
      tokenPrefix: botToken ? botToken.substring(0, 10) + '...' : null,
    },
    bot: {
      username: botUsername,
      info: botInfo,
      error: error,
    },
    widget: {
      expectedUrl: `https://oauth.telegram.org/auth?bot_id=${botInfo?.id || 'BOT_ID'}&origin=${encodeURIComponent('https://tec.openplp.com')}&request_access=write`,
      script: 'https://telegram.org/js/telegram-widget.js?22',
    },
    troubleshooting: {
      domainSet: 'Make sure domain is set in @BotFather',
      httpsRequired: 'Production must use HTTPS',
      corsHeaders: 'Check if CORS headers are properly set',
      botActive: botInfo ? 'Bot is active' : 'Bot not reachable',
    }
  });
}