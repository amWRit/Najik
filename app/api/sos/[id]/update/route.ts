import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/server';

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: alertId } = await context.params;
    const body = await req.json();
    const { is_active, acknowledged_by, acknowledged_at } = body;
    if (!alertId) {
      return NextResponse.json({ error: 'Missing alertId' }, { status: 400 });
    }

    const updateData: any = {};
    if (typeof is_active === 'boolean') updateData.is_active = is_active;
    if (acknowledged_by) {
      updateData.acknowledged_by = acknowledged_by;
    }
    if (acknowledged_at) {
      updateData.acknowledged_at = acknowledged_at;
    }

    const alert = await prisma.sos_alerts.update({
      where: { id: alertId },
      data: updateData,
    });

    return NextResponse.json({ success: true, alert }, { status: 200 });
  } catch (error) {
    console.error('Error updating SOS alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
