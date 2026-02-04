import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/server';

export async function PATCH(req: NextRequest) {
  try {
    const { alertId, isActive, acknowledgedBy } = await req.json();
    if (!alertId) {
      return NextResponse.json({ error: 'Missing alertId' }, { status: 400 });
    }

    const updateData: any = {};
    if (typeof isActive === 'boolean') updateData.is_active = isActive;
    if (acknowledgedBy) {
      updateData.acknowledged_at = new Date().toISOString();
      updateData.acknowledged_by = acknowledgedBy;
      updateData.is_active = false;
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
