import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }
    const alert = await prisma.sos_alerts.findFirst({
      where: { user_id: userId, is_active: true },
      orderBy: { timestamp: 'desc' },
    });
    if (!alert) {
      return NextResponse.json({ is_active: false }, { status: 200 });
    }
    return NextResponse.json({
      id: alert.id,
      is_active: alert.is_active,
      timestamp: alert.timestamp,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching latest SOS alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
