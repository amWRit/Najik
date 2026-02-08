// import { sendPushNotification } from '@/lib/firebase/admin';
// import { prisma } from '@/lib/prisma/client';

// export async function POST(req: Request) {
//   const { user_id, latitude, longitude } = await req.json();

//   // Create SOS alert in database
//   const sosAlert = await prisma.sos_alerts.create({
//     data: {
//       user: { connect: { id: user_id } },
//       latitude,
//       longitude,
//       is_active: true,
//       timestamp: new Date(),
//     },
//   });

//   // Get all helpers for this parent
//   const relationships = await prisma.relationships.findMany({
//     where: { parent_id: user_id },
//     include: { helper: true },
//   });

//   // Fetch parent name
//   const parent = await prisma.users.findUnique({
//     where: { id: user_id },
//     select: { name: true },
//   });
//   const parentName = parent?.name ?? 'Your parent';

//   // Send push notification to all helpers
//   for (const rel of relationships) {
//     if (rel.helper.fcm_token) {
//       await sendPushNotification(
//         rel.helper.fcm_token,
//         '🚨 EMERGENCY ALERT',
//         `${parentName} needs help immediately!`,
//         {
//           type: 'sos_alert',
//           parentId: user_id,
//           latitude: latitude.toString(),
//           longitude: longitude.toString(),
//           url: '/helper',
//         }
//       );
//     }
//   }

//   return Response.json({ success: true, alertId: sosAlert.id });
// }

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/server';
import { sendPushNotification } from '@/lib/firebase/admin';

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

      // Get all helpers for this parent
    const relationships = await prisma.relationships.findMany({
      where: { parent_id: userId },
      include: { helper: true },
    });

    // Fetch parent name
    const parent = await prisma.users.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    const parentName = parent?.name ?? 'Your parent';

    // Send push notification to all helpers
    for (const rel of relationships) {
      if (rel.helper.fcm_token) {
        await sendPushNotification(
          rel.helper.fcm_token,
          '🚨 EMERGENCY ALERT',
          `${parentName} needs help immediately!`,
          {
            type: 'sos_alert',
            parentId: userId,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            url: '/helper',
          }
        );
      }
    }

    return NextResponse.json({ id: alert.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating SOS alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
