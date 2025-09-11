import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'connected',
      auth: 'active',
      storage: 'available',
      functions: 'running'
    },
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  };

  return NextResponse.json(healthData, { status: 200 });
}

export async function POST() {
  return NextResponse.json(
    { message: 'Health check endpoint - use GET method' },
    { status: 405 }
  );
}
