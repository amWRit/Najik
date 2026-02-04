import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require('@/firebase-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  priority?: 'high' | 'normal';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipientIds, notification }: { recipientIds: string[]; notification: NotificationPayload } = body;

    if (!recipientIds || !notification) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get FCM tokens for recipients
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, fcm_token, notification_enabled')
      .in('id', recipientIds)
      .eq('notification_enabled', true);

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No valid users found' }, { status: 200 });
    }

    const tokens = users
      .filter((u: any) => u.fcm_token)
      .map((u: any) => u.fcm_token as string);

    if (tokens.length === 0) {
      return NextResponse.json({ message: 'No valid FCM tokens found' }, { status: 200 });
    }

    // Send notifications using Firebase Admin SDK (V1 API)
    const messages = tokens.map((token: string) => ({
      token,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      webpush: {
        notification: {
          icon: '/images/logos/icon-192x192.png',
          badge: '/images/logos/icon-72x72.png',
          tag: notification.data?.type || 'default',
        },
        fcmOptions: {
          link: '/',
        },
      },
      android: {
        priority: notification.priority === 'high' ? 'high' as 'high' : 'normal' as 'normal',
      },
      apns: {
        headers: {
          'apns-priority': notification.priority === 'high' ? '10' : '5',
        },
      },
    }));

    const fcmResult = await admin.messaging().sendEach(messages);

    // Log notifications
    if (users && users.length > 0) {
      const notificationLogs = users.map((u: any) => ({
        user_id: u.id as string,
        type: (notification.data?.type as any) || 'location_sharing_started',
        title: notification.title,
        body: notification.body,
      }));

      const { error: logError } = await supabase
        .from('notifications_log')
        .insert(notificationLogs as any);
      
      if (logError) {
        console.error('Error logging notifications:', logError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      successCount: fcmResult.successCount,
      failureCount: fcmResult.failureCount,
      sentTo: tokens.length,
    });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
