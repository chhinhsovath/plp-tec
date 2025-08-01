import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Test database connection
    const roleCount = await prisma.role.count();
    const studentRole = await prisma.role.findFirst({
      where: { name: 'Student' }
    });
    
    // Check environment variables
    const envCheck = {
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    };
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        roleCount,
        studentRoleExists: !!studentRole,
        studentRoleId: studentRole?.id
      },
      environment: envCheck
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}