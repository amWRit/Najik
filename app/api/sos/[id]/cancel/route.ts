import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/server';

export async function POST(req: NextRequest, context: { params: { id: string } } | Promise<{ params: { id: string } }>) {
  try {
    // Always await context and params if either is a Promise (Next.js 14+)
    const awaitedContext = typeof (context as any).then === 'function' ? await context : context;
    const params = typeof awaitedContext.params?.then === 'function' ? await awaitedContext.params : awaitedContext.params;
    const alertId = params.id;
    if (!alertId) {
      return NextResponse.json({ error: 'Missing alertId' }, { status: 400 });
    }

    // Find the alert to get the user_id
    const alert = await prisma.sos_alerts.findUnique({ where: { id: alertId } });
    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    // Delete all SOS alerts for this user
    const result = await prisma.sos_alerts.deleteMany({
      where: { user_id: alert.user_id },
    });

    return NextResponse.json({ success: true, count: result.count }, { status: 200 });
  } catch (error) {
    console.error('Error canceling SOS alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
