import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export async function POST(req: NextRequest) {
  try {
    const { userId, token } = await req.json();

    if (!userId || !token) {
      return NextResponse.json(
        { error: 'Missing userId or token' },
        { status: 400 }
      );
    }

    // Update user's FCM token
    await prisma.users.update({
      where: { id: userId },
      data: { fcm_token: token },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    return NextResponse.json(
      { error: 'Failed to save token' },
      { status: 500 }
    );
  }
}
