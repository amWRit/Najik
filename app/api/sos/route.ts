import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/server';

export async function POST(req: NextRequest) {
  try {
    const { userId, latitude, longitude } = await req.json();
    if (!userId || latitude == null || longitude == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const alert = await prisma.sos_alerts.create({
      data: {
        user_id: userId,
        latitude,
        longitude,
        is_active: true,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({ id: alert.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating SOS alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
