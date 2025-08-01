import { NextRequest, NextResponse } from 'next/server';
import { createHash, createHmac } from 'crypto';

interface TelegramAuthData {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    // Create check string
    const checkArr = [];
    for (const key in body) {
      if (key !== 'hash') {
        checkArr.push(`${key}=${body[key as keyof TelegramAuthData]}`);
      }
    }
    checkArr.sort();
    const checkString = checkArr.join('\n');
    
    let calculatedHash = '';
    let secretKeyHex = '';
    
    if (botToken) {
      // Create secret key
      const secretKey = createHash('sha256').update(botToken).digest();
      secretKeyHex = secretKey.toString('hex');
      
      // Calculate hash
      calculatedHash = createHmac('sha256', secretKey).update(checkString).digest('hex');
    }
    
    const providedHash = body.hash || '';
    const isValid = calculatedHash === providedHash;
    
    // Check auth date
    const authDate = parseInt(body.auth_date || '0');
    const currentTime = Math.floor(Date.now() / 1000);
    const ageSeconds = currentTime - authDate;
    
    return NextResponse.json({
      debug: {
        receivedData: {
          ...body,
          hash: body.hash ? body.hash.substring(0, 10) + '...' : 'missing'
        },
        checkString: checkString,
        calculatedHash: calculatedHash ? calculatedHash.substring(0, 10) + '...' : 'no token',
        providedHash: providedHash ? providedHash.substring(0, 10) + '...' : 'missing',
        hashMatch: isValid,
        tokenPresent: !!botToken,
        tokenPrefix: botToken ? botToken.substring(0, 10) + '...' : 'missing',
        secretKeyPrefix: secretKeyHex ? secretKeyHex.substring(0, 10) + '...' : 'no key',
        authTimestamp: authDate,
        currentTimestamp: currentTime,
        ageSeconds: ageSeconds,
        expired: ageSeconds > 300,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL_ENV: process.env.VERCEL_ENV,
          hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET
        }
      },
      valid: isValid && ageSeconds <= 300
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}